import { Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { AuthedRequest } from '../../common/types';
import { resumesService } from './resumes.service';

export const resumesController = {
  list: asyncHandler(async (req: AuthedRequest, res: Response) => res.json({ data: await resumesService.list(req.userId) })),
  getById: asyncHandler(async (req: AuthedRequest, res: Response) => res.json({ data: await resumesService.getById(req.params.id, req.userId) })),
  create: asyncHandler(async (req: AuthedRequest, res: Response) => res.status(201).json({ data: await resumesService.create(req.userId, req.body) })),
  update: asyncHandler(async (req: AuthedRequest, res: Response) => res.json({ data: await resumesService.update(req.params.id, req.userId, req.body) })),
  remove: asyncHandler(async (req: AuthedRequest, res: Response) => { await resumesService.remove(req.params.id, req.userId); res.status(204).send(); }),
  listMatches: asyncHandler(async (req: AuthedRequest, res: Response) => res.json({ data: await resumesService.listMatches(req.userId, Number(req.query.limit)) })),
  getMatch: asyncHandler(async (req: AuthedRequest, res: Response) => res.json({ data: await resumesService.getMatch(req.params.id, req.userId) })),
  removeMatch: asyncHandler(async (req: AuthedRequest, res: Response) => { await resumesService.removeMatch(req.params.id, req.userId); res.status(204).send(); }),
};
