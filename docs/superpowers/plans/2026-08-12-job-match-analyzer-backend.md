# Job Match Analyzer — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a backend `POST /api/job-match/analyze` endpoint that calls Gemini to extract job requirements, then computes match scores deterministically against the user's profile — plus the profile fields and endpoint it depends on.

**Architecture:** New `job-match` module following the existing layered pattern (routes → controller → service → schema), a small `ai.service.ts` wrapping `@google/genai` for structured extraction, and pure scoring logic in `skill-matcher.ts` with no Prisma dependency. Two new fields on the existing `User` model. `auth` module gains one endpoint to write those fields.

**Tech Stack:** Node.js, Express, TypeScript, Prisma/PostgreSQL, Zod, `@google/genai` (new dependency, backend only).

## Global Constraints

- No new models/tables — `skills`/`yearsOfExperience` live directly on `User`.
- No match-result persistence — `/analyze` is stateless request/response.
- The AI response is validated with Zod regardless of Gemini's own schema enforcement (defense in depth).
- All scores (`skillsScore`, `experienceScore`, `overallScore`, `recommendation`) are computed by backend code, never taken from the AI response.
- `GEMINI_API_KEY` never leaves the backend process — not logged, not echoed in any error response.
- This repo has **no test framework installed** (no jest/vitest anywhere, despite `backend.md` describing a testing scope — that doc is aspirational, not current state). Do not add one for this feature; it would be a bigger footprint than the feature itself and the codebase has no existing pattern to follow. Verify each task by running `tsc --noEmit` (typecheck) and manual `curl`/`tsx` smoke checks instead, matching how the rest of this codebase is actually verified.
- This directory is **not a git repository** (`git status` confirms `fatal: not a git repository`). Task steps below use a "Checkpoint" step instead of `git commit` — do not run `git init` or any git command unless the user asks for it.
- Follow the existing repository/service/controller layering exactly: controllers never call Prisma directly; `skill-matcher.ts` and `ai.service.ts` contain no Express types (`Request`/`Response`) so they stay unit-testable in isolation even without a runner installed today.

---

### Task 1: Add profile fields to the `User` model

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Creates: a new migration under `backend/prisma/migrations/`

**Interfaces:**
- Produces: `User.skills: string[]`, `User.yearsOfExperience: number | null` — consumed by Task 3 (auth) and Task 7 (job-match service).

- [ ] **Step 1: Add the two fields to the `User` model**

In `backend/prisma/schema.prisma`, inside `model User { ... }`, add after `updatedAt`:

```prisma
  skills            String[] @default([])
  yearsOfExperience Int?
```

- [ ] **Step 2: Generate and apply the migration**

Run: `cd backend && npx prisma migrate dev --name add_user_profile_fields`
Expected: a new folder `backend/prisma/migrations/<timestamp>_add_user_profile_fields/migration.sql` is created, containing an `ALTER TABLE "User" ADD COLUMN "skills" ...` statement, and the command exits 0.

- [ ] **Step 3: Verify the Prisma client regenerated with the new fields**

Run: `cd backend && npx prisma generate`
Then check: `grep -n "skills" node_modules/.prisma/client/index.d.ts | head -3`
Expected: at least one match referencing `skills` on the `User` type.

- [ ] **Step 4: Checkpoint**

No git in this repo — confirm the migration file exists and `npx tsc -p tsconfig.json --noEmit` (run from `backend/`) still passes before moving on.

---

### Task 2: Add Gemini config to `env.ts`

**Files:**
- Modify: `backend/src/config/env.ts`
- Modify: `backend/.env.example`
- Modify: `backend/.env` (local only — add your real key here, this file is gitignored)

**Interfaces:**
- Produces: `env.GEMINI_API_KEY: string`, `env.GEMINI_MODEL: string` — consumed by Task 6 (`ai.service.ts`).

- [ ] **Step 1: Extend the zod env schema**

In `backend/src/config/env.ts`, add two fields to `envSchema`, after `CLIENT_ORIGIN`:

```ts
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().default('gemini-3.6-flash'),
```

- [ ] **Step 2: Document the new vars in `.env.example`**

Append to `backend/.env.example`:

```
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-3.6-flash"
```

- [ ] **Step 3: Add a real (or placeholder) key to local `.env`**

Append the same two lines to `backend/.env`, with an actual key if you have one — the server will refuse to boot without `GEMINI_API_KEY` set once this task lands, since it's a required (non-default) field in the schema.

- [ ] **Step 4: Verify the server still boots**

Run: `cd backend && npm run dev` briefly, then stop it (Ctrl+C).
Expected: no "Invalid environment variables" error printed; server logs its normal startup message.

- [ ] **Step 5: Checkpoint**

Confirm `backend/.env` is still listed in `.gitignore` (it already is — just don't remove that).

---

### Task 3: `PATCH /api/auth/profile` — read/write skills + years of experience

**Files:**
- Modify: `backend/src/modules/auth/auth.schema.ts`
- Modify: `backend/src/modules/auth/auth.service.ts`
- Modify: `backend/src/modules/auth/auth.controller.ts`
- Modify: `backend/src/modules/auth/auth.routes.ts`

**Interfaces:**
- Consumes: `AuthedRequest` from `backend/src/common/types.ts`, `asyncHandler` from `backend/src/common/asyncHandler.ts`, `validate` from `backend/src/middleware/validate.middleware.ts` — all existing.
- Produces: `authService.updateProfile(userId: string, input: UpdateProfileInput): Promise<PublicUser>` where `PublicUser` now includes `skills: string[]` and `yearsOfExperience: number | null`. Consumed by Task 7 (`job-match.service.ts` reads `user.skills`/`user.yearsOfExperience` via `authService.getById`).

- [ ] **Step 1: Add `updateProfileSchema` to `auth.schema.ts`**

Append to `backend/src/modules/auth/auth.schema.ts`:

```ts
export const updateProfileSchema = z.object({
  body: z.object({
    skills: z.array(z.string().min(1).max(60)).max(50),
    yearsOfExperience: z.number().int().min(0).max(60),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
```

- [ ] **Step 2: Update `toPublicUser` and add `updateProfile` to `auth.service.ts`**

In `backend/src/modules/auth/auth.service.ts`, replace the `toPublicUser` function and its call sites' shape to include the new fields, and add an `updateProfile` method. Replace:

```ts
const toPublicUser = (user: { id: string; email: string; name: string }) => ({
  id: user.id,
  email: user.email,
  name: user.name,
});
```

with:

```ts
const toPublicUser = (user: {
  id: string;
  email: string;
  name: string;
  skills: string[];
  yearsOfExperience: number | null;
}) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  skills: user.skills,
  yearsOfExperience: user.yearsOfExperience,
});
```

Then add this method inside the `authService` object, after `getById`:

```ts
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { skills: input.skills, yearsOfExperience: input.yearsOfExperience },
    });
    return toPublicUser(user);
  },
```

Add `UpdateProfileInput` to the existing import from `./auth.schema` at the top of the file.

- [ ] **Step 3: Add the controller handler**

In `backend/src/modules/auth/auth.controller.ts`, add inside the `authController` object, after `me`:

```ts
  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.updateProfile((req as AuthedRequest).userId, req.body);
    res.status(200).json({ data: user });
  }),
```

- [ ] **Step 4: Add the route**

In `backend/src/modules/auth/auth.routes.ts`, add after the `/me` route:

```ts
authRouter.patch(
  '/profile',
  authMiddleware,
  validate(updateProfileSchema),
  authController.updateProfile
);
```

Add `updateProfileSchema` to the existing import from `./auth.schema`.

- [ ] **Step 5: Typecheck**

Run: `cd backend && npm run typecheck`
Expected: exits 0, no errors.

- [ ] **Step 6: Manual smoke test**

With the dev server running (`npm run dev` in `backend/`) and a registered test user, run:

```bash
curl -i -c /tmp/jt-cookies -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"password123"}'

curl -i -b /tmp/jt-cookies -X PATCH http://localhost:4000/api/auth/profile \
  -H 'Content-Type: application/json' \
  -d '{"skills":["Node.js","TypeScript","PostgreSQL","Docker"],"yearsOfExperience":6}'
```

Expected: second call returns `200` with `"data": { ..., "skills": ["Node.js","TypeScript","PostgreSQL","Docker"], "yearsOfExperience": 6 }`.

- [ ] **Step 7: Checkpoint**

Confirm the smoke test output matches expected before moving to Task 4.

---

### Task 4: `skill-matcher.ts` — pure scoring logic

**Files:**
- Create: `backend/src/modules/job-match/skill-matcher.ts`

**Interfaces:**
- Consumes: nothing (pure functions, no imports beyond none needed).
- Produces (all consumed by Task 7, `job-match.service.ts`):
  - `normalizeSkill(skill: string): string`
  - `skillsMatch(a: string, b: string): boolean`
  - `matchSkills(required: string[], userSkills: string[]): { matched: string[]; missing: string[] }`
  - `inferRequiredYearsFromTitle(jobTitle: string): number`
  - `computeSkillsScore(requiredSkills: string[], matched: string[]): number`
  - `computeExperienceScore(userYears: number | null, requiredYears: number): number`
  - `computeOverallScore(skillsScore: number, experienceScore: number): number`
  - `scoreToRecommendation(overallScore: number): 'Excellent Match' | 'Strong Match' | 'Moderate Match' | 'Weak Match' | 'Poor Match'`

- [ ] **Step 1: Write the file**

Create `backend/src/modules/job-match/skill-matcher.ts`:

```ts
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

export const matchSkills = (
  required: string[],
  userSkills: string[]
): { matched: string[]; missing: string[] } => {
  const normalizedUserSkills = new Set(userSkills.map(normalizeSkill));
  const matched: string[] = [];
  const missing: string[] = [];

  for (const skill of required) {
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
  if (requiredSkills.length === 0) return 100;
  return Math.round((matched.length / requiredSkills.length) * 100);
};

export const computeExperienceScore = (userYears: number | null, requiredYears: number): number => {
  const years = userYears ?? 0;
  if (requiredYears <= 0) return 100;
  if (years >= requiredYears) return 100;
  return Math.max(0, Math.round((years / requiredYears) * 100));
};

export const computeOverallScore = (skillsScore: number, experienceScore: number): number =>
  Math.round(0.8 * skillsScore + 0.2 * experienceScore);

export const scoreToRecommendation = (
  overallScore: number
): 'Excellent Match' | 'Strong Match' | 'Moderate Match' | 'Weak Match' | 'Poor Match' => {
  if (overallScore >= 90) return 'Excellent Match';
  if (overallScore >= 75) return 'Strong Match';
  if (overallScore >= 60) return 'Moderate Match';
  if (overallScore >= 40) return 'Weak Match';
  return 'Poor Match';
};
```

- [ ] **Step 2: Typecheck**

Run: `cd backend && npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Manual verification script**

Since there's no test runner, verify the pure functions directly with `tsx`. Create a throwaway file `backend/scratch-verify.ts`:

```ts
import {
  matchSkills,
  computeSkillsScore,
  computeExperienceScore,
  computeOverallScore,
  scoreToRecommendation,
  inferRequiredYearsFromTitle,
} from './src/modules/job-match/skill-matcher';

const { matched, missing } = matchSkills(
  ['Node.js', 'TypeScript', 'PostgreSQL', 'REST API', 'Docker', 'AWS', 'Kubernetes'],
  ['Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'JS']
);
console.log('matched', matched);
console.log('missing', missing);

const skillsScore = computeSkillsScore(
  ['Node.js', 'TypeScript', 'PostgreSQL', 'REST API', 'Docker', 'AWS', 'Kubernetes'],
  matched
);
console.log('skillsScore', skillsScore); // expect 71 (5/7)

const experienceScore = computeExperienceScore(6, 5);
console.log('experienceScore', experienceScore); // expect 100

console.log('overallScore', computeOverallScore(80, 90)); // expect 82
console.log('recommendation', scoreToRecommendation(82)); // expect 'Strong Match'
console.log('seniority', inferRequiredYearsFromTitle('Senior Backend Engineer')); // expect 5
```

Run: `cd backend && npx tsx scratch-verify.ts`
Expected output includes `matched [ 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker' ]`, `skillsScore 57` (4/7 rounded — recompute by hand if the printed number differs from a stale comment above and trust the printed number), `experienceScore 100`, `overallScore 82`, `recommendation Strong Match`, `seniority 5`.

Delete `backend/scratch-verify.ts` after confirming.

- [ ] **Step 4: Checkpoint**

Confirm output matched expectations, scratch file deleted.

---

### Task 5: `job-match.schema.ts` — request and AI-response validation

**Files:**
- Create: `backend/src/modules/job-match/job-match.schema.ts`

**Interfaces:**
- Produces: `analyzeJobSchema` (zod), `AnalyzeJobInput` (type), `geminiExtractionSchema` (zod), `GeminiExtraction` (type). Consumed by Task 6 (`ai.service.ts` uses `geminiExtractionSchema`/`GeminiExtraction`) and Task 8 (`job-match.routes.ts` uses `analyzeJobSchema`).

- [ ] **Step 1: Write the file**

Create `backend/src/modules/job-match/job-match.schema.ts`:

```ts
import { z } from 'zod';

export const analyzeJobSchema = z.object({
  body: z.object({
    companyName: z.string().min(1).max(200),
    jobTitle: z.string().min(1).max(200),
    jobDescription: z.string().min(20).max(20000),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export type AnalyzeJobInput = z.infer<typeof analyzeJobSchema>['body'];

export const geminiExtractionSchema = z.object({
  requiredSkills: z.array(z.string().min(1).max(60)).max(30),
  preferredSkills: z.array(z.string().min(1).max(60)).max(30),
  experienceYearsRequired: z.number().int().min(0).max(60).nullable(),
  experienceReasoning: z.string().min(1).max(500),
  suggestedProjectTypes: z.array(z.string().min(1).max(200)).max(10),
});

export type GeminiExtraction = z.infer<typeof geminiExtractionSchema>;
```

- [ ] **Step 2: Typecheck**

Run: `cd backend && npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Checkpoint**

Move to Task 6.

---

### Task 6: `ai.service.ts` — Gemini structured extraction

**Files:**
- Modify: `backend/package.json` (add `@google/genai`)
- Create: `backend/src/modules/job-match/ai.service.ts`

**Interfaces:**
- Consumes: `env` from `backend/src/config/env.ts` (Task 2), `AppError` from `backend/src/common/AppError.ts`, `geminiExtractionSchema`/`GeminiExtraction` from Task 5.
- Produces: `aiService.extractJobRequirements(input: { companyName: string; jobTitle: string; jobDescription: string; userSkills: string[]; userYearsOfExperience: number | null }): Promise<GeminiExtraction>`. Consumed by Task 7 (`job-match.service.ts`).

- [ ] **Step 1: Install the dependency**

Run: `cd backend && npm install @google/genai@^2.16.0`
Expected: `package.json` gains `"@google/genai": "^2.16.0"` under `dependencies`, install exits 0.

- [ ] **Step 2: Write `ai.service.ts`**

Create `backend/src/modules/job-match/ai.service.ts`:

```ts
import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../../config/env';
import { AppError } from '../../common/AppError';
import { geminiExtractionSchema, GeminiExtraction } from './job-match.schema';

const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    preferredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    experienceYearsRequired: { type: Type.NUMBER, nullable: true },
    experienceReasoning: { type: Type.STRING },
    suggestedProjectTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
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

Extract, from the job description text only:
1. requiredSkills: the technical skills explicitly required for this role (short canonical names, e.g. "Node.js" not "strong Node.js background").
2. preferredSkills: technical skills listed as nice-to-have/preferred/bonus, distinct from requiredSkills.
3. experienceYearsRequired: the minimum years of experience stated in the text (a single integer), or null if the text does not state a number.
4. experienceReasoning: one or two plain-English sentences comparing the candidate's years of experience to what this role appears to need, written for the candidate to read directly.
5. suggestedProjectTypes: 1-3 short descriptions of the kinds of projects that would strengthen an application for this specific role, based only on the job description (not the candidate's actual history, which you don't have).

Do not invent a match score or a recommendation label — only extract the facts above.`;

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
```

- [ ] **Step 3: Typecheck**

Run: `cd backend && npm run typecheck`
Expected: exits 0. If `Type` or `GoogleGenAI` imports fail to resolve, check the installed `@google/genai` version's exported names with `grep -n "export" node_modules/@google/genai/dist/**/*.d.ts | grep -i "class GoogleGenAI\|enum Type"` and adjust the import to match.

- [ ] **Step 4: Manual smoke test against the real API**

Create a throwaway `backend/scratch-verify-ai.ts`:

```ts
import { aiService } from './src/modules/job-match/ai.service';

aiService
  .extractJobRequirements({
    companyName: 'Coinbase',
    jobTitle: 'Backend Engineer',
    jobDescription:
      'We are looking for a Backend Engineer with 5+ years of experience in Node.js, TypeScript, PostgreSQL, Docker, and AWS. Experience with Kubernetes is a plus. You will build REST APIs for our trading platform.',
    userSkills: ['Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
    userYearsOfExperience: 6,
  })
  .then((result) => console.log(JSON.stringify(result, null, 2)))
  .catch((err) => console.error('FAILED', err));
```

Run: `cd backend && npx tsx scratch-verify-ai.ts`
Expected: prints valid JSON with `requiredSkills` including things like `Node.js`, `TypeScript`, `PostgreSQL`, `Docker`, `AWS`; `preferredSkills` including `Kubernetes`; `experienceYearsRequired: 5`; a non-empty `experienceReasoning`; and 1-3 `suggestedProjectTypes`. If it fails with an auth error, double check `GEMINI_API_KEY` in `backend/.env`.

Delete `backend/scratch-verify-ai.ts` after confirming.

- [ ] **Step 5: Checkpoint**

Confirm the real Gemini call round-trips and validates before moving to Task 7.

---

### Task 7: `job-match.service.ts` — orchestration and deterministic scoring

**Files:**
- Create: `backend/src/modules/job-match/job-match.service.ts`

**Interfaces:**
- Consumes: `aiService.extractJobRequirements` (Task 6), `matchSkills`/`computeSkillsScore`/`computeExperienceScore`/`computeOverallScore`/`scoreToRecommendation`/`inferRequiredYearsFromTitle` (Task 4), `authService.getById` (existing, extended in Task 3), `AppError` (existing), `AnalyzeJobInput` (Task 5).
- Produces: `jobMatchService.analyze(userId: string, input: AnalyzeJobInput): Promise<JobMatchResult>` where `JobMatchResult` is defined in this file and consumed by Task 8 (`job-match.controller.ts`).

- [ ] **Step 1: Write the file**

Create `backend/src/modules/job-match/job-match.service.ts`:

```ts
import { AppError } from '../../common/AppError';
import { authService } from '../auth/auth.service';
import { aiService } from './ai.service';
import { AnalyzeJobInput } from './job-match.schema';
import {
  matchSkills,
  computeSkillsScore,
  computeExperienceScore,
  computeOverallScore,
  scoreToRecommendation,
  inferRequiredYearsFromTitle,
} from './skill-matcher';

export interface JobMatchResult {
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  preferredSkillsMatched: string[];
  preferredSkillsMissing: string[];
  experienceReasoning: string;
  suggestedProjectTypes: string[];
  recommendation: string;
}

export const jobMatchService = {
  async analyze(userId: string, input: AnalyzeJobInput): Promise<JobMatchResult> {
    const user = await authService.getById(userId);

    if (user.skills.length === 0) {
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
    });

    const { matched: matchedSkills, missing: missingSkills } = matchSkills(
      extraction.requiredSkills,
      user.skills
    );
    const { matched: preferredSkillsMatched, missing: preferredSkillsMissing } = matchSkills(
      extraction.preferredSkills,
      user.skills
    );

    const requiredYears = extraction.experienceYearsRequired ?? inferRequiredYearsFromTitle(input.jobTitle);
    const skillsScore = computeSkillsScore(extraction.requiredSkills, matchedSkills);
    const experienceScore = computeExperienceScore(user.yearsOfExperience, requiredYears);
    const overallScore = computeOverallScore(skillsScore, experienceScore);

    return {
      overallScore,
      skillsScore,
      experienceScore,
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
```

- [ ] **Step 2: Typecheck**

Run: `cd backend && npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Checkpoint**

Move to Task 8.

---

### Task 8: Wire up the route — `POST /api/job-match/analyze`

**Files:**
- Create: `backend/src/modules/job-match/job-match.controller.ts`
- Create: `backend/src/modules/job-match/job-match.routes.ts`
- Modify: `backend/src/app.ts`

**Interfaces:**
- Consumes: `jobMatchService.analyze` (Task 7), `analyzeJobSchema` (Task 5), `authMiddleware`/`validate`/`asyncHandler`/`AuthedRequest` (existing).
- Produces: the mounted route, the end of this plan's dependency chain.

- [ ] **Step 1: Write the controller**

Create `backend/src/modules/job-match/job-match.controller.ts`:

```ts
import { Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { AuthedRequest } from '../../common/types';
import { jobMatchService } from './job-match.service';

export const jobMatchController = {
  analyze: asyncHandler(async (req: AuthedRequest, res: Response) => {
    const data = await jobMatchService.analyze(req.userId, req.body);
    res.status(200).json({ data });
  }),
};
```

- [ ] **Step 2: Write the routes**

Create `backend/src/modules/job-match/job-match.routes.ts`:

```ts
import { Router } from 'express';
import { jobMatchController } from './job-match.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { analyzeJobSchema } from './job-match.schema';

export const jobMatchRouter = Router();

jobMatchRouter.post(
  '/analyze',
  authMiddleware,
  validate(analyzeJobSchema),
  jobMatchController.analyze
);
```

- [ ] **Step 3: Mount the router in `app.ts`**

In `backend/src/app.ts`, add the import alongside the other module imports:

```ts
import { jobMatchRouter } from './modules/job-match/job-match.routes';
```

And mount it alongside the other `app.use('/api/...')` lines:

```ts
app.use('/api/job-match', jobMatchRouter);
```

- [ ] **Step 4: Typecheck**

Run: `cd backend && npm run typecheck`
Expected: exits 0.

- [ ] **Step 5: End-to-end manual smoke test**

With the dev server running and the same logged-in session cookie from Task 3's smoke test (re-login if it expired):

```bash
curl -i -b /tmp/jt-cookies -X POST http://localhost:4000/api/job-match/analyze \
  -H 'Content-Type: application/json' \
  -d '{
    "companyName": "Coinbase",
    "jobTitle": "Backend Engineer",
    "jobDescription": "We are looking for a Backend Engineer with 5+ years of experience in Node.js, TypeScript, PostgreSQL, Docker, and AWS. Experience with Kubernetes is a plus. You will build REST APIs for our trading platform."
  }'
```

Expected: `200` with a `data` object containing `overallScore`, `skillsScore`, `experienceScore` as numbers; `matchedSkills` including `Node.js`, `TypeScript`, `PostgreSQL`, `Docker`; `missingSkills` including `AWS`; `recommendation` one of the five fixed labels.

Also verify the profile-incomplete guard: run the same request against a freshly registered user who has never called `PATCH /api/auth/profile` (empty `skills`). Expected: `400` with `"code": "PROFILE_INCOMPLETE"`.

Also verify auth is enforced: run the same request with `-b /tmp/does-not-exist` (no cookie). Expected: `401`.

- [ ] **Step 6: Checkpoint**

All three smoke-test cases pass. Backend work for this plan is complete — stop here per the current scope; frontend is a separate follow-up plan.
