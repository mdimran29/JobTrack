import { z } from 'zod';
import { InterviewOutcome, InterviewType } from '@prisma/client';

export const createInterviewSchema = z.object({
  body: z.object({
    type: z.nativeEnum(InterviewType),
    scheduledAt: z.coerce.date(),
    durationMinutes: z.number().int().positive().optional(),
    interviewerName: z.string().max(200).optional(),
    mode: z.string().max(100).optional(),
    outcome: z.nativeEnum(InterviewOutcome).default(InterviewOutcome.PENDING),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});

export const listInterviewsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});

export const updateInterviewSchema = z.object({
  body: z.object({
    type: z.nativeEnum(InterviewType).optional(),
    scheduledAt: z.coerce.date().optional(),
    durationMinutes: z.number().int().positive().nullable().optional(),
    interviewerName: z.string().max(200).nullable().optional(),
    mode: z.string().max(100).nullable().optional(),
    outcome: z.nativeEnum(InterviewOutcome).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});

export const deleteInterviewSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>['body'];
export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>['body'];
