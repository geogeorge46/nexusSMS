# API Overview

All protected APIs require:

```txt
Authorization: Bearer <jwt>
```

## Auth

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

## Administration

- `/api/admins` Super Admin only.
- `/api/audit-logs` Admin/Super Admin only.
- `/api/dashboard` non-student/non-parent operational users only.

## Institution

- `/api/catalog/departments`
- `/api/catalog/programs`
- `/api/catalog/academicYears`
- `/api/catalog/semesters`
- `/api/catalog/staff`
- `/api/catalog/studentcourses`
- `/api/catalog/courseassignments`

GET is view-only for approved operational roles. Mutations require Admin/Super Admin.

## Students, Courses, Documents

- `/api/students`
- `/api/students/import`
- `/api/courses`
- `/api/documents`

Students and parents must use their portal endpoints. Document downloads through `/api/documents` are restricted to operational users; portal document access is scoped to own or linked student records.

## Academic

- `/api/attendance`
- `/api/grades`
- `/api/timetable/rooms`
- `/api/timetable/slots`
- `/api/exams`
- `/api/lms`

Teachers are constrained by assigned courses. Admin/Super Admin keep full management access.

## Fees

- `/api/fees/categories`
- `/api/fees/structures`
- `/api/fees/assign`
- `/api/fees/student-fees`
- `/api/fees/payments`
- `/api/fees/receipts`
- `/api/fees/reports`

Admin/Super Admin manage structures and assignments. Accountants can view finance data and record payments.

## Student Portal

- `/api/student-portal/me`
- `/api/student-portal/courses`
- `/api/student-portal/timetable`
- `/api/student-portal/attendance`
- `/api/student-portal/grades`
- `/api/student-portal/documents`
- `/api/student-portal/fees`
- `/api/student-portal/receipts`
- `/api/student-portal/exams`
- `/api/student-portal/hall-tickets`
- `/api/student-portal/results`
- `/api/student-portal/assignments`
- `/api/student-portal/submissions`
- `/api/student-portal/materials`
- `/api/student-portal/notifications`

Every endpoint resolves the student from the authenticated user.

## Parent Portal

- `/api/parent-portal/me`
- `/api/parent-portal/students`
- `/api/parent-portal/students/:studentId/profile`
- `/api/parent-portal/students/:studentId/attendance`
- `/api/parent-portal/students/:studentId/grades`
- `/api/parent-portal/students/:studentId/results`
- `/api/parent-portal/students/:studentId/fees`
- `/api/parent-portal/students/:studentId/receipts`
- `/api/parent-portal/students/:studentId/assignments`
- `/api/parent-portal/students/:studentId/materials`
- `/api/parent-portal/students/:studentId/timetable`
- `/api/parent-portal/students/:studentId/documents`
- `/api/parent-portal/notifications`

Every child endpoint verifies that `studentId` is linked to the authenticated parent profile.
