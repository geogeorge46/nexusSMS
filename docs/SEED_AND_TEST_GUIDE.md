# Seed And Test Guide

Run seeds in this order for a full demo database:

```bash
npm run seed:institution
npm run seed:constraints
npm run seed:fees
npm run seed:timetable
npm run seed:lms
npm run seed:parents
```

Optional exam seed:

```bash
npm run seed:exams
```

Run smoke tests:

```bash
npm run test:constraints
npm run test:fees
npm run test:timetable
npm run test:lms
npm run test:parents
```

Optional:

```bash
npm run test:exams
```

Finish with:

```bash
npm run lint
npm run build
```

## Seed Safety

Seed scripts are intended for local or demo databases. In production they stop unless:

```txt
ALLOW_PRODUCTION_SEED=true
```

Only enable this for an intentional demo reset.

## Demo Passwords

```txt
Admin/Super Admin: Admin@12345
Teacher: Teacher@12345
Student: Student@12345
Parent: Parent@12345
```

Parent demo accounts:

```txt
parent.aarav@nexus.local
parent.maya@nexus.local
parent.family@nexus.local
```
