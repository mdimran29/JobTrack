import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { handleResumeUpload } from '../../middleware/resume-upload';
import { resumeToolsController } from './resume-tools.controller';
import { atsSchema, bulletSchema, coverLetterSchema, summarySchema } from './resume-tools.schema';

export const resumeToolsRouter = Router();
resumeToolsRouter.use(authMiddleware);
resumeToolsRouter.post('/ats/analyze', handleResumeUpload, validate(atsSchema), resumeToolsController.ats);
resumeToolsRouter.post('/rewrite-bullet', validate(bulletSchema), resumeToolsController.bullet);
resumeToolsRouter.post('/summary', handleResumeUpload, validate(summarySchema), resumeToolsController.summary);
resumeToolsRouter.post('/cover-letter', handleResumeUpload, validate(coverLetterSchema), resumeToolsController.coverLetter);
