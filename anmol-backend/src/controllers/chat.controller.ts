import {
  Controller,
  Post,
  Body,
  Req,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ChatbotService } from '@backend/services/chatbot.service';
import { AuthService } from '@backend/services/auth.service';

interface ChatRequestBody {
  message?: string;
  messages?: Array<{
    role: string;
    content?: string;
    text?: string;
    parts?: Array<{ text: string }>;
  }>;
}

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly authService: AuthService,
  ) {}

  @Throttle({ default: { limit: 15, ttl: 60000 } }) // 15 requests/min per IP
  @Post('message')
  async handleMessage(@Body() body: ChatRequestBody, @Req() req: Request) {
    let userText = (body.message || '').trim();

    if (!userText && body.messages && body.messages.length > 0) {
      const last = body.messages[body.messages.length - 1];
      if (typeof last.content === 'string') {
        userText = last.content.trim();
      } else if (typeof last.text === 'string') {
        userText = last.text.trim();
      } else if (Array.isArray(last.parts) && last.parts[0]?.text) {
        userText = last.parts[0].text.trim();
      }
    }

    if (!userText) {
      throw new BadRequestException('Message text cannot be empty');
    }

    // Size limit: restrict to 500 characters to prevent prompt injection and token runaway
    if (userText.length > 500) {
      throw new BadRequestException(
        'Message is too long (maximum 500 characters allowed)',
      );
    }

    // Security: Authenticate user from JWT Bearer token only.
    // Client-supplied body.phone is strictly ignored on the web interface to prevent caller spoofing.
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    let verifiedPhone = '';
    let isAuthenticated = false;

    if (token) {
      try {
        const user = await this.authService.getUserFromToken(token);
        if (user && user.phone) {
          verifiedPhone = user.phone;
          isAuthenticated = true;
        }
      } catch (err) {
        this.logger.debug('Invalid bearer token provided on chat request');
      }
    }

    // Privacy & Security: Log metadata only. NEVER log customer phone numbers or message content.
    this.logger.log(
      `Web chat request received [length: ${userText.length}, authenticated: ${isAuthenticated}]`,
    );

    const reply = await this.chatbotService.processMessage(
      verifiedPhone,
      userText,
    );
    return { reply };
  }
}
