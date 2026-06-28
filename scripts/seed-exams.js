#!/usr/bin/env node

import 'dotenv/config'

import { connectDatabase, disconnectDatabase } from '../server/config/db.js'
import { env, validateRuntimeEnv } from '../server/config/env.js'
import { CourseAssignment } from '../server/models/CourseAssignment.js'
import { Exam } from '../server/models/Exam.js'
import { ExamResult } from '../server/models/ExamResult.js'
import { ExamSchedule } from '../server/models/ExamSchedule.js'
import { Room } from '../server/models/Room.js'
import { StudentCourse } from '../server/models/StudentCourse.js'
import { createExam, createSchedule, generateHallTickets, publishResults, upsertResult } from '../server/services/examService.js'
import { assertSafeSeed } from './seedSafety.js'

const actor = { id: 'seed-exams', name: 'Nexus Seed', role: 'Super Admin' }

try {
  assertSafeSeed('seed:exams')
  validateRuntimeEnv()
  await connectDatabase(env.mongoUri)

  const assignment = await CourseAssignment.findOne({ status: 'Active' }).populate('courseId').lean()
  if (!assignment?.courseId) throw new Error('Run npm run seed:institution before npm run seed:exams')
  const room = await Room.findOne({ status: 'Active' }).lean()
  if (!room) throw new Error('Run npm run seed:timetable before npm run seed:exams')

  const exam = await ensureExam('Internal Assessment 1', 'Internal', assignment)
  const finalExam = await ensureExam('End Semester Examination', 'Final', assignment)
  const schedule = await ensureSchedule(exam.id ?? exam._id.toString(), assignment, room, '2026-08-20', '10:00', '11:30')
  await ensureSchedule(finalExam.id ?? finalExam._id.toString(), assignment, room, '2026-09-20', '14:00', '17:00')
  await generateHallTickets(exam.id ?? exam._id.toString(), actor)

  const enrollments = await StudentCourse.find({ courseId: assignment.courseId._id, status: 'Enrolled' }).limit(3).lean()
  for (const [index, enrollment] of enrollments.entries()) {
    await upsertResult({
      scheduleId: schedule.id,
      studentId: enrollment.studentId.toString(),
      marksObtained: index === 0 ? 86 : 62,
      remarks: index === 0 ? 'Strong performance' : 'Satisfactory',
    }, actor)
  }
  await publishResults(exam.id ?? exam._id.toString())

  console.log('Exam demo data ready')
  console.log(`Seeded exams: ${exam.title}, ${finalExam.title}`)
} catch (error) {
  console.error('Failed to seed exam data:')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await disconnectDatabase()
}

async function ensureExam(title, examType, assignment) {
  const existing = await Exam.findOne({ title, academicYearId: assignment.academicYearId, programId: assignment.courseId.programId, semesterId: assignment.semesterId })
  if (existing) return existing
  return createExam({
    title,
    examType,
    academicYearId: assignment.academicYearId.toString(),
    programId: assignment.courseId.programId.toString(),
    semesterId: assignment.semesterId.toString(),
    status: 'Scheduled',
  }, actor)
}

async function ensureSchedule(examId, assignment, room, date, startTime, endTime) {
  const existing = await ExamSchedule.findOne({ examId, courseId: assignment.courseId._id }).lean()
  if (existing) return { ...existing, id: existing._id.toString() }
  return createSchedule(examId, {
    courseId: assignment.courseId._id.toString(),
    date,
    startTime,
    endTime,
    roomId: room._id.toString(),
    maxMarks: 100,
    passingMarks: 40,
  })
}
