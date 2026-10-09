import { router, staffProcedure } from '@backend/config/trpc.config';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { PrismaService } from '@backend/services/prisma.service';

export const posRouter = router({
  createOrder: staffProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            productId: z.string(),
            variantId: z.string().optional(),
            quantity: z.number().min(1),
            price: z.number().min(0),
          }),
        ),
        paymentMethod: z.enum(['CASH', 'OFFLINE_UPI', 'CARD_SWIPE']),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        isEstimate: z.boolean().default(false),
        discountAmount: z.number().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const prisma = ctx.services.product['prisma'] as PrismaService; // Quick way to access prisma or via ctx

      let totalAmount = 0;
      for (const item of input.items) {
        totalAmount += item.price * item.quantity;
      }
      
      totalAmount = Math.max(0, totalAmount - input.discountAmount);

      if (input.isEstimate) {
        // Return a virtual draft object, don't save to DB
        return {
          id: `EST-${Date.now()}`,
          status: 'ESTIMATE',
          totalAmount,
          items: input.items,
          message: 'Estimate generated successfully',
        };
      }

      // Ensure user exists or create a placeholder if phone provided
      let userId: string;
      if (input.customerPhone) {
        let user = await prisma.user.findUnique({
          where: { phone: input.customerPhone },
        });
        if (!user) {
          user = await prisma.user.create({
            data: {
              phone: input.customerPhone,
              name: input.customerName || 'Walk-in Customer',
              role: 'CUSTOMER',
            },
          });
        }
        userId = user.id;
      } else {
        // Default walk-in user logic
        let walkInUser = await prisma.user.findFirst({
          where: { email: 'walkin@anmolvastralay.local' },
        });
        if (!walkInUser) {
          walkInUser = await prisma.user.create({
            data: {
              email: 'walkin@anmolvastralay.local',
              name: 'Walk-in Customer',
              role: 'CUSTOMER',
            },
          });
        }
        userId = walkInUser.id;
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. Create the order
        const order = await tx.order.create({
          data: {
            userId,
            totalAmount,
            status: 'DELIVERED', // Since it's POS, it's immediately delivered
            source: 'POS',
            shippingAddress: 'In-Store Purchase',
            items: {
              create: input.items.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price: item.price, // using POS agreed price
              })),
            },
            statusHistory: {
              create: {
                status: 'DELIVERED',
                note: `In-store purchase via ${input.paymentMethod}`,
              },
            },
          },
        });

        // 2. Create the payment record
        await tx.payment.create({
          data: {
            orderId: order.id,
            userId,
            amount: totalAmount,
            status: 'COMPLETED',
            paymentMethod: input.paymentMethod,
          },
        });

        // 3. Deduct inventory
        for (const item of input.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stockQty: { decrement: item.quantity } },
            });
          }
        }

        return order;
      });

      return {
        id: result.id,
        totalAmount: result.totalAmount,
        status: result.status,
        message: 'POS Order created successfully!',
      };
    }),
});
