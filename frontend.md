# JobTrack Frontend Architecture

## Overview

React + TypeScript + Vite. Tailwind for styling, React Router for navigation, TanStack Query for all server state, React Hook Form + Zod for forms, Recharts for the dashboard. No global client-state library (Redux/Zustand) — server state lives in TanStack Query's cache, the only local/global state needed is auth (current user), handled with a small Context.

## Layering

```
Pages          route-level components; compose layout + feature components, own no business logic
Feature components   applications/interviews/notes/dashboard — render + local UI state only
Hooks          TanStack Query wrappers per resource — the only place that calls the api/ layer
api/           axios calls, one file per backend module, typed request/response
lib/           zod schemas (shared with RHF), pure utility functions
types/         TS types mirroring backend DTOs
```

Data flow for any screen: **Page → hook (`useApplications`) → api function (`applications.api.ts`) → axios → backend**. Components never call `axios` or `fetch` directly.

## Folder structure

```
frontend/
  src/
    api/
      axios.ts               # axios instance, baseURL from env, withCredentials: true
      auth.api.ts             # register, login, me, logout
      applications.api.ts      # list (with query params), getById, create, update, remove
      interviews.api.ts
      notes.api.ts
      dashboard.api.ts

    hooks/
      useAuth.ts               # wraps AuthContext
      useApplications.ts        # useQuery(['applications', filters]), useMutation for create/update/delete
      useApplication.ts         # useQuery(['applications', id]) — single application incl. interviews/notes
      useInterviews.ts
      useNotes.ts
      useFollowUps.ts
      useDashboardStats.ts

    context/
      AuthContext.tsx           # { user, isLoading, login(), register(), logout() } — calls auth.api, exposes to app

    routes/
      AppRouter.tsx              # route table
      ProtectedRoute.tsx          # redirects to /login if AuthContext has no user (after initial /me check)

    components/
      ui/                        # Button, Input, Select, Textarea, Badge, StatusBadge, Card, Modal, Table,
                                  # Pagination, Spinner, EmptyState, ErrorState, Toast
      layout/
        AppShell.tsx              # sidebar + topbar + <Outlet/>
        Sidebar.tsx
        Topbar.tsx
      applications/
        ApplicationTable.tsx       # renders rows, handles sort-column clicks
        ApplicationFilters.tsx     # status filter, search input, debounced
        ApplicationForm.tsx        # create/edit, RHF + Zod, reused by both modes
      interviews/
        InterviewList.tsx
        InterviewForm.tsx
      notes/
        NoteList.tsx
        NoteForm.tsx
      dashboard/
        StatCard.tsx
        StatusBreakdownChart.tsx   # Recharts pie/bar
        RateCards.tsx              # interview rate / offer rate

    pages/
      LoginPage.tsx
      RegisterPage.tsx
      DashboardPage.tsx
      ApplicationsPage.tsx
      ApplicationDetailPage.tsx
      FollowUpsPage.tsx
      NotFoundPage.tsx

    lib/
      schemas.ts                 # zod schemas: loginSchema, registerSchema, applicationSchema, interviewSchema, noteSchema
      utils.ts                   # formatDate, formatCurrency, cn (classnames helper)

    types/
      index.ts                   # ApplicationStatus, JobApplication, Interview, Note, PaginatedResponse<T>, DashboardStats

    App.tsx
    main.tsx
  index.html
  tailwind.config.ts
  vite.config.ts
  .env.example
```

## Routing

```
/login                        public
/register                     public
/                              -> redirect to /dashboard
/dashboard                    protected
/applications                  protected — list + filters + pagination
/applications/:id              protected — detail: info, interviews, notes
/follow-ups                    protected
```

`ProtectedRoute` wraps every protected route in `AppRouter.tsx`. On app load, `AuthContext` calls `GET /api/auth/me` once; while that's pending, `ProtectedRoute` shows a full-page spinner instead of redirecting (avoids a login-page flash on refresh).

## Server state — TanStack Query conventions

- Query keys are arrays scoped by resource and params: `['applications', { page, status, search, sortBy, order }]`, `['applications', id]`, `['dashboard-stats']`, `['follow-ups']`.
- Every list query stays on the page via `placeholderData: keepPreviousData` so pagination/filter changes don't flash a loading spinner over the table.
- Mutations (`create`/`update`/`delete` for applications, interviews, notes) call `queryClient.invalidateQueries` on the relevant keys in `onSuccess` — e.g. creating an interview invalidates both `['applications', id]` and `['dashboard-stats']`.
- Default `staleTime` of 30s for list/detail data; dashboard stats use 60s since they're less time-sensitive.

## Forms

Every form (`ApplicationForm`, `InterviewForm`, `NoteForm`, login/register) uses `react-hook-form` with `zodResolver` against the schema in `lib/schemas.ts`. The same zod schema shape is reused for both the form resolver and documented alongside the matching backend schema, so frontend and backend validation stay in sync conceptually even though they run separately. Submit handlers call the corresponding mutation hook; field-level errors render from RHF's `formState.errors`, server-side errors (e.g. duplicate email) render as a form-level banner.

## UI states

Every data-driven view (table, detail page, dashboard) explicitly renders one of four states, never leaves a blank screen:
- **Loading** — skeleton rows / `Spinner`, not a blocking full-page spinner for list refetches
- **Error** — `ErrorState` component with retry button, wired to the query's `isError`/`refetch`
- **Empty** — `EmptyState` with contextual copy ("No applications yet — add your first one") and a primary action button
- **Loaded** — the real content

## Styling conventions

Tailwind only, no CSS files beyond `index.css` (Tailwind directives + font import). Design language: neutral grays, single accent color for primary actions/links, status badges color-coded per `ApplicationStatus` (e.g. gray=Applied, blue=Screening, purple=Interview, indigo=Technical, green=Offer, red=Rejected, slate=Withdrawn). Layout: fixed sidebar + scrollable content area, cards with subtle border (`border-gray-200`) rather than heavy shadows, consistent 8px-multiple spacing scale — matches the Linear/Vercel reference aesthetic from the brief.

## Environment variables

```
VITE_API_URL=http://localhost:4000/api
```

## Error handling (network layer)

`axios.ts` sets a response interceptor: on `401`, clear `AuthContext` user state and redirect to `/login` (session expired); on other errors, let the calling hook's `onError` / TanStack Query's `isError` handle it so components can render `ErrorState` with the actual message from `error.response.data.error.message`.
