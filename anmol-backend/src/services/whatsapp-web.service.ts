import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { PrismaService } from './prisma.service';
import { usePrismaAuthState } from './whatsapp-auth';

@Injectable()
export class WhatsappWebService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappWebService.name);
  private sock: ReturnType<typeof makeWASocket> | null = null;
  private isReady = false;

  private qrCode: string | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('Initializing Baileys WhatsApp Web Client...');
    await this.connectToWhatsApp();
  }

  async onModuleDestroy() {
    if (this.sock) {
      await this.sock.logout();
    }
  }

  private async connectToWhatsApp() {
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
        
        if (shouldReconnect) {
          setTimeout(() => this.connectToWhatsApp(), 5000);
        } else {
          // Logged out intentionally
          this.prisma.whatsappSession.deleteMany().then(() => {
            this.logger.log('Cleared WhatsApp sessions from database after logout.');
          });
        }
      } else if (connection === 'open') {
        this.isReady = true;
        this.qrCode = null;
        this.logger.log('✓ WhatsApp Web (Baileys) is connected and ready!');
      }
    });

    this.sock.ev.on('creds.update', saveCreds);
  }

  getStatus() {
    return {
      isReady: this.isReady,
      qrCode: this.qrCode,
    };
  }

  async logout() {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
      this.isReady = false;
      this.qrCode = null;
      await this.prisma.whatsappSession.deleteMany();
      // Re-initialize to generate a new QR immediately
      setTimeout(() => this.connectToWhatsApp(), 2000);
      return true;
    }
    return false;
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
}
