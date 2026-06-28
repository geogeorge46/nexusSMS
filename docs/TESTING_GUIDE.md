# Testing Guide

## Full Demo Verification

Run the requested readiness sequence:

```bash
npm run seed:institution
npm run seed:constraints
npm run seed:fees
npm run seed:timetable
npm run seed:lms
npm run seed:parents
npm run test:constraints
npm run test:fees
npm run test:timetable
npm run test:lms
npm run test:parents
npm run lint
npm run build
```

## Optional Exam Checks

```bash
npm run seed:exams
npm run test:exams
```

## Browser QA Checklist

- Admin can open students, documents, courses, institution pages, fees, timetable, exams, LMS, reports, audit logs, and settings.
- Super Admin can additionally open admin management.
- Teacher sees teaching-focused pages and cannot open admin/institution/fee management pages.
- Staff sees only designation-appropriate pages.
- Student sees only student portal pages and cannot open `/students`, `/courses`, `/attendance`, `/grades`, `/fees`, `/audit-logs`, or institution pages.
- Parent sees only parent portal pages and cannot open student/admin/staff/teacher internal pages.
- Restricted backend API calls return 401 without a token and 403 with an unauthorized role.
- Tables should search, filter, sort current results, paginate, and show empty states.
- Mobile sidebar should open/close cleanly and content should not overflow horizontally.

## Demo Accounts

```txt
admin@nexus.com / Admin@12345
qa.admin@nexus.local / Admin@12345
parent.aarav@nexus.local / Parent@12345
parent.maya@nexus.local / Parent@12345
parent.family@nexus.local / Parent@12345
```

Teacher, staff, and student accounts are printed by the seed scripts.

## Seed Safety

Seed scripts are blocked when `NODE_ENV=production` unless `ALLOW_PRODUCTION_SEED=true` is explicitly set.
