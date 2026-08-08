import { Request, Response, NextFunction } from 'express';
import { intelligenceService } from './intelligence.service';
import { sendSuccess } from '../../utils/response';

export class IntelligenceController {
  async getCustomerIntelligence(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await intelligenceService.getCustomerIntelligence(req.params.id);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async getInventoryRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await intelligenceService.getInventoryRecommendations();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async getBusinessBrief(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await intelligenceService.getBusinessBrief();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async getNextActions(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await intelligenceService.getNextActions();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }
}

export const intelligenceController = new IntelligenceController();
