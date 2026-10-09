import { router, staffProcedure } from '@backend/config/trpc.config';
import { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const dashboardRouter = router({
  getUpdates: staffProcedure
    .input(z.object({ filter: z.enum(['TODAY', 'YESTERDAY', 'LAST_WEEK', 'ALL_TIME']).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const prisma = ctx.prisma as PrismaClient;

      let dateFilter: Date | undefined;
      let endDateFilter: Date | undefined;

      if (input?.filter === 'TODAY') {
        dateFilter = new Date();
        dateFilter.setHours(0, 0, 0, 0);
      } else if (input?.filter === 'YESTERDAY') {
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 1);
        dateFilter.setHours(0, 0, 0, 0);
        endDateFilter = new Date();
        endDateFilter.setHours(0, 0, 0, 0);
      } else if (input?.filter === 'LAST_WEEK' || !input?.filter) {
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 7);
      } // ALL_TIME leaves dateFilter as undefined

      const dateCondition = dateFilter ? { gte: dateFilter, ...(endDateFilter ? { lt: endDateFilter } : {}) } : undefined;

    // Fetch out of stock variants
    const outOfStock = await prisma.productVariant.findMany({
      where: { stockQty: { lte: 0 } },
      include: { product: { select: { name: true, slug: true } } },
      take: 20,
    });

    // Fetch categories with low total inventory
    const categoriesWithProducts = await prisma.category.findMany({
      include: {
        products: {
          where: { isActive: true },
          include: { variants: true }
        }
      }
    });

    const lowStockCategories = categoriesWithProducts
      .map(category => {
        let totalStock = 0;
        category.products.forEach(p => {
           p.variants.forEach(v => totalStock += v.stockQty);
        });
        return { ...category, totalStock };
      })
      .filter(category => category.totalStock <= 15);

    // Fetch recent orders
    const recentOrders = await prisma.order.findMany({
      where: dateCondition ? { createdAt: dateCondition } : undefined,
      include: { user: { select: { name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Fetch new users
    const newUsers = await prisma.user.findMany({
      where: dateCondition ? { createdAt: dateCondition } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Fetch delivery staff status (Treating as staff attendance)
    const deliveryStaff = await prisma.deliveryPerson.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    const updates = [
      ...outOfStock.map((item) => ({
        id: `stock-${item.id}`,
        type: 'STOCK',
        title: 'Out of Stock Alert',
        message: `${item.product.name} ${item.color ? '(' + item.color + ')' : ''} is out of stock.`,
        date: item.updatedAt,
        link: `/products/${item.product.slug}`,
      })),
      ...lowStockCategories.map((category) => ({
        id: `cat-stock-${category.id}`,
        type: 'STOCK',
        title: 'Category Inventory Low',
        message: `The "${category.name}" category only has ${category.totalStock} item(s) left in stock. Consider adding more products!`,
        date: new Date(), // Always show at top as active critical alert
        link: `/categories`,
      })),
      ...recentOrders.map((order) => ({
        id: `order-${order.id}`,
        type: 'ORDER',
        title: 'New Order Received',
        message: `Order #${order.id.slice(-6)} placed by ${order.user.name || order.user.phone} for ₹${order.totalAmount.toString()}.`,
        date: order.createdAt,
        link: `/orders?highlight=${order.id}`,
      })),
      ...newUsers.map((user) => ({
        id: `user-${user.id}`,
        type: 'USER',
        title: 'New User Registered',
        message: `${user.name || user.phone || user.email} just signed up.`,
        date: user.createdAt,
        link: `/customers?highlight=${user.id}`,
      })),
      ...deliveryStaff.map((staff) => ({
        id: `staff-${staff.id}`,
        type: 'STAFF',
        title: 'Staff Status Update',
        message: `${staff.name} is currently ${staff.status}.`,
        date: staff.updatedAt,
        link: `/delivery-persons`,
      })),
    ];

    // Sort by most recent first
    return updates.sort((a, b) => b.date.getTime() - a.date.getTime());
  }),

  generateDemandForecast: staffProcedure.query(async ({ ctx }) => {
    try {
      const prisma = ctx.prisma as PrismaClient;
      
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const recentOrders = await prisma.order.findMany({
        where: {
          createdAt: { gte: ninetyDaysAgo },
          status: { not: 'CANCELLED' }
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true
                }
              }
            }
          }
        }
      });

    const categorySales: Record<string, { totalSold: number, last30Days: number, prev60Days: number }> = {};
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    recentOrders.forEach(order => {
      const isRecent = order.createdAt >= thirtyDaysAgo;
      
      order.items.forEach(item => {
        const catName = item.product.category?.name || 'Uncategorized';
        if (!categorySales[catName]) {
          categorySales[catName] = { totalSold: 0, last30Days: 0, prev60Days: 0 };
        }
        
        categorySales[catName].totalSold += item.quantity;
        if (isRecent) {
          categorySales[catName].last30Days += item.quantity;
        } else {
          categorySales[catName].prev60Days += item.quantity;
        }
      });
    });

      const formattedData = Object.entries(categorySales).map(([category, stats]) => ({
        category,
        ...stats
      }));

      // Pass the data to the Gemini AI Service
      return await ctx.services.ai.generateDemandForecast(JSON.stringify(formattedData, null, 2));
    } catch (error: any) {
      console.error('Error generating demand forecast:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to generate demand forecast',
      });
    }
  }),
});
