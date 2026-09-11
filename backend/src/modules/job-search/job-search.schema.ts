import { z } from 'zod';

export const searchJobsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    keyword: z.string().min(1).max(120),
    location: z.string().max(120).optional(),
    page: z.coerce.number().int().positive().max(50).default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
  }),
});

export type SearchJobsQuery = z.infer<typeof searchJobsSchema>['query'];
