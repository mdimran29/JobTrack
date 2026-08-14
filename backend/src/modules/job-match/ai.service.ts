import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../../config/env';
import { AppError } from '../../common/AppError';
import { geminiExtractionSchema, GeminiExtraction } from './job-match.schema';

const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    candidateSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    candidateCurrentRole: { type: Type.STRING },
    candidateExperienceYears: { type: Type.NUMBER, nullable: true },
    relevantExperienceSummary: { type: Type.STRING },
    resumeStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    resumeRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    resumeAdditions: { type: Type.ARRAY, items: { type: Type.STRING } },
    requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    preferredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    experienceYearsRequired: { type: Type.NUMBER, nullable: true },
    experienceReasoning: { type: Type.STRING },
    suggestedProjectTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    'candidateSkills',
    'candidateCurrentRole',
    'candidateExperienceYears',
    'relevantExperienceSummary',
    'resumeStrengths',
    'resumeRecommendations',
    'resumeAdditions',
    'requiredSkills',
    'preferredSkills',
    'experienceYearsRequired',
    'experienceReasoning',
    'suggestedProjectTypes',
  ],
};

interface ExtractInput {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  userSkills: string[];
  userYearsOfExperience: number | null;
  resumeText?: string;
}

const buildPrompt = (input: ExtractInput): string => `You are analyzing a job posting against a candidate's profile for a job-tracking app.

Company: ${input.companyName}
Job Title: ${input.jobTitle}
Job Description:
"""
${input.jobDescription}
"""

Candidate's current skills: ${input.userSkills.length > 0 ? input.userSkills.join(', ') : '(none listed)'}
Candidate's years of experience: ${input.userYearsOfExperience ?? 'unknown'}
${input.resumeText ? `\nUploaded resume text:\n"""\n${input.resumeText}\n"""` : ''}

Extract candidate information from the profile or uploaded resume:
1. candidateSkills: canonical technical skills explicitly present in the candidate profile or resume.
2. candidateCurrentRole: the candidate's current or most recent role, or "Not stated" if unavailable.
3. candidateExperienceYears: total professional experience stated or reasonably calculable from the resume, or null if unavailable. Do not guess.
4. relevantExperienceSummary: two plain-English sentences explaining how the candidate's roles and projects relate to the target job. Mention relevant project types and responsibilities, not just skills.
5. resumeStrengths: 2-5 concrete strengths in the resume for this target job, including relevant roles, projects, outcomes, or evidence.

Then extract from the job description:
6. requiredSkills: the technical skills explicitly required for this role (short canonical names, e.g. "Node.js" not "strong Node.js background"). Include only skills necessary for the core work.
7. preferredSkills: technical skills listed as nice-to-have/preferred/bonus, distinct from requiredSkills.
8. experienceYearsRequired: the minimum years of experience stated in the text, or null if not stated.
9. experienceReasoning: one or two plain-English sentences comparing the candidate's experience and project background to what this role needs.
10. suggestedProjectTypes: 1-3 short descriptions of projects that would strengthen an application for this role.
11. resumeRecommendations: when an uploaded resume is provided, give 2-5 specific, actionable recommendations based on the whole resume. Reference missing required skills, weak project evidence, unclear impact, role progression, or relevant keywords. Do not invent experience. When no resume is uploaded, return an empty array.
12. resumeAdditions: when an uploaded resume is provided, list 2-5 concrete things the candidate should add to the resume to better match this job, such as truthful technologies used, relevant project details, responsibilities, metrics, certifications, or job-description keywords. Phrase each as an item to add, and never tell the candidate to claim experience they do not have. When no resume is uploaded, return an empty array.

Do not invent a match score or a recommendation label — only extract the facts above. If wording is ambiguous, leave the skill out rather than guessing.`;

export const aiService = {
  async extractJobRequirements(input: ExtractInput): Promise<GeminiExtraction> {
    let raw: string | undefined;
    try {
      const response = await client.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: buildPrompt(input),
        config: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      });
      raw = response.text;
    } catch {
      throw new AppError(502, 'AI analysis failed, please try again');
    }

    if (!raw) {
      throw new AppError(502, 'AI analysis failed, please try again');
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      throw new AppError(502, 'AI analysis failed, please try again');
    }

    const result = geminiExtractionSchema.safeParse(parsedJson);
    if (!result.success) {
      throw new AppError(502, 'AI analysis failed, please try again');
    }

    return result.data;
  },
};
