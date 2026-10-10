import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private twilioClient: Twilio.Twilio | null = null;
  private twilioPhone: string = '';
  private isBrevoConfigured = false;
  private brevoApiKey = '';
  private brevoFromEmail = '';

  constructor(private readonly config: ConfigService) {
    this.initTwilio();
    this.initBrevo();
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

  private initBrevo() {
    this.brevoApiKey = this.config.get<string>('BREVO_API_KEY') || '';
    this.brevoFromEmail =
      this.config.get<string>('BREVO_FROM_EMAIL') || 
      this.config.get<string>('SMTP_FROM_EMAIL') || 
      'noreply@anmolvastralay.com';

    if (!this.brevoApiKey) {
      this.logger.warn(
        '⚠ Brevo API Key not configured — Email OTP will use console logging',
      );
      return;
    }

    this.isBrevoConfigured = true;
    this.logger.log('✓ Brevo configured for OTP emails');
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
   * Send OTP via Email using Brevo REST API
   */
  async sendEmailOtp(email: string, code: string): Promise<boolean> {
    if (!this.isBrevoConfigured) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.error(`[ERROR] Brevo not configured. Cannot send OTP to ${email}. Check BREVO_API_KEY.`);
        return false;
      }
      this.logger.log(`[DEV EMAIL OTP] To ${email}: ${code}`);
      return true; // Silently succeed in dev
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.brevoApiKey,
        },
        body: JSON.stringify({
          sender: { name: 'Anmol Vastralay', email: this.brevoFromEmail },
          to: [{ email: email }],
          subject: 'Your Verification Code — Anmol Vastralay',
          htmlContent: `
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
          `,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Brevo API Error: ${response.status} ${errorText}`);
      }

      this.logger.log(`Email OTP sent to ${email} via Brevo`);
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${email}:`, err.message);
      this.logger.log(`[FALLBACK EMAIL OTP] To ${email}: ${code}`);
      return false;
    }
  }
}
