import { Request, Response, NextFunction } from 'express';
import { invoiceService } from './invoice.service';
import { sendSuccess, sendCreated, sendPaginated, parsePaginationQuery } from '../../utils/response';

export class InvoiceController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = parsePaginationQuery(req.query);
      const { invoices, total } = await invoiceService.findAll({
        page, limit, skip,
        search: req.query.search as string,
        status: req.query.status as string,
        customerId: req.query.customerId as string,
      });
      sendPaginated(res, invoices, { page, limit, total });
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.findById(req.params.id);
      sendSuccess(res, invoice);
    } catch (error) { next(error); }
  }

  async createFromChallan(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.createFromChallan(req.params.challanId, req.user!.userId);
      sendCreated(res, invoice, 'Invoice created successfully');
    } catch (error) { next(error); }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const invoice = await invoiceService.updateStatus(req.params.id, status, req.user!.userId);
      sendSuccess(res, invoice, 'Invoice status updated');
    } catch (error) { next(error); }
  }

  async downloadPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.findById(req.params.id);
      const pdfBuffer = await invoiceService.generatePdf(req.params.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) { next(error); }
  }
}

export const invoiceController = new InvoiceController();
