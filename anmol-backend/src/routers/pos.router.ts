import { router, staffProcedure } from '@backend/config/trpc.config';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const posRouter = router({
  // ─── 1. Instant Barcode / SKU Lookup ─────────────────────────────────────────
  barcodeLookup: staffProcedure
    .input(z.object({ code: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const trimmed = input.code.trim();

      // Search by variant SKU first
      const variant = await ctx.prisma.productVariant.findFirst({
        where: {
          sku: { equals: trimmed, mode: 'insensitive' },
        },
        include: {
          product: {
            include: {
              images: { take: 1, orderBy: { sortOrder: 'asc' } },
              category: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (variant && variant.product) {
        return {
          found: true,
          product: {
            id: variant.product.id,
            name: variant.product.name,
            brand: variant.product.brand,
            netPrice: Number(variant.product.netPrice),
            discountPercent: Number(variant.product.discountPercent || 0),
            categoryName: variant.product.category?.name || 'General',
            image: variant.product.images[0]?.url || null,
          },
          variant: {
            id: variant.id,
            color: variant.color,
            size: variant.size,
            sku: variant.sku,
            stockQty: variant.stockQty,
          },
          availableStock: variant.stockQty,
        };
      }

      // Search by product ID or slug
      const product = await ctx.prisma.product.findFirst({
        where: {
          isActive: true,
          OR: [
            { id: trimmed },
            { slug: trimmed },
          ],
        },
        include: {
          images: { take: 1, orderBy: { sortOrder: 'asc' } },
          category: { select: { id: true, name: true } },
          variants: true,
        },
      });

      if (product) {
        return {
          found: true,
          product: {
            id: product.id,
            name: product.name,
            brand: product.brand,
            netPrice: Number(product.netPrice),
            discountPercent: Number(product.discountPercent || 0),
            categoryName: product.category?.name || 'General',
            image: product.images[0]?.url || null,
            variants: product.variants.map((v) => ({
              id: v.id,
              color: v.color,
              size: v.size,
              sku: v.sku,
              stockQty: v.stockQty,
            })),
          },
          variant: product.variants[0] || null,
          availableStock: product.variants[0]?.stockQty ?? 999,
        };
      }

      return {
        found: false,
        product: null,
        variant: null,
        availableStock: 0,
      };
    }),

  // ─── 2. Customer Phone / Name Fast Lookup ──────────────────────────────────
  customerLookup: staffProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const q = input.query.trim();

      const customers = await ctx.prisma.user.findMany({
        where: {
          role: 'CUSTOMER',
          OR: [
            { phone: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          isMember: true,
          membershipExpiresAt: true,
          _count: { select: { orders: true } },
        },
      });

      return customers.map((c) => ({
        id: c.id,
        name: c.name || 'Customer',
        phone: c.phone || '',
        email: c.email,
        isMember: c.isMember && (!c.membershipExpiresAt || c.membershipExpiresAt > new Date()),
        totalOrders: c._count.orders,
      }));
    }),

  // ─── 3. Atomic POS Checkout & Order Creation ────────────────────────────────
  createOrder: staffProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            productId: z.string(),
            variantId: z.string().optional(),
            quantity: z.number().int().min(1),
            price: z.number().min(0),
            name: z.string().optional(),
            color: z.string().optional(),
            size: z.string().optional(),
          }),
        ).min(1, 'Cart cannot be empty'),
        paymentMethod: z.enum(['CASH', 'OFFLINE_UPI', 'CARD_SWIPE', 'SPLIT']),
        splitPayments: z
          .array(
            z.object({
              method: z.enum(['CASH', 'OFFLINE_UPI', 'CARD_SWIPE']),
              amount: z.number().min(0),
            }),
          )
          .optional(),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        isEstimate: z.boolean().default(false),
        discountAmount: z.number().min(0).default(0),
        taxRate: z.number().min(0).default(0), // GST percentage (e.g. 5, 12, or 0)
        cashTendered: z.number().optional(),
        sendWhatsApp: z.boolean().default(false),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const afterDiscount = Math.max(0, subtotal - input.discountAmount);
      const taxAmount = input.taxRate > 0 ? Math.round(((afterDiscount * input.taxRate) / 100) * 100) / 100 : 0;
      const totalAmount = Math.round((afterDiscount + taxAmount) * 100) / 100;
      const cashTendered = input.cashTendered ?? totalAmount;
      const changeDue = Math.max(0, Math.round((cashTendered - totalAmount) * 100) / 100);

      // Handle Estimate Draft (no DB writes, no stock decrement)
      if (input.isEstimate) {
        const estNumber = `EST-${Date.now().toString().slice(-8)}`;
        return {
          id: estNumber,
          invoiceNumber: estNumber,
          status: 'ESTIMATE',
          subtotal,
          discountAmount: input.discountAmount,
          taxAmount,
          totalAmount,
          cashTendered: 0,
          changeDue: 0,
          customerName: input.customerName || 'Walk-in Customer',
          customerPhone: input.customerPhone || '',
          items: input.items,
          paymentMethod: input.paymentMethod,
          createdAt: new Date(),
          message: 'Estimate generated successfully',
        };
      }

      // Step A: Stock Pre-Validation before entering transaction
      const variantIds = input.items
        .map((it) => it.variantId)
        .filter((id): id is string => Boolean(id));

      if (variantIds.length > 0) {
        const currentVariants = await ctx.prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true, stockQty: true, color: true, size: true },
        });

        const variantMap = new Map(currentVariants.map((v) => [v.id, v]));

        for (const item of input.items) {
          if (item.variantId) {
            const current = variantMap.get(item.variantId);
            if (!current) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Variant for item "${item.name || item.productId}" was not found.`,
              });
            }
            if (current.stockQty < item.quantity) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Insufficient stock for "${item.name || 'Item'}" (${current.color} ${current.size || ''}). Available: ${current.stockQty}, Requested: ${item.quantity}.`,
              });
            }
          }
        }
      }

      // Step B: Resolve or Upsert Customer
      let userId: string;
      const cleanPhone = input.customerPhone?.replace(/[^0-9]/g, '').trim() || '';

      if (cleanPhone) {
        const existingUser = await ctx.prisma.user.findFirst({
          where: { phone: cleanPhone },
        });

        if (existingUser) {
          userId = existingUser.id;
          if (input.customerName && !existingUser.name) {
            await ctx.prisma.user.update({
              where: { id: existingUser.id },
              data: { name: input.customerName.trim() },
            });
          }
        } else {
          const newUser = await ctx.prisma.user.create({
            data: {
              phone: cleanPhone,
              name: input.customerName?.trim() || 'Valued Customer',
              role: 'CUSTOMER',
            },
          });
          userId = newUser.id;
        }
      } else {
        // Walk-in fallback
        let walkInUser = await ctx.prisma.user.findFirst({
          where: { email: 'walkin@anmolvastralay.local' },
        });
        if (!walkInUser) {
          walkInUser = await ctx.prisma.user.create({
            data: {
              email: 'walkin@anmolvastralay.local',
              name: 'Walk-in Customer',
              role: 'CUSTOMER',
            },
          });
        }
        userId = walkInUser.id;
      }

      // Step C: Execute Atomic Transaction
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randPart = Math.floor(1000 + Math.random() * 9000);
      const invoiceNumber = `INV-POS-${datePart}-${randPart}`;

      const createdOrder = await ctx.prisma.$transaction(async (tx) => {
        // 1. Create Order
        const order = await tx.order.create({
          data: {
            userId,
            totalAmount: new Prisma.Decimal(totalAmount),
            status: 'DELIVERED',
            source: 'POS',
            shippingAddress: 'In-Store POS (Counter 1)',
            invoiceNumber,
            invoiceCreatedAt: new Date(),
            items: {
              create: input.items.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price: new Prisma.Decimal(item.price),
              })),
            },
            statusHistory: {
              create: {
                status: 'DELIVERED',
                note: `In-store checkout via ${input.paymentMethod}. Cashier: ${ctx.user?.name || 'Staff'}. ${input.notes || ''}`.trim(),
              },
            },
          },
          include: {
            items: {
              include: {
                product: { select: { name: true } },
                variant: { select: { color: true, size: true, sku: true } },
              },
            },
          },
        });

        // 2. Create Payment Record(s)
        if (input.paymentMethod === 'SPLIT' && input.splitPayments && input.splitPayments.length > 0) {
          for (const sp of input.splitPayments) {
            if (sp.amount > 0) {
              await tx.payment.create({
                data: {
                  orderId: order.id,
                  userId,
                  amount: new Prisma.Decimal(sp.amount),
                  status: 'COMPLETED',
                  paymentMethod: sp.method,
                },
              });
            }
          }
        } else {
          await tx.payment.create({
            data: {
              orderId: order.id,
              userId,
              amount: new Prisma.Decimal(totalAmount),
              status: 'COMPLETED',
              paymentMethod: input.paymentMethod,
            },
          });
        }

        // 3. Atomically decrement variant inventory with conditional stock check (Strict CP)
        for (const item of input.items) {
          if (item.variantId) {
            const updated = await tx.productVariant.updateMany({
              where: {
                id: item.variantId,
                stockQty: { gte: item.quantity },
              },
              data: { stockQty: { decrement: item.quantity } },
            });

            if (updated.count === 0) {
              throw new TRPCError({
                code: 'CONFLICT',
                message: `Stock was claimed by another customer or transaction for "${item.name || 'Item'}". Order aborted.`,
              });
            }
          }
        }

        return order;
      });

      // Step D: Send WhatsApp Digital Receipt (Non-blocking background dispatch)
      if (input.sendWhatsApp && cleanPhone && ctx.services.whatsapp) {
        const itemRows = createdOrder.items
          .map(
            (it, idx) =>
              `${idx + 1}. *${it.product.name}* ${(it.variant?.color || '')} ${(it.variant?.size || '')}\n   Qty: ${it.quantity} × ₹${Number(it.price).toLocaleString('en-IN')} = ₹${(it.quantity * Number(it.price)).toLocaleString('en-IN')}`,
          )
          .join('\n');

        const waText = [
          `✨ *ANMOL VASTRALAY* ✨`,
          `Traditional & Designer Ethnic Wear`,
          `━━━━━━━━━━━━━━━━━━━━━━`,
          `🧾 *Invoice #${invoiceNumber}*`,
          `📅 Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
          `👤 Customer: ${input.customerName || 'Valued Patron'}`,
          `━━━━━━━━━━━━━━━━━━━━━━`,
          itemRows,
          `━━━━━━━━━━━━━━━━━━━━━━`,
          `Subtotal: ₹${subtotal.toLocaleString('en-IN')}`,
          input.discountAmount > 0 ? `Discount: -₹${input.discountAmount.toLocaleString('en-IN')}` : null,
          taxAmount > 0 ? `GST (${input.taxRate}%): ₹${taxAmount.toLocaleString('en-IN')}` : null,
          `*Grand Total: ₹${totalAmount.toLocaleString('en-IN')}*`,
          `Payment Mode: *${input.paymentMethod}*`,
          `━━━━━━━━━━━━━━━━━━━━━━`,
          `🙏 Thank you for shopping with us!`,
          `Visit again at Anmol Vastralay.`,
        ]
          .filter(Boolean)
          .join('\n');

        ctx.services.whatsapp.sendMessage(cleanPhone, waText).catch(() => {});
      }

      return {
        id: createdOrder.id,
        invoiceNumber,
        status: 'DELIVERED',
        subtotal,
        discountAmount: input.discountAmount,
        taxAmount,
        totalAmount,
        cashTendered,
        changeDue,
        customerName: input.customerName || 'Walk-in Customer',
        customerPhone: cleanPhone,
        items: input.items,
        paymentMethod: input.paymentMethod,
        createdAt: createdOrder.createdAt,
        message: 'POS Order created successfully!',
      };
    }),

  // ─── 4. Recent Bills for Register View & Reprint ───────────────────────────
  getRecentBills: staffProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(15) }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 15;

      const orders = await ctx.prisma.order.findMany({
        where: { source: 'POS' },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          invoiceNumber: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          user: { select: { id: true, name: true, phone: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              price: true,
              product: { select: { name: true } },
              variant: { select: { color: true, size: true } },
            },
          },
          payments: {
            select: { paymentMethod: true, amount: true },
          },
        },
      });

      return orders.map((o) => ({
        id: o.id,
        invoiceNumber: o.invoiceNumber || o.id.slice(-8).toUpperCase(),
        totalAmount: Number(o.totalAmount),
        customerName: o.user?.name || 'Walk-in Customer',
        customerPhone: o.user?.phone || '',
        itemCount: o.items.reduce((s, it) => s + it.quantity, 0),
        items: o.items.map((it) => ({
          name: it.product.name,
          quantity: it.quantity,
          price: Number(it.price),
          color: it.variant?.color,
          size: it.variant?.size,
        })),
        paymentMethod: o.payments[0]?.paymentMethod || 'CASH',
        createdAt: o.createdAt,
      }));
    }),

  // ─── 5. Today's Register Summary ──────────────────────────────────────────
  getRegisterSummary: staffProcedure.query(async ({ ctx }) => {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const [todayOrders, todayPayments] = await Promise.all([
      ctx.prisma.order.findMany({
        where: {
          source: 'POS',
          createdAt: { gte: todayMidnight },
        },
        select: {
          id: true,
          totalAmount: true,
        },
      }),
      ctx.prisma.payment.findMany({
        where: {
          order: { source: 'POS' },
          createdAt: { gte: todayMidnight },
        },
        select: {
          paymentMethod: true,
          amount: true,
        },
      }),
    ]);

    let totalSales = 0;
    for (const ord of todayOrders) {
      totalSales += Number(ord.totalAmount);
    }

    let cashTotal = 0;
    let upiTotal = 0;
    let cardTotal = 0;

    for (const p of todayPayments) {
      const amt = Number(p.amount);
      if (p.paymentMethod === 'CASH') cashTotal += amt;
      else if (p.paymentMethod === 'OFFLINE_UPI') upiTotal += amt;
      else if (p.paymentMethod === 'CARD_SWIPE') cardTotal += amt;
    }

    return {
      billsCount: todayOrders.length,
      totalSales: Math.round(totalSales * 100) / 100,
      cashTotal: Math.round(cashTotal * 100) / 100,
      upiTotal: Math.round(upiTotal * 100) / 100,
      cardTotal: Math.round(cardTotal * 100) / 100,
      averageBill: todayOrders.length > 0 ? Math.round((totalSales / todayOrders.length) * 100) / 100 : 0,
    };
  }),
});
