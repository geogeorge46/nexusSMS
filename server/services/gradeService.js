import mongoose from 'mongoose'

import { Course } from '../models/Course.js'
import { Grade } from '../models/Grade.js'
import { Student } from '../models/Student.js'

const populate = (query) => query
  .populate('studentId', 'name registerNumber department')
  .populate('courseId', 'title courseNumber department')

export async function listGrades(filters = {}) {
  const records = await populate(
    Grade.find(await buildQuery(filters)).sort({ createdAt: -1 }),
  ).lean()

  return buildDashboard(records)
}

export async function getGrade(id) {
  const record = await populate(Grade.findById(id)).lean()

  if (!record) throw httpError(404, 'Grade not found')
  return serialize(record)
}

export async function createGrade(payload, user) {
  const values = await normalize(payload)

  if (await Grade.exists(uniqueKey(values))) {
    throw httpError(409, 'A grade already exists for this assessment')
  }

  const record = await Grade.create({
    ...values,
    createdBy: { userId: user.id, name: user.name, role: user.role },
  })

  return getGrade(record._id)
}

export async function updateGrade(id, payload) {
  const current = await Grade.findById(id).lean()

  if (!current) throw httpError(404, 'Grade not found')

  const values = await normalize({ ...current, ...payload })
  const duplicate = await Grade.exists({ ...uniqueKey(values), _id: { $ne: id } })

  if (duplicate) throw httpError(409, 'A grade already exists for this assessment')

  await Grade.findByIdAndUpdate(id, values, { runValidators: true })
  return getGrade(id)
}

export async function deleteGrade(id) {
  const record = await Grade.findByIdAndDelete(id)

  if (!record) throw httpError(404, 'Grade not found')
  return { id: record._id.toString() }
}

export function getStudentGrades(id) {
  return listGrades({ student: id })
}

export function getCourseGrades(id) {
  return listGrades({ course: id })
}

async function buildQuery(filters) {
  const query = {}

  if (filters.semester && filters.semester !== 'All') query.semester = filters.semester
  if (filters.assessmentType && filters.assessmentType !== 'All') query.assessmentType = filters.assessmentType
  if (filters.student && filters.student !== 'All') query.studentId = await resolve(Student, filters.student, 'registerNumber')
  if (filters.course && filters.course !== 'All') query.courseId = await resolve(Course, filters.course, 'courseNumber')

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

async function normalize(payload) {
  const studentId = await resolve(Student, payload.studentId, 'registerNumber')
  const courseId = await resolve(Course, payload.courseId, 'courseNumber')
  const marksObtained = Number(payload.marksObtained)
  const maxMarks = Number(payload.maxMarks)

  if (
    !payload.assessmentType?.trim()
    || !payload.semester?.trim()
    || !Number.isFinite(marksObtained)
    || !Number.isFinite(maxMarks)
    || maxMarks <= 0
    || marksObtained < 0
    || marksObtained > maxMarks
  ) {
    throw httpError(400, 'Grade details are invalid')
  }

  const percentage = Math.round((marksObtained / maxMarks) * 10000) / 100

  return {
    studentId,
    courseId,
    assessmentType: payload.assessmentType.trim(),
    marksObtained,
    maxMarks,
    percentage,
    gradeLetter: calculateGradeLetter(percentage),
    semester: payload.semester.trim(),
    remarks: String(payload.remarks ?? '').trim(),
  }
}

async function resolve(Model, value, field) {
  const entity = field === 'registerNumber' ? 'Student' : 'Course'

  if (!value) throw httpError(400, `${entity} is required`)
  if (mongoose.Types.ObjectId.isValid(value)) return value

  const record = await Model.findOne({ [field]: value }).select('_id').lean()

  if (!record) throw httpError(404, `${entity} not found`)
  return record._id
}

function serialize(record) {
  const percentage = Number(record.percentage)

  return {
    id: record._id.toString(),
    studentId: record.studentId?._id?.toString() ?? '',
    courseId: record.courseId?._id?.toString() ?? '',
    student: record.studentId?.name ?? 'Unknown Student',
    course: record.courseId?.title ?? 'Unknown Course',
    department: record.studentId?.department ?? record.courseId?.department ?? '',
    type: record.assessmentType,
    assessmentType: record.assessmentType,
    marksObtained: record.marksObtained,
    maxMarks: record.maxMarks,
    score: percentage,
    percentage,
    letter: record.gradeLetter,
    gradeLetter: record.gradeLetter,
    semester: record.semester,
    remarks: record.remarks,
    gpa: toGpa(percentage),
    cgpa: toGpa(percentage),
    status: 'Published',
    createdAt: new Date(record.createdAt).toISOString(),
  }
}

function buildDashboard(records) {
  const grades = records.map(serialize)
  const studentScores = new Map()

  for (const grade of grades) {
    studentScores.set(grade.studentId, [...(studentScores.get(grade.studentId) ?? []), grade.score])
  }

  return {
    summary: {
      gpa: toGpa(mean(grades.map((grade) => grade.score))),
      cgpa: mean([...studentScores.values()].map((scores) => toGpa(mean(scores)))),
      graded: grades.length,
      pending: 0,
      atRisk: grades.filter((grade) => grade.score < 60).length,
    },
    assignments: assessmentSummary(grades, ['Assignment', 'Project']),
    exams: assessmentSummary(grades, ['Exam', 'Quiz']),
    grades,
    performance: performanceSummary(grades),
    analytics: analyticsSummary(grades),
  }
}

function assessmentSummary(grades, types) {
  return grades
    .filter((grade) => types.includes(grade.type))
    .slice(0, 4)
    .map((grade) => ({
      id: grade.id,
      title: `${grade.type} - ${grade.student}`,
      course: grade.course,
      average: grade.score,
      status: 'Published',
      date: grade.createdAt.slice(0, 10),
    }))
}

function performanceSummary(grades) {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const months = new Map()

  for (const grade of grades) {
    const month = new Date(grade.createdAt).getMonth()
    months.set(month, [...(months.get(month) ?? []), grade.score])
  }

  return [...months.entries()]
    .sort(([first], [second]) => first - second)
    .slice(-6)
    .map(([month, scores]) => ({
      label: labels[month],
      average: Math.round(mean(scores)),
      gpa: toGpa(mean(scores)),
    }))
}

function analyticsSummary(grades) {
  const ranges = [
    { label: 'A Range', matches: (score) => score >= 80, tone: 'green' },
    { label: 'B Range', matches: (score) => score >= 70 && score < 80, tone: 'blue' },
    { label: 'C Range', matches: (score) => score >= 60 && score < 70, tone: 'amber' },
    { label: 'At Risk', matches: (score) => score < 60, tone: 'rose' },
  ]

  return ranges.map((range) => ({
    label: range.label,
    value: grades.length
      ? Math.round((grades.filter((grade) => range.matches(grade.score)).length / grades.length) * 100)
      : 0,
    tone: range.tone,
  }))
}

function calculateGradeLetter(percentage) {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 75) return 'B+'
  if (percentage >= 70) return 'B'
  if (percentage >= 65) return 'C+'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'D'
  return 'F'
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
}

function toGpa(percentage) {
  return Math.round(Math.min(Math.max(percentage / 25, 0), 4) * 100) / 100
}

function uniqueKey(values) {
  return {
    studentId: values.studentId,
    courseId: values.courseId,
    assessmentType: values.assessmentType,
    semester: values.semester,
  }
}

function httpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}
