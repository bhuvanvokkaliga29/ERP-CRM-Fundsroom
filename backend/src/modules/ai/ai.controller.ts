import { Request, Response, NextFunction } from 'express';
import { aiService } from './ai.service';
import { sendSuccess } from '../../utils/response';
import { z } from 'zod';

const copilotSchema = z.object({ query: z.string().min(1).max(500) });
const followUpDraftSchema = z.object({ mode: z.enum(['professional', 'friendly', 'short']).default('professional') });

export class AIController {
  async copilot(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = copilotSchema.parse(req.body);
      const result = await aiService.processQuery(query, req.user!.role);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async followUpDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const { mode } = followUpDraftSchema.parse(req.body);
      const result = await aiService.generateFollowUpDraft(req.params.customerId, mode);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }
}

export const aiController = new AIController();
