import { GoogleGenAI, Type } from '@google/genai';
import { AppError } from '../../common/AppError';
import { env } from '../../config/env';
import { extractResumeText } from '../job-match/job-match.service';
import { z } from 'zod';
import { BulletInput, CoverLetterInput, SummaryInput } from './resume-tools.schema';

const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const atsResultSchema = z.object({
  score: z.number().int().min(0).max(100),
  verdict: z.string().min(1).max(200),
  strengths: z.array(z.string().min(1).max(300)).max(8),
  issues: z.array(z.string().min(1).max(300)).max(10),
  missingKeywords: z.array(z.string().min(1).max(80)).max(30),
  recommendations: z.array(z.string().min(1).max(300)).max(10),
});
const bulletResultSchema = z.object({ originalBullet: z.string(), rewrittenBullet: z.string().min(1).max(1000), rationale: z.string().min(1).max(500) });
const summaryResultSchema = z.object({ summary: z.string().min(1).max(1200), matchedKeywords: z.array(z.string().min(1).max(80)).max(20) });
const coverLetterResultSchema = z.object({ coverLetter: z.string().min(1).max(6000) });

const responseSchemas = {
  ats: { type: Type.OBJECT, properties: { score: { type: Type.INTEGER }, verdict: { type: Type.STRING }, strengths: { type: Type.ARRAY, items: { type: Type.STRING } }, issues: { type: Type.ARRAY, items: { type: Type.STRING } }, missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }, recommendations: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['score', 'verdict', 'strengths', 'issues', 'missingKeywords', 'recommendations'] },
  bullet: { type: Type.OBJECT, properties: { originalBullet: { type: Type.STRING }, rewrittenBullet: { type: Type.STRING }, rationale: { type: Type.STRING } }, required: ['originalBullet', 'rewrittenBullet', 'rationale'] },
  summary: { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['summary', 'matchedKeywords'] },
  coverLetter: { type: Type.OBJECT, properties: { coverLetter: { type: Type.STRING } }, required: ['coverLetter'] },
};

const generate = async <T>(prompt: string, schema: object, validator: z.ZodType<T>): Promise<T> => {
  let raw: string | undefined;
  try {
    const response = await client.models.generateContent({ model: env.GEMINI_MODEL, contents: prompt, config: { responseMimeType: 'application/json', responseSchema: schema } });
    raw = response.text;
  } catch {
    throw new AppError(502, 'AI generation failed, please try again', 'AI_GENERATION_FAILED');
  }
  if (!raw) throw new AppError(502, 'AI generation failed, please try again', 'AI_GENERATION_FAILED');
  try {
    const result = validator.safeParse(JSON.parse(raw));
    if (!result.success) throw new Error('Invalid AI response');
    return result.data;
  } catch {
    throw new AppError(502, 'AI generation failed, please try again', 'AI_GENERATION_FAILED');
  }
};

export const resumeToolsService = {
  async analyzeAts(resume: Express.Multer.File, jobDescription?: string) {
    const resumeText = await extractResumeText(resume);
    return generate(`Evaluate this resume for ATS compatibility. Score parsing quality, structure, clarity, keyword usage, measurable impact, and compatibility with the target job when provided. Never recommend inventing experience.\nTarget job:\n${jobDescription ?? '(not provided)'}\nResume:\n${resumeText}`, responseSchemas.ats, atsResultSchema);
  },
  rewriteBullet(input: BulletInput) {
    return generate(`Rewrite exactly one resume bullet for the target job. Preserve truthful facts and metrics, improve impact and relevant keywords, and do not add unsupported claims. Return the original bullet unchanged.\nJob: ${input.jobTitle} at ${input.companyName}\nDescription:\n${input.jobDescription}\nBullet: ${input.bullet}`, responseSchemas.bullet, bulletResultSchema);
  },
  summary(input: SummaryInput) {
    return generate(`Write a concise, job-specific resume summary (3-4 sentences) using only evidence in the resume. Emphasize relevant experience, skills, and outcomes. Do not invent facts.\nJob: ${input.jobTitle} at ${input.companyName}\nDescription:\n${input.jobDescription}\nResume:\n${input.resumeText}`, responseSchemas.summary, summaryResultSchema);
  },
  coverLetter(input: CoverLetterInput) {
    return generate(`Write a tailored cover letter of 3-5 paragraphs for this job, using only evidence in the resume. Be ${input.tone}, specific, and avoid generic claims or invented details. Do not include address/date placeholders.\nJob: ${input.jobTitle} at ${input.companyName}\nDescription:\n${input.jobDescription}\nResume:\n${input.resumeText}`, responseSchemas.coverLetter, coverLetterResultSchema);
  },
};
