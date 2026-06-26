# Nexus SMS Role Access Matrix

This matrix documents the current role-based access rules for the React sidebar, route guards, and Express API middleware.

## Test Login Accounts

Run `npm run seed:institution` and `npm run seed:constraints` before testing the full matrix.

| Role | Email | Password | Notes |
| --- | --- | --- | --- |
| Super Admin | `admin@nexus.com` | `Admin@12345` | Full platform owner account from `seed:institution`. |
| Admin | `qa.admin@nexus.local` | `Admin@12345` | Deterministic QA admin account. |
| Teacher | `constraint.java.faculty@nexus.local` | `Teacher@12345` | Teaching staff assigned to seeded courses. |
| Staff - Admission Officer | `constraint.admission.officer@nexus.local` | `Teacher@12345` | Non-teaching staff with admission permissions. |
| Staff - Office Clerk | `constraint.office.clerk@nexus.local` | `Teacher@12345` | Non-teaching staff with student/document update permissions. |
| Staff - Librarian | `constraint.librarian@nexus.local` | `Teacher@12345` | Non-teaching view-only academic access. |
| Staff - Accountant | `constraint.accountant@nexus.local` | `Teacher@12345` | Non-teaching document/financial support access. |
| Staff - Lab Assistant | `constraint.lab.assistant@nexus.local` | `Teacher@12345` | Non-teaching course/student view access. |

## Page Visibility

| Role | Pages visible in sidebar |
| --- | --- |
| Super Admin | Dashboard, Students, Documents, Courses, Attendance, Grades, Reports, Departments, Programs, Academic Years, Semesters, Staff, Course Assignments, Enrollments, Admin Management, Audit Logs, Governance, Settings |
| Admin | Dashboard, Students, Documents, Courses, Attendance, Grades, Reports, Departments, Programs, Academic Years, Semesters, Staff, Course Assignments, Enrollments, Audit Logs, Governance, Settings |
| Teacher | Dashboard, Students, Documents, Courses, Attendance, Grades, Reports, Departments, Programs, Academic Years, Semesters, Settings |
| Staff - Admission Officer | Dashboard, Students, Documents, Courses, Reports, Departments, Programs, Academic Years, Semesters, Settings |
| Staff - Office Clerk | Dashboard, Students, Documents, Reports, Settings |
| Staff - Librarian | Dashboard, Students, Documents, Courses, Reports, Settings |
| Staff - Accountant | Dashboard, Students, Documents, Reports, Settings |
| Staff - Lab Assistant | Dashboard, Students, Documents, Courses, Reports, Settings |

## Actions Allowed

| Role | Actions allowed |
| --- | --- |
| Super Admin | Full create, read, update, delete access for admins, institution catalog, students, courses, documents, attendance, grades, reports, audit logs, and governance. |
| Admin | Full academic and operational management for institution catalog, students, courses, documents, attendance, grades, reports, audit logs, and governance. |
| Teacher | View students, documents, courses, and limited reports. Mark attendance and add grades only for assigned courses and enrolled students. View institution structure modules needed for academic context. |
| Staff - Admission Officer | Create and update student admission records. Upload, verify, and manage admission documents. View courses and core institution structure. View students/courses reports. |
| Staff - Office Clerk | Create/update student records and manage general documents. View students and limited reports. |
| Staff - Librarian | View students, courses, documents, and limited reports. |
| Staff - Accountant | View students and limited reports. Upload/manage student documents for financial workflows. |
| Staff - Lab Assistant | View students, courses, documents, and limited reports. |

## Actions Blocked

| Role | Actions blocked |
| --- | --- |
| Super Admin | None by role. Business validations still apply, such as valid enrollment and duplicate prevention. |
| Admin | Admin Management is blocked because it is Super Admin only. Business validations still apply. |
| Teacher | Cannot create/update/delete students, courses, institution catalog, staff, course assignments, enrollments, admins, audit logs, or governance settings. Cannot mark attendance or grades for unassigned courses or non-enrolled students. |
| Staff - Admission Officer | Cannot mark attendance, add grades, manage admins, view audit logs, edit institution catalog, manage courses, assign faculty, or enroll students into courses. |
| Staff - Office Clerk | Cannot mark attendance, add grades, manage admins, view audit logs, edit institution catalog, manage courses, assign faculty, or enroll students into courses. |
| Staff - Librarian | Cannot edit students, documents, courses, academic records, institution catalog, attendance, grades, admins, audit logs, or governance settings. |
| Staff - Accountant | Cannot edit students, courses, academic records, institution catalog, attendance, grades, admins, audit logs, or governance settings. |
| Staff - Lab Assistant | Cannot edit students, documents, courses, academic records, institution catalog, attendance, grades, admins, audit logs, or governance settings. |

## Backend Permission Checks

| API area | Middleware / rule |
| --- | --- |
| `/api/admins` | `requireSuperAdmin`; Admin, Teacher, and Staff receive 403. |
| `/api/catalog/:resource` | Authenticated users can read. Only Admin and Super Admin can create, update, or delete. |
| `/api/students` | Authenticated users can read. Admin, Super Admin, Admission Officer, and Office Clerk can create/update. Only Admin and Super Admin can delete. |
| `/api/courses` | Authenticated users can read. Only Admin and Super Admin can create, update, or delete. |
| `/api/student-documents` | Authenticated users can read/download. Admin, Super Admin, Admission Officer, Office Clerk, and Accountant can upload/manage. |
| `/api/attendance` | Admin, Super Admin, and Teacher only. Service layer also checks assigned teacher and enrolled student/course pair. |
| `/api/grades` | Admin, Super Admin, and Teacher only. Service layer also checks assigned teacher, enrolled student/course pair, mark range, and duplicate assessment. |
| `/api/reports/students` and `/api/reports/courses` | Admin, Super Admin, Teacher, and Staff. |
| `/api/reports/attendance` and `/api/reports/grades` | Admin, Super Admin, and Teacher only. |
| Report exports | Admin and Super Admin only. |

## Browser QA Checklist

1. Log in as each account above.
2. Confirm the sidebar shows only the pages listed in this matrix.
3. Try direct URLs for hidden pages, such as `/admins`, `/audit-logs`, `/attendance`, `/grades`, and `/institution/staff`.
4. Confirm blocked pages redirect to the dashboard or their safe list page.
5. Confirm Staff users see view-only controls where applicable: no Add Course, no institution create form, no Edit/Delete course actions, and no attendance/grade pages.
6. Confirm Admission Officer and Office Clerk can open student create/edit pages, while Librarian, Accountant, Lab Assistant, and Teacher cannot.
7. Confirm Teacher can open attendance and grades, but receives clear backend errors when using an unassigned course or a non-enrolled student-course pair.

## Postman QA Checklist

1. `POST /api/auth/login` with one test account and copy the returned token.
2. Add `Authorization: Bearer <token>` to all requests.
3. For Staff, verify `POST /api/attendance/mark` returns 403 with `Academic access requires an admin or teaching staff account`.
4. For Staff, verify `POST /api/catalog/departments` returns 403 with `Admin access required`.
5. For Admin, verify `GET /api/admins` returns 403 with `Super Admin access required`.
6. For Teacher, verify `POST /api/catalog/departments` returns 403 with `Admin access required`.
7. For Admission Officer, verify `POST /api/students` is allowed past authorization and then fails only on validation if the body is incomplete.
8. For Lab Assistant, verify `GET /api/reports/students` returns 200 but `GET /api/reports/grades` returns 403.
