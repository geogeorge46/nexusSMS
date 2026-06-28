import { ParentProfile } from '../models/ParentProfile.js'
import { Student } from '../models/Student.js'
import { listNotifications, markNotificationRead } from './notificationService.js'
import {
  getStudentPortalProfile,
  listStudentPortalAttendance,
  listStudentPortalDocuments,
  listStudentPortalGrades,
} from './studentPortalService.js'
import { listOwnReceipts, listOwnStudentFees } from './feeService.js'
import { getStudentTimetable } from './timetableService.js'
import { getStudentPortalResults } from './examService.js'
import { listStudentAssignments, listStudentMaterials } from './lmsService.js'

export async function getParentProfile(user) {
  const parent = await ParentProfile.findById(user.parent.id).lean()
  if (!parent || parent.status !== 'Active') throw httpError(403, 'Parent profile is inactive')
  return { parent: serializeParent(parent) }
}

export async function listParentStudents(user) {
  const students = await Student.find({ _id: { $in: user.parent.linkedStudentIds }, status: { $ne: 'Inactive' } }).sort({ name: 1 }).lean()
  return { items: students.map(serializeStudent) }
}

export async function getParentStudentProfile(user, studentId) {
  return getStudentPortalProfile(asStudentUser(user, await ensureLinkedStudent(user, studentId)))
}

export async function getParentStudentAttendance(user, studentId) {
  return listStudentPortalAttendance(asStudentUser(user, await ensureLinkedStudent(user, studentId)))
}

export async function getParentStudentGrades(user, studentId) {
  return listStudentPortalGrades(asStudentUser(user, await ensureLinkedStudent(user, studentId)))
}

export async function getParentStudentResults(user, studentId) {
  return getStudentPortalResults(asStudentUser(user, await ensureLinkedStudent(user, studentId)))
}

export async function getParentStudentFees(user, studentId) {
  return listOwnStudentFees(asStudentUser(user, await ensureLinkedStudent(user, studentId)))
}

export async function getParentStudentReceipts(user, studentId) {
  return listOwnReceipts(asStudentUser(user, await ensureLinkedStudent(user, studentId)))
}

export async function getParentStudentAssignments(user, studentId) {
  return listStudentAssignments(asStudentUser(user, await ensureLinkedStudent(user, studentId)))
}

export async function getParentStudentMaterials(user, studentId) {
  return listStudentMaterials(asStudentUser(user, await ensureLinkedStudent(user, studentId)))
}

export async function getParentStudentTimetable(user, studentId) {
  const student = await ensureLinkedStudent(user, studentId)
  return getStudentTimetable(student._id.toString())
}

export async function getParentStudentDocuments(user, studentId) {
  return listStudentPortalDocuments(asStudentUser(user, await ensureLinkedStudent(user, studentId)))
}

export function listParentNotifications(user, filters = {}) {
  return listNotifications({ ...filters, user })
}

export function markParentNotificationRead(user, notificationId) {
  return markNotificationRead(notificationId, user)
}

async function ensureLinkedStudent(user, studentId) {
  if (!user.parent.linkedStudentIds.includes(String(studentId))) throw httpError(403, 'Parent cannot access an unlinked student')
  const student = await Student.findOne({ _id: studentId, status: { $ne: 'Inactive' } }).lean()
  if (!student) throw httpError(404, 'Linked student not found')
  return student
}

function asStudentUser(parentUser, student) {
  return {
    id: parentUser.id,
    name: parentUser.name,
    email: parentUser.email,
    role: 'Parent',
    student: {
      id: student._id.toString(),
      registerNumber: student.registerNumber,
      name: student.name,
      email: student.email,
      department: student.department,
      program: student.program,
      semesterId: student.semesterId?.toString?.() ?? '',
    },
  }
}

function serializeParent(parent) {
  return {
    id: parent._id.toString(),
    name: parent.name,
    email: parent.email,
    phone: parent.phone,
    relationship: parent.relationship,
    linkedStudentIds: parent.linkedStudentIds.map((id) => id.toString()),
    status: parent.status,
  }
}

function serializeStudent(student) {
  return {
    id: student._id.toString(),
    registerNumber: student.registerNumber,
    name: student.name,
    email: student.email,
    department: student.department,
    program: student.program,
    year: student.year,
    batch: student.batch,
    status: student.status,
  }
}

function httpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}
