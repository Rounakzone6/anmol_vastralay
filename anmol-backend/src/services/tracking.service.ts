import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { z } from 'zod';
import { RecordVisitSchema, RecordInteractionSchema } from '../models/tracking.model';

@Injectable()
export class TrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async recordVisit(input: z.infer<typeof RecordVisitSchema>) {
    return this.prisma.siteVisit.upsert({
      where: { sessionId: input.sessionId },
      create: {
        sessionId: input.sessionId,
        userAgent: input.userAgent,
      },
      update: {
        // Just update timestamp or ignore if already exists
        createdAt: new Date(),
      },
    });
  }

  async recordInteraction(userId: string | undefined, input: z.infer<typeof RecordInteractionSchema>) {
    // Only record if we have a way to identify the user (either logged in or anonymous session)
    if (!userId && !input.sessionId) {
      return { success: false, reason: 'No identifier provided' };
    }

    return this.prisma.productInteraction.create({
      data: {
        productId: input.productId,
        userId: userId || null,
        sessionId: input.sessionId || null,
        action: input.action as any, // enum from prisma matches string
      },
    });
  }

  async getVisitsCount() {
    return this.prisma.siteVisit.count();
  }
}
