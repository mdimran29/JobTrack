import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { asyncHandler } from '../../common/asyncHandler';
import { AuthedRequest } from '../../common/types';
import { extractResumeText, jobMatchService } from './job-match.service';
import { resumesService } from '../resumes/resumes.service';

export const jobMatchController = {
  analyze: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const resumeText = req.file ? await extractResumeText(req.file) : undefined;
    const data = await jobMatchService.analyze(req.userId, { ...req.body, resumeText });
    await resumesService.recordMatch(req.userId, {
      companyName: req.body.companyName,
      jobTitle: req.body.jobTitle,
      jobDescription: req.body.jobDescription,
      resumeVersionId: req.body.resumeVersionId,
      result: data as unknown as Prisma.InputJsonValue,
    });
    res.status(200).json({ data });
  }),
};
