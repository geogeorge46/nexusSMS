import { CourseAssignment } from '../models/CourseAssignment.js'
import { Room } from '../models/Room.js'
import { Staff } from '../models/Staff.js'
import { StudentCourse } from '../models/StudentCourse.js'
import { TimetableSlot } from '../models/TimetableSlot.js'
import {
  httpError,
  resolveAcademicYear,
  resolveCourse,
  resolveDepartment,
  resolveProgram,
  resolveSemester,
  resolveStaff,
} from './institutionService.js'

const slotPopulate = [
  { path: 'departmentId', select: 'name code' },
  { path: 'programId', select: 'name code' },
  { path: 'semesterId', select: 'name number' },
  { path: 'academicYearId', select: 'name' },
  { path: 'courseId', select: 'title code courseNumber capacity status' },
  { path: 'staffId', select: 'name employeeNumber email category designation status' },
  { path: 'roomId', select: 'name roomNumber building capacity type status' },
]

export async function listRooms(filters = {}) {
  const query = {}
  if (filters.status && filters.status !== 'All') query.status = filters.status
  if (filters.type && filters.type !== 'All') query.type = filters.type
  if (filters.search) query.$text = { $search: filters.search }
  const items = await Room.find(query).sort({ building: 1, roomNumber: 1 }).lean()
  return { items: items.map(serialize) }
}

export async function createRoom(payload) {
  const room = await Room.create({
    name: requiredText(payload.name, 'Room name is required'),
    roomNumber: requiredText(payload.roomNumber, 'Room number is required'),
    building: requiredText(payload.building, 'Building is required'),
    capacity: positiveNumber(payload.capacity, 'Room capacity must be greater than zero'),
    type: payload.type ?? 'Classroom',
    status: payload.status ?? 'Active',
  })
  return serialize(room.toObject())
}

export async function updateRoom(id, payload) {
  const update = {}
  for (const key of ['name', 'roomNumber', 'building', 'type', 'status']) if (payload[key] !== undefined) update[key] = payload[key]
  if (payload.capacity !== undefined) update.capacity = positiveNumber(payload.capacity, 'Room capacity must be greater than zero')
  const room = await Room.findByIdAndUpdate(id, update, { returnDocument: 'after', runValidators: true }).lean()
  if (!room) throw httpError(404, 'Room not found')
  return serialize(room)
}

export async function deleteRoom(id) {
  const room = await Room.findByIdAndUpdate(id, { status: 'Inactive' }, { returnDocument: 'after' }).lean()
  if (!room) throw httpError(404, 'Room not found')
  return serialize(room)
}

export async function listSlots(filters = {}) {
  const query = {}
  for (const key of ['programId', 'semesterId', 'academicYearId', 'courseId', 'staffId', 'roomId', 'dayOfWeek']) {
    if (filters[key]) query[key] = filters[key]
  }
  if (filters.status && filters.status !== 'All') query.status = filters.status
  const items = await TimetableSlot.find(query).populate(slotPopulate).sort({ dayOfWeek: 1, startTime: 1 }).lean()
  return { items: items.map(serializeSlot) }
}

export async function createSlot(payload, user) {
  const normalized = await validateSlotPayload(payload)
  await ensureNoConflicts(normalized)
  const slot = await TimetableSlot.create({ ...normalized, status: payload.status ?? 'Active', createdBy: actor(user) })
  return serializeSlot(await TimetableSlot.findById(slot._id).populate(slotPopulate).lean())
}

export async function updateSlot(id, payload) {
  const current = await TimetableSlot.findById(id).lean()
  if (!current) throw httpError(404, 'Timetable slot not found')
  const normalized = await validateSlotPayload({ ...current, ...payload })
  await ensureNoConflicts(normalized, id)
  const slot = await TimetableSlot.findByIdAndUpdate(
    id,
    { ...normalized, status: payload.status ?? current.status },
    { returnDocument: 'after', runValidators: true },
  ).populate(slotPopulate).lean()
  return serializeSlot(slot)
}

export async function deleteSlot(id) {
  const slot = await TimetableSlot.findByIdAndUpdate(id, { status: 'Cancelled' }, { returnDocument: 'after' })
    .populate(slotPopulate)
    .lean()
  if (!slot) throw httpError(404, 'Timetable slot not found')
  return serializeSlot(slot)
}

export async function getProgramTimetable(programId, semesterId, filters = {}) {
  return listSlots({ ...filters, programId, semesterId, status: filters.status ?? 'Active' })
}

export async function getTeacherTimetable(teacherId, user, filters = {}) {
  const staff = await resolveStaff(teacherId, { category: 'Teaching' })
  if (user.role === 'Teacher') {
    const ownStaff = await Staff.findOne({ $or: [{ userId: user.id }, { email: user.email }], category: 'Teaching', status: 'Active' }).lean()
    if (!ownStaff || ownStaff._id.toString() !== staff._id.toString()) throw httpError(403, 'Teachers can only view their own timetable')
  }
  return listSlots({ ...filters, staffId: staff._id.toString(), status: filters.status ?? 'Active' })
}

export async function getOwnTeacherTimetable(user, filters = {}) {
  const staff = await Staff.findOne({ $or: [{ userId: user.id }, { email: user.email }], category: 'Teaching', status: 'Active' }).lean()
  if (!staff) throw httpError(403, 'Only active teaching staff can view teacher timetable')
  return listSlots({ ...filters, staffId: staff._id.toString(), status: filters.status ?? 'Active' })
}

export async function getRoomTimetable(roomId, filters = {}) {
  const room = await Room.findById(roomId).lean()
  if (!room) throw httpError(404, 'Room not found')
  return listSlots({ ...filters, roomId, status: filters.status ?? 'Active' })
}

export async function getStudentTimetable(studentId) {
  const enrollments = await StudentCourse.find({ studentId, status: 'Enrolled' }).select('courseId').lean()
  const courseIds = enrollments.map((item) => item.courseId)
  if (courseIds.length === 0) return { items: [], source: 'timetable-slots' }
  const items = await TimetableSlot.find({ courseId: { $in: courseIds }, status: 'Active' })
    .populate(slotPopulate)
    .sort({ dayOfWeek: 1, startTime: 1 })
    .lean()
  return { items: items.map(serializePortalSlot), source: 'timetable-slots' }
}

async function validateSlotPayload(payload) {
  const course = await resolveCourse(payload.courseId)
  if (course.status !== 'Active') throw httpError(400, 'Inactive courses cannot be scheduled')
  const department = await resolveDepartment(payload.departmentId ?? course.departmentId)
  const program = await resolveProgram(payload.programId ?? course.programId, { departmentId: department._id })
  const academicYear = await resolveAcademicYear(payload.academicYearId)
  const semester = await resolveSemester(payload.semesterId ?? course.semesterId, { academicYearId: academicYear._id })
  const staff = await resolveStaff(payload.staffId ?? payload.teacherId, { category: 'Teaching' })
  const room = await Room.findById(payload.roomId).lean()
  if (!room) throw httpError(404, 'Room not found')
  if (room.status !== 'Active') throw httpError(400, 'Inactive rooms cannot be scheduled')
  if (Number(room.capacity) < Number(course.capacity || 0)) throw httpError(400, 'Room capacity is lower than the course capacity')

  const dayOfWeek = requiredText(payload.dayOfWeek, 'Day of week is required')
  const startTime = normalizeTime(payload.startTime, 'Start time is required')
  const endTime = normalizeTime(payload.endTime, 'End time is required')
  if (minutes(startTime) >= minutes(endTime)) throw httpError(400, 'Start time must be before end time')

  const assignment = await CourseAssignment.findOne({
    courseId: course._id,
    staffId: staff._id,
    academicYearId: academicYear._id,
    semesterId: semester._id,
    status: 'Active',
  }).lean()
  if (!assignment) throw httpError(400, 'Teacher is not assigned to this course for the selected academic year and semester')

  if (course.programId && course.programId.toString() !== program._id.toString()) throw httpError(400, 'Course does not belong to the selected program')
  if (course.semesterId && course.semesterId.toString() !== semester._id.toString()) throw httpError(400, 'Course does not belong to the selected semester')

  return {
    departmentId: department._id,
    programId: program._id,
    semesterId: semester._id,
    academicYearId: academicYear._id,
    courseId: course._id,
    staffId: staff._id,
    roomId: room._id,
    dayOfWeek,
    startTime,
    endTime,
    slotType: payload.slotType ?? 'Lecture',
  }
}

async function ensureNoConflicts(slot, excludeId) {
  const base = { dayOfWeek: slot.dayOfWeek, status: 'Active' }
  if (excludeId) base._id = { $ne: excludeId }
  const candidates = await TimetableSlot.find(base).lean()
  const overlapping = candidates.filter((item) => overlaps(slot, item))

  if (overlapping.some((item) => item.programId.toString() === slot.programId.toString() && item.semesterId.toString() === slot.semesterId.toString())) {
    throw httpError(409, 'Program and semester already have a class during this time')
  }
  if (overlapping.some((item) => item.staffId.toString() === slot.staffId.toString())) {
    throw httpError(409, 'Teacher already has a class during this time')
  }
  if (overlapping.some((item) => item.roomId.toString() === slot.roomId.toString())) {
    throw httpError(409, 'Room is already allocated during this time')
  }
}

function overlaps(left, right) {
  return minutes(left.startTime) < minutes(right.endTime) && minutes(left.endTime) > minutes(right.startTime)
}

function serializeSlot(slot) {
  return {
    ...serialize(slot),
    teacherId: slot.staffId,
    teacherName: slot.staffId?.name ?? '',
    courseName: slot.courseId?.title ?? '',
    roomName: slot.roomId?.name ?? '',
    time: `${slot.startTime} - ${slot.endTime}`,
  }
}

function serializePortalSlot(slot) {
  return {
    id: slot._id.toString(),
    day: slot.dayOfWeek,
    time: `${slot.startTime} - ${slot.endTime}`,
    course: slot.courseId?.title ?? 'Unknown Course',
    courseCode: slot.courseId?.code ?? '',
    room: slot.roomId ? `${slot.roomId.name} (${slot.roomId.roomNumber})` : 'Room pending',
    faculty: slot.staffId?.name ?? 'Faculty pending',
    slotType: slot.slotType,
    building: slot.roomId?.building ?? '',
  }
}

function serialize(item) {
  return { ...item, id: item._id?.toString?.() ?? item.id }
}

function actor(user) {
  return { userId: user.id, name: user.name, role: user.role }
}

function requiredText(value, message) {
  const text = String(value ?? '').trim()
  if (!text) throw httpError(400, message)
  return text
}

function positiveNumber(value, message) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) throw httpError(400, message)
  return number
}

function normalizeTime(value, message) {
  const text = requiredText(value, message)
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(text)) throw httpError(400, 'Time must use HH:mm format')
  return text
}

function minutes(value) {
  const [hours, mins] = value.split(':').map(Number)
  return hours * 60 + mins
}
