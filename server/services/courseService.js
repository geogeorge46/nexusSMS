import mongoose from 'mongoose'

import { Course } from '../models/Course.js'

const validStatuses = new Set(['Active', 'Inactive'])

export async function listCourses(filters = {}) {
  const page = Math.max(Number(filters.page ?? 1), 1)
  const limit = Math.min(Math.max(Number(filters.limit ?? 7), 1), 50)
  const query = buildCourseQuery(filters)

  const [items, total, summaryRows] = await Promise.all([
    Course.find(query)
      .sort({ createdAt: -1, title: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Course.countDocuments(query),
    Course.find(query).select('status enrolled capacity').lean(),
  ])

  return {
    items: items.map(serializeCourse),
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(Math.ceil(total / limit), 1),
    },
    summary: buildSummary(summaryRows),
  }
}

export async function getCourse(courseId) {
  const course = await Course.findOne(buildCourseIdentifierQuery(courseId)).lean()

  if (!course) {
    const error = new Error('Course not found')
    error.statusCode = 404
    throw error
  }

  return serializeCourse(course)
}

export async function createCourse(payload) {
  const normalized = normalizeCoursePayload(payload)
  const course = await Course.create({
    ...normalized,
    courseNumber: normalized.courseNumber || await getNextCourseNumber(),
  })

  return serializeCourse(course)
}

export async function updateCourse(courseId, payload) {
  const normalized = normalizeCoursePayload(payload, { partial: true })
  delete normalized.courseNumber

  const existing = await Course.findOne(buildCourseIdentifierQuery(courseId)).lean()

  if (!existing) {
    const error = new Error('Course not found')
    error.statusCode = 404
    throw error
  }

  const nextEnrolled = normalized.enrolled ?? existing.enrolled
  const nextCapacity = normalized.capacity ?? existing.capacity

  if (nextEnrolled > nextCapacity) {
    const error = new Error('Course enrollment cannot exceed capacity')
    error.statusCode = 400
    throw error
  }

  const course = await Course.findByIdAndUpdate(
    existing._id,
    { $set: normalized },
    { new: true, runValidators: true },
  ).lean()

  return serializeCourse(course)
}

export async function deleteCourse(courseId) {
  const course = await Course.findOneAndDelete(buildCourseIdentifierQuery(courseId)).lean()

  if (!course) {
    const error = new Error('Course not found')
    error.statusCode = 404
    throw error
  }

  return serializeCourse(course)
}

function buildCourseQuery(filters) {
  const query = {}

  if (filters.search) {
    const pattern = escapeRegExp(String(filters.search).trim())
    query.$or = [
      { courseNumber: { $regex: pattern, $options: 'i' } },
      { title: { $regex: pattern, $options: 'i' } },
      { code: { $regex: pattern, $options: 'i' } },
      { department: { $regex: pattern, $options: 'i' } },
      { faculty: { $regex: pattern, $options: 'i' } },
      { semester: { $regex: pattern, $options: 'i' } },
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

function buildCourseIdentifierQuery(courseId) {
  if (mongoose.Types.ObjectId.isValid(courseId)) {
    return { $or: [{ _id: courseId }, { courseNumber: courseId }] }
  }

  return { courseNumber: courseId }
}

function normalizeCoursePayload(payload, options = {}) {
  const normalized = {
    courseNumber: cleanString(payload.courseNumber),
    title: cleanString(payload.title),
    code: cleanString(payload.code),
    department: cleanString(payload.department),
    faculty: cleanString(payload.faculty),
    credits: normalizeNumber(payload.credits),
    status: validStatuses.has(payload.status) ? payload.status : undefined,
    enrolled: normalizeNumber(payload.enrolled),
    capacity: normalizeNumber(payload.capacity),
    schedule: cleanString(payload.schedule),
    room: cleanString(payload.room),
    semester: cleanString(payload.semester ?? payload.term),
    description: cleanString(payload.description),
  }

  for (const [key, value] of Object.entries(normalized)) {
    if (value === undefined || value === '') {
      delete normalized[key]
    }
  }

  if (!options.partial) {
    const requiredFields = [
      'title',
      'code',
      'department',
      'faculty',
      'credits',
      'capacity',
      'schedule',
      'room',
      'semester',
      'description',
    ]
    const missing = requiredFields.filter((field) => normalized[field] === undefined || normalized[field] === '')

    if (missing.length > 0) {
      const error = new Error('Course details are incomplete')
      error.statusCode = 400
      error.details = missing.map((field) => `${field} is required`)
      throw error
    }

    normalized.status ??= 'Active'
    normalized.enrolled ??= 0
  }

  if (normalized.enrolled !== undefined && normalized.capacity !== undefined && normalized.enrolled > normalized.capacity) {
    const error = new Error('Course enrollment cannot exceed capacity')
    error.statusCode = 400
    throw error
  }

  return normalized
}

async function getNextCourseNumber() {
  const latest = await Course.findOne({ courseNumber: /^CRS-\d+$/ })
    .sort({ courseNumber: -1 })
    .select('courseNumber')
    .lean()
  const next = Number(latest?.courseNumber?.replace('CRS-', '') ?? 200) + 1

  return `CRS-${next}`
}

function serializeCourse(course) {
  const source = typeof course.toObject === 'function' ? course.toObject() : course

  return {
    id: source.courseNumber,
    databaseId: source._id.toString(),
    title: source.title,
    code: source.code,
    department: source.department,
    faculty: source.faculty,
    credits: source.credits,
    status: source.status,
    enrolled: source.enrolled,
    capacity: source.capacity,
    schedule: source.schedule,
    room: source.room,
    term: source.semester,
    semester: source.semester,
    description: source.description,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  }
}

function buildSummary(courses) {
  const totalCapacity = courses.reduce((sum, course) => sum + (course.capacity ?? 0), 0)
  const totalEnrollment = courses.reduce((sum, course) => sum + (course.enrolled ?? 0), 0)

  return {
    total: courses.length,
    active: courses.filter((course) => course.status === 'Active').length,
    enrollment: totalEnrollment,
    capacityUsed: Math.round((totalEnrollment / Math.max(totalCapacity, 1)) * 100),
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
