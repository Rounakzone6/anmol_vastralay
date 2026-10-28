import { router, staffProcedure } from '@backend/config/trpc.config';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { redis } from '@backend/config/redis.config';

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
          requiresVariantSelection: false,
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
          OR: [{ id: trimmed }, { slug: trimmed }],
        },
        include: {
          images: { take: 1, orderBy: { sortOrder: 'asc' } },
          category: { select: { id: true, name: true } },
          variants: true,
        },
      });

      if (product) {
        const variants = product.variants;
        const requiresVariantSelection = variants.length > 1;
        const selectedVariant = variants.length === 1 ? variants[0] : null;
        const availableStock = selectedVariant ? selectedVariant.stockQty : 0;

        return {
          found: true,
          requiresVariantSelection,
          product: {
            id: product.id,
            name: product.name,
            brand: product.brand,
            netPrice: Number(product.netPrice),
            discountPercent: Number(product.discountPercent || 0),
            categoryName: product.category?.name || 'General',
            image: product.images[0]?.url || null,
            variants: variants.map((v) => ({
              id: v.id,
              color: v.color,
              size: v.size,
              sku: v.sku,
              stockQty: v.stockQty,
            })),
          },
          variant: selectedVariant,
          availableStock,
        };
      }

      return {
        found: false,
        requiresVariantSelection: false,
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
        isMember:
          c.isMember &&
          (!c.membershipExpiresAt || c.membershipExpiresAt > new Date()),
        totalOrders: c._count.orders,
      }));
    }),

  // ─── 3. Atomic POS Checkout & Order Creation ────────────────────────────────
  createOrder: staffProcedure
    .input(
      z.object({
        idempotencyKey: z.string().optional(),
        items: z
          .array(
            z.object({
              productId: z.string(),
              variantId: z.string().optional(),
              quantity: z.number().int().min(1),
              price: z.number().min(0).optional(), // client price is ignored; DB price is authoritative
              name: z.string().optional(),
              color: z.string().optional(),
              size: z.string().optional(),
            }),
          )
          .min(1, 'Cart cannot be empty'),
        paymentMethod: z.enum(['CASH', 'OFFLINE_UPI', 'CARD_SWIPE', 'SPLIT']),
        splitPayments: z
          .array(
            z.object({
              method: z.enum(['CASH', 'OFFLINE_UPI', 'CARD_SWIPE']),
              amount: z.number().min(0),
              reference: z.string().optional(),
            }),
          )
          .optional(),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        isEstimate: z.boolean().default(false),
        discountAmount: z.number().min(0).default(0),
        taxRate: z.number().min(0).default(0), // GST percentage (5, 12, or 18)
        cashTendered: z.number().optional(),
        upiReference: z.string().optional(),
        sendWhatsApp: z.boolean().default(false),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Step A: Idempotency Check (Prevents double-click duplicate sales)
      if (input.idempotencyKey) {
        try {
          const cached = await redis.get(
            `pos:idempotency:${input.idempotencyKey}`,
          );
          if (cached) {
            return JSON.parse(cached);
          }
        } catch {}
      }

      // Step B: Server-Side Price Verification (NEVER trust prices from browser)
      const productIds = Array.from(
        new Set(input.items.map((it) => it.productId)),
      );
      const products = await ctx.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, netPrice: true, name: true },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      let subtotal = 0;
      const verifiedItems = input.items.map((item) => {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Product ${item.productId} was not found in catalog`,
          });
        }
        const authoritativePrice = Number(product.netPrice);
        subtotal += authoritativePrice * item.quantity;
        return {
          ...item,
          name: item.name || product.name,
          price: authoritativePrice,
        };
      });

      // Step C: Cashier Discount Capping (Max 25% allowed at register without manager code)
      const maxAllowedDiscount =
        Math.round(((subtotal * 25) / 100) * 100) / 100;
      if (input.discountAmount > maxAllowedDiscount) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cashier discount ₹${input.discountAmount} exceeds 25% limit (Max allowed: ₹${maxAllowedDiscount}). Manager override required.`,
        });
      }

      const afterDiscount = Math.max(0, subtotal - input.discountAmount);
      const taxAmount =
        input.taxRate > 0
          ? Math.round(((afterDiscount * input.taxRate) / 100) * 100) / 100
          : 0;
      const totalAmount = Math.round((afterDiscount + taxAmount) * 100) / 100;

      // Step D: Payment Tender Validation
      if (input.paymentMethod === 'SPLIT') {
        if (!input.splitPayments || input.splitPayments.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'Split payments breakdown is required for SPLIT payment method',
          });
        }
        const splitSum = input.splitPayments.reduce((s, p) => s + p.amount, 0);
        if (Math.abs(splitSum - totalAmount) > 0.05) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Sum of split payments (₹${splitSum.toFixed(2)}) must equal total bill amount (₹${totalAmount.toFixed(2)})`,
          });
        }
      } else if (input.paymentMethod === 'CASH') {
        if (
          input.cashTendered !== undefined &&
          input.cashTendered < totalAmount
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cash tendered (₹${input.cashTendered.toFixed(2)}) cannot be less than grand total (₹${totalAmount.toFixed(2)})`,
          });
        }
      }

      const cashTendered = input.cashTendered ?? totalAmount;
      const changeDue = Math.max(
        0,
        Math.round((cashTendered - totalAmount) * 100) / 100,
      );

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
          items: verifiedItems,
          paymentMethod: input.paymentMethod,
          createdAt: new Date(),
          message: 'Estimate generated successfully',
        };
      }

      // Step E: Sequential, Collision-Free Daily Invoice Number via Redis INCR
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      let dailySeq = 1;
      try {
        dailySeq = await redis.incr(`pos:invoice:seq:${datePart}`);
      } catch {
        dailySeq = Math.floor(1000 + Math.random() * 9000);
      }
      const invoiceNumber = `INV-POS-${datePart}-${String(dailySeq).padStart(5, '0')}`;

      const cleanPhone =
        input.customerPhone?.replace(/[^0-9]/g, '').trim() || '';

      // Step F: Concurrency-Safe Customer Upsert (Executed OUTSIDE transaction to eliminate row-lock deadlocks)
      let userId: string;
      if (cleanPhone) {
        const customer = await ctx.prisma.user.upsert({
          where: { phone: cleanPhone },
          update: input.customerName
            ? { name: input.customerName.trim() }
            : {},
          create: {
            phone: cleanPhone,
            name: input.customerName?.trim() || 'Valued Customer',
            role: 'CUSTOMER',
          },
          select: { id: true },
        });
        userId = customer.id;
      } else {
        const walkin = await ctx.prisma.user.upsert({
          where: { email: 'walkin@anmolvastralay.local' },
          update: {},
          create: {
            email: 'walkin@anmolvastralay.local',
            name: 'Walk-in Customer',
            role: 'CUSTOMER',
          },
          select: { id: true },
        });
        userId = walkin.id;
      }

      // Step G: Execute Atomic Transaction (Order + Payments + Stock Decrement)
      const createdOrder = await ctx.prisma.$transaction(async (tx) => {
        // 1. Create POS Order
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
              create: verifiedItems.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price: new Prisma.Decimal(item.price),
              })),
            },
            statusHistory: {
              create: {
                status: 'DELIVERED',
                note: `In-store POS checkout via ${input.paymentMethod}. Cashier: ${ctx.user?.name || ctx.user?.email || 'Staff'}. Discount: ₹${input.discountAmount}. ${input.notes || ''}`.trim(),
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

        // 3. Create Payment Records with UTR / Transaction Proof
        if (
          input.paymentMethod === 'SPLIT' &&
          input.splitPayments &&
          input.splitPayments.length > 0
        ) {
          for (const sp of input.splitPayments) {
            if (sp.amount > 0) {
              await tx.payment.create({
                data: {
                  orderId: order.id,
                  userId,
                  amount: new Prisma.Decimal(sp.amount),
                  status: 'COMPLETED',
                  paymentMethod: sp.method,
                  transactionId: sp.reference || undefined,
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
              transactionId: input.upiReference || undefined,
            },
          });
        }

        // 4. Concurrency-Safe Stock Decrement with Conditional Check (Strict CP)
        for (const item of verifiedItems) {
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
                message: `Stock was claimed by another customer or transaction for "${item.name}". Sale aborted.`,
              });
            }
          }
        }

        return order;
      });

      // Step G: Send WhatsApp Receipt (Background)
      if (input.sendWhatsApp && cleanPhone && ctx.services.whatsapp) {
        const itemRows = createdOrder.items
          .map(
            (it, idx) =>
              `${idx + 1}. *${it.product.name}* ${it.variant?.color || ''} ${it.variant?.size || ''}\n   Qty: ${it.quantity} × ₹${Number(it.price).toLocaleString('en-IN')} = ₹${(it.quantity * Number(it.price)).toLocaleString('en-IN')}`,
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
          input.discountAmount > 0
            ? `Discount: -₹${input.discountAmount.toLocaleString('en-IN')}`
            : null,
          taxAmount > 0
            ? `GST (${input.taxRate}%): ₹${taxAmount.toLocaleString('en-IN')}`
            : null,
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

      const response = {
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
        items: verifiedItems,
        paymentMethod: input.paymentMethod,
        createdAt: createdOrder.createdAt,
        message: 'POS Order created successfully!',
      };

      // Cache for idempotency (24 hours)
      if (input.idempotencyKey) {
        try {
          await redis.set(
            `pos:idempotency:${input.idempotencyKey}`,
            JSON.stringify(response),
            'EX',
            86400,
          );
        } catch {}
      }

      return response;
    }),

  // ─── 4. Recent Bills for Register View & Reprint ───────────────────────────
  getRecentBills: staffProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(50).default(15) })
        .optional(),
    )
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
            select: { paymentMethod: true, amount: true, transactionId: true },
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
        transactionId: o.payments[0]?.transactionId || null,
        createdAt: o.createdAt,
      }));
    }),

  // ─── 5. 80mm Thermal Receipt Layout & Details ─────────────────────────────
  getReceiptDetails: staffProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
        include: {
          user: true,
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
          payments: true,
        },
      });

      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
      }

      return {
        storeInfo: {
          name: 'ANMOL VASTRALAY',
          tagline: 'Traditional & Designer Ethnic Wear',
          address: 'Main Market Road, Gopalganj, Bihar - 841428',
          gstin: '10AAACB1234F1Z5',
          hsnDefault: '5407 (Silk/Synthetic Fabrics)',
          phone: '+91 98765 43210',
          receiptLayout: '80mm Thermal Receipt (ESC/POS Compatible)',
        },
        invoiceNumber: order.invoiceNumber || order.id.slice(-8).toUpperCase(),
        date: order.createdAt,
        customer: {
          name: order.user.name || 'Walk-in Customer',
          phone: order.user.phone || 'N/A',
        },
        items: order.items.map((i) => ({
          name: i.product.name,
          variant: i.variant
            ? `${i.variant.color} ${i.variant.size || ''}`.trim()
            : '',
          sku: i.variant?.sku || i.productId.slice(-6).toUpperCase(),
          quantity: i.quantity,
          unitPrice: Number(i.price),
          total: i.quantity * Number(i.price),
          hsn: '5407',
        })),
        totalAmount: Number(order.totalAmount),
        paymentMethod: order.payments[0]?.paymentMethod || 'CASH',
        transactionId: order.payments[0]?.transactionId || null,
      };
    }),

  // ─── 6. Register Day Summary / Z-Report ──────────────────────────────────
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
      averageBill:
        todayOrders.length > 0
          ? Math.round((totalSales / todayOrders.length) * 100) / 100
          : 0,
      reportType: 'End of Day Register Close (Z-Report)',
      generatedAt: new Date(),
    };
  }),
});
