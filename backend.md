# JobTrack Backend Architecture

## Overview

Modular monolith. Node.js + Express + TypeScript + PostgreSQL + Prisma. One deployable service, internally organized by feature module (`auth`, `applications`, `interviews`, `notes`, `dashboard`). No microservices, no message queues, no separate services for anything in this scope.

## Request flow

Every request passes through the same pipeline, regardless of module:

```
HTTP request
  → authMiddleware        verifies JWT from httpOnly cookie, attaches req.userId (skipped for /auth/register, /auth/login)
  → validateMiddleware     parses req.body / req.query / req.params against a zod schema, 400 on failure
  → Controller             thin — extract typed input, call one service method, map result to HTTP response
  → Service                business logic, ownership enforcement, orchestrates repository calls
  → Repository              Prisma calls only, no business logic
  → Prisma Client → PostgreSQL
  ← errors thrown anywhere above are caught by asyncHandler and passed to errorMiddleware
```

Rule: controllers never call Prisma directly, and repositories never contain `if` statements about business rules — only query shape.

## Folder structure

```
backend/
  src/
    config/
      env.ts               # loads & validates process.env with zod, exports typed config object
      prisma.ts             # single PrismaClient instance, imported everywhere else

    middleware/
      auth.middleware.ts     # reads JWT cookie, verifies, sets req.userId or throws AppError(401)
      validate.middleware.ts # generic factory: validate(schema) -> RequestHandler
      error.middleware.ts    # final error handler, maps AppError -> JSON, logs unexpected errors as 500

    common/
      AppError.ts            # class AppError extends Error { statusCode, message, code }
      asyncHandler.ts         # wraps async route handlers so thrown errors reach errorMiddleware
      pagination.ts           # shared parsePagination(query) -> { skip, take, page, limit }
      types.ts                # shared request/response types (AuthedRequest extends Request)

    modules/
      auth/
        auth.routes.ts
        auth.controller.ts
        auth.service.ts
        auth.schema.ts        # zod: registerSchema, loginSchema

      applications/
        applications.routes.ts
        applications.controller.ts
        applications.service.ts
        applications.repository.ts
        applications.schema.ts  # createApplicationSchema, updateApplicationSchema, listQuerySchema

      interviews/
        interviews.routes.ts
        interviews.controller.ts
        interviews.service.ts
        interviews.repository.ts
        interviews.schema.ts

      notes/
        notes.routes.ts
        notes.controller.ts
        notes.service.ts
        notes.repository.ts
        notes.schema.ts

      dashboard/
        dashboard.routes.ts
        dashboard.controller.ts
        dashboard.service.ts   # no repository — queries via applications data directly

    app.ts                   # creates express app, mounts middleware + all module routers
    server.ts                # imports app, starts http server, reads PORT from config

  prisma/
    schema.prisma
    seed.ts                  # creates one demo user + a handful of applications/interviews/notes

  .env.example
  tsconfig.json
  package.json
```

## Module responsibilities

### auth
- `POST /api/auth/register` — validate body (email, password min 8 chars, name), reject if email taken, hash password with bcrypt (12 rounds), create user, issue JWT cookie, return `{ id, email, name }`.
- `POST /api/auth/login` — validate credentials, compare bcrypt hash, issue JWT cookie, return user.
- `GET /api/auth/me` — requires auth middleware, returns current user from `req.userId`.
- `POST /api/auth/logout` — clears the cookie.

JWT payload: `{ sub: userId }`, 7-day expiry. Signed with `JWT_SECRET` from env. Cookie flags: `httpOnly: true, sameSite: 'lax', secure: NODE_ENV === 'production'`.

### applications
- `GET /api/applications` — list, scoped to `req.userId`. Query params: `page`, `limit` (default 20, max 100), `status`, `search` (ILIKE on `company`/`position`), `sortBy` (`appliedDate` | `company` | `status`, default `appliedDate`), `order` (`asc`|`desc`, default `desc`). Returns `{ data, meta: { page, limit, total, totalPages } }`.
- `GET /api/applications/:id` — 404 if not found or not owned by `req.userId`. Includes `interviews` and `notes` (ordered by date desc).
- `POST /api/applications` — validated body, `userId` forced from `req.userId` (never trust client-supplied userId).
- `PATCH /api/applications/:id` — partial update, ownership check before write.
- `DELETE /api/applications/:id` — ownership check, cascades to interviews/notes via Prisma `onDelete: Cascade`.

Ownership check pattern used everywhere: query with `where: { id, userId: req.userId }` — a mismatched owner produces the same 404 as a nonexistent id, so IDs never leak existence to other users.

### interviews
- `POST /api/applications/:id/interviews` — verify the parent application belongs to `req.userId` first, then create.
- `GET /api/applications/:id/interviews` — same ownership check, then list ordered by `scheduledAt`.
- `PATCH /api/interviews/:id` — ownership resolved by joining through `interview.application.userId`.
- `DELETE /api/interviews/:id` — same join-based ownership check.

### notes
Identical pattern to interviews: `POST/GET` nested under `/applications/:id/notes`, `PATCH/DELETE` standalone under `/notes/:id`, ownership always resolved through the parent application's `userId`.

### dashboard
- `GET /api/dashboard/stats` — single grouped Prisma query (`groupBy` on `status`) scoped to `req.userId`, computing:
  - `totalApplications`
  - `byStatus` (count per `ApplicationStatus`)
  - `interviewRate` = applications that reached INTERVIEW/TECHNICAL/OFFER or later ÷ total
  - `offerRate` = OFFER count ÷ total
  - `recentActivity` (last 5 applications by `updatedAt`)

  No N+1 queries — aggregate in SQL via Prisma's `groupBy`/`count`, not by fetching all rows and reducing in JS.

## Validation

Every route with a body or query gets a zod schema in that module's `.schema.ts`, applied via `validateMiddleware(schema)`. Validation happens before the controller runs. Example shape:

```ts
export const createApplicationSchema = z.object({
  body: z.object({
    company: z.string().min(1).max(200),
    position: z.string().min(1).max(200),
    status: z.nativeEnum(ApplicationStatus).default('APPLIED'),
    appliedDate: z.coerce.date(),
    jobUrl: z.string().url().optional(),
    location: z.string().max(200).optional(),
    salaryMin: z.number().int().positive().optional(),
    salaryMax: z.number().int().positive().optional(),
    source: z.string().max(100).optional(),
    followUpDate: z.coerce.date().optional(),
  }),
});
```

## Error handling

`AppError` carries `statusCode` + `message` + optional `code`. Services throw it directly (`throw new AppError(404, 'Application not found')`). `asyncHandler` wraps every controller so rejected promises reach `errorMiddleware`. `errorMiddleware`:
- `AppError` → respond with its statusCode and `{ error: { message, code } }`
- zod `ZodError` (if it somehow reaches here) → 400 with field errors
- Prisma known errors (e.g. `P2002` unique violation) → mapped to 409
- anything else → log full error server-side, respond 500 with a generic message (never leak stack traces to the client)

## Authorization model

Every module method that touches a `JobApplication`, `Interview`, or `Note` requires `userId` as an explicit parameter and includes it in the Prisma `where` clause — either directly (`JobApplication.userId`) or via a relation filter (`interview: { application: { userId } }`). This is enforced at the repository layer so it can't be forgotten in a controller.

## Environment variables

```
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=7d
PORT=4000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
```

CORS is configured with `origin: CLIENT_ORIGIN, credentials: true` (required for the httpOnly cookie to be sent cross-origin in dev).

## Testing scope (2-day budget)

Given the timeline, automated tests are limited to the highest-signal paths: auth (register/login/duplicate email), ownership enforcement (user A cannot read/edit/delete user B's application), and pagination/filter correctness on the applications list. Everything else is verified manually via the smoke-test pass at the end of Day 1.
