import { z } from 'zod';

// Normalize so "Me@Example.com" and "me@example.com" resolve to the same account.
const emailField = z.string().trim().toLowerCase().email().max(254);

export const registerSchema = z.object({
  body: z.object({
    email: emailField,
    password: z.string().min(8).max(72),
    name: z.string().trim().min(1).max(120),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const loginSchema = z.object({
  body: z.object({
    email: emailField,
    password: z.string().min(1).max(72),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateProfileSchema = z.object({
  body: z.object({
    skills: z.array(z.string().trim().min(1).max(60)).max(50),
    yearsOfExperience: z.number().int().min(0).max(60),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
