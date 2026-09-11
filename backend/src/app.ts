import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
import { jobSearchRouter } from './modules/job-search/job-search.routes';
import { requireTrustedOrigin } from './middleware/origin.middleware';
import { apiLimiter } from './middleware/rate-limit.middleware';

export const app = express();

// Behind Render/Vercel-style proxies so req.ip and secure cookies reflect the real client.
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
app.disable('x-powered-by');

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Non-browser clients send no Origin; browsers must match the allow-list.
      if (!origin || env.CLIENT_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  })
);
// Saved resumes and LaTeX sources can legitimately be ~100 KB; anything much larger is abuse.
app.use(express.json({ limit: '512kb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', apiLimiter, requireTrustedOrigin);
app.use('/api/auth', authRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/interviews', interviewsStandaloneRouter);
app.use('/api/notes', notesStandaloneRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/job-match', jobMatchRouter);
app.use('/api/resumes', resumesRouter);
app.use('/api/resume-tools', resumeToolsRouter);
app.use('/api/job-search', jobSearchRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
