import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { notesController } from './notes.controller';
import { createNoteSchema, deleteNoteSchema, listNotesSchema, updateNoteSchema } from './notes.schema';

// Mounted at /api/applications/:id/notes
export const notesNestedRouter = Router({ mergeParams: true });
notesNestedRouter.get('/', validate(listNotesSchema), notesController.list);
notesNestedRouter.post('/', validate(createNoteSchema), notesController.create);

// Mounted at /api/notes
export const notesStandaloneRouter = Router();
notesStandaloneRouter.use(authMiddleware);
notesStandaloneRouter.patch('/:id', validate(updateNoteSchema), notesController.update);
notesStandaloneRouter.delete('/:id', validate(deleteNoteSchema), notesController.remove);
