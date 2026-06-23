# Nexus Student Management System

Production-ready React + Vite + Tailwind CSS frontend scaffold for an enterprise student management workspace.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- React Router
- shadcn/ui-style components with Radix primitives
- Lucide React
- Framer Motion
- React Hook Form
- TanStack Query
- Axios
- Socket.io real-time events
- Light and dark theme provider
- Express + Mongoose + Multer backend for bulk student import and document management
- xlsx + csv-parser for server-side spreadsheet parsing
- Cloudinary storage for secure student documents

## Modules

- Dashboard: `/`
- Student Management: `/students`, `/students/new`, `/students/import`, `/students/:studentId`, `/students/:studentId/edit`
- Student Documents: `/documents`
- Course Management: `/courses`, `/courses/new`, `/courses/:courseId`, `/courses/:courseId/edit`
- Attendance: `/attendance`, `/attendance/mark`
- Grade Management: `/grades`
- Reports: `/reports`
- Analytics: `/analytics`
- Audit Logs: `/audit-logs`
- Governance: `/governance`
- Settings: `/settings`

## Structure

```txt
src/
  components/
    atoms/
    molecules/
    organisms/
    templates/
    ui/
  config/
  data/
  hooks/
  lib/
  pages/
  providers/
  routes/
```

## Scripts

```bash
npm install
npm run dev
npm run dev:api
npm run dev:full
npm run build
npm run lint
npm run healthcheck
npm run backup:mongodb
```

## Production Deployment

See `docs/DEPLOYMENT.md` for MongoDB Atlas, Docker, NGINX, HTTPS, Vercel, Render, CI/CD, monitoring, and backup setup.

## Bulk Student Import API

Create `.env` from `.env.example`, then run the API:

```bash
npm run dev:api
```

Endpoints:

- `GET /api/students/import/template`
- `POST /api/students/import/validate`
- `POST /api/students/import/commit`
- `POST /api/students/import/errors`

Rollback uses MongoDB transactions, so MongoDB must run as a replica set in production-like environments.

## Student Document API

Set the Cloudinary values in `.env` before running document uploads:

```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_DOCUMENT_FOLDER=nexus/student-documents
MAX_DOCUMENT_UPLOAD_MB=10
```

Endpoints:

- `GET /api/documents`
- `POST /api/documents`
- `GET /api/documents/:documentId/download`
- `DELETE /api/documents/:documentId`

Uploads use Multer memory storage, file type and size validation, a pre-storage validation hook, Cloudinary storage, and MongoDB metadata records.

## Notifications and Audit Logs

Socket.io runs on the same Express HTTP server as the API.

```bash
VITE_SOCKET_URL=http://localhost:5000
```

Endpoints:

- `GET /api/notifications`
- `POST /api/notifications`
- `PATCH /api/notifications/read-all`
- `PATCH /api/notifications/:notificationId/read`
- `DELETE /api/notifications/:notificationId`
- `GET /api/audit-logs`
- `GET /api/audit-logs/export?format=csv`
- `GET /api/audit-logs/export?format=excel`

The demo request context uses `x-user-id`, `x-user-name`, and `x-user-role` headers. Replace `server/middleware/requestContext.js` with JWT/session verification before production deployment.
