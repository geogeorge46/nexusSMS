#!/usr/bin/env node

import 'dotenv/config'
import assert from 'node:assert/strict'

import { connectDatabase, disconnectDatabase } from '../server/config/db.js'
import { env, validateRuntimeEnv } from '../server/config/env.js'
import { Course } from '../server/models/Course.js'
import { CourseAssignment } from '../server/models/CourseAssignment.js'
import { Room } from '../server/models/Room.js'
import { Staff } from '../server/models/Staff.js'
import { Student } from '../server/models/Student.js'
import { TimetableSlot } from '../server/models/TimetableSlot.js'
import { createSlot, getOwnTeacherTimetable, getStudentTimetable, updateRoom } from '../server/services/timetableService.js'

const actor = { id: 'timetable-test', name: 'Timetable Test Admin', role: 'Super Admin' }

try {
  validateRuntimeEnv()
  await connectDatabase(env.mongoUri)

  const assignments = await CourseAssignment.find({ status: 'Active' }).populate('courseId').populate('staffId').lean()
  const base = assignments.find((item) => item.courseId?.status === 'Active' && item.staffId?.status === 'Active')
  assert.ok(base, 'Active course assignment exists')

  const room = await Room.findOneAndUpdate(
    { roomNumber: 'TT-TEST-1' },
    { $set: { name: 'Timetable Test Room', roomNumber: 'TT-TEST-1', building: 'QA Block', capacity: 999, type: 'Classroom', status: 'Active' } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  )
  const roomTwo = await Room.findOneAndUpdate(
    { roomNumber: 'TT-TEST-2' },
    { $set: { name: 'Timetable Test Room Two', roomNumber: 'TT-TEST-2', building: 'QA Block', capacity: 999, type: 'Classroom', status: 'Active' } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  )
  const inactiveRoom = await Room.findOneAndUpdate(
    { roomNumber: 'TT-INACTIVE' },
    { $set: { name: 'Inactive Timetable Room', roomNumber: 'TT-INACTIVE', building: 'QA Block', capacity: 999, type: 'Classroom', status: 'Inactive' } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  )

  await TimetableSlot.deleteMany({ 'createdBy.userId': actor.id })
  const payload = buildPayload(base, room._id.toString(), 'Wednesday', '14:00', '15:00')
  const valid = await createSlot(payload, actor)
  assert.ok(valid.id, 'Valid timetable slot created')

  await assert.rejects(() => createSlot({ ...payload, roomId: roomTwo._id.toString(), startTime: '15:00', endTime: '14:00' }, actor), /Start time must be before end time/)
  await assert.rejects(() => createSlot({ ...payload, roomId: inactiveRoom._id.toString(), startTime: '16:00', endTime: '17:00' }, actor), /Inactive rooms/)
  await assert.rejects(() => createSlot({ ...payload, roomId: roomTwo._id.toString(), startTime: '14:15', endTime: '14:45' }, actor), /Program and semester/)

  const otherStaff = await Staff.findOne({ _id: { $ne: base.staffId._id }, category: 'Teaching', status: 'Active' }).lean()
  if (otherStaff) {
    await assert.rejects(() => createSlot({ ...payload, staffId: otherStaff._id.toString(), roomId: roomTwo._id.toString(), startTime: '16:00', endTime: '17:00' }, actor), /not assigned/)
  }

  const teacherConflict = await findOrCreateSameTeacherDifferentBatch(base, assignments)
  if (teacherConflict) {
    await assert.rejects(() => createSlot(buildPayload(teacherConflict, roomTwo._id.toString(), 'Wednesday', '14:10', '14:50'), actor), /Teacher already/)
  }

  const roomConflict = await findOrCreateDifferentBatchDifferentTeacher(base, assignments)
  if (roomConflict) {
    await assert.rejects(() => createSlot(buildPayload(roomConflict, room._id.toString(), 'Wednesday', '14:10', '14:50'), actor), /Room is already/)
  }

  const student = await Student.findOne({ status: { $ne: 'Inactive' } }).lean()
  assert.ok(student, 'Student exists')
  const studentTimetable = await getStudentTimetable(student._id.toString())
  assert.ok(studentTimetable.items.every((item) => item.id), 'Student timetable returns own slot-shaped records')

  const teacherUser = { id: String(base.staffId.userId ?? ''), email: base.staffId.email, role: 'Teacher' }
  const teacherTimetable = await getOwnTeacherTimetable(teacherUser)
  assert.ok(teacherTimetable.items.every((item) => String(item.staffId._id) === String(base.staffId._id)), 'Teacher timetable returns only own slots')

  await updateRoom(inactiveRoom._id.toString(), { status: 'Inactive', capacity: 999 })
  console.log('Timetable workflow smoke tests passed')
} catch (error) {
  console.error('Timetable workflow smoke tests failed:')
  console.error(error)
  process.exitCode = 1
} finally {
  await disconnectDatabase()
}

function buildPayload(assignment, roomId, dayOfWeek, startTime, endTime) {
  return {
    departmentId: assignment.courseId.departmentId.toString(),
    programId: assignment.courseId.programId.toString(),
    semesterId: assignment.semesterId.toString(),
    academicYearId: assignment.academicYearId.toString(),
    courseId: assignment.courseId._id.toString(),
    staffId: assignment.staffId._id.toString(),
    roomId,
    dayOfWeek,
    startTime,
    endTime,
    slotType: 'Lecture',
  }
}

async function findOrCreateSameTeacherDifferentBatch(base, assignments) {
  const existing = assignments.find((item) =>
    String(item.staffId?._id) === String(base.staffId._id)
    && (String(item.courseId?.programId) !== String(base.courseId.programId) || String(item.semesterId) !== String(base.semesterId)),
  )
  if (existing) return existing
  const course = await Course.findOne({ _id: { $ne: base.courseId._id }, status: 'Active', capacity: { $lte: 999 } }).lean()
  if (!course) return null
  const assignment = await CourseAssignment.findOneAndUpdate(
    { courseId: course._id, staffId: base.staffId._id, academicYearId: base.academicYearId, semesterId: course.semesterId ?? base.semesterId },
    { $set: { courseId: course._id, staffId: base.staffId._id, academicYearId: base.academicYearId, semesterId: course.semesterId ?? base.semesterId, role: 'Assistant', status: 'Active' } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  ).populate('courseId').populate('staffId').lean()
  return assignment
}

async function findOrCreateDifferentBatchDifferentTeacher(base, assignments) {
  return assignments.find((item) =>
    String(item.staffId?._id) !== String(base.staffId._id)
    && (String(item.courseId?.programId) !== String(base.courseId.programId) || String(item.semesterId) !== String(base.semesterId)),
  ) ?? null
}
