import { Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { AuthedRequest } from '../../common/types';
import { applicationsService } from './applications.service';
import { ListApplicationsQuery } from './applications.schema';

export const applicationsController = {
  list: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const result = await applicationsService.list(
      req.userId,
      req.query as unknown as ListApplicationsQuery
    );
    res.status(200).json(result);
  }),

  followUps: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const data = await applicationsService.followUps(req.userId);
    res.status(200).json({ data });
  }),

  getById: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const data = await applicationsService.getById(req.params.id, req.userId);
    res.status(200).json({ data });
  }),

  create: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const data = await applicationsService.create(req.userId, req.body);
    res.status(201).json({ data });
  }),

  update: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const data = await applicationsService.update(req.params.id, req.userId, req.body);
    res.status(200).json({ data });
  }),

  remove: asyncHandler(async (req: AuthedRequest, res: Response) => {
    await applicationsService.remove(req.params.id, req.userId);
    res.status(204).send();
  }),
};
