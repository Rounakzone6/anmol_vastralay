import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private twilioClient: any = null;
  private twilioPhone: string;
  private isConfigured = false;

  constructor(private readonly config: ConfigService) {
    this.twilioPhone = `whatsapp:${this.config.get<string>('TWILIO_PHONE_NUMBER') || '+14155238886'}`;
    this.initTwilio();
  }

  private initTwilio() {
    // We use the same Twilio account for both OTP and WhatsApp
    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.config.get<string>('TWILIO_AUTH_TOKEN');

    if (sid && token && !sid.startsWith('your_')) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
        const twilio = require('twilio');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        this.twilioClient = twilio(sid, token);
        this.isConfigured = true;
        this.logger.log('✓ Twilio WhatsApp configured');
      } catch (err) {
        this.logger.warn('Twilio WhatsApp initialization failed:', err);
      }
    } else {
      this.logger.warn('⚠ Twilio WhatsApp not configured - missing AUTH_TOKEN');
    }
  }

  /**
   * Send WhatsApp Order Confirmation
   * Using Sandbox template: "Your {{1}} order of {{2}} has shipped and should be delivered on {{3}}."
   * Wait, the user provided: contentVariables: '{"1":"12/1","2":"3pm"}' which is an appointment template.
   * "Your appointment is coming up on {{1}} at {{2}}"
   * So we will map: 1 -> Order Date, 2 -> Order Amount/ID
   */
  async sendOrderConfirmation(
    phone: string,
    orderId: string,
    amount: number,
  ): Promise<boolean> {
    if (!this.isConfigured || !this.twilioClient) {
      this.logger.log(
        `[DEV WHATSAPP] To ${phone}: Order ${orderId} confirmed.`,
      );
      return true;
    }

    // Ensure phone has country code and whatsapp: prefix
    let formattedPhone = phone;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone; // default to India
    }
    const to = `whatsapp:${formattedPhone}`;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await this.twilioClient.messages.create({
        from: this.twilioPhone,
        contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
        contentVariables: JSON.stringify({
          '1': new Date().toLocaleDateString(), // Date
          '2': `Order #${orderId.slice(-6).toUpperCase()} for ₹${amount}`, // Time/Details
        }),
        to: to,
      });
      this.logger.log(
        `WhatsApp confirmation sent to ${to} for order ${orderId}`,
      );
      return true;
    } catch (err) {
      this.logger.error(`Failed to send WhatsApp to ${to}:`, err);
      return false;
    }
  }

  /**
   * Send a generic text message to a WhatsApp user
   */
  async sendMessage(phone: string, text: string): Promise<boolean> {
    if (!this.isConfigured || !this.twilioClient) {
      this.logger.log(`[DEV WHATSAPP] To ${phone}: ${text}`);
      return true;
    }

    let formattedPhone = phone;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone; // default to India
    }
    const to = `whatsapp:${formattedPhone}`;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await this.twilioClient.messages.create({
        from: this.twilioPhone,
        body: text,
        to: to,
      });
      this.logger.log(`WhatsApp text message sent to ${to}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send WhatsApp text to ${to}:`, err);
      return false;
    }
  }
}
