import mongoose from 'mongoose'

import { Attendance } from '../models/Attendance.js'
import { Course } from '../models/Course.js'
import { Student } from '../models/Student.js'

const validStatuses = new Set(['Present', 'Absent', 'Late', 'Excused'])

export async function listAttendance(filters = {}) {
  const query = await buildAttendanceQuery(filters)
  const records = await Attendance.find(query)
    .sort({ date: -1, createdAt: -1 })
    .limit(100)
    .populate('studentId', 'name registerNumber department year')
    .populate('courseId', 'title courseNumber department')
    .lean()

  return {
    history: records.map(serializeAttendance),
  }
}

export async function getAttendanceSummary(filters = {}) {
  const query = await buildAttendanceQuery(filters)
  const records = await Attendance.find(query)
    .sort({ date: -1 })
    .populate('studentId', 'name registerNumber department year')
    .populate('courseId', 'title courseNumber department')
    .lean()
  const roster = await buildRoster(filters)

  return {
    summary: buildSummary(records),
    dailyTrend: buildDailyTrend(records),
    calendar: buildCalendar(records),
    heatmap: buildHeatmap(records),
    history: records.slice(0, 25).map(serializeAttendance),
    markRoster: roster,
  }
}

export async function markAttendance(payload, user) {
  const normalized = await normalizeAttendancePayload(payload)
  const existing = await Attendance.findOne({
    studentId: normalized.studentId,
    courseId: normalized.courseId,
    date: normalized.date,
  }).lean()

  if (existing) {
    const error = new Error('Attendance is already marked for this student, course, and date')
    error.statusCode = 409
    error.details = { attendanceId: existing._id.toString() }
    throw error
  }

  const attendance = await Attendance.create({
    ...normalized,
    markedBy: {
      userId: user.id,
      name: user.name,
      role: user.role,
    },
  })

  return getSerializedAttendance(attendance._id)
}

export async function updateAttendance(attendanceId, payload, user) {
  const normalized = await normalizeAttendancePayload(payload, { partial: true })
  const attendance = await Attendance.findByIdAndUpdate(
    attendanceId,
    {
      $set: {
        ...normalized,
        markedBy: {
          userId: user.id,
          name: user.name,
          role: user.role,
        },
      },
    },
    { new: true, runValidators: true },
  ).lean()

  if (!attendance) {
    const error = new Error('Attendance record not found')
    error.statusCode = 404
    throw error
  }

  return getSerializedAttendance(attendance._id)
}

export async function deleteAttendance(attendanceId) {
  const attendance = await Attendance.findByIdAndDelete(attendanceId)

  if (!attendance) {
    const error = new Error('Attendance record not found')
    error.statusCode = 404
    throw error
  }

  return { id: attendance._id.toString() }
}

async function getSerializedAttendance(attendanceId) {
  const attendance = await Attendance.findById(attendanceId)
    .populate('studentId', 'name registerNumber department year')
    .populate('courseId', 'title courseNumber department')
    .lean()

  return serializeAttendance(attendance)
}

async function buildAttendanceQuery(filters) {
  const query = {}

  if (filters.status && filters.status !== 'All') {
    query.status = filters.status
  }

  if (filters.date) {
    query.date = normalizeDate(filters.date)
  }

  if (filters.student && filters.student !== 'All') {
    const pattern = escapeRegExp(String(filters.student).trim())
    const students = await Student.find({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(filters.student) ? filters.student : undefined },
        { registerNumber: { $regex: pattern, $options: 'i' } },
        { name: { $regex: pattern, $options: 'i' } },
      ],
    }).select('_id').lean()
    query.studentId = { $in: students.map((student) => student._id) }
  }

  if (filters.course && filters.course !== 'All') {
    const pattern = escapeRegExp(String(filters.course).trim())
    const courses = await Course.find({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(filters.course) ? filters.course : undefined },
        { courseNumber: { $regex: pattern, $options: 'i' } },
        { title: { $regex: pattern, $options: 'i' } },
      ],
    }).select('_id').lean()
    query.courseId = { $in: courses.map((course) => course._id) }
  }

  if (filters.department && filters.department !== 'All') {
    const [students, courses] = await Promise.all([
      Student.find({ department: filters.department }).select('_id').lean(),
      Course.find({ department: filters.department }).select('_id').lean(),
    ])

    query.$or = [
      { studentId: { $in: students.map((student) => student._id) } },
      { courseId: { $in: courses.map((course) => course._id) } },
    ]
  }

  return query
}

async function normalizeAttendancePayload(payload, options = {}) {
  const normalized = {
    studentId: payload.studentId ? await resolveStudentId(payload.studentId) : undefined,
    courseId: payload.courseId ? await resolveCourseId(payload.courseId) : undefined,
    date: payload.date ? normalizeDate(payload.date) : undefined,
    status: validStatuses.has(payload.status) ? payload.status : undefined,
    remarks: typeof payload.remarks === 'string' ? payload.remarks.trim() : '',
  }

  for (const [key, value] of Object.entries(normalized)) {
    if (value === undefined || value === '') delete normalized[key]
  }

  if (!options.partial) {
    const missing = ['studentId', 'courseId', 'date', 'status'].filter((field) => !normalized[field])

    if (missing.length > 0) {
      const error = new Error('Attendance details are incomplete')
      error.statusCode = 400
      error.details = missing.map((field) => `${field} is required`)
      throw error
    }
  }

  return normalized
}

async function resolveStudentId(value) {
  if (mongoose.Types.ObjectId.isValid(value)) return value

  const student = await Student.findOne({ registerNumber: value }).select('_id').lean()
  if (!student) {
    const error = new Error('Student not found')
    error.statusCode = 404
    throw error
  }

  return student._id
}

async function resolveCourseId(value) {
  if (mongoose.Types.ObjectId.isValid(value)) return value

  const course = await Course.findOne({ courseNumber: value }).select('_id').lean()
  if (!course) {
    const error = new Error('Course not found')
    error.statusCode = 404
    throw error
  }

  return course._id
}

async function buildRoster(filters) {
  const studentQuery = {}

  if (filters.department && filters.department !== 'All') {
    studentQuery.department = filters.department
  }

  if (filters.student && filters.student !== 'All') {
    studentQuery._id = await resolveStudentId(filters.student)
  }

  const students = await Student.find(studentQuery)
    .sort({ name: 1 })
    .limit(50)
    .select('name registerNumber year')
    .lean()
  const course = filters.course && filters.course !== 'All'
    ? await Course.findOne(buildCourseLookup(filters.course)).select('title courseNumber').lean()
    : await Course.findOne().sort({ createdAt: -1 }).select('title courseNumber').lean()
  const existingRecords = course && filters.date
    ? await Attendance.find({
        courseId: course._id,
        date: normalizeDate(filters.date),
        studentId: { $in: students.map((student) => student._id) },
      }).select('studentId status').lean()
    : []
  const recordsByStudent = new Map(
    existingRecords.map((record) => [record.studentId.toString(), record]),
  )

  return students.map((student) => {
    const attendance = recordsByStudent.get(student._id.toString())

    return {
      id: student.registerNumber,
      databaseId: student._id.toString(),
      attendanceId: attendance?._id.toString() ?? '',
      name: student.name,
      course: course?.title ?? 'No course selected',
      courseId: course?.courseNumber ?? '',
      grade: student.year,
      status: attendance?.status ?? 'Present',
    }
  })
}

function buildCourseLookup(courseId) {
  if (mongoose.Types.ObjectId.isValid(courseId)) {
    return { $or: [{ _id: courseId }, { courseNumber: courseId }] }
  }

  return { courseNumber: courseId }
}

function buildSummary(records) {
  const total = records.length
  const present = records.filter((record) => record.status === 'Present').length
  const late = records.filter((record) => record.status === 'Late').length
  const absent = records.filter((record) => record.status === 'Absent').length
  const average = total > 0 ? Math.round((present / total) * 1000) / 10 : 0

  return {
    average,
    present,
    absent,
    late,
    atRisk: absent,
  }
}

function buildDailyTrend(records) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

  return days.map((day, index) => {
    const dayRecords = records.filter((record) => new Date(record.date).getDay() === index + 1)
    const total = Math.max(dayRecords.length, 1)

    return {
      day,
      present: Math.round((dayRecords.filter((record) => record.status === 'Present').length / total) * 100),
      late: dayRecords.filter((record) => record.status === 'Late').length,
      absent: dayRecords.filter((record) => record.status === 'Absent').length,
    }
  })
}

function buildCalendar(records) {
  const grouped = new Map()

  for (const record of records) {
    const date = formatDate(record.date)
    const current = grouped.get(date) ?? { total: 0, present: 0 }
    current.total += 1
    if (record.status === 'Present') current.present += 1
    grouped.set(date, current)
  }

  return [...grouped.entries()].slice(0, 15).map(([date, value]) => {
    const rate = Math.round((value.present / Math.max(value.total, 1)) * 100)
    return {
      date,
      rate,
      status: rate >= 90 ? 'Strong' : rate >= 80 ? 'Watch' : 'Concern',
    }
  })
}

function buildHeatmap(records) {
  const grades = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']

  return grades.map((grade) => ({
    label: grade,
    values: [1, 2, 3, 4, 5].map((day) => {
      const dayRecords = records.filter(
        (record) => record.studentId?.year === grade && new Date(record.date).getDay() === day,
      )
      const total = Math.max(dayRecords.length, 1)
      return Math.round((dayRecords.filter((record) => record.status === 'Present').length / total) * 100)
    }),
  }))
}

function serializeAttendance(record) {
  return {
    id: record._id.toString(),
    studentId: record.studentId?._id?.toString() ?? '',
    courseId: record.courseId?._id?.toString() ?? '',
    student: record.studentId?.name ?? 'Unknown Student',
    course: record.courseId?.title ?? 'Unknown Course',
    department: record.studentId?.department ?? record.courseId?.department ?? '',
    grade: record.studentId?.year ?? '',
    date: formatDate(record.date),
    status: record.status,
    remarks: record.remarks ?? '',
    checkIn: record.status === 'Present' || record.status === 'Late'
      ? new Date(record.createdAt ?? record.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : '-',
  }
}

function normalizeDate(value) {
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) {
    const error = new Error('Attendance date is invalid')
    error.statusCode = 400
    throw error
  }

  return date
}

function formatDate(value) {
  return new Date(value).toISOString().slice(0, 10)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
