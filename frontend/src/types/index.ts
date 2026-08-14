export type ApplicationStatus =
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'TECHNICAL'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN';

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'TECHNICAL',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
];

/** Stages that make up the forward pipeline (excludes terminal REJECTED/WITHDRAWN). */
export const PIPELINE_STAGES: ApplicationStatus[] = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'TECHNICAL',
  'OFFER',
];

export type InterviewType =
  | 'PHONE_SCREEN'
  | 'TECHNICAL'
  | 'ONSITE'
  | 'BEHAVIORAL'
  | 'FINAL'
  | 'OTHER';

export const INTERVIEW_TYPES: InterviewType[] = [
  'PHONE_SCREEN',
  'TECHNICAL',
  'ONSITE',
  'BEHAVIORAL',
  'FINAL',
  'OTHER',
];

export type InterviewOutcome = 'PENDING' | 'PASSED' | 'FAILED' | 'CANCELLED';

export const INTERVIEW_OUTCOMES: InterviewOutcome[] = ['PENDING', 'PASSED', 'FAILED', 'CANCELLED'];

export interface User {
  id: string;
  email: string;
  name: string;
  skills: string[];
  yearsOfExperience: number | null;
}

export interface JobApplication {
  id: string;
  userId: string;
  company: string;
  position: string;
  jobUrl: string | null;
  location: string | null;
  status: ApplicationStatus;
  appliedDate: string;
  salaryMin: number | null;
  salaryMax: number | null;
  source: string | null;
  followUpDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplicationDetail extends JobApplication {
  interviews: Interview[];
  notes: Note[];
}

export interface Interview {
  id: string;
  applicationId: string;
  type: InterviewType;
  scheduledAt: string;
  durationMinutes: number | null;
  interviewerName: string | null;
  mode: string | null;
  outcome: InterviewOutcome;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  applicationId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface DashboardStats {
  totalApplications: number;
  byStatus: Record<ApplicationStatus, number>;
  interviewRate: number;
  offerRate: number;
  recentActivity: {
    id: string;
    company: string;
    position: string;
    status: ApplicationStatus;
    updatedAt: string;
  }[];
}

export interface ApiErrorBody {
  error: {
    message: string;
    code?: string;
  };
}

export interface ApplicationListParams {
  page?: number;
  limit?: number;
  status?: ApplicationStatus;
  search?: string;
  sortBy?: 'appliedDate' | 'company' | 'status' | 'updatedAt';
  order?: 'asc' | 'desc';
}

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
