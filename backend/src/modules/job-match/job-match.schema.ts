import { z } from 'zod';

export const analyzeJobSchema = z.object({
  body: z.object({
    companyName: z.string().min(1).max(200),
    jobTitle: z.string().min(1).max(200),
    jobDescription: z.string().min(20).max(20000),
    resumeText: z.string().min(50).max(50000).optional(),
    resumeVersionId: z.string().min(1).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export type AnalyzeJobInput = z.infer<typeof analyzeJobSchema>['body'];

export const geminiExtractionSchema = z.object({
  candidateSkills: z.array(z.string().min(1).max(60)).max(50),
  candidateCurrentRole: z.string().min(1).max(300),
  candidateExperienceYears: z.number().int().min(0).max(60).nullable(),
  relevantExperienceSummary: z.string().min(1).max(2000),
  resumeStrengths: z.array(z.string().min(1).max(500)).max(8),
  resumeRecommendations: z.array(z.string().min(1).max(600)).max(8),
  resumeAdditions: z.array(z.string().min(1).max(600)).max(8),
  requiredSkills: z.array(z.string().min(1).max(60)).max(30),
  preferredSkills: z.array(z.string().min(1).max(60)).max(30),
  experienceYearsRequired: z.number().int().min(0).max(60).nullable(),
  experienceReasoning: z.string().min(1).max(1000),
  suggestedProjectTypes: z.array(z.string().min(1).max(200)).max(10),
});

export type GeminiExtraction = z.infer<typeof geminiExtractionSchema>;
