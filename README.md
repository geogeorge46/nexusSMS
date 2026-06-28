# Nexus SMS

Nexus SMS is a MERN student management system for school and college workflows. It connects admissions, institutional structure, courses, enrollments, attendance, grades, fees, timetable, exams, LMS, student self-service, parent self-service, notifications, documents, reports, and audit logs.

## Features

- Role-based dashboards for Super Admin, Admin, Teacher, Staff, Student, and Parent.
- Institutional catalog: departments, programs, academic years, semesters, staff, course assignments, and enrollments.
- Academic operations: courses, attendance, grades, timetable, exams, hall tickets, results, LMS assignments, submissions, and materials.
- Finance operations: fee categories, structures, student fee assignments, payments, receipts, and reports.
- Portals: students view only their own records; parents view only linked children.
- Security controls: JWT auth, role guards, backend 403 checks, document restrictions, seed safety, audit logs, CORS allow-list, rate limiting, Helmet, and production env validation.

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Axios, Socket.io client.
- Backend: Node.js, Express, MongoDB, Mongoose, Multer, Socket.io, Helmet, CORS, express-rate-limit.
- Storage: Cloudinary for student documents.
- Utilities: CSV/Excel import, PDF/Excel report exports, seed and smoke-test scripts.

## Roles

- Super Admin: full system access including admin management and audit logs.
- Admin: academic, fee, timetable, exam, LMS, student, document, report, and institutional management.
- Teacher: assigned-course academic tools, timetable, exams, LMS, grades, attendance.
- Staff: designation-based access for Admission Officer, Office Clerk, Librarian, Accountant, and Lab Assistant.
- Student: own portal only.
- Parent: linked-child portal only.

See [docs/ROLE_ACCESS_MATRIX.md](docs/ROLE_ACCESS_MATRIX.md) for the detailed matrix.

## Setup

```bash
npm install
cp .env.example .env
npm run dev:full
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000/api`

## Environment Variables

Required for local development:

```txt
MONGODB_URI=mongodb://127.0.0.1:27017/nexus-student-management
JWT_SECRET=replace-with-a-long-random-secret-at-least-32-characters
CLIENT_ORIGIN=http://localhost:5173
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Required for production:

```txt
NODE_ENV=production
MONGODB_URI=<mongodb-atlas-uri>
CLIENT_ORIGIN=https://your-frontend.example.com
JWT_SECRET=<32+ character random secret>
JWT_EXPIRES_IN=12h
PASSWORD_PEPPER=<32+ character random pepper>
TRUST_PROXY=true
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
VITE_API_BASE_URL=https://your-api.example.com/api
VITE_SOCKET_URL=https://your-api.example.com
```

Demo seed scripts are blocked in production unless `ALLOW_PRODUCTION_SEED=true` is intentionally set.

## Seed Commands

```bash
npm run seed:institution
npm run seed:constraints
npm run seed:fees
npm run seed:timetable
npm run seed:lms
npm run seed:parents
```

Optional:

```bash
npm run seed:exams
npm run seed:admin
```

## Test Commands

```bash
npm run test:constraints
npm run test:fees
npm run test:timetable
npm run test:lms
npm run test:parents
npm run lint
npm run build
```

Optional:

```bash
npm run test:exams
```

## Demo Accounts

Common seeded passwords:

```txt
Admin/Super Admin: Admin@12345
Teachers: Teacher@12345
Students: Student@12345
Parents: Parent@12345
```

Useful accounts:

```txt
admin@nexus.com
qa.admin@nexus.local
parent.aarav@nexus.local
parent.maya@nexus.local
parent.family@nexus.local
```

The seed output lists additional generated teacher, staff, and student accounts.

## Deployment Notes

- Set `CLIENT_ORIGIN` to every deployed frontend origin, comma-separated.
- Set `VITE_API_BASE_URL` and `VITE_SOCKET_URL` for the frontend build.
- Use MongoDB Atlas or a managed MongoDB instance.
- Use a strong `JWT_SECRET` and `PASSWORD_PEPPER`; production validation rejects short values.
- Keep `ALLOW_PRODUCTION_SEED=false` except for an intentional demo database reset.
- Configure Cloudinary before document uploads.

See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for the full deployment checklist.
