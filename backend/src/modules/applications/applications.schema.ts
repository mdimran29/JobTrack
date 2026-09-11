import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';

const statusEnum = z.nativeEnum(ApplicationStatus);

// Only web URLs: `z.string().url()` alone accepts "javascript:" and "data:" schemes,
// which the frontend would then render as a clickable link.
export const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((value) => /^https?:\/\//i.test(value), { message: 'Must be an http(s) URL' });

const salaryRangeIsValid = (data: { salaryMin?: number | null; salaryMax?: number | null }) =>
  data.salaryMin == null || data.salaryMax == null || data.salaryMin <= data.salaryMax;

const SALARY_RANGE_MESSAGE = { message: 'salaryMin cannot be greater than salaryMax', path: ['salaryMax'] };

export const createApplicationSchema = z.object({
  body: z
    .object({
      company: z.string().trim().min(1).max(200),
      position: z.string().trim().min(1).max(200),
      status: statusEnum.default(ApplicationStatus.APPLIED),
      appliedDate: z.coerce.date(),
      jobUrl: httpUrl.optional(),
      location: z.string().trim().max(200).optional(),
      salaryMin: z.number().int().positive().optional(),
      salaryMax: z.number().int().positive().optional(),
      source: z.string().trim().max(100).optional(),
      followUpDate: z.coerce.date().optional(),
      resumeVersionId: z.string().min(1).optional(),
      matchScore: z.number().int().min(0).max(100).optional(),
    })
    .refine(salaryRangeIsValid, SALARY_RANGE_MESSAGE),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateApplicationSchema = z.object({
  body: z
    .object({
      company: z.string().trim().min(1).max(200).optional(),
      position: z.string().trim().min(1).max(200).optional(),
      status: statusEnum.optional(),
      appliedDate: z.coerce.date().optional(),
      jobUrl: httpUrl.nullable().optional(),
      location: z.string().trim().max(200).nullable().optional(),
      salaryMin: z.number().int().positive().nullable().optional(),
      salaryMax: z.number().int().positive().nullable().optional(),
      source: z.string().trim().max(100).nullable().optional(),
      followUpDate: z.coerce.date().nullable().optional(),
      resumeVersionId: z.string().min(1).nullable().optional(),
      matchScore: z.number().int().min(0).max(100).nullable().optional(),
    })
    .refine(salaryRangeIsValid, SALARY_RANGE_MESSAGE),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});

export const getApplicationSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});

export const listApplicationsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: statusEnum.optional(),
    search: z.string().trim().max(200).optional(),
    sortBy: z.enum(['appliedDate', 'company', 'status', 'updatedAt']).default('appliedDate'),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>['body'];
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>['body'];
export type ListApplicationsQuery = z.infer<typeof listApplicationsSchema>['query'];
