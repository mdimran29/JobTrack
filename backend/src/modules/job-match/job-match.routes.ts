import { Router } from 'express';
import { jobMatchController } from './job-match.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { analyzeJobSchema } from './job-match.schema';
import { handleResumeUpload } from '../../middleware/resume-upload';
import { aiLimiter } from '../../middleware/rate-limit.middleware';

export const jobMatchRouter = Router();

jobMatchRouter.post(
  '/analyze',
  authMiddleware,
  aiLimiter,
  handleResumeUpload,
  validate(analyzeJobSchema),
  jobMatchController.analyze
);
