import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { jobSearchController } from './job-search.controller';
import { searchJobsSchema } from './job-search.schema';
import { aiLimiter } from '../../middleware/rate-limit.middleware';

export const jobSearchRouter = Router();

jobSearchRouter.get('/search', authMiddleware, aiLimiter, validate(searchJobsSchema), jobSearchController.search);
