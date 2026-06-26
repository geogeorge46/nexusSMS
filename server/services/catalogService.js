import { AcademicYear } from '../models/AcademicYear.js'
import { Course } from '../models/Course.js'
import { CourseAssignment } from '../models/CourseAssignment.js'
import { Department } from '../models/Department.js'
import { Program } from '../models/Program.js'
import { Semester } from '../models/Semester.js'
import { Staff } from '../models/Staff.js'
import { Student } from '../models/Student.js'
import { StudentCourse } from '../models/StudentCourse.js'
import {
  ensureTeacherAssigned,
  httpError,
  resolveAcademicYear,
  resolveCourse,
  resolveDepartment,
  resolveProgram,
  resolveSemester,
  resolveStaff,
  resolveStudent,
  validateCourseAllowedForStudent,
} from './institutionService.js'

const models = {
  departments: Department,
  programs: Program,
  academicYears: AcademicYear,
  semesters: Semester,
  staff: Staff,
  studentcourses: StudentCourse,
  courseassignments: CourseAssignment,
}

export async function listResource(resource, filters = {}) {
  const Model = getModel(resource)
  const query = {}
  if (filters.status && filters.status !== 'All') query.status = filters.status

  const items = await Model.find(query).sort({ createdAt: -1 }).lean()
  return { items: items.map((item) => serializeResource(resource, item)) }
}

export async function createResource(resource, payload) {
  const values = await normalizeResource(resource, payload)
  const record = await getModel(resource).create(values)
  await syncCourseEnrollmentCount(resource, values.courseId)
  return serializeResource(resource, record)
}

export async function updateResource(resource, id, payload) {
  const current = await getModel(resource).findById(id).lean()
  if (!current) throw httpError(404, `${label(resource)} not found`)

  const values = await normalizeResource(resource, { ...current, ...payload }, { partial: true })
  const record = await getModel(resource).findByIdAndUpdate(id, values, { new: true, runValidators: true }).lean()
  await syncCourseEnrollmentCount(resource, record.courseId)
  return serializeResource(resource, record)
}

export async function deleteResource(resource, id) {
  const record = await getModel(resource).findByIdAndDelete(id).lean()
  if (!record) throw httpError(404, `${label(resource)} not found`)

  await syncCourseEnrollmentCount(resource, record.courseId)
  return serializeResource(resource, record)
}

async function normalizeResource(resource, payload) {
  if (resource === 'departments') return normalizeDepartment(payload)
  if (resource === 'programs') return normalizeProgram(payload)
  if (resource === 'academicYears') return normalizeAcademicYear(payload)
  if (resource === 'semesters') return normalizeSemester(payload)
  if (resource === 'staff') return normalizeStaff(payload)
  if (resource === 'studentcourses') return normalizeStudentCourse(payload)
  if (resource === 'courseassignments') return normalizeCourseAssignment(payload)
  throw httpError(404, 'Resource not found')
}

function normalizeDepartment(payload) {
  const name = cleanString(payload.name)
  const code = cleanString(payload.code).toUpperCase()
  if (!name || !code) throw httpError(400, 'Department name and code are required')
  return {
    name,
    code,
    description: cleanString(payload.description),
    status: normalizeStatus(payload.status),
  }
}

async function normalizeProgram(payload) {
  const department = await resolveDepartment(payload.departmentId ?? payload.department)
  const name = cleanString(payload.name)
  const code = cleanString(payload.code).toUpperCase()
  const durationSemesters = Number(payload.durationSemesters)
  if (!name || !code || !Number.isFinite(durationSemesters) || durationSemesters < 1) {
    throw httpError(400, 'Program name, code, department, and durationSemesters are required')
  }
  return {
    name,
    code,
    departmentId: department._id,
    level: cleanString(payload.level) || 'Undergraduate',
    durationSemesters,
    status: normalizeStatus(payload.status),
  }
}

function normalizeAcademicYear(payload) {
  const name = cleanString(payload.name)
  const startDate = parseDate(payload.startDate, 'Academic year startDate is required')
  const endDate = parseDate(payload.endDate, 'Academic year endDate is required')
  if (!name) throw httpError(400, 'Academic year name is required')
  if (startDate >= endDate) throw httpError(400, 'Academic year start date must be before end date')
  return { name, startDate, endDate, status: normalizeStatus(payload.status) }
}

async function normalizeSemester(payload) {
  const academicYear = await resolveAcademicYear(payload.academicYearId ?? payload.academicYear)
  const name = cleanString(payload.name)
  const number = Number(payload.number)
  const startDate = parseDate(payload.startDate, 'Semester startDate is required')
  const endDate = parseDate(payload.endDate, 'Semester endDate is required')
  if (!name || !Number.isFinite(number) || number < 1) throw httpError(400, 'Semester name, number, and academicYear are required')
  if (startDate >= endDate) throw httpError(400, 'Semester start date must be before end date')
  return { name, number, academicYearId: academicYear._id, startDate, endDate, status: normalizeStatus(payload.status) }
}

async function normalizeStaff(payload) {
  const department = await resolveDepartment(payload.departmentId ?? payload.department)
  const employeeNumber = cleanString(payload.employeeNumber)
  const name = cleanString(payload.name)
  const email = cleanString(payload.email).toLowerCase()
  const category = cleanString(payload.category)
  if (!employeeNumber || !name || !email || !['Teaching', 'Non-Teaching'].includes(category)) {
    throw httpError(400, 'Staff employeeNumber, name, email, category, and department are required')
  }
  return {
    employeeNumber,
    name,
    email,
    phone: cleanString(payload.phone),
    category,
    departmentId: department._id,
    userId: payload.userId || undefined,
    designation: cleanString(payload.designation),
    status: normalizeStatus(payload.status),
  }
}

async function normalizeStudentCourse(payload) {
  const student = await resolveStudent(payload.studentId ?? payload.student)
  const course = await resolveCourse(payload.courseId ?? payload.course)
  if (student.status !== 'Active') throw httpError(400, 'Inactive students cannot be enrolled in courses')
  if (course.status !== 'Active') throw httpError(400, 'Inactive courses cannot receive enrollments')
  await validateCourseAllowedForStudent(student, course)

  const academicYear = payload.academicYearId || payload.academicYear
    ? await resolveAcademicYear(payload.academicYearId ?? payload.academicYear)
    : await resolveAcademicYear(student.academicYearId, { optional: true })
  const semester = payload.semesterId || payload.semester
    ? await resolveSemester(payload.semesterId ?? payload.semester, { academicYearId: academicYear?._id })
    : await resolveSemester(student.semesterId, { optional: true })

  if (!academicYear || !semester) throw httpError(400, 'Enrollment requires academicYear and semester')
  if (course.semesterId && course.semesterId.toString() !== semester._id.toString()) {
    throw httpError(400, 'Course is not offered in the selected semester')
  }
  const enrolledCount = await StudentCourse.countDocuments({ courseId: course._id, status: 'Enrolled' })
  const nextStatus = ['Enrolled', 'Dropped', 'Completed'].includes(payload.status) ? payload.status : 'Enrolled'
  if (nextStatus === 'Enrolled' && enrolledCount >= course.capacity) {
    throw httpError(400, 'Course capacity is already full')
  }

  return {
    studentId: student._id,
    courseId: course._id,
    academicYearId: academicYear._id,
    semesterId: semester._id,
    status: nextStatus,
    enrolledAt: payload.enrolledAt ? new Date(payload.enrolledAt) : new Date(),
  }
}

async function normalizeCourseAssignment(payload) {
  const course = await resolveCourse(payload.courseId ?? payload.course)
  const staff = await resolveStaff(payload.staffId ?? payload.staff ?? payload.faculty, { category: 'Teaching' })
  if (course.status !== 'Active') throw httpError(400, 'Inactive courses cannot receive faculty assignments')
  if (course.departmentId && staff.departmentId && course.departmentId.toString() !== staff.departmentId.toString()) {
    throw httpError(400, 'Teaching staff can only be assigned to courses in their own department')
  }
  const academicYear = payload.academicYearId || payload.academicYear
    ? await resolveAcademicYear(payload.academicYearId ?? payload.academicYear)
    : await resolveAcademicYear(course.academicYearId, { optional: true })
  const semester = payload.semesterId || payload.semester
    ? await resolveSemester(payload.semesterId ?? payload.semester, { academicYearId: academicYear?._id })
    : await resolveSemester(course.semesterId, { optional: true })

  if (!academicYear || !semester) throw httpError(400, 'Course assignment requires academicYear and semester')

  await ensureTeacherAssigned({ role: 'Super Admin' }, course._id)

  return {
    courseId: course._id,
    staffId: staff._id,
    academicYearId: academicYear._id,
    semesterId: semester._id,
    role: ['Primary', 'Assistant'].includes(payload.role) ? payload.role : 'Primary',
    status: normalizeStatus(payload.status),
  }
}

function getModel(resource) {
  const Model = models[resource]
  if (!Model) throw httpError(404, 'Resource not found')
  return Model
}

function serializeResource(resource, record) {
  const source = typeof record.toObject === 'function' ? record.toObject() : record
  return { id: source._id.toString(), ...source, _id: source._id.toString(), resource }
}

async function syncCourseEnrollmentCount(resource, courseId) {
  if (resource !== 'studentcourses' || !courseId) return
  const enrolled = await StudentCourse.countDocuments({ courseId, status: 'Enrolled' })
  await Course.findByIdAndUpdate(courseId, { $set: { enrolled } })
}

function label(resource) {
  return resource.replace(/([A-Z])/g, ' $1')
}

function normalizeStatus(status) {
  return ['Active', 'Inactive'].includes(status) ? status : 'Active'
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function parseDate(value, message) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) throw httpError(400, message)
  return date
}
