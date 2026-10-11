import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

type OrderEmailData = {
  id: string;
  createdAt: Date;
  totalAmount: unknown;
  status: string;
  shippingAddress: string;
  user: { name: string | null; email: string | null };
};

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null = null;
  private readonly transport: Transporter | null = null;
  private readonly from: string = '';

  constructor(private readonly config: ConfigService) {
    const resendApiKey = config.get<string>('RESEND_API_KEY');
    const resendFrom =
      config.get<string>('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';

    if (
      resendApiKey &&
      !resendApiKey.startsWith('re_your_') &&
      !resendApiKey.startsWith('your_')
    ) {
      this.resend = new Resend(resendApiKey);
      this.from = resendFrom.includes('<')
        ? resendFrom
        : `"Anmol Vastralay" <${resendFrom}>`;
      this.logger.log('✓ Resend email client configured');
    } else {
      // Fallback to SMTP if configured
      const host = config.get<string>('SMTP_HOST');
      const port = config.get<number>('SMTP_PORT') || 587;
      const user = config.get<string>('SMTP_USER');
      const pass = config.get<string>('SMTP_PASS');
      const smtpFrom = config.get<string>('SMTP_FROM_EMAIL') || user || '';

      if (host && user && pass) {
        this.from = smtpFrom.includes('<')
          ? smtpFrom
          : `"Anmol Vastralay" <${smtpFrom}>`;
        this.transport = nodemailer.createTransport({
          host,
          port,
          secure:
            config.get<string>('SMTP_SECURE') === 'true' || port === 465,
          auth: { user, pass },
        });
        this.logger.log('✓ SMTP email fallback configured');
      } else {
        this.logger.warn(
          '⚠ Neither Resend nor SMTP configured — transactional emails are disabled or logged in development.',
        );
      }
    }
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
      attachments: [
        {
          filename: `invoice-${order.id.slice(-8).toUpperCase()}.pdf`,
          content: invoice,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  private async send(message: EmailPayload): Promise<boolean> {
    // 1. Try Resend if configured
    if (this.resend) {
      try {
        const { data, error } = await this.resend.emails.send({
          from: this.from,
          to: message.to,
          subject: message.subject,
          html: message.html,
          attachments: message.attachments?.map((att) => ({
            filename: att.filename,
            content: att.content,
            contentType: att.contentType,
          })),
        });

        if (error) {
          this.logger.error(
            `Resend email failed: ${message.subject} -> ${message.to}: ${error.message}`,
          );
          return false;
        }

        this.logger.log(
          `Resend email sent: ${message.subject} -> ${message.to} (id: ${data?.id})`,
        );
        return true;
      } catch (error) {
        this.logger.error(
          `Resend email error: ${message.subject} -> ${message.to}`,
          error instanceof Error ? error.stack : String(error),
        );
        return false;
      }
    }

    // 2. Fallback to SMTP transport
    if (this.transport) {
      try {
        await this.transport.sendMail({
          from: this.from,
          to: message.to,
          subject: message.subject,
          html: message.html,
          attachments: message.attachments,
        });
        this.logger.log(`SMTP Email sent: ${message.subject} -> ${message.to}`);
        return true;
      } catch (error) {
        this.logger.error(
          `SMTP Email failed: ${message.subject} -> ${message.to}`,
          error instanceof Error ? error.stack : String(error),
        );
        return false;
      }
    }

    // 3. Fallback for development if no service is configured
    this.logger.warn(
      `Email skipped (neither Resend nor SMTP configured): ${message.subject} -> ${message.to}`,
    );
    return false;
  }

  private escape(value: string) {
    return value.replace(
      /[&<>"']/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[character] || character,
    );
  }
}
