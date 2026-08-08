import { prisma } from '../../config/database';
import { NotFoundError, InvalidStateTransitionError } from '../../utils/errors';
import { Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';

export class InvoiceService {
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const lastInvoice = await prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });
    let nextNum = 1;
    if (lastInvoice) {
      nextNum = parseInt(lastInvoice.invoiceNumber.replace(prefix, ''), 10) + 1;
    }
    return `${prefix}${nextNum.toString().padStart(6, '0')}`;
  }

  async findAll(params: {
    page: number; limit: number; skip: number;
    search?: string; status?: string; customerId?: string;
  }) {
    const where: Prisma.InvoiceWhereInput = {};
    if (params.search) {
      where.OR = [
        { invoiceNumber: { contains: params.search, mode: 'insensitive' } },
        { customer: { customerName: { contains: params.search, mode: 'insensitive' } } },
      ];
    }
    if (params.status) where.status = params.status as any;
    if (params.customerId) where.customerId = params.customerId;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: params.skip, take: params.limit,
        include: {
          customer: { select: { id: true, customerName: true, businessName: true } },
          challan: { select: { id: true, challanNumber: true } },
          createdBy: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);
    return { invoices, total };
  }

  async findById(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        challan: { select: { id: true, challanNumber: true, confirmedAt: true } },
        createdBy: { select: { id: true, name: true } },
        items: true,
      },
    });
    if (!invoice) throw new NotFoundError('Invoice', id);
    return invoice;
  }

  async createFromChallan(challanId: string, userId: string) {
    const challan = await prisma.challan.findUnique({
      where: { id: challanId },
      include: { customer: true, items: true, invoices: true },
    });

    if (!challan) throw new NotFoundError('Challan', challanId);
    if (challan.status !== 'CONFIRMED') {
      throw new InvalidStateTransitionError('Challan', challan.status, 'INVOICED');
    }
    if (challan.invoices.length > 0) {
      throw new InvalidStateTransitionError('Invoice', 'EXISTS', 'CREATE');
    }

    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          invoiceNumber,
          challanId,
          customerId: challan.customerId,
          subtotal: challan.subtotal,
          taxTotal: challan.taxTotal,
          grandTotal: challan.grandTotal,
          status: 'ISSUED',
          issuedAt: new Date(),
          createdById: userId,
          items: {
            create: challan.items.map(item => ({
              productId: item.productId,
              productNameSnapshot: item.productNameSnapshot,
              skuSnapshot: item.skuSnapshot,
              unitPriceSnapshot: item.unitPriceSnapshot,
              taxRateSnapshot: item.taxRateSnapshot,
              quantity: item.quantity,
              lineSubtotal: item.lineSubtotal,
              lineTax: item.lineTax,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: {
          customer: true,
          items: true,
          createdBy: { select: { id: true, name: true } },
        },
      });

      await tx.challan.update({
        where: { id: challanId },
        data: { status: 'INVOICED' },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'INVOICE_CREATED',
          entityType: 'INVOICE',
          entityId: inv.id,
          newValues: {
            invoiceNumber,
            challanNumber: challan.challanNumber,
            grandTotal: challan.grandTotal.toString(),
          } as any,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          type: 'INVOICE_CREATED',
          title: 'Invoice Generated',
          message: `Invoice ${invoiceNumber} generated from challan ${challan.challanNumber}`,
          entityType: 'INVOICE',
          entityId: inv.id,
        },
      });

      return inv;
    });

    return invoice;
  }

  async updateStatus(id: string, status: 'PAID' | 'CANCELLED', userId: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundError('Invoice', id);

    const validTransitions: Record<string, string[]> = {
      DRAFT: ['ISSUED', 'CANCELLED'],
      ISSUED: ['PAID', 'CANCELLED'],
    };

    if (!validTransitions[invoice.status]?.includes(status)) {
      throw new InvalidStateTransitionError('Invoice', invoice.status, status);
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        paidAt: status === 'PAID' ? new Date() : undefined,
      },
    });

    return updated;
  }

  async generatePdf(id: string): Promise<Buffer> {
    const invoice = await this.findById(id);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('Ledger Operations', 50, 50);
      doc.fontSize(10).font('Helvetica').text('Operations Portal', 50, 78);
      doc.moveDown(2);

      // Invoice details
      doc.fontSize(18).font('Helvetica-Bold').text(`INVOICE ${invoice.invoiceNumber}`);
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica');
      doc.text(`Date: ${invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString('en-IN') : 'N/A'}`);
      doc.text(`Challan: ${invoice.challan.challanNumber}`);
      doc.moveDown(1);

      // Customer
      doc.fontSize(12).font('Helvetica-Bold').text('Bill To:');
      doc.fontSize(10).font('Helvetica');
      doc.text(invoice.customer.customerName);
      if (invoice.customer.businessName) doc.text(invoice.customer.businessName);
      if (invoice.customer.gstNumber) doc.text(`GST: ${invoice.customer.gstNumber}`);
      if (invoice.customer.address) doc.text(invoice.customer.address);
      if (invoice.customer.mobileNumber) doc.text(`Phone: ${invoice.customer.mobileNumber}`);
      doc.moveDown(1.5);

      // Table header
      const tableTop = doc.y;
      const col1 = 50, col2 = 200, col3 = 300, col4 = 370, col5 = 430, col6 = 490;

      doc.font('Helvetica-Bold').fontSize(9);
      doc.text('Product', col1, tableTop);
      doc.text('SKU', col2, tableTop);
      doc.text('Qty', col3, tableTop);
      doc.text('Unit Price', col4, tableTop);
      doc.text('Tax', col5, tableTop);
      doc.text('Total', col6, tableTop);

      doc.moveTo(50, tableTop + 15).lineTo(560, tableTop + 15).stroke();

      // Items
      let y = tableTop + 25;
      doc.font('Helvetica').fontSize(9);

      for (const item of invoice.items) {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        doc.text(item.productNameSnapshot.substring(0, 25), col1, y);
        doc.text(item.skuSnapshot, col2, y);
        doc.text(item.quantity.toString(), col3, y);
        doc.text(`₹${Number(item.unitPriceSnapshot).toFixed(2)}`, col4, y);
        doc.text(`₹${Number(item.lineTax).toFixed(2)}`, col5, y);
        doc.text(`₹${Number(item.lineTotal).toFixed(2)}`, col6, y);
        y += 20;
      }

      // Totals
      doc.moveTo(50, y + 5).lineTo(560, y + 5).stroke();
      y += 15;

      doc.font('Helvetica').fontSize(10);
      doc.text('Subtotal:', 400, y);
      doc.text(`₹${Number(invoice.subtotal).toFixed(2)}`, col6, y);
      y += 18;
      doc.text('Tax:', 400, y);
      doc.text(`₹${Number(invoice.taxTotal).toFixed(2)}`, col6, y);
      y += 18;
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Grand Total:', 400, y);
      doc.text(`₹${Number(invoice.grandTotal).toFixed(2)}`, col6, y);

      // Footer
      doc.fontSize(8).font('Helvetica').fillColor('#707070');
      doc.text(
        'This is a computer-generated invoice. No signature required.',
        50, 750,
        { align: 'center', width: 510 }
      );

      doc.end();
    });
  }
}

export const invoiceService = new InvoiceService();
