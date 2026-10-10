import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { PrismaService } from './prisma.service';
import { usePrismaAuthState } from './whatsapp-auth';
import { ChatbotService } from './chatbot.service';

@Injectable()
export class WhatsappWebService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappWebService.name);
  private sock: ReturnType<typeof makeWASocket> | null = null;
  private isReady = false;

  private qrCode: string | null = null;
  private isShuttingDown = false;
  private isExplicitLogout = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatbotService: ChatbotService
  ) {}

  async onModuleInit() {
    this.isShuttingDown = false;
    this.logger.log('Initializing Baileys WhatsApp Web Client in background...');
    this.connectToWhatsApp().catch((err) => {
      this.logger.error('Failed to initialize Baileys WhatsApp in background', err);
    });
  }

  async onModuleDestroy() {
    this.isShuttingDown = true;
    this.clearReconnectTimer();
    if (this.sock) {
      // Closing the transport preserves the DB-backed auth state across
      // deploys/restarts. An explicit admin logout is the only operation that
      // should invalidate the WhatsApp session.
      this.sock.ws.close();
      this.sock = null;
      this.isReady = false;
    }
  }

  private async connectToWhatsApp() {
    if (this.isShuttingDown) return;

    const { state, saveCreds } = await usePrismaAuthState(this.prisma);

    this.sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }) as any, // Suppress baileys internal logs for cleaner console
    });

    this.sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.qrCode = qr; // Save for frontend polling
        this.logger.log('New WhatsApp QR code generated. Please scan it from the Admin Panel.');
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        this.logger.warn('WhatsApp connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
        this.isReady = false;
        this.qrCode = null;
        
        if (this.isShuttingDown) return;

        if (shouldReconnect) {
          this.scheduleReconnect(5000);
        } else if (!this.isExplicitLogout) {
          // A logout from the phone invalidates the Baileys credentials.
          void this.clearAuthStateAndReconnect('WhatsApp was logged out from the phone');
        }
      } else if (connection === 'open') {
        this.isReady = true;
        this.qrCode = null;
        this.logger.log('✓ WhatsApp Web (Baileys) is connected and ready!');
      }

    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('messages.upsert', async (m) => {
      if (m.type === 'notify') {
        for (const msg of m.messages) {
          if (!msg.key.fromMe && msg.message) {
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
            if (text) {
               void this.handleIncomingMessage(msg.key.remoteJid, text);
            }
          }
        }
      }
    });
  }

  private async handleIncomingMessage(jid: string | null | undefined, text: string) {
    if (!jid || !this.sock) return;
    try {
       this.logger.log(`Received WhatsApp message from ${jid}: ${text}`);
       const phone = jid.split('@')[0];
       
       const cleanPhone = phone.replace(/^91/, ''); // Simple cleanup assuming Indian numbers
       const user = await this.prisma.user.findFirst({
         where: { phone: { endsWith: cleanPhone } },
       });

       if (user) {
         // Check if user has an OPEN ticket
         const openTicket = await this.prisma.supportTicket.findFirst({
           where: { userId: user.id, status: 'OPEN' },
         });

         if (openTicket) {
           // User has an open ticket. Route to Human Helpdesk instead of AI.
           await this.prisma.ticketMessage.create({
             data: {
               ticketId: openTicket.id,
               sender: 'CUSTOMER',
               text,
             },
           });
           this.logger.log(`Routed message to OPEN ticket ${openTicket.id} for user ${user.id}`);
           return; // Do not process with AI
         }
       }

       // No open ticket, let AI handle it
       const reply = await this.chatbotService.processMessage(phone, text);
       await this.sock.sendMessage(jid, { text: reply });
       this.logger.log(`Replied to ${jid} via AI Chatbot`);
    } catch (err) {
       this.logger.error('Error handling incoming message', err);
    }
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect(delayMs: number) {
    if (this.isShuttingDown || this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connectToWhatsApp();
    }, delayMs);
  }

  private async clearAuthStateAndReconnect(reason: string) {
    if (this.isShuttingDown) return;

    this.clearReconnectTimer();
    await this.prisma.whatsappSession.deleteMany();
    this.logger.warn(`${reason}; cleared WhatsApp sessions from database.`);
    this.isExplicitLogout = false;
    this.scheduleReconnect(2000);
  }

  getStatus() {
    return {
      isReady: this.isReady,
      qrCode: this.qrCode,
    };
  }

  async logout() {
    if (!this.sock) {
      await this.prisma.whatsappSession.deleteMany();
      this.isExplicitLogout = false;
      this.scheduleReconnect(2000);
      return false;
    }

    this.isExplicitLogout = true;
    try {
      await this.sock.logout();
    } finally {
      this.sock = null;
      this.isReady = false;
      this.qrCode = null;
      await this.prisma.whatsappSession.deleteMany();
      this.logger.log('Cleared WhatsApp sessions from database after admin logout.');
      this.isExplicitLogout = false;
      this.scheduleReconnect(2000);
    }
    return true;
  }

  /**
   * Send a WhatsApp message to a phone number.
   */
  async sendMessage(phone: string, message: string): Promise<boolean> {
    if (!this.isReady || !this.sock) {
      this.logger.warn(`Cannot send message to ${phone}, WhatsApp Web Client is not ready.`);
      return false;
    }

    try {
      let cleanedPhone = phone.replace(/[^0-9]/g, '');
      if (cleanedPhone.length === 10) {
        cleanedPhone = '91' + cleanedPhone;
      }
      
      const jid = `${cleanedPhone}@s.whatsapp.net`;
      await this.sock.sendMessage(jid, { text: message });
      this.logger.log(`Successfully sent message to ${phone}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send message to ${phone}:`, err);
      return false;
    }
  }

  /**
   * Send a WhatsApp document message (like PDF) to a phone number.
   */
  async sendDocument(phone: string, documentData: Buffer | { url: string }, fileName: string, caption?: string): Promise<boolean> {
    if (!this.isReady || !this.sock) {
      this.logger.warn(`Cannot send document to ${phone}, WhatsApp Web Client is not ready.`);
      return false;
    }

    try {
      let cleanedPhone = phone.replace(/[^0-9]/g, '');
      if (cleanedPhone.length === 10) {
        cleanedPhone = '91' + cleanedPhone;
      }
      
      const jid = `${cleanedPhone}@s.whatsapp.net`;
      await this.sock.sendMessage(jid, { 
        document: documentData, 
        mimetype: 'application/pdf', 
        fileName,
        caption 
      });
      this.logger.log(`Successfully sent document to ${phone}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send document to ${phone}:`, err);
      return false;
    }
  }
}
