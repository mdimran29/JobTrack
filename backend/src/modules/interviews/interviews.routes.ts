import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { interviewsController } from './interviews.controller';
import {
  createInterviewSchema,
  deleteInterviewSchema,
  listInterviewsSchema,
  updateInterviewSchema,
} from './interviews.schema';

// Mounted at /api/applications/:id/interviews
export const interviewsNestedRouter = Router({ mergeParams: true });
interviewsNestedRouter.get('/', validate(listInterviewsSchema), interviewsController.list);
interviewsNestedRouter.post('/', validate(createInterviewSchema), interviewsController.create);

// Mounted at /api/interviews
export const interviewsStandaloneRouter = Router();
interviewsStandaloneRouter.use(authMiddleware);
interviewsStandaloneRouter.patch(
  '/:id',
  validate(updateInterviewSchema),
  interviewsController.update
);
interviewsStandaloneRouter.delete(
  '/:id',
  validate(deleteInterviewSchema),
  interviewsController.remove
);
