import { z } from 'zod';

export const createResumeSchema = z.object({
  body: z.object({ name: z.string().min(1).max(200), content: z.string().min(1).max(100000) }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateResumeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    content: z.string().min(1).max(100000).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});

export const resumeIdSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});

export const listMatchesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({ limit: z.coerce.number().int().positive().max(100).default(20) }),
});

export type CreateResumeInput = z.infer<typeof createResumeSchema>['body'];
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>['body'];
