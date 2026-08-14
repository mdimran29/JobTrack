import { Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { AuthedRequest } from '../../common/types';
import { interviewsService } from './interviews.service';

export const interviewsController = {
  list: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const data = await interviewsService.list(req.params.id, req.userId);
    res.status(200).json({ data });
  }),

  create: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const data = await interviewsService.create(req.params.id, req.userId, req.body);
    res.status(201).json({ data });
  }),

  update: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const data = await interviewsService.update(req.params.id, req.userId, req.body);
    res.status(200).json({ data });
  }),

  remove: asyncHandler(async (req: AuthedRequest, res: Response) => {
    await interviewsService.remove(req.params.id, req.userId);
    res.status(204).send();
  }),
};
