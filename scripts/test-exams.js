#!/usr/bin/env node

import 'dotenv/config'
import assert from 'node:assert/strict'

import { connectDatabase, disconnectDatabase } from '../server/config/db.js'
import { env, validateRuntimeEnv } from '../server/config/env.js'
import { CourseAssignment } from '../server/models/CourseAssignment.js'
import { Exam } from '../server/models/Exam.js'
import { ExamResult } from '../server/models/ExamResult.js'
import { ExamSchedule } from '../server/models/ExamSchedule.js'
import { Room } from '../server/models/Room.js'
import { Student } from '../server/models/Student.js'
import { StudentCourse } from '../server/models/StudentCourse.js'
import { createExam, createSchedule, generateHallTickets, getStudentPortalResults, publishResults, upsertResult } from '../server/services/examService.js'

const actor = { id: 'exam-test', name: 'Exam Test Admin', role: 'Super Admin' }

try {
  validateRuntimeEnv()
  await connectDatabase(env.mongoUri)

  const assignment = await CourseAssignment.findOne({ status: 'Active' }).populate('courseId').populate('staffId').lean()
  assert.ok(assignment?.courseId, 'Active course assignment exists')
  const room = await Room.findOneAndUpdate(
    { roomNumber: 'EXAM-TEST-1' },
    { $set: { name: 'Exam Test Hall', roomNumber: 'EXAM-TEST-1', building: 'QA Block', capacity: 999, type: 'Classroom', status: 'Active' } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  )
  const roomTwo = await Room.findOneAndUpdate(
    { roomNumber: 'EXAM-TEST-2' },
    { $set: { name: 'Exam Test Hall Two', roomNumber: 'EXAM-TEST-2', building: 'QA Block', capacity: 999, type: 'Classroom', status: 'Active' } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  )
  await Exam.deleteMany({ 'createdBy.userId': actor.id })
  await ExamSchedule.deleteMany({ roomId: { $in: [room._id, roomTwo._id] } })
  await ExamResult.deleteMany({ 'createdBy.userId': actor.id })

  const exam = await createExam({
    title: `Exam Smoke ${Date.now()}`,
    examType: 'Internal',
    academicYearId: assignment.academicYearId.toString(),
    programId: assignment.courseId.programId.toString(),
    semesterId: assignment.semesterId.toString(),
    status: 'Scheduled',
  }, actor)
  const schedule = await createSchedule(exam.id, { courseId: assignment.courseId._id.toString(), date: '2026-10-10', startTime: '09:00', endTime: '10:00', roomId: room._id.toString(), maxMarks: 100, passingMarks: 40 })
  await assert.rejects(() => createSchedule(exam.id, { courseId: assignment.courseId._id.toString(), date: '2026-10-11', startTime: '09:00', endTime: '10:00', roomId: roomTwo._id.toString(), maxMarks: 100, passingMarks: 40 }), /already has a schedule/)
  const otherAssignment = await CourseAssignment.findOne({ _id: { $ne: assignment._id }, status: 'Active' }).populate('courseId').lean()
  if (otherAssignment?.courseId?.programId?.toString() === assignment.courseId.programId.toString() && otherAssignment?.semesterId?.toString() === assignment.semesterId.toString()) {
    await assert.rejects(() => createSchedule(exam.id, { courseId: otherAssignment.courseId._id.toString(), date: '2026-10-10', startTime: '09:30', endTime: '10:30', roomId: room._id.toString(), maxMarks: 100, passingMarks: 40 }), /room is already/i)
  }
  await assert.rejects(() => createSchedule(exam.id, { courseId: assignment.courseId._id.toString(), date: '2026-10-12', startTime: '11:00', endTime: '10:00', maxMarks: 100, passingMarks: 40 }), /Start time/)

  const enrollment = await StudentCourse.findOne({ courseId: assignment.courseId._id, status: 'Enrolled' }).lean()
  assert.ok(enrollment, 'Enrollment exists')
  const student = await Student.findById(enrollment.studentId).lean()
  const otherStudent = await Student.findOne({ _id: { $ne: enrollment.studentId } }).lean()
  if (otherStudent) await assert.rejects(() => upsertResult({ scheduleId: schedule.id, studentId: otherStudent._id.toString(), marksObtained: 70 }, actor), /Only enrolled/)
  await assert.rejects(() => upsertResult({ scheduleId: schedule.id, studentId: enrollment.studentId.toString(), marksObtained: 101 }, actor), /greater than max/)
  await upsertResult({ scheduleId: schedule.id, studentId: enrollment.studentId.toString(), marksObtained: 82 }, actor)

  const beforePublish = await getStudentPortalResults({ student: { id: student._id.toString() } })
  assert.equal(beforePublish.items.some((item) => item.examId._id?.toString?.() === exam.id), false, 'Student cannot see unpublished result')
  await publishResults(exam.id)
  const afterPublish = await getStudentPortalResults({ student: { id: student._id.toString() } })
  assert.equal(afterPublish.items.some((item) => item.examId._id?.toString?.() === exam.id), true, 'Student can see own published result')

  const teacherUser = { id: String(assignment.staffId.userId ?? ''), email: assignment.staffId.email, role: 'Teacher', name: assignment.staffId.name }
  const teacherResult = await upsertResult({ scheduleId: schedule.id, studentId: enrollment.studentId.toString(), marksObtained: 84 }, teacherUser)
  assert.ok(teacherResult.id, 'Assigned teacher can enter result')
  await generateHallTickets(exam.id, actor)

  console.log('Exam workflow smoke tests passed')
} catch (error) {
  console.error('Exam workflow smoke tests failed:')
  console.error(error)
  process.exitCode = 1
} finally {
  await disconnectDatabase()
}
