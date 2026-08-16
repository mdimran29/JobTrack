import { AppError } from '../../common/AppError';
import { authService } from '../auth/auth.service';
import { aiService } from './ai.service';
import { AnalyzeJobInput } from './job-match.schema';
import { PDFParse } from 'pdf-parse';
import {
  matchSkills,
  computeSkillsScore,
  computeExperienceScore,
  computeOverallScore,
  scoreToRecommendation,
  inferRequiredYearsFromTitle,
} from './skill-matcher';

export interface JobMatchResult {
  candidateSkills: string[];
  candidateCurrentRole: string;
  candidateExperienceYears: number | null;
  relevantExperienceSummary: string;
  resumeStrengths: string[];
  resumeRecommendations: string[];
  resumeAdditions: string[];
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  preferredSkillsScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  preferredSkillsMatched: string[];
  preferredSkillsMissing: string[];
  experienceReasoning: string;
  suggestedProjectTypes: string[];
  recommendation: string;
}

const latexToResumeText = (source: string) => source
  .replace(/%.*$/gm, '')
  .replace(/\\(?:section|subsection|subsubsection)\*?\{([^{}]*)\}/g, '\n$1\n')
  .replace(/\\(?:item|resumeItem)\s*(?:\{([^{}]*)\}|([^\n]+))/g, '\n$1$2')
  .replace(/\\text(?:bf|it|tt)\{([^{}]*)\}/g, '$1')
  .replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?/g, ' ')
  .replace(/[{}]/g, '')
  .replace(/\\/g, '')
  .replace(/[ \t]+/g, ' ')
  .replace(/\n\s*\n+/g, '\n')
  .trim();

export const extractResumeText = async (file: Express.Multer.File): Promise<string> => {
  try {
    if (file.originalname.toLowerCase().endsWith('.tex')) {
      return latexToResumeText(file.buffer.toString('utf8')).trim();
    }

    if (file.mimetype === 'text/plain' || file.originalname.toLowerCase().endsWith('.txt')) {
      return file.buffer.toString('utf8').trim();
    }

    const parser = new PDFParse({ data: file.buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text.trim();
  } catch {
    throw new AppError(400, 'Could not read that resume. Upload a text-based PDF or TXT file.', 'INVALID_RESUME');
  }
};

export const jobMatchService = {
  async analyze(userId: string, input: AnalyzeJobInput): Promise<JobMatchResult> {
    const user = await authService.getById(userId);

    if (user.skills.length === 0 && !input.resumeText) {
      throw new AppError(
        400,
        'Add your skills to your profile before analyzing a job',
        'PROFILE_INCOMPLETE'
      );
    }

    const extraction = await aiService.extractJobRequirements({
      companyName: input.companyName,
      jobTitle: input.jobTitle,
      jobDescription: input.jobDescription,
      userSkills: user.skills,
      userYearsOfExperience: user.yearsOfExperience,
      resumeText: input.resumeText,
    });

    const resumeSkillText = input.resumeText?.toLowerCase() ?? '';
    const explicitlyListedResumeSkills = input.resumeText
      ? [...extraction.requiredSkills, ...extraction.preferredSkills].filter((skill) =>
          resumeSkillText.includes(skill.toLowerCase())
        )
      : [];
    const candidateSkills = input.resumeText
      ? [...new Set([...extraction.candidateSkills, ...explicitlyListedResumeSkills])]
      : user.skills;
    const candidateExperienceYears = input.resumeText
      ? extraction.candidateExperienceYears
      : user.yearsOfExperience;

    const { matched: matchedSkills, missing: missingSkills } = matchSkills(
      extraction.requiredSkills,
      candidateSkills
    );
    const { matched: preferredSkillsMatched, missing: preferredSkillsMissing } = matchSkills(
      extraction.preferredSkills,
      candidateSkills
    );

    const requiredYears = extraction.experienceYearsRequired ?? inferRequiredYearsFromTitle(input.jobTitle);
    const skillsScore = computeSkillsScore(extraction.requiredSkills, matchedSkills);
    const preferredSkillsScore = computeSkillsScore(extraction.preferredSkills, preferredSkillsMatched);
    const experienceScore = computeExperienceScore(candidateExperienceYears, requiredYears);
    const overallScore = computeOverallScore(skillsScore, experienceScore, preferredSkillsScore);

    return {
      candidateSkills,
      candidateCurrentRole: extraction.candidateCurrentRole,
      candidateExperienceYears,
      relevantExperienceSummary: extraction.relevantExperienceSummary,
      resumeStrengths: input.resumeText ? extraction.resumeStrengths : [],
      resumeRecommendations: input.resumeText ? extraction.resumeRecommendations : [],
      resumeAdditions: input.resumeText ? extraction.resumeAdditions : [],
      overallScore,
      skillsScore,
      experienceScore,
      preferredSkillsScore,
      matchedSkills,
      missingSkills,
      preferredSkillsMatched,
      preferredSkillsMissing,
      experienceReasoning: extraction.experienceReasoning,
      suggestedProjectTypes: extraction.suggestedProjectTypes,
      recommendation: scoreToRecommendation(overallScore),
    };
  },
};
