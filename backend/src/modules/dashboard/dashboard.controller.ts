import { Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { AuthedRequest } from '../../common/types';
import { dashboardService } from './dashboard.service';

export const dashboardController = {
  stats: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const data = await dashboardService.getStats(req.userId);
    res.status(200).json({ data });
  }),
};
