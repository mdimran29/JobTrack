# Job Match Analyzer — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Job Match" page to JobTracker's frontend: a profile-skills panel, a job-description form, and a results view (score gauge, matched/missing skill badges, experience card, project suggestions, recommendation) wired to the backend's `POST /api/job-match/analyze` (already built and verified).

**Architecture:** New `job-match` component folder + one new page, following the existing layering (`page → hook → api → axios`). Profile skills/years live on the existing `User` object in `AuthContext` (mirroring how `login`/`register`/`logout` already work there), not in TanStack Query, since they're part of the auth-scoped user, not server list/detail data.

**Tech Stack:** React, TypeScript, TanStack Query, React Hook Form + Zod (for the job-description form only — the skills panel uses local component state, see Task 5), Tailwind v4 (CSS-variable theme in `index.css`, no `tailwind.config.ts` in this project).

## Global Constraints

- No new npm dependencies — everything is buildable from what's already installed.
- Follow existing component conventions exactly: `cn()` from `lib/utils.ts` is a plain string joiner (no Tailwind-merge/dedup) — never pass two classes that target the same CSS property to the same element (e.g. two different `py-*` values); if you need different spacing than a shared component's default, wrap it, don't fight it.
- Score color tokens are added to `src/index.css`'s `@theme` block, following the exact pattern already used for `--color-status-*` — this is the project's established way to add a new semantic color family, not a deviation from it.
- The backend contract (already live, verified working) is:
  ```
  POST /api/job-match/analyze
  body: { companyName: string, jobTitle: string, jobDescription: string }
  200 -> { data: JobMatchResult }
  400 (code: PROFILE_INCOMPLETE) -> { error: { message, code } }  — when user.skills is empty
  401 -> { error: { message } }  — when unauthenticated
  502 -> { error: { message } }  — when the AI call/parse fails

  PATCH /api/auth/profile
  body: { skills: string[], yearsOfExperience: number }
  200 -> { data: User }  — User now includes skills, yearsOfExperience

  GET /api/auth/me
  200 -> { data: User }  — User now includes skills, yearsOfExperience
  ```
- This repo has no frontend test framework installed either (no vitest/jest, only `oxlint`). Verify via `npm run typecheck` (add this script if missing — check first) plus a real browser walkthrough with the dev server running, per the top-level instruction to actually exercise UI changes in a browser before calling them done.
- This directory is **not a git repository** — steps use a "Checkpoint" instead of `git commit`.

---

### Task 1: Extend `User` type + add `JobMatchResult` type

**Files:**
- Modify: `frontend/src/types/index.ts`

**Interfaces:**
- Produces: `User.skills: string[]`, `User.yearsOfExperience: number | null`, `JobMatchResult` interface — consumed by every task below.

- [ ] **Step 1: Update `User` and add `JobMatchResult`**

In `frontend/src/types/index.ts`, replace:

```ts
export interface User {
  id: string;
  email: string;
  name: string;
}
```

with:

```ts
export interface User {
  id: string;
  email: string;
  name: string;
  skills: string[];
  yearsOfExperience: number | null;
}
```

Then append at the end of the file:

```ts
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
```

- [ ] **Step 2: Typecheck**

Check whether a typecheck script exists first: `cd frontend && cat package.json | grep -A15 '"scripts"'`. If there's a `typecheck` script, run `npm run typecheck`. If not, run `npx tsc --noEmit -p .` directly.
Expected: fails right now with errors in files that construct a `User` object without `skills`/`yearsOfExperience` (namely `auth.api.ts` responses are fine since they come from the backend at runtime, but any local object literals typed as `User` would fail — there shouldn't be any yet). If it fails, note the exact error for the next tasks; if it's clean, proceed.

- [ ] **Step 3: Checkpoint**

Move to Task 2.

---

### Task 2: Profile update — API call + `AuthContext`

**Files:**
- Modify: `frontend/src/api/auth.api.ts`
- Modify: `frontend/src/context/AuthContext.tsx`

**Interfaces:**
- Consumes: `api` from `frontend/src/api/axios.ts` (existing), `User` type (Task 1).
- Produces: `authApi.updateProfile(payload: UpdateProfilePayload): Promise<User>`, and `useAuth().updateProfile(payload: UpdateProfilePayload): Promise<void>` — consumed by Task 5 (`ProfileSkillsPanel.tsx`).

- [ ] **Step 1: Add `updateProfile` to `auth.api.ts`**

In `frontend/src/api/auth.api.ts`, add after the `LoginPayload` interface:

```ts
export interface UpdateProfilePayload {
  skills: string[];
  yearsOfExperience: number;
}
```

And add this method inside the `authApi` object, after `me`:

```ts
  async updateProfile(payload: UpdateProfilePayload) {
    const { data } = await api.patch<{ data: User }>('/auth/profile', payload);
    return data.data;
  },
```

- [ ] **Step 2: Add `updateProfile` to `AuthContext`**

In `frontend/src/context/AuthContext.tsx`, update the import line:

```ts
import { authApi, LoginPayload, RegisterPayload, UpdateProfilePayload } from '../api/auth.api';
```

Add `updateProfile` to the `AuthContextValue` interface, after `logout`:

```ts
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
```

Add the implementation inside `AuthProvider`, after the `logout` callback:

```ts
  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    const updatedUser = await authApi.updateProfile(payload);
    setUser(updatedUser);
  }, []);
```

And add `updateProfile` to the context value object:

```ts
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile }}>
```

- [ ] **Step 3: Typecheck**

Run the typecheck command established in Task 1, Step 2.
Expected: passes (or the same baseline result as Task 1 Step 2 — no new errors from these two files).

- [ ] **Step 4: Checkpoint**

Move to Task 3.

---

### Task 3: `job-match` API + hook

**Files:**
- Create: `frontend/src/api/job-match.api.ts`
- Create: `frontend/src/hooks/useJobMatch.ts`

**Interfaces:**
- Consumes: `api` from `frontend/src/api/axios.ts`, `JobMatchResult` from `frontend/src/types` (Task 1).
- Produces: `jobMatchApi.analyze(payload: AnalyzeJobPayload): Promise<JobMatchResult>`, `useAnalyzeJobMatch()` (a TanStack `useMutation` result) — consumed by Task 8 (`JobMatchPage.tsx`).

- [ ] **Step 1: Write `job-match.api.ts`**

Create `frontend/src/api/job-match.api.ts`:

```ts
import { api } from './axios';
import { JobMatchResult } from '../types';

export interface AnalyzeJobPayload {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
}

export const jobMatchApi = {
  async analyze(payload: AnalyzeJobPayload) {
    const { data } = await api.post<{ data: JobMatchResult }>('/job-match/analyze', payload);
    return data.data;
  },
};
```

- [ ] **Step 2: Write `useJobMatch.ts`**

Create `frontend/src/hooks/useJobMatch.ts`:

```ts
import { useMutation } from '@tanstack/react-query';
import { jobMatchApi, AnalyzeJobPayload } from '../api/job-match.api';

export const useAnalyzeJobMatch = () =>
  useMutation({
    mutationFn: (payload: AnalyzeJobPayload) => jobMatchApi.analyze(payload),
  });
```

- [ ] **Step 3: Typecheck**

Run the typecheck command from Task 1.
Expected: passes.

- [ ] **Step 4: Checkpoint**

Move to Task 4.

---

### Task 4: Score-band tokens, helper, and form schema

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/lib/utils.ts`
- Modify: `frontend/src/lib/schemas.ts`

**Interfaces:**
- Produces: CSS tokens `--color-score-{excellent,strong,moderate,weak,poor}-{text,bg}` (and their auto-generated Tailwind utilities `bg-score-*-bg`, `text-score-*-text`, `stroke-score-*-text`); `ScoreBand` type, `scoreBand(score: number): ScoreBand`, `SCORE_BAND_LABELS` from `lib/utils.ts`; `jobMatchFormSchema`/`JobMatchFormValues` from `lib/schemas.ts`. Consumed by Tasks 6 and 7.

- [ ] **Step 1: Add score-band color tokens**

In `frontend/src/index.css`, inside the `@theme { ... }` block, add after the `--color-status-withdrawn-bg` line (before `--color-danger`):

```css
  /* Score bands — Job Match recommendation scale */
  --color-score-excellent-text: #16803d;
  --color-score-excellent-bg: #e6f7ec;

  --color-score-strong-text: #0e7f95;
  --color-score-strong-bg: #e4f6f9;

  --color-score-moderate-text: #ab6f1e;
  --color-score-moderate-bg: #fbecd4;

  --color-score-weak-text: #b45309;
  --color-score-weak-bg: #fef1e0;

  --color-score-poor-text: #c22b2b;
  --color-score-poor-bg: #fbeaea;
```

- [ ] **Step 2: Add the score-band helper to `utils.ts`**

In `frontend/src/lib/utils.ts`, append at the end of the file:

```ts
export type ScoreBand = 'excellent' | 'strong' | 'moderate' | 'weak' | 'poor';

export const scoreBand = (score: number): ScoreBand => {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'strong';
  if (score >= 60) return 'moderate';
  if (score >= 40) return 'weak';
  return 'poor';
};

export const SCORE_BAND_LABELS: Record<ScoreBand, string> = {
  excellent: 'Excellent Match',
  strong: 'Strong Match',
  moderate: 'Moderate Match',
  weak: 'Weak Match',
  poor: 'Poor Match',
};
```

- [ ] **Step 3: Add the job-match form schema**

In `frontend/src/lib/schemas.ts`, append at the end of the file:

```ts
export const jobMatchFormSchema = z.object({
  companyName: z.string().min(1, 'Company is required').max(200),
  jobTitle: z.string().min(1, 'Job title is required').max(200),
  jobDescription: z
    .string()
    .min(20, 'Paste the full job description (at least 20 characters)')
    .max(20000),
});
export type JobMatchFormValues = z.infer<typeof jobMatchFormSchema>;
```

- [ ] **Step 4: Typecheck**

Run the typecheck command from Task 1.
Expected: passes.

- [ ] **Step 5: Checkpoint**

Move to Task 5.

---

### Task 5: `ProfileSkillsPanel.tsx`

**Files:**
- Create: `frontend/src/components/job-match/ProfileSkillsPanel.tsx`

**Interfaces:**
- Consumes: `useAuth` (Task 2's `updateProfile`), `useToast` from `frontend/src/components/ui/Toast.tsx` (existing), `getErrorMessage` from `frontend/src/api/axios.ts` (existing), `Card`/`CardHeader`/`CardTitle`/`CardBody`, `Button`, `Input`, `Field` (all existing).
- Produces: `<ProfileSkillsPanel />` — a self-contained component with no props (reads/writes via `useAuth`). Consumed by Task 8 (`JobMatchPage.tsx`).

Uses local component state for the skill-chip list rather than React Hook Form — RHF's array-field API adds real complexity for a plain "type and press Enter" tag input, and this codebase doesn't have an existing tag-input pattern to extend, so plain `useState` is the simpler, more legible choice here (YAGNI).

- [ ] **Step 1: Write the file**

Create `frontend/src/components/job-match/ProfileSkillsPanel.tsx`:

```tsx
import { useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Field } from '../ui/Field';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { getErrorMessage } from '../../api/axios';

export const ProfileSkillsPanel = () => {
  const { user, updateProfile } = useAuth();
  const { show } = useToast();
  const [editing, setEditing] = useState(() => (user?.skills.length ?? 0) === 0);
  const [skills, setSkills] = useState<string[]>(user?.skills ?? []);
  const [skillInput, setSkillInput] = useState('');
  const [years, setYears] = useState<string>(user?.yearsOfExperience?.toString() ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => setSkills(skills.filter((s) => s !== skill));

  const startEditing = () => {
    setSkills(user?.skills ?? []);
    setYears(user?.yearsOfExperience?.toString() ?? '');
    setError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    setError(null);
    const parsedYears = Number(years);
    if (skills.length === 0) {
      setError('Add at least one skill');
      return;
    }
    if (years.trim() === '' || !Number.isInteger(parsedYears) || parsedYears < 0 || parsedYears > 60) {
      setError('Enter a valid number of years (0-60)');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({ skills, yearsOfExperience: parsedYears });
      show('Profile updated');
      setEditing(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (!editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <Button variant="ghost" size="sm" onClick={startEditing}>
            Edit
          </Button>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {(user?.skills ?? []).map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-text-secondary"
              >
                {skill}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-text-secondary">
            {user?.yearsOfExperience} years of experience
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <Field label="Skills" htmlFor="skillInput" hint="Press Enter to add a skill" required>
          {skills.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-text-secondary"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    aria-label={`Remove ${skill}`}
                    className="text-text-tertiary hover:text-danger"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <Input
            id="skillInput"
            placeholder="e.g. Node.js, then press Enter"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill();
              }
            }}
          />
        </Field>
        <Field label="Years of experience" htmlFor="years" required>
          <Input
            id="years"
            type="number"
            min={0}
            max={60}
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </Field>
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditing(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} isLoading={isSaving}>
            Save
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};
```

- [ ] **Step 2: Typecheck**

Run the typecheck command from Task 1.
Expected: passes.

- [ ] **Step 3: Checkpoint**

Move to Task 6.

---

### Task 6: `JobMatchForm.tsx`

**Files:**
- Create: `frontend/src/components/job-match/JobMatchForm.tsx`

**Interfaces:**
- Consumes: `jobMatchFormSchema`/`JobMatchFormValues` (Task 4), `Field`, `Input`, `Textarea`, `Button` (existing).
- Produces: `<JobMatchForm onSubmit={(values: JobMatchFormValues) => void} isSubmitting={boolean} />`. Consumed by Task 8.

- [ ] **Step 1: Write the file**

Create `frontend/src/components/job-match/JobMatchForm.tsx`:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { jobMatchFormSchema, JobMatchFormValues } from '../../lib/schemas';

interface JobMatchFormProps {
  onSubmit: (values: JobMatchFormValues) => void;
  isSubmitting: boolean;
}

export const JobMatchForm = ({ onSubmit, isSubmitting }: JobMatchFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JobMatchFormValues>({
    resolver: zodResolver(jobMatchFormSchema),
    defaultValues: { companyName: '', jobTitle: '', jobDescription: '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Company" htmlFor="companyName" error={errors.companyName?.message} required>
          <Input id="companyName" placeholder="Coinbase" {...register('companyName')} />
        </Field>
        <Field label="Job title" htmlFor="jobTitle" error={errors.jobTitle?.message} required>
          <Input id="jobTitle" placeholder="Backend Engineer" {...register('jobTitle')} />
        </Field>
      </div>
      <Field label="Job description" htmlFor="jobDescription" error={errors.jobDescription?.message} required>
        <Textarea
          id="jobDescription"
          rows={10}
          placeholder="Paste the full job description…"
          {...register('jobDescription')}
        />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting}>
          Analyze Job
        </Button>
      </div>
    </form>
  );
};
```

- [ ] **Step 2: Typecheck**

Run the typecheck command from Task 1.
Expected: passes.

- [ ] **Step 3: Checkpoint**

Move to Task 7.

---

### Task 7: Result display components

**Files:**
- Create: `frontend/src/components/job-match/MatchScoreGauge.tsx`
- Create: `frontend/src/components/job-match/SkillBadgeList.tsx`
- Create: `frontend/src/components/job-match/ExperienceMatchCard.tsx`
- Create: `frontend/src/components/job-match/ProjectSuggestionsCard.tsx`
- Create: `frontend/src/components/job-match/RecommendationCard.tsx`

**Interfaces:**
- Consumes: `scoreBand`/`ScoreBand`/`SCORE_BAND_LABELS`/`cn` from `lib/utils.ts` (Task 4 + existing), `Card`/`CardHeader`/`CardTitle`/`CardBody` (existing).
- Produces: `<MatchScoreGauge score={number} />`, `<SkillBadgeList title={string} skills={string[]} variant={'matched'|'missing'} emptyMessage?={string} />`, `<ExperienceMatchCard score={number} reasoning={string} />`, `<ProjectSuggestionsCard items={string[]} />`, `<RecommendationCard recommendation={string} overallScore={number} />`. All consumed by Task 8.

Grouped into one task since these are five small, purely presentational components with no cross-dependencies beyond shared helpers — a reviewer would approve or reject the whole "results display" surface together, not one badge component in isolation.

- [ ] **Step 1: `MatchScoreGauge.tsx`**

Create `frontend/src/components/job-match/MatchScoreGauge.tsx`:

```tsx
import { cn, scoreBand, ScoreBand } from '../../lib/utils';

const RING_COLORS: Record<ScoreBand, string> = {
  excellent: 'stroke-score-excellent-text',
  strong: 'stroke-score-strong-text',
  moderate: 'stroke-score-moderate-text',
  weak: 'stroke-score-weak-text',
  poor: 'stroke-score-poor-text',
};

const SIZE = 160;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const MatchScoreGauge = ({ score }: { score: number }) => {
  const band = scoreBand(score);
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          fill="none"
          className="stroke-border"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={cn('transition-[stroke-dashoffset] duration-700 ease-out', RING_COLORS[band])}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-[40px] font-semibold leading-none tabular-nums text-text-primary">
          {score}%
        </span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
          Match score
        </span>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: `SkillBadgeList.tsx`**

Create `frontend/src/components/job-match/SkillBadgeList.tsx`:

```tsx
import { cn } from '../../lib/utils';

interface SkillBadgeListProps {
  title: string;
  skills: string[];
  variant: 'matched' | 'missing';
  emptyMessage?: string;
}

export const SkillBadgeList = ({ title, skills, variant, emptyMessage }: SkillBadgeListProps) => (
  <div>
    <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-text-tertiary">{title}</p>
    {skills.length === 0 ? (
      <p className="text-[13px] text-text-tertiary">{emptyMessage ?? 'None'}</p>
    ) : (
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
              variant === 'matched'
                ? 'bg-score-excellent-bg text-score-excellent-text'
                : 'bg-score-weak-bg text-score-weak-text'
            )}
          >
            {variant === 'matched' ? '✓' : '⚠'} {skill}
          </span>
        ))}
      </div>
    )}
  </div>
);
```

- [ ] **Step 3: `ExperienceMatchCard.tsx`**

Create `frontend/src/components/job-match/ExperienceMatchCard.tsx`:

```tsx
import { Card, CardBody, CardHeader, CardTitle } from '../ui/Card';

interface ExperienceMatchCardProps {
  score: number;
  reasoning: string;
}

export const ExperienceMatchCard = ({ score, reasoning }: ExperienceMatchCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Experience Match</CardTitle>
      <span className="font-display text-lg font-semibold tabular-nums text-text-primary">{score}%</span>
    </CardHeader>
    <CardBody>
      <p className="text-[13px] text-text-secondary">{reasoning}</p>
    </CardBody>
  </Card>
);
```

- [ ] **Step 4: `ProjectSuggestionsCard.tsx`**

Create `frontend/src/components/job-match/ProjectSuggestionsCard.tsx`:

```tsx
import { Card, CardBody, CardHeader, CardTitle } from '../ui/Card';

export const ProjectSuggestionsCard = ({ items }: { items: string[] }) => {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects to Highlight</CardTitle>
      </CardHeader>
      <CardBody>
        <ul className="list-disc space-y-1.5 pl-4 text-[13px] text-text-secondary">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
};
```

- [ ] **Step 5: `RecommendationCard.tsx`**

Create `frontend/src/components/job-match/RecommendationCard.tsx`:

```tsx
import { cn, scoreBand, ScoreBand } from '../../lib/utils';

const BAND_STYLES: Record<ScoreBand, string> = {
  excellent: 'bg-score-excellent-bg text-score-excellent-text',
  strong: 'bg-score-strong-bg text-score-strong-text',
  moderate: 'bg-score-moderate-bg text-score-moderate-text',
  weak: 'bg-score-weak-bg text-score-weak-text',
  poor: 'bg-score-poor-bg text-score-poor-text',
};

interface RecommendationCardProps {
  recommendation: string;
  overallScore: number;
}

export const RecommendationCard = ({ recommendation, overallScore }: RecommendationCardProps) => {
  const band = scoreBand(overallScore);
  return (
    <div
      className={cn(
        'w-full rounded-[var(--radius-card)] border border-border px-5 py-4 text-center',
        BAND_STYLES[band]
      )}
    >
      <p className="text-[12px] font-medium uppercase tracking-wide opacity-80">Recommendation</p>
      <p className="mt-1 font-display text-xl font-semibold">{recommendation}</p>
    </div>
  );
};
```

- [ ] **Step 6: Typecheck**

Run the typecheck command from Task 1.
Expected: passes.

- [ ] **Step 7: Checkpoint**

Move to Task 8.

---

### Task 8: `JobMatchPage.tsx`

**Files:**
- Create: `frontend/src/pages/JobMatchPage.tsx`

**Interfaces:**
- Consumes: `PageHeader`, `Card`/`CardBody`/`CardHeader`/`CardTitle`, `EmptyState`, `ErrorState` (existing); `ProfileSkillsPanel`, `JobMatchForm`, `MatchScoreGauge`, `SkillBadgeList`, `ExperienceMatchCard`, `ProjectSuggestionsCard`, `RecommendationCard` (Tasks 5-7); `useAnalyzeJobMatch` (Task 3); `useAuth` (existing); `getErrorMessage` (existing); `JobMatchFormValues` (Task 4).
- Produces: `<JobMatchPage />`. Consumed by Task 9 (`AppRouter.tsx`).

- [ ] **Step 1: Write the file**

Create `frontend/src/pages/JobMatchPage.tsx`:

```tsx
import { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardBody } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { ProfileSkillsPanel } from '../components/job-match/ProfileSkillsPanel';
import { JobMatchForm } from '../components/job-match/JobMatchForm';
import { MatchScoreGauge } from '../components/job-match/MatchScoreGauge';
import { SkillBadgeList } from '../components/job-match/SkillBadgeList';
import { ExperienceMatchCard } from '../components/job-match/ExperienceMatchCard';
import { ProjectSuggestionsCard } from '../components/job-match/ProjectSuggestionsCard';
import { RecommendationCard } from '../components/job-match/RecommendationCard';
import { useAnalyzeJobMatch } from '../hooks/useJobMatch';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/axios';
import { JobMatchFormValues } from '../lib/schemas';

const ResultSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="mx-auto h-40 w-40 rounded-full bg-border/60" />
    <div className="h-28 rounded-[var(--radius-card)] bg-border/60" />
    <div className="h-28 rounded-[var(--radius-card)] bg-border/60" />
  </div>
);

export const JobMatchPage = () => {
  const { user } = useAuth();
  const { mutate, data, isPending, isError, error } = useAnalyzeJobMatch();
  const [lastValues, setLastValues] = useState<JobMatchFormValues | null>(null);

  const hasProfile = (user?.skills.length ?? 0) > 0;

  const handleSubmit = (values: JobMatchFormValues) => {
    setLastValues(values);
    mutate(values);
  };

  return (
    <div>
      <PageHeader title="Job Match" description="See how a job description lines up with your profile." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <ProfileSkillsPanel />

          <Card>
            <CardBody>
              {hasProfile ? (
                <JobMatchForm onSubmit={handleSubmit} isSubmitting={isPending} />
              ) : (
                <p className="text-[13px] text-text-secondary">
                  Add your skills above before analyzing a job.
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        <div>
          {isPending && <ResultSkeleton />}

          {isError && (
            <ErrorState
              message={getErrorMessage(error)}
              onRetry={lastValues ? () => mutate(lastValues) : undefined}
            />
          )}

          {!isPending && !isError && !data && (
            <EmptyState
              title="No analysis yet"
              description="Paste a job description on the left and click Analyze Job to see your match score."
            />
          )}

          {data && !isPending && !isError && (
            <div className="space-y-6">
              <Card>
                <CardBody className="flex flex-col items-center gap-4">
                  <MatchScoreGauge score={data.overallScore} />
                  <RecommendationCard recommendation={data.recommendation} overallScore={data.overallScore} />
                </CardBody>
              </Card>

              <Card>
                <CardBody className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-[15px] font-semibold text-text-primary">Skills Match</p>
                    <span className="font-display text-lg font-semibold tabular-nums text-text-primary">
                      {data.skillsScore}%
                    </span>
                  </div>
                  <SkillBadgeList title="Matched skills" skills={data.matchedSkills} variant="matched" />
                  <SkillBadgeList
                    title="Missing skills"
                    skills={data.missingSkills}
                    variant="missing"
                    emptyMessage="None — you cover every required skill."
                  />
                </CardBody>
              </Card>

              {(data.preferredSkillsMatched.length > 0 || data.preferredSkillsMissing.length > 0) && (
                <Card>
                  <CardBody className="space-y-4">
                    <p className="font-display text-[15px] font-semibold text-text-primary">
                      Preferred Skills
                    </p>
                    <SkillBadgeList
                      title="You have"
                      skills={data.preferredSkillsMatched}
                      variant="matched"
                      emptyMessage="None matched"
                    />
                    <SkillBadgeList
                      title="Nice to have"
                      skills={data.preferredSkillsMissing}
                      variant="missing"
                      emptyMessage="None"
                    />
                  </CardBody>
                </Card>
              )}

              <ExperienceMatchCard score={data.experienceScore} reasoning={data.experienceReasoning} />

              <ProjectSuggestionsCard items={data.suggestedProjectTypes} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Typecheck**

Run the typecheck command from Task 1.
Expected: passes.

- [ ] **Step 3: Checkpoint**

Move to Task 9.

---

### Task 9: Nav item + route

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx`
- Modify: `frontend/src/routes/AppRouter.tsx`

**Interfaces:**
- Consumes: `JobMatchPage` (Task 8).
- Produces: the mounted `/job-match` route, reachable from the sidebar — end of this plan's dependency chain.

- [ ] **Step 1: Add the nav item**

In `frontend/src/components/layout/Sidebar.tsx`, add a new entry to `NAV_ITEMS`, after the `follow-ups` entry:

```ts
  {
    to: '/job-match',
    label: 'Job Match',
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <circle cx="8.5" cy="8.5" r="6.5" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="8.5" cy="8.5" r="3.2" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="8.5" cy="8.5" r="0.9" fill="currentColor" />
      </svg>
    ),
  },
```

- [ ] **Step 2: Add the route**

In `frontend/src/routes/AppRouter.tsx`, add the import:

```ts
import { JobMatchPage } from '../pages/JobMatchPage';
```

And add the route inside the protected `<Route element={<AppShell />}>` block, after `/follow-ups`:

```tsx
        <Route path="/job-match" element={<JobMatchPage />} />
```

- [ ] **Step 3: Typecheck**

Run the typecheck command from Task 1.
Expected: passes, zero errors across the whole frontend.

- [ ] **Step 4: Checkpoint**

Move to Task 10.

---

### Task 10: Browser verification

**Files:** none (verification only)

- [ ] **Step 1: Start both servers**

Ensure the backend dev server is running (`cd backend && npm run dev`, already running from the backend plan — confirm with `curl -s http://localhost:4000/health`). Start the frontend: `cd frontend && npm run dev` (note the port it prints, typically 5173).

- [ ] **Step 2: Log in and navigate to Job Match**

In a browser (or via the Playwright MCP tools if available in this session), navigate to the frontend URL, log in as `demo@jobtrack.dev` / `password123` (seeded user), and click "Job Match" in the sidebar.
Expected: the sidebar shows a "Job Match" item; clicking it loads `/job-match` with the page header, a "Your Profile" card, an analyze form (or the "add your skills" prompt if the demo user's profile is still empty from earlier backend testing — check and fill it in if so), and an `EmptyState` on the right ("No analysis yet").

- [ ] **Step 3: Exercise the full flow**

If the profile is empty, add a few skills (e.g. `Node.js`, `TypeScript`, `PostgreSQL`, `Docker`) and years of experience (e.g. `6`), click Save — expect a success toast and the panel collapsing to the read-only view. Then fill in the Job Match form with company `Coinbase`, title `Backend Engineer`, and a job description mentioning `Node.js, TypeScript, PostgreSQL, Docker, AWS, Kubernetes, 5+ years`. Click "Analyze Job".
Expected: a brief loading skeleton, then the full result: circular gauge showing a score, a colored recommendation card, matched/missing skill badges, an experience card with reasoning text, and (if any) a project-suggestions card.

- [ ] **Step 4: Check the error state**

Temporarily stop the backend server (`Ctrl+C` in its terminal, or find and kill the process) and click "Analyze Job" again with the same form values.
Expected: `ErrorState` renders with a "Try again" button instead of a blank page or an uncaught exception. Restart the backend afterward and confirm "Try again" successfully re-runs the analysis.

- [ ] **Step 5: Check responsive layout**

Resize the browser (or use Playwright's `browser_resize`) to a mobile width (~375px).
Expected: the two-column layout (`lg:grid-cols-[1fr_1.2fr]`) collapses to a single column; the mobile hamburger nav opens the sidebar drawer and "Job Match" is reachable from it; no horizontal overflow/scrollbar appears on the page.

- [ ] **Step 6: Confirm existing functionality is untouched**

Click through Dashboard, Applications, and Follow-ups once each.
Expected: all three still work exactly as before — this task adds a new page and touches only `Sidebar.tsx`, `AppRouter.tsx`, `AuthContext.tsx`, `auth.api.ts`, `types/index.ts`, `index.css`, and `lib/utils.ts`/`lib/schemas.ts` (additive changes only in each), so nothing else should have changed behavior.

- [ ] **Step 7: Checkpoint**

All checks pass. Frontend implementation complete.
