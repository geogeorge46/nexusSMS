import mongoose from 'mongoose'

import { AcademicYear } from '../models/AcademicYear.js'
import { Course } from '../models/Course.js'
import { CourseAssignment } from '../models/CourseAssignment.js'
import { Department } from '../models/Department.js'
import { Program } from '../models/Program.js'
import { Semester } from '../models/Semester.js'
import { Staff } from '../models/Staff.js'
import { Student } from '../models/Student.js'
import { StudentCourse } from '../models/StudentCourse.js'

export function httpError(statusCode, message, details) {
  const error = new Error(message)
  error.statusCode = statusCode
  if (details) error.details = details
  return error
}

export async function resolveDepartment(value, options = {}) {
  const department = await resolveByIdOrFields(Department, value, ['code', 'name'])
  if (!department) {
    if (options.optional) return null
    throw httpError(404, 'Department not found')
  }
  if (options.requireActive !== false && department.status !== 'Active') {
    throw httpError(400, 'Department is not active')
  }
  return department
}

export async function resolveProgram(value, options = {}) {
  const program = await resolveByIdOrFields(Program, value, ['code', 'name'])
  if (!program) {
    if (options.optional) return null
    throw httpError(404, 'Program not found')
  }
  if (options.requireActive !== false && program.status !== 'Active') {
    throw httpError(400, 'Program is not active')
  }
  if (options.departmentId && program.departmentId.toString() !== options.departmentId.toString()) {
    throw httpError(400, 'Program does not belong to the selected department')
  }
  return program
}

export async function resolveAcademicYear(value, options = {}) {
  const academicYear = await resolveByIdOrFields(AcademicYear, value, ['name'])
  if (!academicYear) {
    if (options.optional) return null
    throw httpError(404, 'Academic year not found')
  }
  if (options.requireActive !== false && academicYear.status !== 'Active') {
    throw httpError(400, 'Academic year is not active')
  }
  return academicYear
}

export async function resolveSemester(value, options = {}) {
  const query = buildResolveQuery(value, ['name'])
  if (!query) {
    if (options.optional) return null
    throw httpError(400, 'Semester is required')
  }
  if (Number.isFinite(Number(value))) query.$or.push({ number: Number(value) })
  if (options.academicYearId) query.academicYearId = options.academicYearId

  const semester = await Semester.findOne(query).lean()
  if (!semester) {
    if (options.optional) return null
    throw httpError(404, 'Semester not found')
  }
  if (options.requireActive !== false && semester.status !== 'Active') {
    throw httpError(400, 'Semester is not active')
  }
  return semester
}

export async function resolveStaff(value, options = {}) {
  const staff = await resolveByIdOrFields(Staff, value, ['employeeNumber', 'email', 'name'])
  if (!staff) {
    if (options.optional) return null
    throw httpError(404, 'Staff member not found')
  }
  if (options.requireActive !== false && staff.status !== 'Active') {
    throw httpError(400, 'Staff member is not active')
  }
  if (options.category && staff.category !== options.category) {
    throw httpError(400, `${staff.name} is ${staff.category} staff and cannot be assigned as course faculty`)
  }
  return staff
}

export async function resolveStudent(value) {
  const student = await resolveByIdOrFields(Student, value, ['registerNumber', 'email'])
  if (!student) throw httpError(404, 'Student not found')
  return student
}

export async function resolveCourse(value) {
  const course = await resolveByIdOrFields(Course, value, ['courseNumber', 'code'])
  if (!course) throw httpError(404, 'Course not found')
  return course
}

export async function validateAdmissionScope(payload, options = {}) {
  const departmentValue = payload.departmentId ?? payload.department
  const programValue = payload.programId ?? payload.program
  const academicYearValue = payload.academicYearId ?? payload.academicYear ?? payload.year
  const semesterValue = payload.semesterId ?? payload.semester ?? payload.batch

  if (options.partial && !departmentValue && !programValue && !academicYearValue && !semesterValue) {
    return {}
  }

  const department = await resolveDepartment(departmentValue)
  const program = await resolveProgram(programValue, { departmentId: department._id })
  const academicYear = await resolveAcademicYear(academicYearValue, { optional: options.partial && !academicYearValue })
  const semester = await resolveSemester(semesterValue, {
    academicYearId: academicYear?._id,
    optional: options.partial && !semesterValue,
  })

  return {
    departmentId: department._id,
    programId: program._id,
    academicYearId: academicYear?._id,
    semesterId: semester?._id,
    department: department.name,
    program: program.name,
    year: academicYear?.name,
    batch: semester?.name,
  }
}

export async function validateCourseScope(payload, options = {}) {
  const departmentValue = payload.departmentId ?? payload.department
  const programValue = payload.programId ?? payload.program
  const semesterValue = payload.semesterId ?? payload.semester ?? payload.term
  const facultyValue = payload.facultyStaffId ?? payload.staffId ?? payload.faculty

  if (options.partial && !departmentValue && !programValue && !semesterValue && !facultyValue) {
    return {}
  }

  const department = await resolveDepartment(departmentValue)
  const program = programValue
    ? await resolveProgram(programValue, { departmentId: department._id })
    : await inferSingleProgram(department._id, options)
  const semester = await resolveSemester(semesterValue, { optional: options.partial && !semesterValue })
  const staff = await resolveStaff(facultyValue, { category: 'Teaching', optional: options.partial && !facultyValue })

  return {
    departmentId: department._id,
    programId: program?._id,
    semesterId: semester?._id,
    facultyStaffId: staff?._id,
    department: department.name,
    program: program?.name,
    semester: semester?.name,
    faculty: staff?.name,
  }
}

async function inferSingleProgram(departmentId, options) {
  const programs = await Program.find({ departmentId, status: 'Active' }).limit(2).lean()
  if (programs.length === 1) return programs[0]
  if (programs.length === 0 && options.partial) return null
  if (programs.length === 0) throw httpError(400, 'Course requires an active program for the selected department')
  throw httpError(400, 'Multiple programs exist for this department; provide program or programId')
}

export async function validateCourseAllowedForStudent(student, course) {
  if (student.departmentId && course.departmentId && student.departmentId.toString() !== course.departmentId.toString()) {
    throw httpError(400, 'Student cannot enroll in a course from another department')
  }
  if (student.programId && course.programId && student.programId.toString() !== course.programId.toString()) {
    throw httpError(400, 'Student cannot enroll in a course outside their program')
  }
  if (student.semesterId && course.semesterId && student.semesterId.toString() !== course.semesterId.toString()) {
    throw httpError(400, 'Student cannot enroll in a course outside their semester or batch')
  }
}

export async function ensureEnrollment(studentId, courseId) {
  const enrollment = await StudentCourse.findOne({
    studentId,
    courseId,
    status: 'Enrolled',
  }).lean()

  if (!enrollment) {
    throw httpError(400, 'Student is not enrolled in this course')
  }

  return enrollment
}

export async function ensureTeacherAssigned(user, courseId) {
  if (user.role === 'Admin' || user.role === 'Super Admin') return null

  const staff = await Staff.findOne({
    $or: [{ userId: user.id }, { email: user.email }],
    category: 'Teaching',
    status: 'Active',
  }).lean()

  if (!staff) {
    throw httpError(403, 'Only active teaching staff can mark attendance or grades')
  }

  const assignment = await CourseAssignment.findOne({
    staffId: staff._id,
    courseId,
    status: 'Active',
  }).lean()

  if (!assignment) {
    throw httpError(403, 'Teacher is not assigned to this course')
  }

  return assignment
}

async function resolveByIdOrFields(Model, value, fields) {
  const query = buildResolveQuery(value, fields)
  if (!query) return null
  return Model.findOne(query).lean()
}

function buildResolveQuery(value, fields) {
  if (!value) return null
  const text = String(value).trim()
  const query = { $or: fields.map((field) => ({ [field]: new RegExp(`^${escapeRegExp(text)}$`, 'i') })) }
  if (mongoose.Types.ObjectId.isValid(text)) query.$or.unshift({ _id: text })
  return query
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
