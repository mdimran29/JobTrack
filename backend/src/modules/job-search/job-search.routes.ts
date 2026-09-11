import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { jobSearchController } from './job-search.controller';
import { searchJobsSchema } from './job-search.schema';

export const jobSearchRouter = Router();

jobSearchRouter.get('/search', authMiddleware, validate(searchJobsSchema), jobSearchController.search);
