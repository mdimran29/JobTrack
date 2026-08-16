import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../../config/env';
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

const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'React.js', 'Next.js', 'Vue', 'Angular', 'HTML', 'CSS',
  'Node.js', 'Python', 'Java', 'Go', 'Rust', 'Solidity', 'Smart Contracts', 'Blockchain',
  'Blockchain Architecture', 'Web3', 'Web3.js', 'Web3 libraries', 'Ethers.js', 'Hardhat',
  'Foundry', 'Chainlink', 'DeFi', 'Layer 2 networks', 'AWS', 'Docker', 'PostgreSQL', 'MySQL',
  'MongoDB', 'Redis', 'SQL', 'REST APIs', 'GraphQL', 'Git', 'Kubernetes', 'Terraform',
];

const containsSkill = (text: string, skill: string) =>
  text.toLowerCase().includes(skill.toLowerCase());

const fallbackExtraction = (input: ExtractInput): GeminiExtraction => {
  const jobText = input.jobDescription.toLowerCase();
  const resumeText = input.resumeText?.toLowerCase() ?? '';
  const candidateSkills = [...new Set([
    ...input.userSkills,
    ...COMMON_SKILLS.filter((skill) => containsSkill(resumeText, skill)),
  ])];
  const requiredSkills = COMMON_SKILLS.filter((skill) => containsSkill(jobText, skill));
  const candidateYearsMatch = input.resumeText?.match(/(\d{1,2})\+?\s+years?/i);
  const candidateYears = candidateYearsMatch ? Number(candidateYearsMatch[1]) : input.userYearsOfExperience;
  const requiredYearsMatch = input.jobDescription.match(/(\d{1,2})\+?\s+years?/i);
  const requiredYears = requiredYearsMatch ? Number(requiredYearsMatch[1]) : null;
  const roleMatch = input.resumeText?.match(/(?:current|most recent)?\s*(?:role|title)\s*[:\-]\s*([^\n]+)/i);
  const currentRole = roleMatch?.[1]?.trim() || 'Not stated';
  return {
    candidateSkills,
    candidateCurrentRole: currentRole,
    candidateExperienceYears: candidateYears,
    relevantExperienceSummary: input.resumeText
      ? 'The resume was reviewed using its available text, projects, roles, and technologies. Add clearer role dates and project outcomes for a more precise experience comparison.'
      : 'No uploaded resume was available, so this comparison uses the skills saved in your profile.',
    resumeStrengths: [],
    resumeRecommendations: input.resumeText ? ['Add measurable outcomes and clear responsibilities to each relevant project or role.'] : [],
    resumeAdditions: input.resumeText ? ['Add truthful evidence for the job requirements that appear in your projects or experience.'] : [],
    requiredSkills,
    preferredSkills: [],
    experienceYearsRequired: requiredYears,
    experienceReasoning: requiredYears === null
      ? 'The job description does not state a specific experience requirement.'
      : `The candidate has ${candidateYears ?? 'an unknown amount of'} experience compared with the stated ${requiredYears}-year requirement.`,
    suggestedProjectTypes: [],
  };
};

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
1. candidateSkills: canonical technical skills explicitly present in the candidate profile or resume, including skills listed under Skills, Technical Skills, Relevant Skills to Add, or similar sections. Skills in a "Relevant Skills to Add" section may count for keyword matching, but must not be treated as proven professional experience.
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
    let lastError: unknown;
    try {
      const models = [...new Set([env.GEMINI_MODEL, 'gemini-3.1-flash-lite', 'gemini-3.5-flash'])];
      for (const model of models) {
        try {
          const response = await client.models.generateContent({
            model,
            contents: buildPrompt(input),
            config: {
              responseMimeType: 'application/json',
              responseSchema: RESPONSE_SCHEMA,
              temperature: 0,
              seed: 42,
            },
          });
          raw = response.text;
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (!raw) throw lastError;
    } catch (error) {
      console.error('Gemini job analysis request failed; using local fallback:', error);
      return fallbackExtraction(input);
    }

    if (!raw) {
      return fallbackExtraction(input);
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      return fallbackExtraction(input);
    }

    const result = geminiExtractionSchema.safeParse(parsedJson);
    if (!result.success) {
      console.error('Gemini job analysis response validation failed:', result.error.flatten());
      return fallbackExtraction(input);
    }

    return result.data;
  },
};
