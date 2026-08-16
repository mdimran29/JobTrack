import { Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { AuthedRequest } from '../../common/types';
import { resumeToolsService } from './resume-tools.service';
import { extractResumeText } from '../job-match/job-match.service';
import { AppError } from '../../common/AppError';

export const resumeToolsController = {
  ats: asyncHandler(async (req: AuthedRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: { code: 'RESUME_REQUIRED', message: 'A resume file is required.' } });
      return;
    }
    res.status(200).json({ data: await resumeToolsService.analyzeAts(req.file, req.body.jobDescription) });
  }),
  bullet: asyncHandler(async (req: AuthedRequest, res: Response) => { res.status(200).json({ data: await resumeToolsService.rewriteBullet(req.body) }); }),
  summary: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const resumeText = req.file ? await extractResumeText(req.file) : req.body.resumeText;
    if (!resumeText) throw new AppError(400, 'A resume file or resume text is required.', 'RESUME_REQUIRED');
    res.status(200).json({ data: await resumeToolsService.summary({ ...req.body, resumeText }) });
  }),
  coverLetter: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const resumeText = req.file ? await extractResumeText(req.file) : req.body.resumeText;
    if (!resumeText) throw new AppError(400, 'A resume file or resume text is required.', 'RESUME_REQUIRED');
    res.status(200).json({ data: await resumeToolsService.coverLetter({ ...req.body, resumeText }) });
  }),
  latex: asyncHandler(async (req: AuthedRequest, res: Response) => {
    res.status(200).json({ data: await resumeToolsService.generateLatex(req.body) });
  }),
  latexPdf: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const pdf = await resumeToolsService.compileLatex(req.body.latex);
    res.type('application/pdf').attachment('updated-resume.pdf').send(pdf);
  }),
};
