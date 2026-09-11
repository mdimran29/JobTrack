import { Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { AuthedRequest } from '../../common/types';
import { SearchJobsQuery } from './job-search.schema';
import { jobSearchService } from './job-search.service';

export const jobSearchController = {
  search: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const data = await jobSearchService.search(req.query as unknown as SearchJobsQuery);
    res.status(200).json(data);
  }),
};
