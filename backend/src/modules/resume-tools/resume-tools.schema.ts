import { z } from 'zod';

const jobContext = {
  jobTitle: z.string().min(1).max(200),
  companyName: z.string().min(1).max(200),
  jobDescription: z.string().min(20).max(20000),
};

export const atsSchema = z.object({
  body: z.object({ jobDescription: z.string().min(20).max(20000).optional() }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const bulletSchema = z.object({
  body: z.object({ ...jobContext, bullet: z.string().min(10).max(1000) }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const summarySchema = z.object({
  body: z.object({ ...jobContext, resumeText: z.string().min(50).max(50000).optional() }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const coverLetterSchema = z.object({
  body: z.object({ ...jobContext, resumeText: z.string().min(50).max(50000).optional(), tone: z.enum(['professional', 'warm', 'confident']).default('professional') }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export type BulletInput = z.infer<typeof bulletSchema>['body'];
export type SummaryInput = Omit<z.infer<typeof summarySchema>['body'], 'resumeText'> & { resumeText: string };
export type CoverLetterInput = Omit<z.infer<typeof coverLetterSchema>['body'], 'resumeText'> & { resumeText: string };
