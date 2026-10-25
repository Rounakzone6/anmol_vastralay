import { Controller, Post, Body, Req, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { ChatbotService } from '@backend/services/chatbot.service';

interface ChatRequestBody {
  message?: string;
  phone?: string;
  messages?: Array<{ role: string; content?: string; text?: string; parts?: Array<{ text: string }> }>;
}

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  async handleMessage(@Body() body: ChatRequestBody, @Req() req: Request) {
    let userText = body.message || '';

    if (!userText && body.messages && body.messages.length > 0) {
      const last = body.messages[body.messages.length - 1];
      if (typeof last.content === 'string') {
        userText = last.content;
      } else if (typeof last.text === 'string') {
        userText = last.text;
      } else if (Array.isArray(last.parts) && last.parts[0]?.text) {
        userText = last.parts[0].text;
      }
    }

    const phone = body.phone || (req as any).user?.phone || '';
    this.logger.log(`Processing chat message from user (phone: ${phone || 'anonymous'}): ${userText}`);

    const reply = await this.chatbotService.processMessage(phone, userText);
    return { reply };
  }
}
