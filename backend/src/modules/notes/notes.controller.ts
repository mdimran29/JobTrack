import { Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { AuthedRequest } from '../../common/types';
import { notesService } from './notes.service';

export const notesController = {
  list: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const data = await notesService.list(req.params.id, req.userId);
    res.status(200).json({ data });
  }),

  create: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const data = await notesService.create(req.params.id, req.userId, req.body.content);
    res.status(201).json({ data });
  }),

  update: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const data = await notesService.update(req.params.id, req.userId, req.body.content);
    res.status(200).json({ data });
  }),

  remove: asyncHandler(async (req: AuthedRequest, res: Response) => {
    await notesService.remove(req.params.id, req.userId);
    res.status(204).send();
  }),
};
