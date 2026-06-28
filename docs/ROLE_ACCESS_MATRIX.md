# Role Access Matrix

## Super Admin

- Pages visible: all dashboards, students, documents, courses, attendance, grades, exams, LMS, reports, fees, timetable, institution modules, admin management, audit logs, governance, settings.
- Actions allowed: full create, read, update, delete, imports, assignments, payments, publishing, seed/demo verification.
- Actions blocked: none by role; still subject to data validation.

## Admin

- Pages visible: all operational pages except Admin Management.
- Actions allowed: manage students, courses, institution catalog, staff, enrollments, attendance, grades, fees, timetable, exams, LMS, documents, reports, audit logs.
- Actions blocked: create/update/delete Super Admin/Admin users.

## Teacher

- Pages visible: dashboard, students, courses, attendance, grades, exams, LMS, reports, my timetable, settings.
- Actions allowed: mark attendance and grades for assigned courses, view own timetable, enter results for assigned exam schedules, manage LMS for assigned courses.
- Actions blocked: admin management, audit logs, fee management, institution editing, unassigned-course attendance/grades/results/LMS.

## Staff: Admission Officer

- Pages visible: dashboard, students, documents, reports, courses where useful, departments/programs/academic years/semesters view-only, settings.
- Actions allowed: create/update admission details, upload/verify admission documents, view academic structure.
- Actions blocked: attendance, grades, exams/LMS management, fees, timetable management, audit logs, admin management.

## Staff: Office Clerk

- Pages visible: dashboard, students, documents, reports, settings.
- Actions allowed: update basic student details and manage general documents.
- Actions blocked: academic structure editing, attendance, grades, exams/LMS, fees, timetable management, audit logs, admin management.

## Staff: Librarian

- Pages visible: dashboard, students, courses, reports, settings.
- Actions allowed: view students and courses.
- Actions blocked: academic edits, attendance, grades, exams/LMS, fees, institution management, audit logs.

## Staff: Accountant

- Pages visible: dashboard, students, documents, reports, fee management, settings.
- Actions allowed: view students, manage finance documents, view fee records, record payments.
- Actions blocked: academic edits, attendance, grades, exams/LMS, timetable, institution management, audit logs.

## Staff: Lab Assistant

- Pages visible: dashboard, students, courses, reports, timetable view, settings.
- Actions allowed: view students, courses, and lab timetable.
- Actions blocked: attendance, grades, exams/LMS management, fees, institution management, audit logs.

## Student

- Pages visible: dashboard, my profile, courses, timetable, exams, hall tickets, results, assignments, submissions, materials, attendance, grades, documents, fees, receipts, notifications, calendar, support, settings.
- Actions allowed: view own data, submit own assignments, update own limited profile fields, read own notifications.
- Actions blocked: all admin/staff/teacher pages, all other student records, attendance marking, grade/result creation, fee/payment mutation.

## Parent

- Pages visible: dashboard, children, attendance, grades/results, fees, assignments, timetable, documents, notifications, support, settings.
- Actions allowed: view linked child data, switch between linked children, read own notifications.
- Actions blocked: unlinked students, all mutation of academic/fee records, student portal endpoints, admin/staff/teacher pages.

## Test Logins

```txt
admin@nexus.com / Admin@12345
qa.admin@nexus.local / Admin@12345
parent.aarav@nexus.local / Parent@12345
parent.maya@nexus.local / Parent@12345
parent.family@nexus.local / Parent@12345
```

Teacher, staff, and student demo emails are printed by `npm run seed:institution` and `npm run seed:constraints`.
