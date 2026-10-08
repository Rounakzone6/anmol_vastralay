import { router, staffProcedure } from '@backend/config/trpc.config';
import { PrismaClient } from '@prisma/client';

export const dashboardRouter = router({
  getUpdates: staffProcedure.query(async ({ ctx }) => {
    const prisma = ctx.prisma as PrismaClient;

    // Fetch out of stock variants
    const outOfStock = await prisma.productVariant.findMany({
      where: { stockQty: { lte: 0 } },
      include: { product: { select: { name: true, slug: true } } },
      take: 20,
    });

    // Fetch recent orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentOrders = await prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      include: { user: { select: { name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Fetch new users (last 7 days)
    const newUsers = await prisma.user.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: 'desc' },
      take: 20,
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
      ...recentOrders.map((order) => ({
        id: `order-${order.id}`,
        type: 'ORDER',
        title: 'New Order Received',
        message: `Order #${order.id.slice(-6)} placed by ${order.user.name || order.user.phone} for ₹${order.totalAmount.toString()}.`,
        date: order.createdAt,
        link: `/orders`,
      })),
      ...newUsers.map((user) => ({
        id: `user-${user.id}`,
        type: 'USER',
        title: 'New User Registered',
        message: `${user.name || user.phone || user.email} just signed up.`,
        date: user.createdAt,
        link: `/customers`,
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
});
