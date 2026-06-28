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
import { hashPassword } from '../server/services/passwordService.js'
import { assertSafeSeed } from './seedSafety.js'

const seedPassword = 'Teacher@12345'
const adminPassword = 'Admin@12345'
const studentPassword = 'Student@12345'
const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase() ?? 'admin@nexus.com'

try {
  assertSafeSeed('seed:institution')
  validateRuntimeEnv()
  await connectDatabase(env.mongoUri)

  const departments = await seedDepartments()
  const programs = await seedPrograms(departments)
  const academicYears = await seedAcademicYears()
  const semesters = await seedSemesters(academicYears)
  await seedAdminUsers()
  const teacherUsers = await seedTeacherUsers()
  const staff = await seedStaff(departments, teacherUsers)
  const courses = await seedCourses(departments, programs, semesters, staff)
  const students = await seedStudents(departments, programs, academicYears, semesters, staff)
  await seedStudentUsers(students)
  await seedCourseAssignments(courses, academicYears, semesters, staff)
  await seedEnrollments(students, courses, academicYears, semesters)
  await syncCourseCounts(courses)
  await seedAttendance(students, courses)
  await seedGrades(students, courses)
  await seedDocuments(students)
  await seedNotifications()
  await seedAuditLogs()

  console.log('Full Nexus SMS demo data ready')
  console.log(`Admin demo accounts: ${adminEmail} and qa.admin@nexus.local`)
  console.log(`Teacher demo password: ${seedPassword}`)
  console.log(`Student demo password: ${studentPassword}`)
} catch (error) {
  console.error('Failed to seed full Nexus SMS demo data:')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await disconnectDatabase()
}

async function seedDepartments() {
  const rows = [
    ['CSE', 'Computer Science Engineering', 'Computing, AI, and software systems'],
    ['ECE', 'Electronics and Communication', 'Embedded systems, communication, and signal processing'],
    ['MGT', 'School of Management', 'Business, finance, operations, and analytics'],
  ]

  return Object.fromEntries(await Promise.all(rows.map(async ([code, name, description]) => {
    const department = await Department.findOneAndUpdate(
      { code },
      { $set: { code, name, description, status: 'Active' } },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    )
    return [code, department]
  })))
}

async function seedPrograms(departments) {
  const rows = [
    { code: 'BTECH-CSE', name: 'B.Tech Computer Science', department: 'CSE', level: 'Undergraduate', durationSemesters: 8 },
    { code: 'BTECH-AIML', name: 'B.Tech Artificial Intelligence', department: 'CSE', level: 'Undergraduate', durationSemesters: 8 },
    { code: 'BTECH-ECE', name: 'B.Tech Electronics', department: 'ECE', level: 'Undergraduate', durationSemesters: 8 },
    { code: 'MBA', name: 'Master of Business Administration', department: 'MGT', level: 'Postgraduate', durationSemesters: 4 },
  ]

  return Object.fromEntries(await Promise.all(rows.map(async (row) => {
    const program = await Program.findOneAndUpdate(
      { code: row.code },
      {
        $set: {
          name: row.name,
          code: row.code,
          departmentId: departments[row.department]._id,
          level: row.level,
          durationSemesters: row.durationSemesters,
          status: 'Active',
        },
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    )
    return [row.code, program]
  })))
}

async function seedAcademicYears() {
  const rows = [
    { name: '2026-2027', startDate: '2026-07-01', endDate: '2027-06-30', status: 'Active' },
    { name: '2025-2026', startDate: '2025-07-01', endDate: '2026-06-30', status: 'Inactive' },
  ]

  return Object.fromEntries(await Promise.all(rows.map(async (row) => {
    const academicYear = await AcademicYear.findOneAndUpdate(
      { name: row.name },
      { $set: { ...row, startDate: new Date(row.startDate), endDate: new Date(row.endDate) } },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    )
    return [row.name, academicYear]
  })))
}

async function seedSemesters(academicYears) {
  const rows = [
    { key: '2026-S1', name: 'Semester 1', number: 1, academicYear: '2026-2027', startDate: '2026-07-01', endDate: '2026-12-15' },
    { key: '2026-S2', name: 'Semester 2', number: 2, academicYear: '2026-2027', startDate: '2027-01-05', endDate: '2027-05-25' },
    { key: '2025-S2', name: 'Semester 2', number: 2, academicYear: '2025-2026', startDate: '2026-01-05', endDate: '2026-05-25' },
  ]

  return Object.fromEntries(await Promise.all(rows.map(async (row) => {
    const semester = await Semester.findOneAndUpdate(
      { academicYearId: academicYears[row.academicYear]._id, number: row.number },
      {
        $set: {
          name: row.name,
          number: row.number,
          academicYearId: academicYears[row.academicYear]._id,
          startDate: new Date(row.startDate),
          endDate: new Date(row.endDate),
          status: row.academicYear === '2026-2027' ? 'Active' : 'Inactive',
        },
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    )
    return [row.key, semester]
  })))
}

async function seedTeacherUsers() {
  const rows = [
    { key: 'ananya', name: 'Dr. Ananya Rao', email: 'ananya.rao@nexus.local', role: 'Teacher' },
    { key: 'kabir', name: 'Prof. Kabir Mehta', email: 'kabir.mehta@nexus.local', role: 'Teacher' },
    { key: 'leela', name: 'Dr. Leela Nair', email: 'leela.nair@nexus.local', role: 'Teacher' },
    { key: 'office', name: 'Ravi Menon', email: 'ravi.menon@nexus.local', role: 'Staff' },
  ]
  const { salt, hash } = await hashPassword(seedPassword)

  return Object.fromEntries(await Promise.all(rows.map(async (row) => {
    const user = await User.findOneAndUpdate(
      { email: row.email },
      {
        $set: {
          name: row.name,
          email: row.email,
          passwordHash: hash,
          passwordSalt: salt,
          role: row.role,
          status: 'Active',
          lastLoginAt: null,
        },
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    )
    return [row.key, user]
  })))
}

async function seedAdminUsers() {
  const { salt, hash } = await hashPassword(adminPassword)
  const rows = [
    { name: 'Nexus Super Admin', email: adminEmail, role: 'Super Admin' },
    { name: 'QA Admin', email: 'qa.admin@nexus.local', role: 'Admin' },
  ]

  await Promise.all(rows.map((row) => User.findOneAndUpdate(
    { email: row.email },
    {
      $set: {
        name: row.name,
        email: row.email,
        passwordHash: hash,
        passwordSalt: salt,
        role: row.role,
        status: 'Active',
        lastLoginAt: null,
      },
    },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  )))
}

async function seedStaff(departments, users) {
  const rows = [
    { key: 'ananya', employeeNumber: 'FAC-1001', name: 'Dr. Ananya Rao', email: 'ananya.rao@nexus.local', phone: '+91 90000 10001', category: 'Teaching', department: 'CSE', designation: 'Assistant Professor', user: 'ananya' },
    { key: 'kabir', employeeNumber: 'FAC-1002', name: 'Prof. Kabir Mehta', email: 'kabir.mehta@nexus.local', phone: '+91 90000 10002', category: 'Teaching', department: 'ECE', designation: 'Associate Professor', user: 'kabir' },
    { key: 'leela', employeeNumber: 'FAC-1003', name: 'Dr. Leela Nair', email: 'leela.nair@nexus.local', phone: '+91 90000 10003', category: 'Teaching', department: 'MGT', designation: 'Professor', user: 'leela' },
    { key: 'ravi', employeeNumber: 'ADM-2001', name: 'Ravi Menon', email: 'ravi.menon@nexus.local', phone: '+91 90000 20001', category: 'Non-Teaching', department: 'CSE', designation: 'Office Executive', user: 'office' },
    { key: 'sara', employeeNumber: 'LIB-2002', name: 'Sara Thomas', email: 'sara.thomas@nexus.local', phone: '+91 90000 20002', category: 'Non-Teaching', department: 'MGT', designation: 'Records Coordinator' },
  ]

  return Object.fromEntries(await Promise.all(rows.map(async (row) => {
    const staff = await Staff.findOneAndUpdate(
      { employeeNumber: row.employeeNumber },
      {
        $set: {
          employeeNumber: row.employeeNumber,
          name: row.name,
          email: row.email,
          phone: row.phone,
          category: row.category,
          departmentId: departments[row.department]._id,
          userId: row.user ? users[row.user]._id : undefined,
          designation: row.designation,
          status: 'Active',
        },
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    )
    return [row.key, staff]
  })))
}

async function seedCourses(departments, programs, semesters, staff) {
  const rows = [
    { key: 'CS101', courseNumber: 'CRS-201', title: 'Programming Fundamentals', code: 'CS101', department: 'CSE', program: 'BTECH-CSE', semester: '2026-S1', faculty: 'ananya', credits: 4, capacity: 60, schedule: 'Mon/Wed 10:00 AM', room: 'Lab 1', description: 'Introductory programming course with hands-on labs.' },
    { key: 'AI201', courseNumber: 'CRS-202', title: 'Machine Learning Foundations', code: 'AI201', department: 'CSE', program: 'BTECH-AIML', semester: '2026-S1', faculty: 'ananya', credits: 4, capacity: 45, schedule: 'Tue/Thu 11:30 AM', room: 'AI Studio', description: 'Core machine learning concepts, model training, and evaluation.' },
    { key: 'EC110', courseNumber: 'CRS-203', title: 'Digital Electronics', code: 'EC110', department: 'ECE', program: 'BTECH-ECE', semester: '2026-S1', faculty: 'kabir', credits: 3, capacity: 50, schedule: 'Mon/Fri 02:00 PM', room: 'Electronics Lab', description: 'Logic gates, combinational circuits, and digital design practice.' },
    { key: 'MG501', courseNumber: 'CRS-204', title: 'Management Analytics', code: 'MG501', department: 'MGT', program: 'MBA', semester: '2026-S1', faculty: 'leela', credits: 3, capacity: 40, schedule: 'Wed/Fri 09:00 AM', room: 'Case Room 2', description: 'Business analytics for management decision-making.' },
  ]

  return Object.fromEntries(await Promise.all(rows.map(async (row) => {
    const course = await Course.findOneAndUpdate(
      { code: row.code },
      {
        $set: {
          courseNumber: row.courseNumber,
          title: row.title,
          code: row.code,
          department: departments[row.department].name,
          program: programs[row.program].name,
          faculty: staff[row.faculty].name,
          departmentId: departments[row.department]._id,
          programId: programs[row.program]._id,
          semesterId: semesters[row.semester]._id,
          facultyStaffId: staff[row.faculty]._id,
          credits: row.credits,
          status: 'Active',
          enrolled: 0,
          capacity: row.capacity,
          schedule: row.schedule,
          room: row.room,
          semester: semesters[row.semester].name,
          description: row.description,
        },
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    )
    return [row.key, course]
  })))
}

async function seedStudents(departments, programs, academicYears, semesters, staff) {
  const rows = [
    { registerNumber: 'STU-1001', name: 'Aarav Sharma', email: 'aarav.sharma@nexus.local', program: 'BTECH-CSE', department: 'CSE', semester: '2026-S1', advisor: 'ananya', phone: '+91 90000 00001', address: 'Nexus Campus Hostel A-104', attendance: 92, gpa: 3.72, status: 'Active', guardianName: 'Meera Sharma', guardianPhone: '+91 90000 90001', emergencyContact: '+91 90000 80001', bloodGroup: 'B+' },
    { registerNumber: 'STU-1002', name: 'Maya Iyer', email: 'maya.iyer@nexus.local', program: 'BTECH-AIML', department: 'CSE', semester: '2026-S1', advisor: 'ananya', phone: '+91 90000 00002', address: '18 Lake View Road, Bengaluru', attendance: 88, gpa: 3.54, status: 'Active', guardianName: 'Raman Iyer', guardianPhone: '+91 90000 90002', emergencyContact: '+91 90000 80002', bloodGroup: 'O+' },
    { registerNumber: 'STU-1003', name: 'Vihaan Reddy', email: 'vihaan.reddy@nexus.local', program: 'BTECH-ECE', department: 'ECE', semester: '2026-S1', advisor: 'kabir', phone: '+91 90000 00003', address: 'Nexus Campus Hostel B-208', attendance: 81, gpa: 3.18, status: 'Active', guardianName: 'Suma Reddy', guardianPhone: '+91 90000 90003', emergencyContact: '+91 90000 80003', bloodGroup: 'A+' },
    { registerNumber: 'STU-1004', name: 'Nisha Kapoor', email: 'nisha.kapoor@nexus.local', program: 'MBA', department: 'MGT', semester: '2026-S1', advisor: 'leela', phone: '+91 90000 00004', address: '42 Market Street, Pune', attendance: 95, gpa: 3.86, status: 'Review', guardianName: 'Arjun Kapoor', guardianPhone: '+91 90000 90004', emergencyContact: '+91 90000 80004', bloodGroup: 'AB+' },
    { registerNumber: 'STU-1005', name: 'Ishaan Verma', email: 'ishaan.verma@nexus.local', program: 'BTECH-CSE', department: 'CSE', semester: '2026-S1', advisor: 'ananya', phone: '+91 90000 00005', address: 'Nexus Campus Hostel C-301', attendance: 76, gpa: 2.94, status: 'Inactive', guardianName: 'Neha Verma', guardianPhone: '+91 90000 90005', emergencyContact: '+91 90000 80005', bloodGroup: 'O-' },
  ]

  return Object.fromEntries(await Promise.all(rows.map(async (row) => {
    const student = await Student.findOneAndUpdate(
      { registerNumber: row.registerNumber },
      {
        $set: {
          registerNumber: row.registerNumber,
          name: row.name,
          email: row.email,
          program: programs[row.program].name,
          department: departments[row.department].name,
          year: academicYears['2026-2027'].name,
          departmentId: departments[row.department]._id,
          programId: programs[row.program]._id,
          academicYearId: academicYears['2026-2027']._id,
          semesterId: semesters[row.semester]._id,
          batch: semesters[row.semester].name,
          status: row.status,
          attendance: row.attendance,
          gpa: row.gpa,
          advisor: staff[row.advisor].name,
          phone: row.phone,
          address: row.address,
          guardianName: row.guardianName,
          guardianPhone: row.guardianPhone,
          emergencyContact: row.emergencyContact,
          bloodGroup: row.bloodGroup,
          skills: ['Communication', 'Problem Solving'],
          achievements: row.status === 'Active' ? ['Orientation completed'] : [],
          enrolledAt: new Date('2026-07-01'),
        },
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    )
    return [row.registerNumber, student]
  })))
}

async function seedStudentUsers(students) {
  const { salt, hash } = await hashPassword(studentPassword)

  await Promise.all(Object.values(students).map((student) => User.findOneAndUpdate(
    { email: student.email },
    {
      $set: {
        name: student.name,
        email: student.email,
        passwordHash: hash,
        passwordSalt: salt,
        role: 'Student',
        studentId: student._id,
        status: student.status === 'Inactive' ? 'Suspended' : 'Active',
        lastLoginAt: null,
      },
    },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  )))
}

async function seedCourseAssignments(courses, academicYears, semesters, staff) {
  const rows = [
    ['CS101', 'ananya', 'Primary'],
    ['AI201', 'ananya', 'Assistant'],
    ['EC110', 'kabir', 'Primary'],
    ['MG501', 'leela', 'Primary'],
  ]

  await Promise.all(rows.map(([courseKey, staffKey, role]) => CourseAssignment.findOneAndUpdate(
    { courseId: courses[courseKey]._id, staffId: staff[staffKey]._id, academicYearId: academicYears['2026-2027']._id, semesterId: semesters['2026-S1']._id },
    { $set: { courseId: courses[courseKey]._id, staffId: staff[staffKey]._id, academicYearId: academicYears['2026-2027']._id, semesterId: semesters['2026-S1']._id, role, status: 'Active' } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  )))
}

async function seedEnrollments(students, courses, academicYears, semesters) {
  const rows = [
    ['STU-1001', 'CS101'], ['STU-1001', 'AI201'],
    ['STU-1002', 'AI201'], ['STU-1002', 'CS101'],
    ['STU-1003', 'EC110'],
    ['STU-1004', 'MG501'],
    ['STU-1005', 'CS101'],
  ]

  await Promise.all(rows.map(([studentKey, courseKey]) => StudentCourse.findOneAndUpdate(
    { studentId: students[studentKey]._id, courseId: courses[courseKey]._id, academicYearId: academicYears['2026-2027']._id, semesterId: semesters['2026-S1']._id },
    { $set: { studentId: students[studentKey]._id, courseId: courses[courseKey]._id, academicYearId: academicYears['2026-2027']._id, semesterId: semesters['2026-S1']._id, status: 'Enrolled', enrolledAt: new Date('2026-07-01') } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  )))
}

async function syncCourseCounts(courses) {
  await Promise.all(Object.values(courses).map(async (course) => {
    const enrolled = await StudentCourse.countDocuments({ courseId: course._id, status: 'Enrolled' })
    await Course.findByIdAndUpdate(course._id, { $set: { enrolled } })
  }))
}

async function seedAttendance(students, courses) {
  const rows = [
    ['STU-1001', 'CS101', '2026-07-06', 'Present', 'On time'],
    ['STU-1002', 'CS101', '2026-07-06', 'Late', 'Arrived during lab briefing'],
    ['STU-1005', 'CS101', '2026-07-06', 'Absent', 'No prior intimation'],
    ['STU-1001', 'AI201', '2026-07-07', 'Present', 'Participated in model discussion'],
    ['STU-1002', 'AI201', '2026-07-07', 'Present', 'Submitted notebook'],
    ['STU-1003', 'EC110', '2026-07-07', 'Excused', 'Medical appointment'],
    ['STU-1004', 'MG501', '2026-07-08', 'Present', 'Case presentation completed'],
  ]

  await Promise.all(rows.map(([studentKey, courseKey, date, status, remarks]) => Attendance.findOneAndUpdate(
    { studentId: students[studentKey]._id, courseId: courses[courseKey]._id, date: day(date) },
    {
      $set: {
        studentId: students[studentKey]._id,
        courseId: courses[courseKey]._id,
        date: day(date),
        status,
        remarks,
        markedBy: { userId: 'seed', name: 'Nexus Seed Admin', role: 'Super Admin' },
      },
    },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  )))
}

async function seedGrades(students, courses) {
  const rows = [
    ['STU-1001', 'CS101', 'Assignment', 46, 50, 'Semester 1', 'Strong algorithmic thinking'],
    ['STU-1002', 'CS101', 'Quiz', 18, 20, 'Semester 1', 'Good command of syntax'],
    ['STU-1005', 'CS101', 'Assignment', 34, 50, 'Semester 1', 'Needs additional lab practice'],
    ['STU-1001', 'AI201', 'Project', 82, 100, 'Semester 1', 'Good model evaluation notes'],
    ['STU-1002', 'AI201', 'Exam', 78, 100, 'Semester 1', 'Solid conceptual understanding'],
    ['STU-1003', 'EC110', 'Quiz', 16, 20, 'Semester 1', 'Careful circuit analysis'],
    ['STU-1004', 'MG501', 'Project', 91, 100, 'Semester 1', 'Excellent business insight'],
  ]

  await Promise.all(rows.map(([studentKey, courseKey, assessmentType, marksObtained, maxMarks, semester, remarks]) => {
    const percentage = Math.round((Number(marksObtained) / Number(maxMarks)) * 10000) / 100

    return Grade.findOneAndUpdate(
      { studentId: students[studentKey]._id, courseId: courses[courseKey]._id, assessmentType, semester },
      {
        $set: {
          studentId: students[studentKey]._id,
          courseId: courses[courseKey]._id,
          assessmentType,
          marksObtained,
          maxMarks,
          percentage,
          gradeLetter: gradeLetter(percentage),
          semester,
          remarks,
          createdBy: { userId: 'seed', name: 'Nexus Seed Admin', role: 'Super Admin' },
        },
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    )
  }))
}

async function seedDocuments(students) {
  const rows = [
    ['STU-1001', 'Identity', 'Aadhaar Verification', 'aarav-identity.pdf', 'application/pdf', 245760],
    ['STU-1001', 'Academic', 'Class XII Transcript', 'aarav-transcript.pdf', 'application/pdf', 368640],
    ['STU-1002', 'Medical', 'Medical Declaration', 'maya-medical.pdf', 'application/pdf', 128000],
    ['STU-1003', 'Consent', 'Lab Safety Consent', 'vihaan-lab-consent.pdf', 'application/pdf', 98000],
    ['STU-1004', 'Financial', 'Fee Receipt', 'nisha-fee-receipt.pdf', 'application/pdf', 156000],
  ]

  await Promise.all(rows.map(([studentKey, documentType, title, fileName, mimeType, fileSize]) => {
    const student = students[studentKey]
    const checksum = `${student.registerNumber}-${documentType}-${fileName}`.toLowerCase().replaceAll(' ', '-')

    return StudentDocument.findOneAndUpdate(
      { checksum },
      {
        $set: {
          studentId: student._id,
          studentName: student.name,
          registerNumber: student.registerNumber,
          documentType,
          title,
          fileName,
          mimeType,
          fileSize,
          cloudinaryPublicId: `nexus-demo/${fileName}`,
          cloudinaryAssetId: `asset-${checksum}`,
          resourceType: 'raw',
          fileUrl: `https://res.cloudinary.com/demo/raw/upload/nexus-demo/${fileName}`,
          downloadUrl: `https://res.cloudinary.com/demo/raw/upload/fl_attachment/nexus-demo/${fileName}`,
          checksum,
          scanStatus: 'passed',
          uploadedBy: 'Nexus Seed Admin',
          uploadedAt: new Date('2026-07-02'),
        },
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    )
  }))
}

async function seedNotifications() {
  const rows = [
    ['Academic calendar ready', 'Semester 1 academic calendar has been published for all active programs.', 'info', false],
    ['Enrollment completed', 'Demo student-course enrollments are ready for attendance and grade workflows.', 'success', false],
    ['Low attendance watchlist', 'One student is below the preferred attendance threshold in Programming Fundamentals.', 'warning', false],
    ['Document scan complete', 'Uploaded sample student documents passed the verification queue.', 'system', true],
  ]
  const studentRows = [
    ['Student academic notice', 'Academic: course enrollment details are available in the student portal.', 'info', false],
    ['Exam cell update', 'Exam: mid-semester exam schedule will be confirmed by the exam cell.', 'warning', false],
    ['Fee reminder', 'Fees: check with accounts for the latest fee/payment status.', 'info', true],
    ['Campus event', 'Events: career readiness week registration opens soon.', 'success', false],
    ['Placement update', 'Placement: resume preparation workshop is scheduled this month.', 'info', true],
    ['Emergency contact reminder', 'Emergency: keep your emergency contact updated in My Profile.', 'system', false],
  ]

  await Promise.all(rows.map(([title, message, type, isRead]) => Notification.findOneAndUpdate(
    { title, 'recipient.role': 'Super Admin' },
    {
      $set: {
        title,
        message,
        type,
        recipient: { userId: '', role: 'Super Admin' },
        sender: { userId: 'system', name: 'Nexus System', role: 'System' },
        isRead,
      },
    },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  )))
  await Promise.all(studentRows.map(([title, message, type, isRead]) => Notification.findOneAndUpdate(
    { title, 'recipient.role': 'Student' },
    {
      $set: {
        title,
        message,
        type,
        recipient: { userId: '', role: 'Student' },
        sender: { userId: 'system', name: 'Nexus System', role: 'System' },
        isRead,
      },
    },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  )))
}

async function seedAuditLogs() {
  const rows = [
    ['LOGIN', 'Auth', 'Geo Admin signed in during demo data setup'],
    ['DEPARTMENT_CREATE', 'Departments', 'Seeded active departments'],
    ['PROGRAM_CREATE', 'Programs', 'Seeded programs under departments'],
    ['STAFF_CREATE', 'Staff', 'Seeded teaching and non-teaching staff'],
    ['COURSE_CREATE', 'Courses', 'Seeded active course catalog'],
    ['STUDENT_CREATE', 'Students', 'Seeded admitted students'],
    ['STUDENT_COURSE_ENROLL', 'StudentCourses', 'Seeded valid course enrollments'],
    ['COURSE_ASSIGNMENT_CREATE', 'CourseAssignments', 'Seeded teaching staff assignments'],
    ['ATTENDANCE_MARK', 'Attendance', 'Seeded attendance records for enrolled students'],
    ['GRADE_CREATE', 'Grades', 'Seeded assessment marks for enrolled students'],
    ['DOCUMENT_UPLOAD', 'Documents', 'Seeded student document records'],
    ['NOTIFICATION_CREATE', 'Notifications', 'Seeded dashboard notifications'],
  ]

  await Promise.all(rows.map(([action, module, description], index) => AuditLog.findOneAndUpdate(
    { action, description },
    {
      $set: {
        user: adminEmail,
        role: 'Super Admin',
        action,
        module,
        description,
        ipAddress: '127.0.0.1',
        browser: 'Seed Script',
        device: 'Local Development',
        metadata: { source: 'seed:institution', order: index + 1 },
        timestamp: new Date(Date.now() - (rows.length - index) * 60_000),
      },
    },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  )))
}

function day(value) {
  return new Date(`${value}T00:00:00.000Z`)
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
