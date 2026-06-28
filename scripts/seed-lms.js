#!/usr/bin/env node

import 'dotenv/config'

import { connectDatabase, disconnectDatabase } from '../server/config/db.js'
import { env, validateRuntimeEnv } from '../server/config/env.js'
import { CourseAssignment } from '../server/models/CourseAssignment.js'
import { StudentCourse } from '../server/models/StudentCourse.js'
import { createAssignment, createMaterial, gradeSubmission, submitAssignment } from '../server/services/lmsService.js'
import { assertSafeSeed } from './seedSafety.js'

const actor = { id: 'seed-lms', name: 'Nexus Seed', role: 'Super Admin' }

try {
  assertSafeSeed('seed:lms')
  validateRuntimeEnv()
  await connectDatabase(env.mongoUri)
  const assignment = await CourseAssignment.findOne({ status: 'Active' }).populate('courseId').populate('staffId').lean()
  if (!assignment?.courseId || !assignment?.staffId) throw new Error('Run npm run seed:institution before npm run seed:lms')

  const dueFuture = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const duePast = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const published = await createAssignment({
    title: `LMS Seed Assignment ${assignment.courseId.code}`,
    description: 'Read the provided material and submit a short response.',
    courseId: assignment.courseId._id.toString(),
    staffId: assignment.staffId._id.toString(),
    academicYearId: assignment.academicYearId.toString(),
    semesterId: assignment.semesterId.toString(),
    dueDate: dueFuture,
    maxMarks: 50,
    status: 'Published',
  }, actor)
  await createAssignment({
    title: `Draft Practice ${assignment.courseId.code}`,
    description: 'Draft assignment for teacher preparation.',
    courseId: assignment.courseId._id.toString(),
    staffId: assignment.staffId._id.toString(),
    academicYearId: assignment.academicYearId.toString(),
    semesterId: assignment.semesterId.toString(),
    dueDate: duePast,
    maxMarks: 25,
    status: 'Draft',
  }, actor).catch(() => null)
  await createMaterial({
    title: `Intro Notes ${assignment.courseId.code}`,
    description: 'Seeded LMS notes for enrolled students.',
    courseId: assignment.courseId._id.toString(),
    staffId: assignment.staffId._id.toString(),
    academicYearId: assignment.academicYearId.toString(),
    semesterId: assignment.semesterId.toString(),
    materialType: 'PDF',
    externalUrl: 'https://example.com/nexus-lms-notes',
    visibility: 'Published',
  }, actor)
  const enrollment = await StudentCourse.findOne({ courseId: assignment.courseId._id, status: 'Enrolled' }).lean()
  if (enrollment) {
    const submission = await submitAssignment({ id: 'seed-student', name: 'Seed Student', role: 'Student', student: { id: enrollment.studentId.toString() } }, published.id, { submissionText: 'Seed submission response.' })
    await gradeSubmission(submission.id, { marksObtained: 42, feedback: 'Good work.' }, actor)
  }
  console.log('LMS demo data ready')
} catch (error) {
  console.error('Failed to seed LMS data:')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await disconnectDatabase()
}
