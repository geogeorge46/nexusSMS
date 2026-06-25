import mongoose from 'mongoose'

import { Attendance } from '../models/Attendance.js'
import { Course } from '../models/Course.js'
import { Grade } from '../models/Grade.js'
import { Student } from '../models/Student.js'

const reportDefinitions = {
  students: {
    title: 'Student Report',
    columns: [
      ['registerNumber', 'Student ID'], ['name', 'Student'], ['department', 'Department'],
      ['program', 'Program'], ['year', 'Year'], ['status', 'Status'],
      ['enrolledAt', 'Enrolled'], ['attendance', 'Attendance %'], ['gpa', 'GPA'],
    ],
  },
  attendance: {
    title: 'Attendance Report',
    columns: [
      ['date', 'Date'], ['student', 'Student'], ['registerNumber', 'Student ID'],
      ['course', 'Course'], ['courseNumber', 'Course ID'], ['department', 'Department'],
      ['status', 'Status'], ['remarks', 'Remarks'],
    ],
  },
  grades: {
    title: 'Grade Report',
    columns: [
      ['createdAt', 'Recorded'], ['student', 'Student'], ['registerNumber', 'Student ID'],
      ['course', 'Course'], ['courseNumber', 'Course ID'], ['department', 'Department'],
      ['semester', 'Semester'], ['assessmentType', 'Assessment'], ['percentage', 'Score %'],
      ['gradeLetter', 'Grade'],
    ],
  },
  courses: {
    title: 'Course Report',
    columns: [
      ['courseNumber', 'Course ID'], ['code', 'Code'], ['title', 'Course'],
      ['department', 'Department'], ['faculty', 'Faculty'], ['semester', 'Semester'],
      ['status', 'Status'], ['enrolled', 'Enrolled'], ['capacity', 'Capacity'],
    ],
  },
}

export function isReportType(value) {
  return Object.hasOwn(reportDefinitions, value)
}

export async function buildReport(type, filters = {}, options = {}) {
  if (!isReportType(type)) throw httpError(400, 'Invalid report type')

  const page = Math.max(Number(filters.page ?? 1), 1)
  const limit = Math.min(Math.max(Number(filters.limit ?? 10), 1), 50)
  const query = await buildQuery(type, filters)
  const Model = getModel(type)
  const total = await Model.countDocuments(query)
  let recordsQuery = Model.find(query).sort(getSort(type))

  if (!options.all) recordsQuery = recordsQuery.skip((page - 1) * limit).limit(limit)
  recordsQuery = populateReportQuery(type, recordsQuery)

  const [records, metrics, filterOptions] = await Promise.all([
    recordsQuery.lean(),
    buildMetrics(type, query, total),
    getFilterOptions(type),
  ])
  const definition = reportDefinitions[type]

  return {
    type,
    title: definition.title,
    columns: definition.columns.map(([key, label]) => ({ key, label })),
    rows: records.map((record) => serializeRecord(type, record)),
    metrics,
    filterOptions,
    pagination: {
      page: options.all ? 1 : page,
      limit: options.all ? total : limit,
      total,
      pages: options.all ? 1 : Math.max(Math.ceil(total / limit), 1),
    },
  }
}

async function buildQuery(type, filters) {
  const query = {}
  const dateField = type === 'attendance' ? 'date' : type === 'students' ? 'enrolledAt' : 'createdAt'
  const dateRange = buildDateRange(filters.dateFrom, filters.dateTo)
  if (dateRange) query[dateField] = dateRange

  if (type === 'students') {
    if (hasFilter(filters.department)) query.department = filters.department
    if (hasFilter(filters.status)) query.status = filters.status
    if (hasFilter(filters.student)) query._id = await resolveId(Student, filters.student, 'registerNumber', 'Student')
  }

  if (type === 'courses') {
    if (hasFilter(filters.department)) query.department = filters.department
    if (hasFilter(filters.semester)) query.semester = filters.semester
    if (hasFilter(filters.status)) query.status = filters.status
    if (hasFilter(filters.course)) query._id = await resolveId(Course, filters.course, 'courseNumber', 'Course')
    if (hasFilter(filters.student)) {
      const studentId = await resolveId(Student, filters.student, 'registerNumber', 'Student')
      const [attendanceCourses, gradeCourses] = await Promise.all([
        Attendance.distinct('courseId', { studentId }),
        Grade.distinct('courseId', { studentId }),
      ])
      query._id = combineIdFilter(query._id, uniqueIds([...attendanceCourses, ...gradeCourses]))
    }
  }

  if (type === 'attendance' || type === 'grades') {
    if (hasFilter(filters.student)) query.studentId = await resolveId(Student, filters.student, 'registerNumber', 'Student')
    if (hasFilter(filters.course)) query.courseId = await resolveId(Course, filters.course, 'courseNumber', 'Course')

    if (hasFilter(filters.department)) {
      const [studentIds, courseIds] = await Promise.all([
        Student.distinct('_id', { department: filters.department }),
        Course.distinct('_id', { department: filters.department }),
      ])
      query.$or = [{ studentId: { $in: studentIds } }, { courseId: { $in: courseIds } }]
    }

    if (hasFilter(filters.semester)) {
      if (type === 'grades') query.semester = filters.semester
      else query.courseId = combineIdFilter(
        query.courseId,
        await Course.distinct('_id', { semester: filters.semester }),
      )
    }

    if (hasFilter(filters.status)) {
      if (type === 'attendance') query.status = filters.status
      if (type === 'grades' && filters.status === 'At Risk') query.percentage = { $lt: 60 }
      if (type === 'grades' && filters.status === 'Passing') query.percentage = { $gte: 60 }
    }
  }

  return query
}

function populateReportQuery(type, query) {
  if (type === 'attendance' || type === 'grades') {
    return query
      .populate('studentId', 'name registerNumber department')
      .populate('courseId', 'title courseNumber department semester')
  }
  return query
}

async function buildMetrics(type, query, total) {
  if (type === 'students') {
    const [active, review, attendance] = await Promise.all([
      Student.countDocuments({ ...query, status: 'Active' }),
      Student.countDocuments({ ...query, status: 'Review' }),
      Student.aggregate([{ $match: query }, { $group: { _id: null, average: { $avg: '$attendance' } } }]),
    ])
    return metrics(total, ['Active', active], ['In Review', review], ['Avg Attendance', `${Math.round(attendance[0]?.average ?? 0)}%`])
  }

  if (type === 'attendance') {
    const counts = await Attendance.aggregate([{ $match: query }, { $group: { _id: '$status', count: { $sum: 1 } } }])
    const byStatus = Object.fromEntries(counts.map((item) => [item._id, item.count]))
    return metrics(total, ['Present', byStatus.Present ?? 0], ['Absent', byStatus.Absent ?? 0], ['Late', byStatus.Late ?? 0])
  }

  if (type === 'grades') {
    const summary = await Grade.aggregate([{
      $match: query,
    }, {
      $group: { _id: null, average: { $avg: '$percentage' }, atRisk: { $sum: { $cond: [{ $lt: ['$percentage', 60] }, 1, 0] } } },
    }])
    const value = summary[0] ?? {}
    return metrics(total, ['Average Score', `${Math.round(value.average ?? 0)}%`], ['At Risk', value.atRisk ?? 0], ['Passing', total - (value.atRisk ?? 0)])
  }

  const summary = await Course.aggregate([{
    $match: query,
  }, {
    $group: { _id: null, active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } }, enrolled: { $sum: '$enrolled' }, capacity: { $sum: '$capacity' } },
  }])
  const value = summary[0] ?? {}
  return metrics(total, ['Active', value.active ?? 0], ['Enrolled', value.enrolled ?? 0], ['Capacity', value.capacity ?? 0])
}

async function getFilterOptions(type) {
  const [studentRows, courseRows, studentDepartments, courseDepartments, semesters] = await Promise.all([
    Student.find().sort({ name: 1 }).select('name registerNumber').limit(500).lean(),
    Course.find().sort({ title: 1 }).select('title courseNumber').limit(500).lean(),
    Student.distinct('department'),
    Course.distinct('department'),
    Course.distinct('semester'),
  ])
  const statuses = type === 'students'
    ? ['Active', 'Pending', 'Review', 'Inactive']
    : type === 'courses'
      ? ['Active', 'Inactive']
      : type === 'attendance'
        ? ['Present', 'Absent', 'Late', 'Excused']
        : ['Passing', 'At Risk']

  return {
    departments: [...new Set([...studentDepartments, ...courseDepartments])].sort(),
    semesters: semesters.sort(),
    students: studentRows.map((student) => ({ value: student._id.toString(), label: `${student.name} (${student.registerNumber})` })),
    courses: courseRows.map((course) => ({ value: course._id.toString(), label: `${course.title} (${course.courseNumber})` })),
    statuses,
  }
}

function serializeRecord(type, record) {
  if (type === 'students') return {
    id: record._id.toString(), registerNumber: record.registerNumber, name: record.name,
    department: record.department, program: record.program, year: record.year, status: record.status,
    enrolledAt: formatDate(record.enrolledAt), attendance: record.attendance, gpa: record.gpa,
  }
  if (type === 'courses') return {
    id: record._id.toString(), courseNumber: record.courseNumber, code: record.code, title: record.title,
    department: record.department, faculty: record.faculty, semester: record.semester, status: record.status,
    enrolled: record.enrolled, capacity: record.capacity,
  }
  const shared = {
    id: record._id.toString(), student: record.studentId?.name ?? 'Unknown Student',
    registerNumber: record.studentId?.registerNumber ?? '', course: record.courseId?.title ?? 'Unknown Course',
    courseNumber: record.courseId?.courseNumber ?? '', department: record.studentId?.department ?? record.courseId?.department ?? '',
  }
  if (type === 'attendance') return { ...shared, date: formatDate(record.date), status: record.status, remarks: record.remarks ?? '' }
  return {
    ...shared, createdAt: formatDate(record.createdAt), semester: record.semester,
    assessmentType: record.assessmentType, percentage: record.percentage, gradeLetter: record.gradeLetter,
  }
}

function getModel(type) {
  return { students: Student, attendance: Attendance, grades: Grade, courses: Course }[type]
}

function getSort(type) {
  if (type === 'attendance') return { date: -1, createdAt: -1 }
  if (type === 'students') return { enrolledAt: -1, name: 1 }
  return { createdAt: -1 }
}

function metrics(total, ...entries) {
  return [{ label: 'Records', value: total }, ...entries.map(([label, value]) => ({ label, value }))]
}

function buildDateRange(dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return null
  const range = {}
  if (dateFrom) range.$gte = parseDate(dateFrom, false)
  if (dateTo) range.$lte = parseDate(dateTo, true)
  if (range.$gte && range.$lte && range.$gte > range.$lte) throw httpError(400, 'Start date must not be after end date')
  return range
}

function parseDate(value, endOfDay) {
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`)
  if (Number.isNaN(date.getTime())) throw httpError(400, 'Invalid report date range')
  return date
}

async function resolveId(Model, value, field, label) {
  if (mongoose.Types.ObjectId.isValid(value) && await Model.exists({ _id: value })) {
    return new mongoose.Types.ObjectId(value)
  }
  const record = await Model.findOne({ [field]: value }).select('_id').lean()
  if (!record) throw httpError(404, `${label} not found`)
  return record._id
}

function uniqueIds(values) {
  return [...new Map(values.map((value) => [value.toString(), value])).values()]
}

function combineIdFilter(existing, allowed) {
  if (!existing) return { $in: allowed }
  const existingValues = existing.$in ?? [existing]
  const allowedSet = new Set(allowed.map((value) => value.toString()))
  return { $in: existingValues.filter((value) => allowedSet.has(value.toString())) }
}

function hasFilter(value) {
  return Boolean(value && value !== 'All')
}

function formatDate(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : ''
}

function httpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}
