import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { applicationsController } from './applications.controller';
import {
  createApplicationSchema,
  getApplicationSchema,
  listApplicationsSchema,
  updateApplicationSchema,
} from './applications.schema';
import { interviewsNestedRouter } from '../interviews/interviews.routes';
import { notesNestedRouter } from '../notes/notes.routes';

export const applicationsRouter = Router();

applicationsRouter.use(authMiddleware);

// Must be registered before "/:id" so "follow-ups" isn't captured as an id.
applicationsRouter.get('/follow-ups', applicationsController.followUps);

applicationsRouter.get('/', validate(listApplicationsSchema), applicationsController.list);
applicationsRouter.post('/', validate(createApplicationSchema), applicationsController.create);
applicationsRouter.get('/:id', validate(getApplicationSchema), applicationsController.getById);
applicationsRouter.patch('/:id', validate(updateApplicationSchema), applicationsController.update);
applicationsRouter.delete('/:id', validate(getApplicationSchema), applicationsController.remove);

applicationsRouter.use('/:id/interviews', interviewsNestedRouter);
applicationsRouter.use('/:id/notes', notesNestedRouter);
