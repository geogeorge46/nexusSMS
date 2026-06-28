# Modules Overview

## Core

- Authentication and role-based authorization
- Dashboard and reports
- Notifications
- Audit logs
- Settings/profile

## Institution

- Departments
- Programs
- Academic years
- Semesters
- Staff
- Course assignments
- Student course enrollments

## Academics

- Student admissions
- Courses
- Attendance
- Grades
- Timetable and room allocation
- Exam management, schedules, hall tickets, results

## Finance

- Fee categories
- Fee structures
- Student fee assignment
- Payments
- Receipts
- Fee reports

## LMS

- Assignments
- Student submissions
- Submission grading and feedback
- Learning materials

## Portals

- Student portal: own profile, courses, timetable, attendance, grades, documents, fees, exams, LMS, notifications.
- Parent portal: linked children, attendance, grades/results, fees, assignments, timetable, documents, notifications.

## Security And Data Rules

- Students and parents cannot access operational APIs.
- Parents cannot access unlinked students.
- Teachers can mutate attendance, grades, exams, and LMS only for assigned courses.
- Non-teaching staff cannot mark attendance or grades.
- Duplicate enrollments, attendance, timetable conflicts, result duplicates, and LMS duplicate submissions are blocked by services and indexes where applicable.
