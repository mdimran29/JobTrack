import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { handleResumeUpload } from '../../middleware/resume-upload';
import { aiLimiter, latexLimiter } from '../../middleware/rate-limit.middleware';
import { resumeToolsController } from './resume-tools.controller';
import { atsSchema, bulletSchema, coverLetterSchema, latexPdfSchema, latexSchema, summarySchema } from './resume-tools.schema';

export const resumeToolsRouter = Router();
resumeToolsRouter.use(authMiddleware);
resumeToolsRouter.post('/ats/analyze', aiLimiter, handleResumeUpload, validate(atsSchema), resumeToolsController.ats);
resumeToolsRouter.post('/rewrite-bullet', aiLimiter, validate(bulletSchema), resumeToolsController.bullet);
resumeToolsRouter.post('/summary', aiLimiter, handleResumeUpload, validate(summarySchema), resumeToolsController.summary);
resumeToolsRouter.post('/cover-letter', aiLimiter, handleResumeUpload, validate(coverLetterSchema), resumeToolsController.coverLetter);
resumeToolsRouter.post('/add-missing-skills', validate(latexSchema), resumeToolsController.latex);
resumeToolsRouter.post('/latex-pdf', latexLimiter, validate(latexPdfSchema), resumeToolsController.latexPdf);
