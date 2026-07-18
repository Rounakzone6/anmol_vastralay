import { Controller, Post, Req, Res, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ChatbotService } from '@backend/services/chatbot.service';
import { WhatsappService } from '@backend/services/whatsapp.service';

interface TwilioWebhookBody {
  From?: string;
  Body?: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
}

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly whatsappService: WhatsappService,
  ) {}

  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const body: TwilioWebhookBody = req.body;
      const from = body.From ?? ''; // "whatsapp:+91..."
      const messageBody = body.Body ?? '';
      const mediaUrl = body.MediaUrl0;
      const mimeType = body.MediaContentType0;

      this.logger.log(`Received message from ${from}`);

      // Process with Gemini AI
      const aiResponse = await this.chatbotService.processMessage(
        from,
        messageBody,
        mediaUrl,
        mimeType,
      );

      // Reply using WhatsappService
      if (from) {
        // extract phone number by removing 'whatsapp:' prefix if present
        const phone = from.replace('whatsapp:', '');
        await this.whatsappService.sendMessage(phone, aiResponse);
      }

      // Twilio expects a 200 OK TwiML response. We send empty TwiML since we replied via API.
      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send('<Response></Response>');
    } catch (error) {
      this.logger.error('Error handling webhook', error);
      res.setHeader('Content-Type', 'text/xml');
      return res.status(500).send('<Response></Response>');
    }
  }
}
