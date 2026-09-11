import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(16),
    JWT_EXPIRES_IN: z.string().default('7d'),
    PORT: z.coerce.number().int().positive().default(4000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    // Comma-separated list of allowed browser origins, e.g. "https://app.example.com,https://preview.example.com".
    CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
    GEMINI_API_KEY: z.string().min(1),
    GEMINI_MODEL: z.string().default('gemini-3.1-flash-lite'),
    ADZUNA_APP_ID: z.string().optional(),
    ADZUNA_APP_KEY: z.string().optional(),
    RAPIDAPI_KEY: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === 'production' && value.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET must be at least 32 characters in production',
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const clientOrigins = parsed.data.CLIENT_ORIGIN.split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

export const env = { ...parsed.data, CLIENT_ORIGINS: clientOrigins };
