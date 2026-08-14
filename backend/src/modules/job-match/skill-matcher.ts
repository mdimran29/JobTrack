const SKILL_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  node: 'node.js',
  nodejs: 'node.js',
  'node js': 'node.js',
  postgres: 'postgresql',
  postgresql: 'postgresql',
  psql: 'postgresql',
  k8s: 'kubernetes',
  aws: 'aws',
  'rest api': 'rest api',
  'rest apis': 'rest api',
  restful: 'rest api',
  'restful api': 'rest api',
  'restful apis': 'rest api',
  golang: 'go',
  reactjs: 'react',
  'react.js': 'react',
  vuejs: 'vue',
  'vue.js': 'vue',
  nextjs: 'next.js',
  mongo: 'mongodb',
  ci_cd: 'ci/cd',
  'ci cd': 'ci/cd',
  cicd: 'ci/cd',
};

export const normalizeSkill = (skill: string): string => {
  const cleaned = skill.trim().toLowerCase().replace(/\s+/g, ' ');
  return SKILL_ALIASES[cleaned] ?? cleaned;
};

export const skillsMatch = (a: string, b: string): boolean => normalizeSkill(a) === normalizeSkill(b);

const uniqueSkills = (skills: string[]): string[] => {
  const seen = new Set<string>();
  return skills.filter((skill) => {
    const normalized = normalizeSkill(skill);
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

export const matchSkills = (
  required: string[],
  userSkills: string[]
): { matched: string[]; missing: string[] } => {
  const normalizedUserSkills = new Set(userSkills.map(normalizeSkill));
  const matched: string[] = [];
  const missing: string[] = [];

  for (const skill of uniqueSkills(required)) {
    if (normalizedUserSkills.has(normalizeSkill(skill))) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  return { matched, missing };
};

const SENIOR_TITLE_PATTERN = /\b(senior|sr\.?|lead|staff|principal)\b/i;
const JUNIOR_TITLE_PATTERN = /\b(junior|jr\.?|entry[- ]level|intern)\b/i;

export const inferRequiredYearsFromTitle = (jobTitle: string): number => {
  if (SENIOR_TITLE_PATTERN.test(jobTitle)) return 5;
  if (JUNIOR_TITLE_PATTERN.test(jobTitle)) return 1;
  return 3;
};

export const computeSkillsScore = (requiredSkills: string[], matched: string[]): number => {
  const uniqueRequired = uniqueSkills(requiredSkills);
  if (uniqueRequired.length === 0) return 100;
  const matchedSkills = new Set(matched.map(normalizeSkill));
  const matchedCount = uniqueRequired.filter((skill) => matchedSkills.has(normalizeSkill(skill))).length;
  return Math.round((matchedCount / uniqueRequired.length) * 100);
};

export const computeExperienceScore = (userYears: number | null, requiredYears: number): number => {
  // Missing profile data is unknown, not proof that the candidate has no experience.
  if (userYears === null) return 50;
  const years = Math.max(0, userYears);
  if (requiredYears <= 0) return 100;
  if (years >= requiredYears) return 100;
  return Math.max(0, Math.round((years / requiredYears) * 100));
};

export const computeOverallScore = (
  skillsScore: number,
  experienceScore: number,
  preferredSkillsScore: number
): number => Math.round(0.7 * skillsScore + 0.2 * experienceScore + 0.1 * preferredSkillsScore);

export const scoreToRecommendation = (
  overallScore: number
): 'Excellent Match' | 'Strong Match' | 'Moderate Match' | 'Weak Match' | 'Poor Match' => {
  if (overallScore >= 90) return 'Excellent Match';
  if (overallScore >= 75) return 'Strong Match';
  if (overallScore >= 60) return 'Moderate Match';
  if (overallScore >= 40) return 'Weak Match';
  return 'Poor Match';
};
