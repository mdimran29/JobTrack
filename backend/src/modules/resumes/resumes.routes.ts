import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { resumesController } from './resumes.controller';
import { createResumeSchema, listMatchesSchema, resumeIdSchema, updateResumeSchema } from './resumes.schema';

export const resumesRouter = Router();
resumesRouter.use(authMiddleware);
resumesRouter.get('/matches', validate(listMatchesSchema), resumesController.listMatches);
resumesRouter.get('/matches/:id', validate(resumeIdSchema), resumesController.getMatch);
resumesRouter.delete('/matches/:id', validate(resumeIdSchema), resumesController.removeMatch);
resumesRouter.get('/', resumesController.list);
resumesRouter.post('/', validate(createResumeSchema), resumesController.create);
resumesRouter.get('/:id', validate(resumeIdSchema), resumesController.getById);
resumesRouter.patch('/:id', validate(updateResumeSchema), resumesController.update);
resumesRouter.delete('/:id', validate(resumeIdSchema), resumesController.remove);
