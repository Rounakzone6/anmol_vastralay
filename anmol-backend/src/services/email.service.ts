import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type OrderEmailData = {
  id: string;
  createdAt: Date;
  totalAmount: unknown;
  status: string;
  shippingAddress: string;
  user: { name: string | null; email: string | null };
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;
  private readonly apiKey: string;
  private readonly isConfigured: boolean;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('BREVO_API_KEY') || '';
    this.from = config.get<string>('BREVO_FROM_EMAIL') || config.get<string>('SMTP_FROM_EMAIL') || 'noreply@anmolvastralay.com';

    if (!this.apiKey) {
      this.isConfigured = false;
      this.logger.warn('Brevo API Key not configured; transactional emails are disabled');
      return;
    }

    this.isConfigured = true;
    this.logger.log('✓ Brevo configured for transactional emails');
  }

  async sendWelcomeEmail(email: string | null, name: string | null) {
    if (!email) return;
    await this.send({
      to: email,
      subject: 'Welcome to Anmol Vastralay',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#252525">
          <h1 style="color:#85142b">Welcome to Anmol Vastralay, ${this.escape(name || 'there')}!</h1>
          <p>Thank you for creating an account with us. We are delighted to have you here.</p>
          <p>Explore our collection of beautiful traditional wear and enjoy a trusted shopping experience.</p>
          <p style="margin-top:32px">With warm regards,<br><strong>Anmol Vastralay</strong></p>
        </div>
      `,
    });
  }

  async sendOrderEmail(order: OrderEmailData, invoice: Buffer) {
    if (!order.user.email) return;
    await this.send({
      to: order.user.email,
      subject: `Order confirmed — #${order.id.slice(-8).toUpperCase()}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#252525">
          <h1 style="color:#85142b">Thank you for your order!</h1>
          <p>Hi ${this.escape(order.user.name || 'Customer')}, your order has been received successfully.</p>
          <table style="width:100%;border-collapse:collapse;margin:24px 0">
            <tr><td style="padding:8px 0;color:#666">Order</td><td style="padding:8px 0;text-align:right;font-weight:bold">#${order.id.slice(-8).toUpperCase()}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Date</td><td style="padding:8px 0;text-align:right">${order.createdAt.toLocaleDateString('en-IN')}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Status</td><td style="padding:8px 0;text-align:right">${order.status}</td></tr>
            <tr><td style="padding:8px 0;color:#666;border-top:1px solid #ddd">Total</td><td style="padding:8px 0;text-align:right;font-weight:bold;border-top:1px solid #ddd">₹${Number(order.totalAmount).toFixed(2)}</td></tr>
          </table>
          <p>Your invoice is attached to this email. We will keep you updated as your order moves through delivery.</p>
          <p style="margin-top:32px">Thank you for shopping with Anmol Vastralay.</p>
        </div>
      `,
      attachments: [{
        name: `invoice-${order.id.slice(-8).toUpperCase()}.pdf`,
        content: invoice.toString('base64'),
      }],
    });
  }

  private async send(message: { to: string; subject: string; html: string; attachments?: Array<any> }) {
    if (!this.isConfigured) {
      this.logger.warn(`Email skipped (Brevo unavailable): ${message.subject} -> ${message.to}`);
      return;
    }
    
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          sender: { name: 'Anmol Vastralay', email: this.from },
          to: [{ email: message.to }],
          subject: message.subject,
          htmlContent: message.html,
          attachment: message.attachments, // Brevo uses 'attachment' array
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(\`Brevo API Error: \${response.status} \${errorData}\`);
      }

      this.logger.log(`Email sent: ${message.subject} -> ${message.to}`);
    } catch (error: any) {
      this.logger.error(`Email failed: ${message.subject} -> ${message.to}`, error.message);
    }
  }

  private escape(value: string) {
    return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] || character);
  }
}
