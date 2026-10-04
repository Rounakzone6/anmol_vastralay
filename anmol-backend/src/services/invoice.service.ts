import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '@backend/services/prisma.service';
import { CloudinaryService } from '@backend/services/cloudinary.service';
import { EmailService } from '@backend/services/email.service';
import { TRPCError } from '@trpc/server';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly email: EmailService,
  ) {}

  async generateInvoice(userId: string | undefined, orderId: string) {
    const order = await this.getOrder(orderId, userId);
    if (order.invoiceUrl && order.invoiceNumber) {
      return { invoiceNumber: order.invoiceNumber, invoiceUrl: order.invoiceUrl };
    }

    const invoiceNumber = `INV-${new Date(order.createdAt).getFullYear()}-${order.id.slice(-8).toUpperCase()}`;
    const pdf = await this.createPdf(order, invoiceNumber);
    const uploaded = await this.cloudinary.uploadPdf(pdf, 'anmol/invoices', invoiceNumber);
    await this.prisma.order.update({
      where: { id: order.id },
      data: { invoiceNumber, invoiceUrl: uploaded.url, invoicePublicId: uploaded.publicId, invoiceCreatedAt: new Date() },
    });
    return { invoiceNumber, invoiceUrl: uploaded.url };
  }

  async emailOrderInvoice(orderId: string) {
    const order = await this.getOrder(orderId);
    const invoiceNumber = order.invoiceNumber || `INV-${new Date(order.createdAt).getFullYear()}-${order.id.slice(-8).toUpperCase()}`;
    const pdf = await this.createPdf(order, invoiceNumber);
    await this.email.sendOrderEmail(order, pdf);
  }

  private async getOrder(orderId: string, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: { include: { product: { select: { name: true } }, variant: { select: { color: true, size: true } } } },
        payments: true,
      },
    });
    if (!order || (userId && order.userId !== userId)) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
    }
    return order;
  }

  private createPdf(order: {
    id: string; createdAt: Date; totalAmount: unknown; shippingAddress: string;
    user: { name: string | null; email: string | null; phone: string | null };
    items: Array<{ quantity: number; price: unknown; product: { name: string }; variant: { color: string; size: string | null } | null }>;
    payments: Array<{ paymentMethod: string | null; status: string }>;
  }, invoiceNumber: string) {
    return new Promise<Buffer>((resolve, reject) => {
      const document = new PDFDocument({ margin: 48 });
      const chunks: Buffer[] = [];
      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);
      document.fontSize(22).fillColor('#85142b').text('Anmol Vastralay');
      document.fontSize(10).fillColor('#555').text('Tax Invoice', { align: 'right' });
      document.moveDown();
      document.strokeColor('#ddd').moveTo(48, document.y).lineTo(547, document.y).stroke();
      document.moveDown();
      document.fontSize(10).fillColor('#222').text(`Invoice number: ${invoiceNumber}`).text(`Order number: #${order.id.slice(-8).toUpperCase()}`).text(`Invoice date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`);
      document.moveDown();
      document.fontSize(12).text('Billed to', { underline: true }).fontSize(10).text(order.user.name || 'Customer');
      if (order.user.email) document.text(order.user.email);
      if (order.user.phone) document.text(order.user.phone);
      document.text(order.shippingAddress).moveDown();
      document.fontSize(11).text('Items', { underline: true }).moveDown(0.5);
      order.items.forEach((item) => {
        const variant = item.variant ? ` (${item.variant.color}${item.variant.size ? ` / ${item.variant.size}` : ''})` : '';
        document.fontSize(10).text(`${item.product.name}${variant} x ${item.quantity}`, 60, document.y, { continued: true }).text(`₹${(Number(item.price) * item.quantity).toFixed(2)}`, { align: 'right' });
      });
      document.moveDown().strokeColor('#ddd').moveTo(48, document.y).lineTo(547, document.y).stroke().moveDown();
      document.fontSize(13).text(`Total: ₹${Number(order.totalAmount).toFixed(2)}`, { align: 'right' });
      const payment = order.payments[0];
      if (payment) document.fontSize(10).fillColor('#555').text(`Payment: ${payment.paymentMethod || 'Online'} (${payment.status})`, { align: 'right' });
      document.fontSize(9).fillColor('#777').text('Thank you for shopping with Anmol Vastralay.', 48, 730, { align: 'center' });
      document.end();
    });
  }
}
