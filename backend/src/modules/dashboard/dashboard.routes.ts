import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { dashboardController } from './dashboard.controller';

export const dashboardRouter = Router();
dashboardRouter.use(authMiddleware);
dashboardRouter.get('/stats', dashboardController.stats);
