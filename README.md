# JobTrack

JobTrack is a full-stack job application tracker with AI-powered resume analysis and job-specific resume tools. It helps candidates track applications and interviews, search live job listings, compare a resume against a job description, identify gaps, and generate tailored application materials.

**Live app:** https://jobtrack-frontend-gamma.vercel.app

| Part | Hosting | URL |
| --- | --- | --- |
| Frontend | Vercel | https://jobtrack-frontend-gamma.vercel.app |
| Backend API | Render | https://jobtrack-api-jnd8.onrender.com/api |
| API health check | Render | https://jobtrack-api-jnd8.onrender.com/health |

The API runs on Render's free tier, so the first request after a period of inactivity can take up to a minute while the service wakes up.

## Features

### Application Tracking

- Application pipeline with statuses from applied through offer, rejected, or withdrawn.
- Application details with interviews, notes, follow-up dates, salary, source, and job URL.
- Follow-ups page listing applications with upcoming or overdue follow-up dates.
- Dashboard with statistics, charts, and recent activity.
- Match score and selected resume version can be attached to an application.

### Job Search

- Search live Indian Adzuna listings by keyword and location.
- View company, location, salary, contract, category, and posting details.
- Add a search result directly to the application tracker.
- Provider credentials stay on the backend and are never exposed to the browser.

### Resume Analysis (Job Match)

- Upload PDF, TXT, or LaTeX `.tex` resumes.
- Extract candidate skills, current role, experience, projects, and strengths.
- Compare required and preferred skills with the job description.
- Calculate skills, preferred-skills, experience, and overall match scores.
- Show missing skills, experience gaps, project suggestions, and resume improvements.
- Fall back to deterministic local matching when the AI provider is unavailable, so analysis still returns a result.

### Resume Tools

- ATS compatibility analysis.
- Job-specific resume summary generation.
- Resume bullet rewriting.
- Tailored cover-letter generation.
- Add missing skills to an existing LaTeX resume section.
- Download the updated LaTeX source.
- Compile and download the updated resume as a PDF.
- Save multiple resume versions and review match history.

## Tech Stack

**Backend**

- Node.js 20, Express 4, TypeScript
- PostgreSQL 16 with Prisma ORM
- Google Gemini (`@google/genai`) for AI analysis and generation
- Zod validation, JWT auth in `httpOnly` cookies, bcrypt, helmet, express-rate-limit
- Multer and pdf-parse for resume uploads, `pdflatex` for PDF export

**Frontend**

- React 19, TypeScript, Vite 8
- Tailwind CSS 4
- React Router 7, TanStack Query 5
- React Hook Form with Zod resolvers
- Recharts for dashboard charts
- oxlint for linting

## Architecture

```text
JobTrack/
├── backend/        Express API: feature modules, Prisma schema, migrations, seed, Dockerfile
├── frontend/       React SPA: pages, feature components, hooks, api clients, vercel.json
├── docs/           Design specifications and implementation plans
├── backend.md      Backend architecture notes
├── frontend.md     Frontend architecture notes
└── render.yaml     Render Blueprint for the API and PostgreSQL database
```

The backend is a modular monolith. Each feature module (`auth`, `applications`, `interviews`, `notes`, `dashboard`, `job-match`, `job-search`, `resumes`, `resume-tools`) follows a routes, controller, service, repository layout. Every request passes through auth, Zod validation, the controller, the service, and Prisma.

The frontend talks to the backend through authenticated HTTP requests using axios with credentials enabled. Server state lives in TanStack Query; the only client-side global state is the current user. Resume files are processed in memory and are not permanently stored by the upload endpoint. Resume versions saved from the UI are stored in PostgreSQL.

Data models: `User`, `JobApplication`, `Interview`, `Note`, `ResumeVersion`, and `MatchHistory`.

## Requirements

- Node.js 20 or newer.
- PostgreSQL 16 or newer.
- A Gemini API key for AI-powered analysis and generation.
- `pdflatex` and the required TeX packages for PDF export from LaTeX resumes.
- Optional Adzuna credentials for job search.

On Debian or Ubuntu, install the LaTeX compiler with:

```bash
sudo apt-get update
sudo apt-get install -y texlive-latex-base texlive-latex-extra
```

## Local Setup

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
ADZUNA_APP_ID="your-adzuna-app-id"
ADZUNA_APP_KEY="your-adzuna-app-key"
RAPIDAPI_KEY="optional-rapidapi-key"
```

Do not commit `.env` files or API keys.

Notes on the settings:

- `JWT_SECRET` must be at least 32 characters in production (`openssl rand -base64 48` generates a good one). The server refuses to start otherwise.
- `CLIENT_ORIGIN` accepts a comma-separated list when the frontend is served from more than one origin, for example a production domain plus a preview domain. Requests that change data are rejected unless their `Origin` header matches this list.
- `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` are optional; job search returns a clear "not configured" error without them.

### 3. Install and initialize the backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
```

The seed creates a demo account with sample applications:

```text
Email: demo@jobtrack.dev
Password: password123
```

The seed refuses to run when `NODE_ENV=production` unless `ALLOW_SEED=true` is also set, so the demo credentials never land on a live database by accident.

### 4. Configure and start the frontend

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:4000/api
```

Then install and run:

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
5. Review the resume overview, match score, missing skills, experience gaps, and recommendations.
6. For a LaTeX source resume, use **Add missing skills**.
7. Download either the updated `.tex` file or the compiled PDF.

LaTeX source is required to preserve the original LaTeX structure. A PDF cannot be converted back into its original LaTeX source reliably.

## API Reference

All routes are prefixed with `/api`. Every route except register, login, and logout requires an authenticated session cookie.

**Auth**

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `PATCH /auth/profile`

**Applications, interviews, and notes**

- `GET /applications`
- `POST /applications`
- `GET /applications/follow-ups`
- `GET /applications/:id`
- `PATCH /applications/:id`
- `DELETE /applications/:id`
- `GET /applications/:id/interviews`
- `POST /applications/:id/interviews`
- `PATCH /interviews/:id`
- `DELETE /interviews/:id`
- `GET /applications/:id/notes`
- `POST /applications/:id/notes`
- `PATCH /notes/:id`
- `DELETE /notes/:id`

**Dashboard and job search**

- `GET /dashboard/stats`
- `GET /job-search/search?keyword=...&location=...`

**Job match and resumes**

- `POST /job-match/analyze`
- `GET /resumes`
- `POST /resumes`
- `GET /resumes/:id`
- `PATCH /resumes/:id`
- `DELETE /resumes/:id`
- `GET /resumes/matches`
- `GET /resumes/matches/:id`
- `DELETE /resumes/matches/:id`

**Resume tools**

- `POST /resume-tools/ats/analyze`
- `POST /resume-tools/summary`
- `POST /resume-tools/rewrite-bullet`
- `POST /resume-tools/cover-letter`
- `POST /resume-tools/add-missing-skills`
- `POST /resume-tools/latex-pdf`

A public `GET /health` endpoint (outside the `/api` prefix) returns `{"status":"ok"}` for uptime checks.

## Security Measures

- Sessions use an `httpOnly` cookie signed with HS256; the verifier pins the algorithm. In production the cookie is `Secure` and `SameSite=None` so the Vercel frontend can talk to the Render API cross-site.
- Login and registration are rate limited (20 failed attempts per 15 minutes per IP), AI endpoints at 40 per 15 minutes, PDF export at 10 per 15 minutes, and the API overall at 600 per 15 minutes.
- State-changing requests must come from an origin listed in `CLIENT_ORIGIN`, which blocks cross-site form posts.
- `helmet` sets standard security headers on the API, and `vercel.json` sets `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` on the frontend.
- JSON bodies are capped at 512 KB and resume uploads at 5 MB. Only PDF, TXT, and `.tex` uploads are accepted.
- Job URLs must be `http(s)`; other schemes such as `javascript:` are rejected on both client and server.
- `pdflatex` runs with shell escape disabled, a minimal environment, a temporary directory, and TeX Live's paranoid file-access mode, so a malicious `.tex` file cannot read server secrets or files outside its temp directory.
- User-owned applications, resume versions, and match history are protected by authenticated ownership checks.
- Emails are trimmed and lower-cased before storage and lookup.
- Never commit Gemini keys, JWT secrets, database passwords, or other credentials.

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

The project is deployed with the API and PostgreSQL on Render and the frontend on Vercel. The configuration for both is committed in the repository.

### Backend on Render

The `render.yaml` Blueprint provisions a free PostgreSQL database (`jobtrack-db`) and a Docker web service (`jobtrack-api`).

1. Create a new Render Blueprint from this repository and select `render.yaml`.
2. Enter `GEMINI_API_KEY`, `CLIENT_ORIGIN`, and the optional job-search credentials when prompted. `JWT_SECRET` is generated automatically.
3. Deploy the blueprint. The container runs `prisma migrate deploy` before starting the API on every deploy.

If creating the service manually instead, use these settings:

```text
Dockerfile: backend/Dockerfile
Docker context: repository root
Health check: /health
```

The Dockerfile installs `texlive-latex-base` and `texlive-latex-extra` so the LaTeX-to-PDF export works in production, and runs the server as the unprivileged `node` user.

Set `CLIENT_ORIGIN` to the exact Vercel URL with no trailing slash:

```text
https://jobtrack-frontend-gamma.vercel.app
```

### Frontend on Vercel

The Vercel project is `jobtrack-frontend`, rooted at `frontend`, with these settings:

```text
Framework: Vite
Build command: npm run build
Output directory: dist
Install command: npm ci
```

`frontend/vercel.json` rewrites all paths to `index.html` for client-side routing and adds the security headers listed above.

Set the Vercel environment variable `VITE_API_URL` to the Render API URL plus `/api`:

```text
https://jobtrack-api-jnd8.onrender.com/api
```

Redeploy the backend after the Vercel URL is known so its `CLIENT_ORIGIN` matches exactly. Do not expose `GEMINI_API_KEY`, database credentials, or JWT secrets in Vercel variables. Only `VITE_`-prefixed variables are bundled into the frontend, and they are public.

To deploy from the CLI after linking the project:

```bash
cd frontend
npx vercel --prod
```
