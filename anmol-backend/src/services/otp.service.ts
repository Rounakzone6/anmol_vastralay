import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import Twilio from 'twilio';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private twilioClient: Twilio.Twilio | null = null;
  private twilioPhone: string = '';
  private resendClient: Resend | null = null;
  private resendFromEmail = '';
  private smtpTransport: Transporter | null = null;
  private smtpFromEmail = '';

  constructor(private readonly config: ConfigService) {
    this.initTwilio();
    this.initEmail();
  }

  private initTwilio() {
    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.config.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioPhone = this.config.get<string>('TWILIO_PHONE_NUMBER') || '';

    if (sid && token && !sid.startsWith('your_')) {
      try {
        this.twilioClient = Twilio(sid, token);
        this.logger.log('✓ Twilio SMS configured');
      } catch (err) {
        this.logger.warn('Twilio initialization failed:', err);
      }
    } else {
      this.logger.warn(
        '⚠ Twilio not configured — SMS OTP will use console logging',
      );
    }
  }

  private initEmail() {
    const resendApiKey = this.config.get<string>('RESEND_API_KEY');
    const resendFrom =
      this.config.get<string>('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
    this.resendFromEmail = resendFrom.includes('<')
      ? resendFrom
      : `"Anmol Vastralay" <${resendFrom}>`;

    if (
      resendApiKey &&
      !resendApiKey.startsWith('re_your_') &&
      !resendApiKey.startsWith('your_')
    ) {
      try {
        this.resendClient = new Resend(resendApiKey);
        this.logger.log('✓ Resend email OTP configured');
      } catch (err) {
        this.logger.warn('Resend initialization failed:', err);
      }
    }

    // SMTP Fallback
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT') || 587;
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const smtpFrom =
      this.config.get<string>('SMTP_FROM_EMAIL') || user || '';
    this.smtpFromEmail = smtpFrom.includes('<')
      ? smtpFrom
      : `"Anmol Vastralay" <${smtpFrom}>`;

    if (host && user && pass) {
      try {
        this.smtpTransport = nodemailer.createTransport({
          host,
          port,
          secure:
            this.config.get<string>('SMTP_SECURE') === 'true' || port === 465,
          auth: { user, pass },
        });
        this.logger.log('✓ SMTP email fallback configured');
      } catch (err) {
        this.logger.warn('SMTP initialization failed:', err);
      }
    }

    if (!this.resendClient && !this.smtpTransport) {
      this.logger.warn(
        '⚠ Email not configured (neither Resend nor SMTP) — Email OTP will use console logging in development',
      );
    }
  }

  /**
   * Send OTP via SMS using Twilio
   */
  async sendSmsOtp(phone: string, code: string): Promise<boolean> {
    if (!this.twilioClient) {
      this.logger.log(`[DEV SMS OTP] To ${phone}: ******`);
      return true; // Silently succeed in dev
    }

    try {
      await this.twilioClient.messages.create({
        body: `Your Anmol Vastralay verification code is: ${code}. Valid for 10 minutes. Do not share this code.`,
        from: this.twilioPhone,
        to: phone,
      });
      this.logger.log(`SMS OTP sent to ${phone}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send SMS to ${phone}:`, err);
      return false;
    }
  }

  /**
   * Send OTP via Email using Resend (or SMTP fallback)
   */
  async sendEmailOtp(email: string, code: string): Promise<boolean> {
    const otpSubject = 'Your Verification Code — Anmol Vastralay';
    const otpHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #85142b; font-size: 24px; margin: 0;">अनमोल वस्त्रालय</h1>
          <p style="color: #999; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">Anmol Vastralay</p>
        </div>
        <div style="background: #f8f8f8; border-radius: 12px; padding: 24px; text-align: center;">
          <p style="color: #333; font-size: 16px; margin: 0 0 16px;">Your verification code is:</p>
          <div style="background: #fff; border: 2px dashed #85142b; border-radius: 8px; padding: 16px; display: inline-block;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #85142b;">${code}</span>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 16px;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color: #999; font-size: 12px; margin-top: 8px;">If you didn't request this code, please ignore this email.</p>
        </div>
        <p style="color: #ccc; font-size: 11px; text-align: center; margin-top: 24px;">
          &copy; ${new Date().getFullYear()} Anmol Vastralay. All rights reserved.
        </p>
      </div>
    `;

    // 1. Primary: Resend
    if (this.resendClient) {
      try {
        const { data, error } = await this.resendClient.emails.send({
          from: this.resendFromEmail,
          to: email,
          subject: otpSubject,
          html: otpHtml,
        });

        if (error) {
          this.logger.error(`Resend OTP send error for ${email}: ${error.message}`);
        } else {
          this.logger.log(`Resend OTP email sent to ${email} (id: ${data?.id})`);
          return true;
        }
      } catch (err) {
        this.logger.error(`Failed to send Resend OTP to ${email}:`, err);
      }
    }

    // 2. Secondary: SMTP fallback
    if (this.smtpTransport) {
      try {
        await this.smtpTransport.sendMail({
          to: email,
          from: this.smtpFromEmail,
          subject: otpSubject,
          html: otpHtml,
        });
        this.logger.log(`SMTP OTP email sent to ${email}`);
        return true;
      } catch (err) {
        this.logger.error(`Failed to send SMTP email to ${email}:`, err);
      }
    }

    // 3. Fallback if neither configured or failed
    if (
      process.env.NODE_ENV === 'production' &&
      !this.resendClient &&
      !this.smtpTransport
    ) {
      this.logger.error(
        `[ERROR] Email provider not configured. Cannot send OTP to ${email}. Please set RESEND_API_KEY in environment variables.`,
      );
      return false;
    }

    this.logger.log(`[DEV/FALLBACK EMAIL OTP] To ${email}: ${code}`);
    return true; // Succeed in dev/fallback so testing isn't blocked
  }
}
