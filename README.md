# JobTrack

JobTrack is a full-stack job application tracker with resume analysis and job-specific resume tools. It helps candidates track applications, compare a resume with a job description, identify gaps, and prepare tailored application materials.

## Features

### Application Tracking

- Application pipeline with statuses from applied through offer, rejected, or withdrawn.
- Application details with interviews, notes, follow-up dates, salary, source, and job URL.
- Dashboard statistics and recent activity.
- Match score and selected resume version can be attached to an application.

### Job Search

- Search live Indian Adzuna listings by keyword and Indian location.
- View company, location, salary, contract, category, and posting details.
- Add a search result directly to the application tracker.
- Provider credentials stay on the backend and are never exposed to the browser.

### Resume Analysis

- Upload PDF, TXT, or LaTeX `.tex` resumes.
- Extract candidate skills, current role, experience, projects, and strengths.
- Compare required and preferred skills with the job description.
- Calculate skills, preferred-skills, experience, and overall match scores.
- Show missing skills, experience gaps, project suggestions, and resume improvements.
- Use deterministic local matching when the AI provider is unavailable, so analysis can still return a result.

### Resume Tools

- ATS compatibility analysis.
- Job-specific resume summary generation.
- Resume bullet rewriting.
- Tailored cover-letter generation.
- Add missing skills to an existing LaTeX resume section.
- Download the updated LaTeX source.
- Compile and download the updated resume as a PDF.
- Save multiple resume versions and review match history.

## Architecture

```text
JobTrack/
├── backend/       Express, TypeScript, Prisma, PostgreSQL, Gemini API
├── frontend/      React, TypeScript, Vite, Tailwind CSS
└── docs/          Design specifications and implementation plans
```

The frontend communicates with the backend through authenticated HTTP requests. Resume files are processed in memory and are not permanently stored by the upload endpoint. Resume versions saved from the UI are stored in PostgreSQL.

## Requirements

- Node.js 20 or newer.
- PostgreSQL 16 or newer.
- A Gemini API key for AI-powered analysis and generation.
- `pdflatex` and the required TeX packages for PDF export from LaTeX resumes.

On Debian or Ubuntu, install the LaTeX compiler with:

```bash
sudo apt-get update
sudo apt-get install -y texlive-latex-base texlive-latex-extra
```

## Setup

### 1. Start PostgreSQL

Docker Compose is provided for local development:

```bash
cd backend
docker compose up -d postgres
```

### 2. Configure the backend

Create `backend/.env` from `backend/.env.example` and set a real Gemini API key:

```env
DATABASE_URL="postgresql://jobtrack:jobtrack@localhost:5432/jobtrack?schema=public"
JWT_SECRET="use-a-long-random-secret"
JWT_EXPIRES_IN="7d"
PORT=4000
NODE_ENV="development"
CLIENT_ORIGIN="http://localhost:5173"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-3.1-flash-lite"
```

Do not commit `.env` files or API keys.

### 3. Install and initialize the backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
```

The seed creates a demo account:

```text
Email: demo@jobtrack.dev
Password: password123
```

### 4. Install and start the frontend

```bash
cd frontend
npm install
npm run dev
```

Start the backend in another terminal:

```bash
cd backend
npm run dev
```

The frontend runs at `http://localhost:5173` and the API runs at `http://localhost:4000`.

## Resume Workflow

1. Open **Job Match**.
2. Enter the company, role, and job description.
3. Upload a PDF, TXT, or `.tex` resume.
4. Run the analysis.
5. Review the holistic resume overview, match score, missing skills, experience gaps, and recommendations.
6. For a LaTeX source resume, use **Add missing skills**.
7. Download either the updated `.tex` file or the compiled PDF.

LaTeX source is required to preserve the original LaTeX structure. A PDF cannot be converted back into its original LaTeX source reliably.

## Main API Areas

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/applications`
- `POST /api/applications`
- `POST /api/job-match/analyze`
- `GET /api/job-search/search?keyword=...&location=...`
- `GET /api/resumes`
- `POST /api/resumes`
- `GET /api/resumes/matches`
- `POST /api/resume-tools/ats/analyze`
- `POST /api/resume-tools/rewrite-bullet`
- `POST /api/resume-tools/summary`
- `POST /api/resume-tools/cover-letter`
- `POST /api/resume-tools/add-missing-skills`
- `POST /api/resume-tools/latex-pdf`

All application, resume, match, and resume-tool endpoints require authentication.

## Verification

Backend:

```bash
cd backend
npm run build
npm run typecheck
npx prisma validate
```

Frontend:

```bash
cd frontend
npm run build
npm run lint
```

The frontend lint command may report existing Fast Refresh warnings in shared context and toast files.

## Deployment

The repository includes deployment configuration for Render (API and PostgreSQL) and Vercel (frontend).

### Backend on Render

1. Create a new Render Blueprint from this repository and select `render.yaml`.
2. Enter `GEMINI_API_KEY` and the optional job-search credentials when prompted.
3. Deploy the blueprint. Render runs Prisma migrations during the first deploy with the command below.

Set the backend service's build/start settings as follows if creating the service manually:

```text
Dockerfile: backend/Dockerfile
Docker context: repository root
Health check: /health
```

The container automatically runs migrations before starting the API. To apply migrations manually from the Render shell, use:

```bash
npx prisma migrate deploy
```

Set `CLIENT_ORIGIN` to the final Vercel URL, for example `https://jobtrack.vercel.app`.

### Frontend on Vercel

Create a Vercel project rooted at `frontend` with these settings:

```text
Build command: npm run build
Output directory: dist
Install command: npm ci
```

Set the Vercel environment variable `VITE_API_URL` to the Render API URL plus `/api`, for example:

```text
https://jobtrack-api.onrender.com/api
```

Redeploy the backend after the Vercel URL is known so its `CLIENT_ORIGIN` matches exactly. Do not expose `GEMINI_API_KEY`, database credentials, or JWT secrets in Vercel variables.

## Security Notes

- Resume uploads are held in memory and limited to 5 MB.
- Only PDF, TXT, and `.tex` uploads are accepted.
- LaTeX compilation uses `-no-shell-escape` and a temporary directory.
- User-owned resume versions and match history are protected by authenticated ownership checks.
- Never commit Gemini keys, JWT secrets, database passwords, or other credentials.
