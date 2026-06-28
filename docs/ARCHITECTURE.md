# Architecture

Nexus SMS is a MERN application with a Vite React frontend and an Express/Mongoose backend.

## Frontend

- `src/routes`: route definitions and role guards.
- `src/pages`: feature pages for admin, teacher, staff, student, and parent workflows.
- `src/components`: reusable UI, layout, navigation, cards, forms, and tables.
- `src/hooks`: TanStack Query hooks for API reads/mutations.
- `src/lib`: API client, auth helpers, permissions, notification helpers, utilities.
- `src/providers`: auth, theme, query client, and notification socket providers.

The frontend uses role-aware navigation and route guards. Sidebar visibility is controlled by `src/lib/permissions.ts` and route entry is controlled by `src/routes/auth-gates.tsx`.

## Backend

- `server/app.js`: Express app, CORS, Helmet, compression, rate limiting, routes, error handling.
- `server/config`: environment, database, logger.
- `server/middleware`: auth context, authorization gates, audit middleware, uploads, errors.
- `server/models`: Mongoose schemas and indexes.
- `server/routes`: Express route modules.
- `server/controllers`: request/response adapters.
- `server/services`: business rules and cross-collection validation.

Services enforce institutional rules such as course assignment, enrollment, timetable conflicts, exam/result eligibility, LMS assignment access, and parent/student scoping.

## Auth Flow

1. User logs in through `/api/auth/login`.
2. Backend validates status, role, linked student/parent profile where needed.
3. Backend signs a JWT with `sub`, `email`, `name`, and `role`.
4. Frontend stores the token and sends `Authorization: Bearer <token>`.
5. `attachRequestContext` loads active user context, staff/student/parent linkage, then route middleware enforces permissions.

## Data Boundaries

- Admin/Super Admin: broad operational access.
- Teacher: assigned-course access.
- Staff: designation-based access.
- Student: own record only through student portal.
- Parent: linked students only through parent portal.

## Deployment Shape

The frontend can be deployed separately from the backend using:

```txt
VITE_API_BASE_URL=https://api.example.com/api
VITE_SOCKET_URL=https://api.example.com
CLIENT_ORIGIN=https://app.example.com
```

If served from the same origin, the frontend falls back to `/api` and the current origin for sockets.
