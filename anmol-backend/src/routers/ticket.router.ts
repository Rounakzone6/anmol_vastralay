import { adminProcedure, router, staffProcedure } from '@backend/config/trpc.config';
import { z } from 'zod';
import { notFound } from '@backend/config/trpc.config';

export const ticketRouter = router({
  getTickets: staffProcedure
    .input(z.object({ status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED']).optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.supportTicket.findMany({
        where: {
          status: input?.status,
        },
        include: {
          user: { select: { name: true, phone: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }),

  getTicketDetails: staffProcedure
    .input(z.object({ ticketId: z.string() }))
    .query(async ({ ctx, input }) => {
      const ticket = await ctx.prisma.supportTicket.findUnique({
        where: { id: input.ticketId },
        include: {
          user: { select: { name: true, phone: true } },
          messages: { orderBy: { createdAt: 'asc' } },
        },
      });
      if (!ticket) notFound('Ticket');
      return ticket;
    }),

  replyToTicket: staffProcedure
    .input(
      z.object({
        ticketId: z.string(),
        text: z.string(),
        closeTicket: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.prisma.supportTicket.findUnique({
        where: { id: input.ticketId },
        include: { user: { select: { phone: true } } },
      });

      if (!ticket) notFound('Ticket');

      // 1. Add message to DB
      await ctx.prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          sender: 'HUMAN',
          text: input.text,
        },
      });

      // 2. Update ticket status if closing
      if (input.closeTicket) {
        await ctx.prisma.supportTicket.update({
          where: { id: ticket.id },
          data: { status: 'RESOLVED' },
        });
      } else if (ticket.status === 'OPEN') {
        await ctx.prisma.supportTicket.update({
          where: { id: ticket.id },
          data: { status: 'IN_PROGRESS' },
        });
      }

      // 3. Send via WhatsApp
      if (ticket.user.phone) {
        await ctx.services.whatsapp.sendMessage(ticket.user.phone, input.text);
      }

      return { success: true };
    }),
});
