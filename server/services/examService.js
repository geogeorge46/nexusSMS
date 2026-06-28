import { Attendance } from '../models/Attendance.js'
import { CourseAssignment } from '../models/CourseAssignment.js'
import { Exam } from '../models/Exam.js'
import { ExamResult } from '../models/ExamResult.js'
import { ExamSchedule } from '../models/ExamSchedule.js'
import { HallTicket } from '../models/HallTicket.js'
import { Room } from '../models/Room.js'
import { Staff } from '../models/Staff.js'
import { Student } from '../models/Student.js'
import { StudentCourse } from '../models/StudentCourse.js'
import { StudentFee } from '../models/StudentFee.js'
import { User } from '../models/User.js'
import { createNotification } from './notificationService.js'
import { httpError, resolveAcademicYear, resolveCourse, resolveProgram, resolveSemester, resolveStudent } from './institutionService.js'

const examPopulate = [
  { path: 'academicYearId', select: 'name' },
  { path: 'programId', select: 'name code' },
  { path: 'semesterId', select: 'name number' },
]
const schedulePopulate = [
  { path: 'examId', select: 'title examType status programId semesterId academicYearId' },
  { path: 'courseId', select: 'title code courseNumber programId semesterId capacity status' },
  { path: 'roomId', select: 'name roomNumber building capacity type status' },
  { path: 'invigilators', select: 'name employeeNumber email' },
]
const resultPopulate = [
  { path: 'examId', select: 'title examType status' },
  { path: 'scheduleId', select: 'date startTime endTime' },
  { path: 'studentId', select: 'name email registerNumber' },
  { path: 'courseId', select: 'title code courseNumber' },
]
const ticketPopulate = [
  { path: 'examId', select: 'title examType status' },
  { path: 'studentId', select: 'name email registerNumber' },
  { path: 'eligibleCourses', select: 'title code' },
  { path: 'blockedCourses', select: 'title code' },
]

export async function listExams(filters = {}) {
  const query = {}
  if (filters.status && filters.status !== 'All') query.status = filters.status
  if (filters.programId) query.programId = filters.programId
  const items = await Exam.find(query).populate(examPopulate).sort({ createdAt: -1 }).lean()
  return { items: items.map(serialize) }
}

export async function createExam(payload, user) {
  const scope = await resolveExamScope(payload)
  const exam = await Exam.create({
    title: requiredText(payload.title, 'Exam title is required'),
    examType: payload.examType,
    ...scope,
    status: payload.status ?? 'Draft',
    createdBy: actor(user),
  })
  return serialize(await Exam.findById(exam._id).populate(examPopulate).lean())
}

export async function updateExam(id, payload) {
  const current = await Exam.findById(id).lean()
  if (!current) throw httpError(404, 'Exam not found')
  const update = {}
  if (payload.title !== undefined) update.title = requiredText(payload.title, 'Exam title is required')
  for (const key of ['examType', 'status']) if (payload[key] !== undefined) update[key] = payload[key]
  if (payload.academicYearId || payload.programId || payload.semesterId) Object.assign(update, await resolveExamScope({ ...current, ...payload }))
  const exam = await Exam.findByIdAndUpdate(id, update, { returnDocument: 'after', runValidators: true }).populate(examPopulate).lean()
  return serialize(exam)
}

export async function deleteExam(id) {
  const exam = await Exam.findByIdAndUpdate(id, { status: 'Cancelled' }, { returnDocument: 'after' }).populate(examPopulate).lean()
  if (!exam) throw httpError(404, 'Exam not found')
  return serialize(exam)
}

export async function listSchedules(examId, filters = {}) {
  const query = examId ? { examId } : {}
  if (filters.courseId) query.courseId = filters.courseId
  const items = await ExamSchedule.find(query).populate(schedulePopulate).sort({ date: 1, startTime: 1 }).lean()
  return { items: items.map(serializeSchedule) }
}

export async function createSchedule(examId, payload) {
  const normalized = await normalizeSchedule(examId, payload)
  await ensureScheduleConflicts(normalized)
  const schedule = await ExamSchedule.create(normalized)
  await Exam.findByIdAndUpdate(examId, { status: 'Scheduled' })
  return serializeSchedule(await ExamSchedule.findById(schedule._id).populate(schedulePopulate).lean())
}

export async function updateSchedule(id, payload) {
  const current = await ExamSchedule.findById(id).lean()
  if (!current) throw httpError(404, 'Exam schedule not found')
  const normalized = await normalizeSchedule(current.examId, { ...current, ...payload })
  await ensureScheduleConflicts(normalized, id)
  const schedule = await ExamSchedule.findByIdAndUpdate(id, { ...normalized, status: payload.status ?? current.status }, { returnDocument: 'after', runValidators: true })
    .populate(schedulePopulate)
    .lean()
  return serializeSchedule(schedule)
}

export async function deleteSchedule(id) {
  const schedule = await ExamSchedule.findByIdAndUpdate(id, { status: 'Cancelled' }, { returnDocument: 'after' }).populate(schedulePopulate).lean()
  if (!schedule) throw httpError(404, 'Exam schedule not found')
  return serializeSchedule(schedule)
}

export async function listAssignedTeacherSchedules(user) {
  const staff = await Staff.findOne({ $or: [{ userId: user.id }, { email: user.email }], category: 'Teaching', status: 'Active' }).lean()
  if (!staff) throw httpError(403, 'Only active teaching staff can view assigned exam schedules')
  const assignments = await CourseAssignment.find({ staffId: staff._id, status: 'Active' }).select('courseId').lean()
  return listSchedules(null, { courseId: { $in: assignments.map((item) => item.courseId) } })
}

export async function upsertResult(payload, user, id) {
  const schedule = await ExamSchedule.findById(payload.scheduleId).populate('examId').lean()
  if (!schedule) throw httpError(404, 'Exam schedule not found')
  const student = await resolveStudent(payload.studentId)
  await ensureStudentEnrollment(student._id, schedule.courseId, schedule.examId.academicYearId, schedule.examId.semesterId)
  await ensureTeacherCanResult(user, schedule.courseId, schedule.examId.academicYearId, schedule.examId.semesterId)

  const marksObtained = Number(payload.marksObtained)
  const maxMarks = Number(payload.maxMarks ?? schedule.maxMarks)
  if (!Number.isFinite(marksObtained) || marksObtained < 0 || marksObtained > maxMarks) throw httpError(400, 'Marks cannot be negative or greater than max marks')
  const resultStatus = payload.resultStatus === 'Absent' || payload.resultStatus === 'Withheld'
    ? payload.resultStatus
    : marksObtained >= schedule.passingMarks ? 'Pass' : 'Fail'
  const percentage = Math.round((marksObtained / maxMarks) * 10000) / 100
  const values = {
    examId: schedule.examId._id,
    scheduleId: schedule._id,
    studentId: student._id,
    courseId: schedule.courseId,
    marksObtained,
    maxMarks,
    percentage,
    gradeLetter: gradeLetter(percentage),
    resultStatus,
    remarks: String(payload.remarks ?? '').trim(),
    createdBy: actor(user),
  }

  const result = id
    ? await ExamResult.findByIdAndUpdate(id, values, { returnDocument: 'after', runValidators: true })
    : await ExamResult.findOneAndUpdate({ examId: values.examId, scheduleId: values.scheduleId, studentId: values.studentId }, { $set: values }, { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true, runValidators: true })
  return serializeResult(await ExamResult.findById(result._id).populate(resultPopulate).lean())
}

export async function publishResults(examId) {
  const publishedAt = new Date()
  const result = await ExamResult.updateMany({ examId }, { publishedAt })
  await Exam.findByIdAndUpdate(examId, { status: 'Published' })
  await notifyStudentsForExam(examId, 'Exam results published', 'Your exam results are now available in the student portal.')
  return { modifiedCount: result.modifiedCount, publishedAt }
}

export async function listResults(filters = {}) {
  const query = {}
  if (filters.examId) query.examId = filters.examId
  if (filters.studentId) query.studentId = filters.studentId
  if (filters.publishedOnly) query.publishedAt = { $exists: true }
  const items = await ExamResult.find(query).populate(resultPopulate).sort({ createdAt: -1 }).lean()
  return { items: items.map(serializeResult) }
}

export async function generateHallTickets(examId, user) {
  const exam = await Exam.findById(examId).lean()
  if (!exam) throw httpError(404, 'Exam not found')
  const schedules = await ExamSchedule.find({ examId, status: { $ne: 'Cancelled' } }).lean()
  const courseIds = schedules.map((item) => item.courseId)
  const students = await Student.find({ programId: exam.programId, semesterId: exam.semesterId, academicYearId: exam.academicYearId, status: 'Active' }).lean()
  const tickets = []

  for (const student of students) {
    const { eligibleCourses, blockedCourses, reasons } = await evaluateEligibility(student, courseIds)
    const status = reasons.length ? 'Blocked' : 'Generated'
    const ticket = await HallTicket.findOneAndUpdate(
      { studentId: student._id, examId },
      {
        $set: {
          hallTicketNumber: `HT-${new Date().getFullYear()}-${student.registerNumber}-${String(examId).slice(-4)}`,
          eligibleCourses,
          blockedCourses,
          status,
          reason: reasons.join(' '),
          generatedAt: new Date(),
          generatedBy: actor(user),
        },
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true, runValidators: true },
    ).populate(ticketPopulate).lean()
    tickets.push(serialize(ticket))
  }
  await notifyStudentsForExam(examId, 'Hall ticket updated', 'Your hall ticket status is available in the student portal.')
  return { items: tickets, summary: { generated: tickets.filter((item) => item.status === 'Generated').length, blocked: tickets.filter((item) => item.status === 'Blocked').length } }
}

export async function listHallTickets(examId, filters = {}) {
  const query = examId ? { examId } : {}
  if (filters.studentId) query.studentId = filters.studentId
  const items = await HallTicket.find(query).populate(ticketPopulate).sort({ generatedAt: -1 }).lean()
  return { items: items.map(serialize) }
}

export async function getExamReports() {
  const [exams, schedules, results, tickets] = await Promise.all([
    Exam.countDocuments(),
    ExamSchedule.countDocuments({ status: { $ne: 'Cancelled' } }),
    ExamResult.countDocuments(),
    HallTicket.countDocuments(),
  ])
  return { summary: { exams, schedules, results, tickets } }
}

export async function getStudentPortalExams(user) {
  const student = await Student.findById(user.student.id).lean()
  const items = await Exam.find({ programId: student.programId, semesterId: student.semesterId, academicYearId: student.academicYearId, status: { $ne: 'Cancelled' } }).populate(examPopulate).sort({ createdAt: -1 }).lean()
  return { items: items.map(serialize) }
}

export async function getStudentPortalTickets(user) {
  return listHallTickets(null, { studentId: user.student.id })
}

export async function getStudentPortalResults(user) {
  return listResults({ studentId: user.student.id, publishedOnly: true })
}

async function resolveExamScope(payload) {
  const academicYear = await resolveAcademicYear(payload.academicYearId)
  const program = await resolveProgram(payload.programId)
  const semester = await resolveSemester(payload.semesterId, { academicYearId: academicYear._id })
  return { academicYearId: academicYear._id, programId: program._id, semesterId: semester._id }
}

async function normalizeSchedule(examId, payload) {
  const exam = await Exam.findById(examId).lean()
  if (!exam) throw httpError(404, 'Exam not found')
  const course = await resolveCourse(payload.courseId)
  if (course.status !== 'Active') throw httpError(400, 'Inactive courses cannot be scheduled for exams')
  if (course.programId?.toString() !== exam.programId.toString() || course.semesterId?.toString() !== exam.semesterId.toString()) throw httpError(400, 'Exam schedule course must belong to exam program and semester')
  const startTime = normalizeTime(payload.startTime)
  const endTime = normalizeTime(payload.endTime)
  if (minutes(startTime) >= minutes(endTime)) throw httpError(400, 'Start time must be before end time')
  const roomId = payload.roomId || undefined
  if (roomId) {
    const room = await Room.findById(roomId).lean()
    if (!room || room.status !== 'Active') throw httpError(400, 'Exam room must exist and be active')
  }
  const maxMarks = Number(payload.maxMarks)
  const passingMarks = Number(payload.passingMarks)
  if (!Number.isFinite(maxMarks) || maxMarks <= 0 || !Number.isFinite(passingMarks) || passingMarks < 0 || passingMarks > maxMarks) throw httpError(400, 'Exam marks configuration is invalid')
  return { examId, courseId: course._id, date: new Date(payload.date), startTime, endTime, roomId, maxMarks, passingMarks, invigilators: payload.invigilators ?? [], status: payload.status ?? 'Scheduled' }
}

async function ensureScheduleConflicts(schedule, excludeId) {
  const duplicateQuery = { examId: schedule.examId, courseId: schedule.courseId }
  if (excludeId) duplicateQuery._id = { $ne: excludeId }
  const duplicate = await ExamSchedule.exists(duplicateQuery)
  if (duplicate) throw httpError(409, 'This course already has a schedule for the selected exam')
  if (!schedule.roomId) return
  const query = { roomId: schedule.roomId, date: dayRange(schedule.date), status: { $ne: 'Cancelled' } }
  if (excludeId) query._id = { $ne: excludeId }
  const candidates = await ExamSchedule.find(query).lean()
  if (candidates.some((item) => minutes(schedule.startTime) < minutes(item.endTime) && minutes(schedule.endTime) > minutes(item.startTime))) throw httpError(409, 'Exam room is already allocated during this time')
}

async function ensureStudentEnrollment(studentId, courseId, academicYearId, semesterId) {
  const exists = await StudentCourse.exists({ studentId, courseId, academicYearId, semesterId, status: 'Enrolled' })
  if (!exists) throw httpError(400, 'Only enrolled students can receive exam results')
}

async function ensureTeacherCanResult(user, courseId, academicYearId, semesterId) {
  if (['Admin', 'Super Admin'].includes(user.role)) return
  const staff = await Staff.findOne({ $or: [{ userId: user.id }, { email: user.email }], category: 'Teaching', status: 'Active' }).lean()
  if (!staff) throw httpError(403, 'Only assigned teachers can enter exam results')
  const assigned = await CourseAssignment.exists({ staffId: staff._id, courseId, academicYearId, semesterId, status: 'Active' })
  if (!assigned) throw httpError(403, 'Teacher can enter results only for assigned courses')
}

async function evaluateEligibility(student, courseIds) {
  const enrollments = await StudentCourse.find({ studentId: student._id, courseId: { $in: courseIds }, status: 'Enrolled' }).lean()
  const enrolledIds = new Set(enrollments.map((item) => item.courseId.toString()))
  const eligibleCourses = []
  const blockedCourses = []
  const reasons = []
  for (const courseId of courseIds) {
    if (!enrolledIds.has(courseId.toString())) {
      blockedCourses.push(courseId)
      reasons.push('Student is not enrolled in every exam course.')
      continue
    }
    const attendance = await Attendance.find({ studentId: student._id, courseId }).lean()
    const percentage = attendance.length ? ((attendance.filter((item) => ['Present', 'Late', 'Excused'].includes(item.status)).length / attendance.length) * 100) : 100
    if (attendance.length && percentage < 75) {
      blockedCourses.push(courseId)
      reasons.push('Attendance is below 75%.')
    } else {
      eligibleCourses.push(courseId)
    }
  }
  const feeDue = await StudentFee.exists({ studentId: student._id, dueAmount: { $gt: 0 }, status: { $in: ['Unpaid', 'Partially Paid', 'Overdue'] } })
  if (feeDue) reasons.push('Fee dues are pending.')
  return { eligibleCourses, blockedCourses: feeDue ? courseIds : blockedCourses, reasons: [...new Set(reasons)] }
}

async function notifyStudentsForExam(examId, title, message) {
  const tickets = await HallTicket.find({ examId }).populate('studentId', 'email').lean()
  for (const ticket of tickets) {
    const user = await User.findOne({ $or: [{ studentId: ticket.studentId?._id }, { email: ticket.studentId?.email }], role: 'Student', status: 'Active' }).lean()
    if (user) await createNotification({ title, message, type: 'info', recipient: { userId: user._id.toString(), role: 'Student' } })
  }
}

function serializeSchedule(item) { return { ...serialize(item), time: `${item.startTime} - ${item.endTime}`, courseName: item.courseId?.title ?? '', roomName: item.roomId?.name ?? '' } }
function serializeResult(item) { return serialize(item) }
function serialize(item) { return { ...item, id: item._id?.toString?.() ?? item.id } }
function actor(user) { return { userId: user.id, name: user.name, role: user.role } }
function requiredText(value, message) { const text = String(value ?? '').trim(); if (!text) throw httpError(400, message); return text }
function normalizeTime(value) { const text = requiredText(value, 'Time is required'); if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(text)) throw httpError(400, 'Time must use HH:mm format'); return text }
function minutes(value) { const [h, m] = value.split(':').map(Number); return h * 60 + m }
function dayRange(value) { const start = new Date(value); start.setHours(0, 0, 0, 0); const end = new Date(start); end.setDate(end.getDate() + 1); return { $gte: start, $lt: end } }
function gradeLetter(p) { if (p >= 90) return 'A+'; if (p >= 80) return 'A'; if (p >= 70) return 'B'; if (p >= 60) return 'C'; if (p >= 50) return 'D'; return 'F' }
