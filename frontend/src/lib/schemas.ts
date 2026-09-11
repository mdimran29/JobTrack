import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Enter your email').email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(1, 'Enter your name').max(120),
  email: z.string().min(1, 'Enter your email').email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
});
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const applicationSchema = z.object({
  company: z.string().min(1, 'Company is required').max(200),
  position: z.string().min(1, 'Role is required').max(200),
  status: z.enum([
    'APPLIED',
    'SCREENING',
    'INTERVIEW',
    'TECHNICAL',
    'OFFER',
    'REJECTED',
    'WITHDRAWN',
  ]),
  appliedDate: z.string().min(1, 'Applied date is required'),
  location: z.string().max(200).optional().or(z.literal('')),
  jobUrl: z
    .string()
    .trim()
    .url('Enter a valid URL')
    .refine((value) => /^https?:\/\//i.test(value), 'Enter a link starting with http:// or https://')
    .optional()
    .or(z.literal('')),
  source: z.string().max(100).optional().or(z.literal('')),
  salaryMin: z.union([z.coerce.number().int().positive(), z.nan()]).optional(),
  salaryMax: z.union([z.coerce.number().int().positive(), z.nan()]).optional(),
  followUpDate: z.string().optional().or(z.literal('')),
}).refine(
  (values) =>
    values.salaryMin === undefined ||
    values.salaryMax === undefined ||
    Number.isNaN(values.salaryMin) ||
    Number.isNaN(values.salaryMax) ||
    values.salaryMin <= values.salaryMax,
  { message: 'Salary max must be at least the salary min', path: ['salaryMax'] }
);
export type ApplicationFormValues = z.infer<typeof applicationSchema>;

export const interviewSchema = z.object({
  type: z.enum(['PHONE_SCREEN', 'TECHNICAL', 'ONSITE', 'BEHAVIORAL', 'FINAL', 'OTHER']),
  scheduledAt: z.string().min(1, 'Date and time are required'),
  durationMinutes: z.union([z.coerce.number().int().positive(), z.nan()]).optional(),
  interviewerName: z.string().max(200).optional().or(z.literal('')),
  mode: z.string().max(100).optional().or(z.literal('')),
  outcome: z.enum(['PENDING', 'PASSED', 'FAILED', 'CANCELLED']),
});
export type InterviewFormValues = z.infer<typeof interviewSchema>;

export const noteSchema = z.object({
  content: z.string().min(1, 'Write something first').max(5000),
});
export type NoteFormValues = z.infer<typeof noteSchema>;

export const jobMatchFormSchema = z.object({
  companyName: z.string().min(1, 'Company is required').max(200),
  jobTitle: z.string().min(1, 'Job title is required').max(200),
  jobDescription: z
    .string()
    .min(20, 'Paste the full job description (at least 20 characters)')
    .max(20000),
});
export type JobMatchFormValues = z.infer<typeof jobMatchFormSchema>;
