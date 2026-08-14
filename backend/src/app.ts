import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { authRouter } from './modules/auth/auth.routes';
import { applicationsRouter } from './modules/applications/applications.routes';
import { interviewsStandaloneRouter } from './modules/interviews/interviews.routes';
import { notesStandaloneRouter } from './modules/notes/notes.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { jobMatchRouter } from './modules/job-match/job-match.routes';
import { resumesRouter } from './modules/resumes/resumes.routes';
import { resumeToolsRouter } from './modules/resume-tools/resume-tools.routes';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';

export const app = express();

app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/interviews', interviewsStandaloneRouter);
app.use('/api/notes', notesStandaloneRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/job-match', jobMatchRouter);
app.use('/api/resumes', resumesRouter);
app.use('/api/resume-tools', resumeToolsRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
