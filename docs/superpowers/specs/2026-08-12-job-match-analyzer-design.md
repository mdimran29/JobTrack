# Job Match Analyzer — Design Spec

Date: 2026-08-12

## Summary

Add an AI-assisted "Job Match" feature to the existing JobTracker app. User pastes a company/title/job description, backend calls Gemini to extract structured requirements, backend computes match scores deterministically (never trusts an AI-supplied score), frontend renders a polished results view. Integrates into the existing modular-monolith architecture — no existing functionality changes.

## Non-goals

- No match history/persistence — single-shot analyze, not saved.
- No resume/file upload or project storage — profile is a structured skill list + years of experience only.
- No changes to existing modules (`auth`, `applications`, `interviews`, `notes`, `dashboard`) beyond the two additive fields on `User` and one new endpoint on the `auth` module described below.

## Data model

Two new fields directly on `User` (no new table — this is per-person data, not per-application):

```prisma
model User {
  ...
  skills            String[] @default([])
  yearsOfExperience Int?
}
```

One Prisma migration. No other schema changes.

## Backend

### Extend `auth` module
- `PATCH /api/auth/profile` — validates `{ skills: string[], yearsOfExperience: number }` via a new `updateProfileSchema` in `auth.schema.ts`. Ownership is implicit (`req.userId`).
- `GET /api/auth/me` response gains `skills` and `yearsOfExperience`.

### New `job-match` module

```
modules/job-match/
  job-match.routes.ts      POST /api/job-match/analyze
  job-match.controller.ts   thin, calls service, maps result to HTTP response
  job-match.service.ts      orchestrates: call AIService -> compare vs profile -> compute scores
  job-match.schema.ts       zod: analyzeJobSchema (request), geminiExtractionSchema (AI response shape)
  ai.service.ts              wraps @google/genai, builds prompt, calls Gemini, validates JSON response
  skill-matcher.ts           pure functions: normalize/alias-match, score math — no Prisma, unit-testable
```

**Request:** `POST /api/job-match/analyze`
```json
{ "companyName": "Coinbase", "jobTitle": "Backend Engineer", "jobDescription": "..." }
```
Requires auth. If the user's `skills` array is empty, respond `400` with a clear message ("Add your skills before analyzing a job") — frontend nudges the user to fill `ProfileSkillsPanel` first rather than allowing a meaningless call.

**AIService** sends job description + company + title + the user's `skills`/`yearsOfExperience` as context to Gemini, requesting structured JSON via `responseSchema` + `responseMimeType: "application/json"`:
```ts
{
  requiredSkills: string[],
  preferredSkills: string[],
  experienceYearsRequired: number | null,
  experienceReasoning: string,
  suggestedProjectTypes: string[]  // generic, JD-derived, not tied to user data — "relevant projects"
}
```
The raw response is parsed through `geminiExtractionSchema` (Zod) regardless of Gemini's own schema enforcement. Parse/API failures throw `AppError(502, 'AI analysis failed, please try again')` — no provider error details or the API key ever reach the client.

**JobMatchService — deterministic scoring, backend-only:**
1. `matchedSkills` / `missingSkills` = compare `requiredSkills` against the user's profile `skills` (normalized: lowercase, trim, small hardcoded alias map — e.g. `js`→`javascript`, `k8s`→`kubernetes`, `postgres`→`postgresql` — reused from `skill-matcher.ts`).
2. `preferredSkills` matched/missing computed the same way and returned separately. Duplicate skills and aliases count only once.
3. `skillsScore = round(matchedUniqueRequired.length / uniqueRequiredSkills.length * 100)`. If there are no required skills, `skillsScore = 100`.
4. `preferredSkillsScore` uses the same formula for preferred skills. If there are no preferred skills, `preferredSkillsScore = 100` so a job without nice-to-haves is not penalized.
5. `experienceScore`: required years = AI's `experienceYearsRequired` if present, else a title-seniority fallback (`Senior|Lead|Staff|Principal` → 5, `Junior|Entry` → 1, else 3) computed in `skill-matcher.ts` from `jobTitle`. Score = `100` if `user.yearsOfExperience >= required`, else `round(user.yearsOfExperience / required * 100)` clamped to `[0, 100]`. If the profile does not contain years, use a neutral `50` rather than assuming zero.
6. `overallScore = round(0.7 * skillsScore + 0.2 * experienceScore + 0.1 * preferredSkillsScore)`.
6. `recommendation` from fixed bands: 90–100 Excellent Match, 75–89 Strong Match, 60–74 Moderate Match, 40–59 Weak Match, 0–39 Poor Match. This label is always backend-computed — the AI's role is extraction only, never scoring or labeling.

**Response:**
```json
{
  "overallScore": 82,
  "skillsScore": 80,
  "experienceScore": 90,
  "matchedSkills": ["Node.js", "TypeScript", "PostgreSQL", "Docker"],
  "missingSkills": ["AWS", "Kubernetes"],
  "preferredSkillsMatched": ["..."],
  "preferredSkillsMissing": ["..."],
  "experienceReasoning": "Your 6 years exceeds the 5 years typically required for this role.",
  "suggestedProjectTypes": ["A project demonstrating containerized deployment to AWS"],
  "recommendation": "Strong Match"
}
```

### Config
- New env vars in `config/env.ts` (zod-validated, same pattern as existing config): `GEMINI_API_KEY` (required), `GEMINI_MODEL` (optional, defaults to a current flash-tier model). Added to `.env.example`.
- New dependency: `@google/genai`, backend only. Key never leaves the backend.

## Frontend

```
api/job-match.api.ts         analyze(payload)
api/auth.api.ts              + updateProfile()   (extends existing file)
hooks/useJobMatch.ts          useMutation for analyze
components/job-match/
  ProfileSkillsPanel.tsx      chip input for skills + years field; collapsed once filled, expanded/prompted if empty
  JobMatchForm.tsx            company / title / JD textarea, RHF + Zod, "Analyze Job" button
  MatchScoreGauge.tsx          circular SVG progress ring, color banded by score
  SkillBadgeList.tsx           matched (✓) / missing (⚠) badge groups — required and preferred sections
  ExperienceMatchCard.tsx      score + AI's experienceReasoning text
  ProjectSuggestionsCard.tsx   suggestedProjectTypes as plain bullets, no score
  RecommendationCard.tsx
pages/JobMatchPage.tsx        composes the above, owns the 4 UI states
```

**Nav:** one new entry "Job Match" → `/job-match` in `Sidebar.tsx`'s `NAV_ITEMS`; one new protected route in `AppRouter.tsx`, same pattern as `dashboard`/`applications`/`follow-ups`.

**UI states on `JobMatchPage`:**
- **Empty** — form only, illustration/prompt copy, no results yet.
- **Loading** — spinner on the Analyze button + skeleton result area (Gemini call takes a couple seconds, so this is a real wait, not instant).
- **Error** — `ErrorState` + retry, same axios-interceptor convention as the rest of the app.
- **Loaded** — gauge, required/preferred skill badges, experience card, project suggestions, recommendation card.

**Styling:** Tailwind utilities only, no `tailwind.config` changes. Score bands map to color utilities consistent with how `StatusBadge` color-codes by enum (green/blue/amber/orange/red at the five thresholds).

## Testing scope

Backend: unit tests for `skill-matcher.ts` (pure functions — normalization, alias matching, score math, band lookup) since it's the part that must be reliable and explainable. `ai.service.ts` is mocked in `job-match.service.ts` tests. No end-to-end tests against the live Gemini API.
