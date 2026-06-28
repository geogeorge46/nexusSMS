#!/usr/bin/env node

import 'dotenv/config'

import { connectDatabase, disconnectDatabase } from '../server/config/db.js'
import { env, validateRuntimeEnv } from '../server/config/env.js'
import { CourseAssignment } from '../server/models/CourseAssignment.js'
import { Room } from '../server/models/Room.js'
import { TimetableSlot } from '../server/models/TimetableSlot.js'
import { createSlot } from '../server/services/timetableService.js'
import { assertSafeSeed } from './seedSafety.js'

const actor = { id: 'seed-timetable', name: 'Nexus Seed', role: 'Super Admin' }
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

try {
  assertSafeSeed('seed:timetable')
  validateRuntimeEnv()
  await connectDatabase(env.mongoUri)

  const rooms = await seedRooms()
  const assignments = await CourseAssignment.find({ status: 'Active' })
    .populate('courseId')
    .populate('staffId')
    .populate('academicYearId')
    .populate('semesterId')
    .limit(12)
    .lean()

  if (assignments.length === 0) throw new Error('Run npm run seed:institution before npm run seed:timetable')

  let created = 0
  for (const [index, assignment] of assignments.entries()) {
    if (!assignment.courseId || !assignment.staffId) continue
    const exists = await TimetableSlot.exists({ courseId: assignment.courseId._id, staffId: assignment.staffId._id, status: 'Active' })
    if (exists) continue
    const room = assignment.courseId.title?.toLowerCase().includes('lab') ? rooms.lab : rooms.classroom
    await createSlot({
      departmentId: assignment.courseId.departmentId?.toString(),
      programId: assignment.courseId.programId?.toString(),
      semesterId: assignment.semesterId._id.toString(),
      academicYearId: assignment.academicYearId._id.toString(),
      courseId: assignment.courseId._id.toString(),
      staffId: assignment.staffId._id.toString(),
      roomId: room._id.toString(),
      dayOfWeek: days[index % days.length],
      startTime: `${String(9 + (index % 5)).padStart(2, '0')}:00`,
      endTime: `${String(10 + (index % 5)).padStart(2, '0')}:00`,
      slotType: assignment.courseId.title?.toLowerCase().includes('lab') ? 'Lab' : 'Lecture',
    }, actor)
    created += 1
  }

  console.log('Timetable demo data ready')
  console.log(`Rooms seeded: ${Object.keys(rooms).join(', ')}`)
  console.log(`New slots created: ${created}`)
} catch (error) {
  console.error('Failed to seed timetable data:')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await disconnectDatabase()
}

async function seedRooms() {
  const rows = {
    classroom: ['Nexus Lecture Hall 101', 'LH-101', 'Academic Block A', 180, 'Classroom'],
    lab: ['Nexus Computing Lab 1', 'LAB-1', 'Innovation Block', 120, 'Lab'],
    seminar: ['Nexus Seminar Hall', 'SEM-201', 'Academic Block B', 150, 'Seminar Hall'],
    auditorium: ['Nexus Auditorium', 'AUD-1', 'Central Block', 500, 'Auditorium'],
  }
  const entries = await Promise.all(Object.entries(rows).map(async ([key, [name, roomNumber, building, capacity, type]]) => {
    const room = await Room.findOneAndUpdate(
      { roomNumber },
      { $set: { name, roomNumber, building, capacity, type, status: 'Active' } },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    )
    return [key, room]
  }))
  return Object.fromEntries(entries)
}
