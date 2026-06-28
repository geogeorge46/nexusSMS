#!/usr/bin/env node

import 'dotenv/config'

import { connectDatabase, disconnectDatabase } from '../server/config/db.js'
import { env, validateRuntimeEnv } from '../server/config/env.js'
import { AcademicYear } from '../server/models/AcademicYear.js'
import { Attendance } from '../server/models/Attendance.js'
import { AuditLog } from '../server/models/AuditLog.js'
import { Course } from '../server/models/Course.js'
import { CourseAssignment } from '../server/models/CourseAssignment.js'
import { Department } from '../server/models/Department.js'
import { Grade } from '../server/models/Grade.js'
import { Notification } from '../server/models/Notification.js'
import { Program } from '../server/models/Program.js'
import { Semester } from '../server/models/Semester.js'
import { Staff } from '../server/models/Staff.js'
import { Student } from '../server/models/Student.js'
import { StudentCourse } from '../server/models/StudentCourse.js'
import { StudentDocument } from '../server/models/StudentDocument.js'
import { User } from '../server/models/User.js'
import { createResource } from '../server/services/catalogService.js'
import { createGrade } from '../server/services/gradeService.js'
import { markAttendance } from '../server/services/attendanceService.js'
import { hashPassword } from '../server/services/passwordService.js'
import { assertSafeSeed } from './seedSafety.js'

const testOnly = process.argv.includes('--test-only')
const password = 'Teacher@12345'
const studentPassword = 'Student@12345'
const summary = {
  seeded: 0,
  validChecks: 0,
  invalidRejected: 0,
  failures: [],
}

const ctx = {}

try {
  assertSafeSeed(testOnly ? 'test:constraints' : 'seed:constraints')
  validateRuntimeEnv()
  await connectDatabase(env.mongoUri)
  await seedBaseline()
  await runConstraintTests()
  printSummary()
  if (summary.failures.length > 0) process.exitCode = 1
} catch (error) {
  console.error('Constraint seed/test failed:')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await disconnectDatabase()
}

async function seedBaseline() {
  ctx.departments = await keyed([
    ['CA', Department, { code: 'CA' }, { code: 'CA', name: 'Computer Applications', description: 'MCA and integrated computer application programs', status: 'Active' }],
    ['CSE', Department, { code: 'CSE' }, { code: 'CSE', name: 'Computer Science Engineering', description: 'Engineering computing and systems programs', status: 'Active' }],
    ['COM', Department, { code: 'COM' }, { code: 'COM', name: 'Commerce', description: 'Accounting, business law, and finance programs', status: 'Active' }],
    ['MGT', Department, { code: 'MGT' }, { code: 'MGT', name: 'Management', description: 'Business administration and management studies', status: 'Active' }],
    ['OAD', Department, { code: 'OAD' }, { code: 'OAD', name: 'Office Administration', description: 'Administrative and operational support department', status: 'Active' }],
  ])

  ctx.programs = await keyed([
    ['IMCA', Program, { code: 'IMCA' }, { code: 'IMCA', name: 'Integrated MCA', departmentId: ctx.departments.CA._id, level: 'Integrated Postgraduate', durationSemesters: 10, status: 'Active' }],
    ['MCA', Program, { code: 'MCA' }, { code: 'MCA', name: 'MCA', departmentId: ctx.departments.CA._id, level: 'Postgraduate', durationSemesters: 4, status: 'Active' }],
    ['BTECH-CSE-CON', Program, { code: 'BTECH-CSE-CON' }, { code: 'BTECH-CSE-CON', name: 'B.Tech CSE', departmentId: ctx.departments.CSE._id, level: 'Undergraduate', durationSemesters: 8, status: 'Active' }],
    ['BCOM', Program, { code: 'BCOM' }, { code: 'BCOM', name: 'B.Com', departmentId: ctx.departments.COM._id, level: 'Undergraduate', durationSemesters: 6, status: 'Active' }],
    ['BBA', Program, { code: 'BBA' }, { code: 'BBA', name: 'BBA', departmentId: ctx.departments.MGT._id, level: 'Undergraduate', durationSemesters: 6, status: 'Active' }],
  ])

  ctx.years = await keyed([
    ['AY25', AcademicYear, { name: '2025-2026' }, { name: '2025-2026', startDate: date('2025-07-01'), endDate: date('2026-06-30'), status: 'Inactive' }],
    ['AY26', AcademicYear, { name: '2026-2027' }, { name: '2026-2027', startDate: date('2026-07-01'), endDate: date('2027-06-30'), status: 'Active' }],
  ])

  ctx.semesters = {}
  for (let number = 1; number <= 10; number += 1) {
    ctx.semesters[`S${number}`] = await upsert(Semester, { academicYearId: ctx.years.AY26._id, number }, {
      name: `Semester ${number}`,
      number,
      academicYearId: ctx.years.AY26._id,
      startDate: date(number % 2 ? '2026-07-01' : '2027-01-05'),
      endDate: date(number % 2 ? '2026-12-15' : '2027-05-25'),
      status: 'Active',
    })
  }

  ctx.users = await seedUsers()
  ctx.staff = await seedStaff()
  ctx.courses = await seedCourses()
  ctx.students = await seedStudents()
  await seedStudentUsers()
  await seedAssignments()
  await seedEnrollments()
  await seedAttendance()
  await seedGrades()
  await seedDocuments()
  await seedNotifications()
  await seedAuditLogs()
}

async function seedUsers() {
  const { salt, hash } = await hashPassword(password)
  const rows = [
    ['java', 'Java Faculty', 'constraint.java.faculty@nexus.local', 'Teacher'],
    ['dbms', 'DBMS Faculty', 'constraint.dbms.faculty@nexus.local', 'Teacher'],
    ['ds', 'Data Structures Faculty', 'constraint.ds.faculty@nexus.local', 'Teacher'],
    ['ai', 'AI/ML Faculty', 'constraint.ai.faculty@nexus.local', 'Teacher'],
    ['math', 'Mathematics Faculty', 'constraint.math.faculty@nexus.local', 'Teacher'],
    ['commerce', 'Commerce Faculty', 'constraint.commerce.faculty@nexus.local', 'Teacher'],
    ['management', 'Management Faculty', 'constraint.management.faculty@nexus.local', 'Teacher'],
    ['librarian', 'Librarian', 'constraint.librarian@nexus.local', 'Staff'],
    ['accountant', 'Accountant', 'constraint.accountant@nexus.local', 'Staff'],
    ['lab', 'Lab Assistant', 'constraint.lab.assistant@nexus.local', 'Staff'],
    ['office', 'Office Clerk', 'constraint.office.clerk@nexus.local', 'Staff'],
    ['admission', 'Admission Officer', 'constraint.admission.officer@nexus.local', 'Staff'],
  ]

  return Object.fromEntries(await Promise.all(rows.map(async ([key, name, email, role]) => {
    const user = await upsert(User, { email }, { name, email, passwordHash: hash, passwordSalt: salt, role, status: 'Active' })
    return [key, user]
  })))
}

async function seedStaff() {
  const rows = [
    ['java', 'CON-FAC-001', 'Java Faculty', 'constraint.java.faculty@nexus.local', 'Teaching', 'CA', 'Assistant Professor', 'java', 'Active'],
    ['dbms', 'CON-FAC-002', 'DBMS Faculty', 'constraint.dbms.faculty@nexus.local', 'Teaching', 'CA', 'Associate Professor', 'dbms', 'Active'],
    ['ds', 'CON-FAC-003', 'Data Structures Faculty', 'constraint.ds.faculty@nexus.local', 'Teaching', 'CA', 'Assistant Professor', 'ds', 'Active'],
    ['ai', 'CON-FAC-004', 'AI/ML Faculty', 'constraint.ai.faculty@nexus.local', 'Teaching', 'CSE', 'Professor', 'ai', 'Active'],
    ['math', 'CON-FAC-005', 'Mathematics Faculty', 'constraint.math.faculty@nexus.local', 'Teaching', 'CSE', 'Assistant Professor', 'math', 'Active'],
    ['commerce', 'CON-FAC-006', 'Commerce Faculty', 'constraint.commerce.faculty@nexus.local', 'Teaching', 'COM', 'Assistant Professor', 'commerce', 'Active'],
    ['management', 'CON-FAC-007', 'Management Faculty', 'constraint.management.faculty@nexus.local', 'Teaching', 'MGT', 'Professor', 'management', 'Active'],
    ['inactiveTeacher', 'CON-FAC-008', 'Inactive Faculty', 'constraint.inactive.faculty@nexus.local', 'Teaching', 'CA', 'Adjunct Faculty', undefined, 'Inactive'],
    ['librarian', 'CON-NT-001', 'Librarian', 'constraint.librarian@nexus.local', 'Non-Teaching', 'OAD', 'Librarian', 'librarian', 'Active'],
    ['accountant', 'CON-NT-002', 'Accountant', 'constraint.accountant@nexus.local', 'Non-Teaching', 'OAD', 'Accountant', 'accountant', 'Active'],
    ['lab', 'CON-NT-003', 'Lab Assistant', 'constraint.lab.assistant@nexus.local', 'Non-Teaching', 'CA', 'Lab Assistant', 'lab', 'Active'],
    ['office', 'CON-NT-004', 'Office Clerk', 'constraint.office.clerk@nexus.local', 'Non-Teaching', 'OAD', 'Office Clerk', 'office', 'Active'],
    ['admission', 'CON-NT-005', 'Admission Officer', 'constraint.admission.officer@nexus.local', 'Non-Teaching', 'OAD', 'Admission Officer', 'admission', 'Active'],
  ]

  return Object.fromEntries(await Promise.all(rows.map(async ([key, employeeNumber, name, email, category, departmentKey, designation, userKey, status]) => {
    const staff = await upsert(Staff, { employeeNumber }, {
      employeeNumber,
      name,
      email,
      phone: `+91 99000 ${String(summary.seeded + 10000).slice(-5)}`,
      category,
      departmentId: ctx.departments[departmentKey]._id,
      userId: userKey ? ctx.users[userKey]._id : undefined,
      designation,
      status,
    })
    return [key, staff]
  })))
}

async function seedCourses() {
  const rows = [
    ['C-PROG', 'CON-CRS-001', 'Programming in C', 'CON-C101', 'CA', 'IMCA', 'S1', 'java', 4, 60, 'Mon 09:00-10:00', 'CA Lab 1'],
    ['JAVA', 'CON-CRS-002', 'Java Programming', 'CON-C102', 'CA', 'MCA', 'S1', 'java', 4, 50, 'Tue 10:00-11:00', 'CA Lab 2'],
    ['DS', 'CON-CRS-003', 'Data Structures', 'CON-C201', 'CA', 'IMCA', 'S2', 'ds', 4, 60, 'Wed 09:00-10:00', 'CA Lab 1'],
    ['DBMS', 'CON-CRS-004', 'Database Management Systems', 'CON-C202', 'CA', 'MCA', 'S2', 'dbms', 4, 50, 'Thu 11:00-12:00', 'DB Lab'],
    ['OS', 'CON-CRS-005', 'Operating Systems', 'CON-C301', 'CA', 'IMCA', 'S3', 'ds', 3, 60, 'Fri 09:00-10:00', 'Room 301'],
    ['WEB', 'CON-CRS-006', 'Web Technologies', 'CON-C401', 'CA', 'MCA', 'S3', 'java', 3, 45, 'Mon 12:00-01:00', 'Web Lab'],
    ['AI', 'CON-CRS-007', 'Artificial Intelligence', 'CON-C501', 'CSE', 'BTECH-CSE-CON', 'S5', 'ai', 4, 50, 'Tue 02:00-03:00', 'AI Lab'],
    ['ML', 'CON-CRS-008', 'Machine Learning', 'CON-C502', 'CSE', 'BTECH-CSE-CON', 'S6', 'ai', 4, 45, 'Wed 02:00-03:00', 'AI Lab'],
    ['CLOUD', 'CON-CRS-009', 'Cloud Computing', 'CON-C601', 'CA', 'MCA', 'S4', 'dbms', 3, 40, 'Thu 02:00-03:00', 'Cloud Lab'],
    ['MATH', 'CON-CRS-010', 'Engineering Mathematics', 'CON-E101', 'CSE', 'BTECH-CSE-CON', 'S1', 'math', 4, 70, 'Mon 11:00-12:00', 'Room 101'],
    ['NETWORKS', 'CON-CRS-011', 'Computer Networks', 'CON-E301', 'CSE', 'BTECH-CSE-CON', 'S4', 'ai', 3, 60, 'Tue 09:00-10:00', 'Room 401'],
    ['SE', 'CON-CRS-012', 'Software Engineering', 'CON-E401', 'CSE', 'BTECH-CSE-CON', 'S5', 'ai', 3, 60, 'Wed 10:00-11:00', 'Room 402'],
    ['COMPILER', 'CON-CRS-013', 'Compiler Design', 'CON-E501', 'CSE', 'BTECH-CSE-CON', 'S6', 'ai', 4, 50, 'Fri 10:00-11:00', 'Room 403'],
    ['FA', 'CON-CRS-014', 'Financial Accounting', 'CON-B101', 'COM', 'BCOM', 'S1', 'commerce', 4, 80, 'Mon 10:00-11:00', 'Commerce 1'],
    ['BLAW', 'CON-CRS-015', 'Business Law', 'CON-B201', 'COM', 'BCOM', 'S2', 'commerce', 3, 80, 'Tue 11:00-12:00', 'Commerce 2'],
    ['COST', 'CON-CRS-016', 'Cost Accounting', 'CON-B301', 'COM', 'BCOM', 'S3', 'commerce', 4, 70, 'Wed 11:00-12:00', 'Commerce 3'],
    ['POM', 'CON-CRS-017', 'Principles of Management', 'CON-M101', 'MGT', 'BBA', 'S1', 'management', 3, 70, 'Mon 01:00-02:00', 'Management 1'],
    ['MARKETING', 'CON-CRS-018', 'Marketing Management', 'CON-M201', 'MGT', 'BBA', 'S2', 'management', 3, 70, 'Tue 01:00-02:00', 'Management 2'],
    ['HRM', 'CON-CRS-019', 'Human Resource Management', 'CON-M301', 'MGT', 'BBA', 'S3', 'management', 3, 70, 'Wed 01:00-02:00', 'Management 3'],
    ['CAP1', 'CON-CRS-020', 'Capacity Test Lab', 'CON-CAP1', 'CA', 'IMCA', 'S1', 'java', 1, 1, 'Fri 03:00-04:00', 'CA Lab 9'],
    ['INACTIVE', 'CON-CRS-021', 'Inactive Elective', 'CON-INACT', 'CA', 'IMCA', 'S1', 'java', 1, 20, 'Fri 04:00-05:00', 'CA Lab 9'],
  ]

  return Object.fromEntries(await Promise.all(rows.map(async ([key, courseNumber, title, code, departmentKey, programKey, semesterKey, facultyKey, credits, capacity, schedule, room]) => {
    const course = await upsert(Course, { code }, {
      courseNumber,
      title,
      code,
      department: ctx.departments[departmentKey].name,
      program: ctx.programs[programKey].name,
      faculty: ctx.staff[facultyKey].name,
      departmentId: ctx.departments[departmentKey]._id,
      programId: ctx.programs[programKey]._id,
      semesterId: ctx.semesters[semesterKey]._id,
      facultyStaffId: ctx.staff[facultyKey]._id,
      credits,
      status: key === 'INACTIVE' ? 'Inactive' : 'Active',
      enrolled: 0,
      capacity,
      schedule,
      room,
      semester: ctx.semesters[semesterKey].name,
      description: `${title} seeded for institutional constraint testing.`,
    })
    return [key, course]
  })))
}

async function seedStudents() {
  const rows = [
    ['CON-STU-0001', 'Ananya Krishnan', 'constraint.student.0001@nexus.local', 'CA', 'IMCA', 'S1', 'Active'],
    ['CON-STU-0002', 'Rohan Menon', 'constraint.student.0002@nexus.local', 'CA', 'IMCA', 'S1', 'Active'],
    ['CON-STU-0003', 'Meera Joseph', 'constraint.student.0003@nexus.local', 'CA', 'MCA', 'S1', 'Active'],
    ['CON-STU-0004', 'Aditya Nair', 'constraint.student.0004@nexus.local', 'CSE', 'BTECH-CSE-CON', 'S1', 'Active'],
    ['CON-STU-0005', 'Sara Mathew', 'constraint.student.0005@nexus.local', 'COM', 'BCOM', 'S1', 'Pending'],
    ['CON-STU-0006', 'Farhan Ali', 'constraint.student.0006@nexus.local', 'MGT', 'BBA', 'S1', 'Review'],
    ['CON-STU-0007', 'Kavya Rao', 'constraint.student.0007@nexus.local', 'CA', 'IMCA', 'S2', 'Active'],
    ['CON-STU-0008', 'Nikhil Das', 'constraint.student.0008@nexus.local', 'CA', 'IMCA', 'S1', 'Inactive'],
  ]

  return Object.fromEntries(await Promise.all(rows.map(async ([registerNumber, name, email, departmentKey, programKey, semesterKey, status], index) => {
    const student = await upsert(Student, { registerNumber }, {
      registerNumber,
      name,
      email,
      program: ctx.programs[programKey].name,
      department: ctx.departments[departmentKey].name,
      year: ctx.years.AY26.name,
      departmentId: ctx.departments[departmentKey]._id,
      programId: ctx.programs[programKey]._id,
      academicYearId: ctx.years.AY26._id,
      semesterId: ctx.semesters[semesterKey]._id,
      batch: ctx.semesters[semesterKey].name,
      status,
      attendance: 75 + index * 3,
      gpa: Math.min(4, 2.6 + index * 0.15),
      advisor: index % 2 ? ctx.staff.dbms.name : ctx.staff.java.name,
      phone: `+91 98000 10${String(index + 1).padStart(3, '0')}`,
      address: `Constraint Demo Address ${index + 1}, Nexus Campus`,
      guardianName: `Constraint Guardian ${index + 1}`,
      guardianPhone: `+91 97000 20${String(index + 1).padStart(3, '0')}`,
      emergencyContact: `+91 96000 30${String(index + 1).padStart(3, '0')}`,
      bloodGroup: ['A+', 'B+', 'O+', 'AB+'][index % 4],
      skills: ['Collaboration', 'Problem Solving'],
      achievements: status === 'Active' ? ['Portal seed profile completed'] : [],
      enrolledAt: date('2026-07-01'),
    })
    return [registerNumber, student]
  })))
}

async function seedStudentUsers() {
  const { salt, hash } = await hashPassword(studentPassword)
  const students = [
    ctx.students['CON-STU-0001'],
    ctx.students['CON-STU-0002'],
    ctx.students['CON-STU-0005'],
    ctx.students['CON-STU-0006'],
    ctx.students['CON-STU-0008'],
  ]

  await Promise.all(students.map((student) => upsert(User, { email: student.email }, {
    name: student.name,
    email: student.email,
    passwordHash: hash,
    passwordSalt: salt,
    role: 'Student',
    studentId: student._id,
    status: student.status === 'Inactive' ? 'Suspended' : 'Active',
  })))
}

async function seedAssignments() {
  const rows = [
    ['C-PROG', 'java', 'Primary'], ['C-PROG', 'dbms', 'Assistant'], ['JAVA', 'java', 'Primary'],
    ['DS', 'ds', 'Primary'], ['DBMS', 'dbms', 'Primary'], ['OS', 'ds', 'Primary'],
    ['WEB', 'java', 'Primary'], ['CLOUD', 'dbms', 'Primary'], ['AI', 'ai', 'Primary'],
    ['ML', 'ai', 'Primary'], ['MATH', 'math', 'Primary'], ['NETWORKS', 'ai', 'Primary'],
    ['SE', 'ai', 'Primary'], ['COMPILER', 'ai', 'Primary'], ['FA', 'commerce', 'Primary'],
    ['BLAW', 'commerce', 'Primary'], ['COST', 'commerce', 'Primary'], ['POM', 'management', 'Primary'],
    ['MARKETING', 'management', 'Primary'], ['HRM', 'management', 'Primary'], ['CAP1', 'java', 'Primary'],
  ]
  await Promise.all(rows.map(([courseKey, staffKey, role]) => upsert(CourseAssignment, assignmentKey(courseKey, staffKey), assignmentValue(courseKey, staffKey, role))))
}

async function seedEnrollments() {
  const rows = [
    ['CON-STU-0001', 'C-PROG'], ['CON-STU-0001', 'CAP1'], ['CON-STU-0002', 'C-PROG'],
    ['CON-STU-0003', 'JAVA'], ['CON-STU-0004', 'MATH'], ['CON-STU-0005', 'FA'],
    ['CON-STU-0006', 'POM'], ['CON-STU-0007', 'DS'],
  ]
  await Promise.all(rows.map(([studentKey, courseKey]) => upsert(StudentCourse, enrollmentKey(studentKey, courseKey), enrollmentValue(studentKey, courseKey))))
  await Promise.all(Object.values(ctx.courses).map(async (course) => {
    const enrolled = await StudentCourse.countDocuments({ courseId: course._id, status: 'Enrolled' })
    await Course.findByIdAndUpdate(course._id, { $set: { enrolled } })
  }))
}

async function seedAttendance() {
  const rows = [
    ['CON-STU-0001', 'C-PROG', '2026-07-06', 'Present'], ['CON-STU-0002', 'C-PROG', '2026-07-06', 'Late'],
    ['CON-STU-0003', 'JAVA', '2026-07-06', 'Excused'], ['CON-STU-0004', 'MATH', '2026-07-06', 'Present'],
    ['CON-STU-0005', 'FA', '2026-07-06', 'Absent'], ['CON-STU-0006', 'POM', '2026-07-06', 'Present'],
    ['CON-STU-0007', 'DS', '2026-07-06', 'Present'],
  ]
  await Promise.all(rows.map(([studentKey, courseKey, value, status]) => upsert(Attendance, {
    studentId: ctx.students[studentKey]._id,
    courseId: ctx.courses[courseKey]._id,
    date: day(value),
  }, {
    studentId: ctx.students[studentKey]._id,
    courseId: ctx.courses[courseKey]._id,
    date: day(value),
    status,
    remarks: `${status} seeded for constraint test`,
    markedBy: { userId: 'constraint-seed', name: 'Constraint Seed Admin', role: 'Super Admin' },
  })))
}

async function seedGrades() {
  const rows = [
    ['CON-STU-0001', 'C-PROG', 'Internal 1', 42, 50], ['CON-STU-0002', 'C-PROG', 'Assignment', 36, 50],
    ['CON-STU-0003', 'JAVA', 'Project', 88, 100], ['CON-STU-0004', 'MATH', 'Internal 2', 39, 50],
    ['CON-STU-0005', 'FA', 'Final Exam', 72, 100], ['CON-STU-0006', 'POM', 'Assignment', 44, 50],
    ['CON-STU-0007', 'DS', 'Internal 1', 45, 50],
  ]
  await Promise.all(rows.map(([studentKey, courseKey, assessmentType, marksObtained, maxMarks]) => {
    const percentage = Math.round((marksObtained / maxMarks) * 10000) / 100
    return upsert(Grade, {
      studentId: ctx.students[studentKey]._id,
      courseId: ctx.courses[courseKey]._id,
      assessmentType,
      semester: 'Semester 1',
    }, {
      studentId: ctx.students[studentKey]._id,
      courseId: ctx.courses[courseKey]._id,
      assessmentType,
      marksObtained,
      maxMarks,
      percentage,
      gradeLetter: gradeLetter(percentage),
      semester: 'Semester 1',
      remarks: 'Seeded assessment record',
      createdBy: { userId: 'constraint-seed', name: 'Constraint Seed Admin', role: 'Super Admin' },
    })
  }))
}

async function seedDocuments() {
  const types = ['Identity', 'Academic', 'Financial', 'Medical', 'Consent', 'Transfer', 'Other']
  await Promise.all(types.map((documentType, index) => {
    const student = Object.values(ctx.students)[index % Object.values(ctx.students).length]
    const checksum = `constraint-${student.registerNumber}-${documentType}`.toLowerCase()
    return upsert(StudentDocument, { checksum }, {
      studentId: student._id,
      studentName: student.name,
      registerNumber: student.registerNumber,
      documentType,
      title: `${documentType} Document`,
      fileName: `${checksum}.pdf`,
      mimeType: 'application/pdf',
      fileSize: 128000 + index * 1000,
      cloudinaryPublicId: `constraint/${checksum}`,
      cloudinaryAssetId: `asset-${checksum}`,
      resourceType: 'raw',
      fileUrl: `https://res.cloudinary.com/demo/raw/upload/constraint/${checksum}.pdf`,
      downloadUrl: `https://res.cloudinary.com/demo/raw/upload/fl_attachment/constraint/${checksum}.pdf`,
      checksum,
      scanStatus: 'passed',
      uploadedBy: 'Constraint Seed Admin',
      uploadedAt: date('2026-07-02'),
    })
  }))
}

async function seedNotifications() {
  const rows = [
    ['Admin constraint summary', 'Admin can review all seeded institutional constraints.', 'info', 'Super Admin'],
    ['Teacher course assignment', 'Teaching staff can see assigned academic workflows.', 'success', 'Teacher'],
    ['Student enrollment notice', 'Student course enrollment is ready for attendance and grades.', 'info', 'Student'],
    ['Staff operational notice', 'Non-teaching staff are seeded for operational role testing.', 'system', 'Staff'],
  ]
  await Promise.all(rows.map(([title, message, type, role]) => upsert(Notification, { title, 'recipient.role': role }, {
    title,
    message,
    type,
    recipient: { userId: '', role },
    sender: { userId: 'constraint-seed', name: 'Constraint Seed Admin', role: 'System' },
    isRead: role === 'Staff',
  })))
}

async function seedAuditLogs() {
  const rows = [
    ['STUDENT_CREATE', 'Students', 'Constraint seed created students'],
    ['COURSE_CREATE', 'Courses', 'Constraint seed created courses'],
    ['STAFF_CREATE', 'Staff', 'Constraint seed created staff'],
    ['COURSE_ASSIGNMENT_CREATE', 'CourseAssignments', 'Constraint seed assigned courses'],
    ['STUDENT_COURSE_ENROLL', 'StudentCourses', 'Constraint seed enrolled students'],
    ['ATTENDANCE_MARK', 'Attendance', 'Constraint seed marked attendance'],
    ['GRADE_CREATE', 'Grades', 'Constraint seed added grades'],
    ['DOCUMENT_UPLOAD', 'Documents', 'Constraint seed uploaded document metadata'],
  ]
  await Promise.all(rows.map(([action, module, description], index) => upsert(AuditLog, { action, description }, {
    user: 'constraint.seed@nexus.local',
    role: 'Super Admin',
    action,
    module,
    description,
    ipAddress: '127.0.0.1',
    browser: 'Constraint Seed Script',
    device: 'Local Development',
    metadata: { seed: 'constraints', testOnly },
    timestamp: new Date(Date.now() - index * 60_000),
  })))
}

async function runConstraintTests() {
  await valid('seeded departments exist', () => assertCount(Department, { code: { $in: ['CA', 'CSE', 'COM', 'MGT', 'OAD'] } }, 5))
  await valid('seeded programs belong to departments', async () => {
    const count = await Program.countDocuments({ code: { $in: ['IMCA', 'MCA', 'BTECH-CSE-CON', 'BCOM', 'BBA'] }, departmentId: { $exists: true } })
    if (count !== 5) throw new Error(`Expected 5 programs with departmentId, found ${count}`)
  })
  await valid('active courses have program, department, semester, and capacity', async () => {
    const broken = await Course.countDocuments({ code: /^CON-/, $or: [{ departmentId: null }, { programId: null }, { semesterId: null }, { capacity: { $lte: 0 } }] })
    if (broken) throw new Error(`${broken} seeded courses are missing required academic references`)
  })
  await valid('attendance records target enrolled student-course pairs', async () => {
    const attendance = await Attendance.find({ remarks: /constraint test/i }).lean()
    for (const record of attendance) {
      const enrollment = await StudentCourse.exists({ studentId: record.studentId, courseId: record.courseId, status: 'Enrolled' })
      if (!enrollment) throw new Error('Attendance record exists for a non-enrolled pair')
    }
  })
  await valid('grades derive percentage and letter from marks', async () => {
    const grade = await Grade.findOne({ assessmentType: 'Internal 1', studentId: ctx.students['CON-STU-0001']._id }).lean()
    if (!grade || grade.percentage !== 84 || grade.gradeLetter !== 'A') throw new Error('Grade derivation is incorrect')
  })

  await reject('program under invalid department fails', () => createResource('programs', { name: 'Invalid Program', code: 'CON-BAD-PROG', departmentId: '000000000000000000000000', durationSemesters: 4 }))
  await reject('course assignment rejects non-teaching staff', () => createResource('courseassignments', assignmentPayload('C-PROG', 'lab')))
  await reject('course assignment rejects wrong department teacher', () => createResource('courseassignments', assignmentPayload('C-PROG', 'management')))
  await reject('course assignment rejects inactive staff', () => createResource('courseassignments', assignmentPayload('C-PROG', 'inactiveTeacher')))
  await reject('course assignment rejects duplicate assignment', () => createResource('courseassignments', assignmentPayload('C-PROG', 'java')))
  await reject('student enrollment rejects another program', () => createResource('studentcourses', enrollmentPayload('CON-STU-0001', 'MATH')))
  await reject('student enrollment rejects another semester', () => createResource('studentcourses', enrollmentPayload('CON-STU-0001', 'DS')))
  await reject('student enrollment rejects inactive student', () => createResource('studentcourses', enrollmentPayload('CON-STU-0008', 'C-PROG')))
  await reject('student enrollment rejects full course capacity', () => createResource('studentcourses', enrollmentPayload('CON-STU-0002', 'CAP1')))
  await reject('student enrollment rejects duplicate enrollment', () => createResource('studentcourses', enrollmentPayload('CON-STU-0001', 'C-PROG')))
  await reject('student enrollment rejects inactive course', () => createResource('studentcourses', enrollmentPayload('CON-STU-0002', 'INACTIVE')))
  await reject('attendance rejects non-enrolled course', () => markAttendance({ studentId: ctx.students['CON-STU-0001']._id, courseId: ctx.courses.MATH._id, date: '2026-07-07', status: 'Present' }, adminUser()))
  await reject('attendance rejects duplicate student/course/date', () => markAttendance({ studentId: ctx.students['CON-STU-0001']._id, courseId: ctx.courses['C-PROG']._id, date: '2026-07-06', status: 'Present' }, adminUser()))
  await reject('attendance rejects non-assigned teacher', () => markAttendance({ studentId: ctx.students['CON-STU-0001']._id, courseId: ctx.courses['C-PROG']._id, date: '2026-07-08', status: 'Present' }, teacherUser('management')))
  await reject('attendance rejects non-teaching staff', () => markAttendance({ studentId: ctx.students['CON-STU-0001']._id, courseId: ctx.courses['C-PROG']._id, date: '2026-07-08', status: 'Present' }, staffUser('lab')))
  await reject('grade rejects non-enrolled course', () => createGrade({ studentId: ctx.students['CON-STU-0001']._id, courseId: ctx.courses.MATH._id, assessmentType: 'Internal 2', marksObtained: 20, maxMarks: 50, semester: 'Semester 1' }, adminUser()))
  await reject('grade rejects marks above max marks', () => createGrade({ studentId: ctx.students['CON-STU-0001']._id, courseId: ctx.courses['C-PROG']._id, assessmentType: 'Internal 2', marksObtained: 51, maxMarks: 50, semester: 'Semester 1' }, adminUser()))
  await reject('grade rejects negative marks', () => createGrade({ studentId: ctx.students['CON-STU-0001']._id, courseId: ctx.courses['C-PROG']._id, assessmentType: 'Internal 2', marksObtained: -1, maxMarks: 50, semester: 'Semester 1' }, adminUser()))
  await reject('grade rejects duplicate assessment', () => createGrade({ studentId: ctx.students['CON-STU-0001']._id, courseId: ctx.courses['C-PROG']._id, assessmentType: 'Internal 1', marksObtained: 40, maxMarks: 50, semester: 'Semester 1' }, adminUser()))
  await reject('grade rejects non-assigned teacher', () => createGrade({ studentId: ctx.students['CON-STU-0001']._id, courseId: ctx.courses['C-PROG']._id, assessmentType: 'Project', marksObtained: 40, maxMarks: 50, semester: 'Semester 1' }, teacherUser('management')))
  await reject('grade rejects non-teaching staff', () => createGrade({ studentId: ctx.students['CON-STU-0001']._id, courseId: ctx.courses['C-PROG']._id, assessmentType: 'Project', marksObtained: 40, maxMarks: 50, semester: 'Semester 1' }, staffUser('lab')))
  await reject('document rejects invalid document type', () => StudentDocument.create({ ...documentBase(), documentType: 'Passport' }))
  await reject('document rejects negative file size', () => StudentDocument.create({ ...documentBase(), checksum: 'constraint-negative-size', fileSize: -1 }))
  await reject('notification rejects invalid type', () => Notification.create({ title: 'Invalid type', message: 'Invalid', type: 'urgent', recipient: { role: 'Admin' } }))
  await reject('student register number uniqueness is enforced', () => Student.create({ ...ctx.students['CON-STU-0001'].toObject(), _id: undefined, email: 'constraint.duplicate.register@nexus.local' }))
  await reject('course code uniqueness is enforced', () => Course.create({ ...ctx.courses['C-PROG'].toObject(), _id: undefined, courseNumber: 'CON-CRS-DUP' }))
}

async function keyed(entries) {
  return Object.fromEntries(await Promise.all(entries.map(async ([key, Model, filter, values]) => [key, await upsert(Model, filter, values)])))
}

async function upsert(Model, filter, values) {
  const record = await Model.findOneAndUpdate(filter, { $set: values }, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true })
  summary.seeded += 1
  return record
}

async function valid(name, fn) {
  try {
    await fn()
    summary.validChecks += 1
  } catch (error) {
    summary.failures.push({ type: 'valid', name, message: error.message })
  }
}

async function reject(name, fn) {
  try {
    const result = await fn()
    await cleanupUnexpectedResult(result)
    summary.failures.push({ type: 'invalid', name, message: 'Expected rejection but operation succeeded' })
  } catch {
    summary.invalidRejected += 1
  }
}

async function cleanupUnexpectedResult(result) {
  const id = result?._id ?? result?.id
  if (!id || !result?.resource) return
  const models = { studentcourses: StudentCourse, courseassignments: CourseAssignment }
  await models[result.resource]?.findByIdAndDelete(id)
}

async function assertCount(Model, query, expected) {
  const count = await Model.countDocuments(query)
  if (count !== expected) throw new Error(`Expected ${expected}, found ${count}`)
}

function assignmentKey(courseKey, staffKey) {
  return { courseId: ctx.courses[courseKey]._id, staffId: ctx.staff[staffKey]._id, academicYearId: ctx.years.AY26._id, semesterId: ctx.courses[courseKey].semesterId }
}

function assignmentValue(courseKey, staffKey, role) {
  return { ...assignmentKey(courseKey, staffKey), role, status: 'Active' }
}

function assignmentPayload(courseKey, staffKey) {
  return { courseId: ctx.courses[courseKey]._id.toString(), staffId: ctx.staff[staffKey]._id.toString(), academicYearId: ctx.years.AY26._id.toString(), semesterId: ctx.courses[courseKey].semesterId.toString(), role: 'Primary', status: 'Active' }
}

function enrollmentKey(studentKey, courseKey) {
  return { studentId: ctx.students[studentKey]._id, courseId: ctx.courses[courseKey]._id, academicYearId: ctx.years.AY26._id, semesterId: ctx.courses[courseKey].semesterId }
}

function enrollmentValue(studentKey, courseKey) {
  return { ...enrollmentKey(studentKey, courseKey), status: 'Enrolled', enrolledAt: date('2026-07-01') }
}

function enrollmentPayload(studentKey, courseKey) {
  return { studentId: ctx.students[studentKey]._id.toString(), courseId: ctx.courses[courseKey]._id.toString(), academicYearId: ctx.years.AY26._id.toString(), semesterId: ctx.courses[courseKey].semesterId.toString(), status: 'Enrolled' }
}

function adminUser() {
  return { id: 'constraint-admin', name: 'Constraint Admin', email: 'constraint.admin@nexus.local', role: 'Super Admin' }
}

function teacherUser(key) {
  return { id: ctx.users[key]._id.toString(), name: ctx.users[key].name, email: ctx.users[key].email, role: 'Teacher' }
}

function staffUser(key) {
  return { id: ctx.users[key]._id.toString(), name: ctx.users[key].name, email: ctx.users[key].email, role: 'Staff' }
}

function documentBase() {
  const student = ctx.students['CON-STU-0001']
  return {
    studentId: student._id,
    studentName: student.name,
    registerNumber: student.registerNumber,
    documentType: 'Identity',
    title: 'Invalid Test Document',
    fileName: 'invalid-test.pdf',
    mimeType: 'application/pdf',
    fileSize: 100,
    cloudinaryPublicId: 'constraint/invalid-test',
    cloudinaryAssetId: 'asset-invalid-test',
    resourceType: 'raw',
    fileUrl: 'https://res.cloudinary.com/demo/raw/upload/constraint/invalid-test.pdf',
    downloadUrl: 'https://res.cloudinary.com/demo/raw/upload/fl_attachment/constraint/invalid-test.pdf',
    checksum: 'constraint-invalid-test',
    scanStatus: 'passed',
  }
}

function date(value) {
  return new Date(`${value}T00:00:00.000Z`)
}

function day(value) {
  return date(value)
}

function gradeLetter(percentage) {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 75) return 'B+'
  if (percentage >= 70) return 'B'
  if (percentage >= 65) return 'C+'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'D'
  return 'F'
}

function printSummary() {
  console.log(testOnly ? 'Constraint test run complete' : 'Constraint seed and test run complete')
  console.table({
    'records seeded or updated': summary.seeded,
    'valid constraint checks passed': summary.validChecks,
    'invalid constraints correctly rejected': summary.invalidRejected,
    'failed checks': summary.failures.length,
  })
  if (summary.failures.length > 0) console.table(summary.failures)
  console.log(`Seeded identities use CON-* values and constraint.*@nexus.local emails.`)
  console.log(`Teaching demo password: ${password}`)
  console.log(`Student demo password: ${studentPassword}`)
}
