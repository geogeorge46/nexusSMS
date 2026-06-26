import mongoose from 'mongoose'

import { Student } from '../models/Student.js'
import { validateAdmissionScope } from './institutionService.js'

const validStatuses = new Set(['Active', 'Pending', 'Review', 'Inactive'])

export async function listStudents(filters = {}) {
  const page = Math.max(Number(filters.page ?? 1), 1)
  const limit = Math.min(Math.max(Number(filters.limit ?? 8), 1), 50)
  const query = buildStudentQuery(filters)

  const [items, total, summaryRows] = await Promise.all([
    Student.find(query)
      .sort({ createdAt: -1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Student.countDocuments(query),
    Student.find(query).select('status attendance').lean(),
  ])

  return {
    items: items.map(serializeStudent),
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(Math.ceil(total / limit), 1),
    },
    summary: buildSummary(summaryRows),
  }
}

export async function getStudent(studentId) {
  const student = await Student.findOne(buildStudentIdentifierQuery(studentId)).lean()

  if (!student) {
    const error = new Error('Student not found')
    error.statusCode = 404
    throw error
  }

  return serializeStudent(student)
}

export async function createStudent(payload) {
  const normalized = normalizeStudentPayload(payload)
  const scope = await validateAdmissionScope({ ...payload, ...normalized })
  const student = await Student.create({
    ...normalized,
    ...scope,
    registerNumber: normalized.registerNumber || await getNextRegisterNumber(),
    enrolledAt: normalized.enrolledAt || new Date(),
  })

  return serializeStudent(student)
}

export async function updateStudent(studentId, payload) {
  const normalized = normalizeStudentPayload(payload, { partial: true })
  delete normalized.registerNumber
  const existing = await Student.findOne(buildStudentIdentifierQuery(studentId)).lean()

  if (!existing) {
    const error = new Error('Student not found')
    error.statusCode = 404
    throw error
  }

  const scope = await validateAdmissionScope({ ...existing, ...payload, ...normalized }, { partial: true })

  const student = await Student.findOneAndUpdate(
    { _id: existing._id },
    { $set: { ...normalized, ...scope } },
    { new: true, runValidators: true },
  ).lean()

  return serializeStudent(student)
}

export async function deleteStudent(studentId) {
  const student = await Student.findOneAndDelete(buildStudentIdentifierQuery(studentId)).lean()

  if (!student) {
    const error = new Error('Student not found')
    error.statusCode = 404
    throw error
  }

  return serializeStudent(student)
}

function buildStudentQuery(filters) {
  const query = {}

  if (filters.search) {
    const pattern = escapeRegExp(String(filters.search).trim())
    query.$or = [
      { registerNumber: { $regex: pattern, $options: 'i' } },
      { name: { $regex: pattern, $options: 'i' } },
      { email: { $regex: pattern, $options: 'i' } },
      { program: { $regex: pattern, $options: 'i' } },
      { department: { $regex: pattern, $options: 'i' } },
    ]
  }

  if (filters.status && filters.status !== 'All') {
    query.status = filters.status
  }

  if (filters.department && filters.department !== 'All') {
    query.department = filters.department
  }

  return query
}

function buildStudentIdentifierQuery(studentId) {
  if (mongoose.Types.ObjectId.isValid(studentId)) {
    return { $or: [{ _id: studentId }, { registerNumber: studentId }] }
  }

  return { registerNumber: studentId }
}

function normalizeStudentPayload(payload, options = {}) {
  const normalized = {
    registerNumber: cleanString(payload.registerNumber),
    name: cleanString(payload.name),
    email: cleanString(payload.email).toLowerCase(),
    program: cleanString(payload.program),
    department: cleanString(payload.department),
    year: cleanString(payload.year),
    departmentId: payload.departmentId,
    programId: payload.programId,
    academicYearId: payload.academicYearId,
    semesterId: payload.semesterId,
    batch: cleanString(payload.batch),
    status: validStatuses.has(payload.status) ? payload.status : undefined,
    attendance: normalizeNumber(payload.attendance),
    gpa: normalizeNumber(payload.gpa),
    advisor: cleanString(payload.advisor),
    phone: cleanString(payload.phone),
    address: cleanString(payload.address),
    enrolledAt: payload.enrolledAt ? new Date(payload.enrolledAt) : undefined,
  }

  for (const [key, value] of Object.entries(normalized)) {
    if (value === undefined || value === '') {
      delete normalized[key]
    }
  }

  if (!options.partial) {
    const requiredFields = ['name', 'email', 'program', 'department', 'year', 'advisor', 'phone', 'address']
    const missing = requiredFields.filter((field) => !normalized[field])

    if (missing.length > 0) {
      const error = new Error('Student details are incomplete')
      error.statusCode = 400
      error.details = missing.map((field) => `${field} is required`)
      throw error
    }

    normalized.status ??= 'Active'
    normalized.attendance ??= 0
    normalized.gpa ??= 0
  }

  return normalized
}

async function getNextRegisterNumber() {
  const latest = await Student.findOne({ registerNumber: /^STU-\d+$/ })
    .sort({ registerNumber: -1 })
    .select('registerNumber')
    .lean()
  const next = Number(latest?.registerNumber?.replace('STU-', '') ?? 1000) + 1

  return `STU-${next}`
}

function serializeStudent(student) {
  const source = typeof student.toObject === 'function' ? student.toObject() : student

  return {
    id: source.registerNumber,
    databaseId: source._id.toString(),
    name: source.name,
    email: source.email,
    program: source.program,
    department: source.department,
    year: source.year,
    status: source.status,
    attendance: source.attendance,
    gpa: source.gpa,
    advisor: source.advisor,
    phone: source.phone,
    address: source.address,
    departmentId: source.departmentId?.toString?.() ?? '',
    programId: source.programId?.toString?.() ?? '',
    academicYearId: source.academicYearId?.toString?.() ?? '',
    semesterId: source.semesterId?.toString?.() ?? '',
    batch: source.batch ?? '',
    enrolledAt: formatDate(source.enrolledAt),
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  }
}

function buildSummary(students) {
  const total = students.length
  const attendanceTotal = students.reduce((sum, student) => sum + (student.attendance ?? 0), 0)

  return {
    total,
    active: students.filter((student) => student.status === 'Active').length,
    review: students.filter((student) => student.status === 'Review').length,
    averageAttendance: total > 0 ? Math.round(attendanceTotal / total) : 0,
  }
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeNumber(value) {
  if (value === undefined || value === null || value === '') return undefined
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
