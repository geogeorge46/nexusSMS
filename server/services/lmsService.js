import { Assignment } from '../models/Assignment.js'
import { AssignmentSubmission } from '../models/AssignmentSubmission.js'
import { CourseAssignment } from '../models/CourseAssignment.js'
import { LearningMaterial } from '../models/LearningMaterial.js'
import { Staff } from '../models/Staff.js'
import { StudentCourse } from '../models/StudentCourse.js'
import { User } from '../models/User.js'
import { createNotification } from './notificationService.js'
import { ensureEnrollment, httpError, resolveCourse, resolveStaff, resolveStudent } from './institutionService.js'

const assignmentPopulate = [
  { path: 'courseId', select: 'title code courseNumber status' },
  { path: 'staffId', select: 'name email employeeNumber' },
  { path: 'academicYearId', select: 'name' },
  { path: 'semesterId', select: 'name number' },
]
const submissionPopulate = [
  { path: 'assignmentId', select: 'title dueDate maxMarks status' },
  { path: 'studentId', select: 'name email registerNumber' },
  { path: 'courseId', select: 'title code courseNumber' },
]
const materialPopulate = [
  { path: 'courseId', select: 'title code courseNumber' },
  { path: 'staffId', select: 'name email employeeNumber' },
  { path: 'academicYearId', select: 'name' },
  { path: 'semesterId', select: 'name number' },
]

export async function listAssignments(filters = {}, user) {
  const query = {}
  if (filters.courseId) query.courseId = filters.courseId
  if (filters.status && filters.status !== 'All') query.status = filters.status
  if (user?.role === 'Teacher') query.courseId = { $in: await teacherCourseIds(user) }
  const items = await Assignment.find(query).populate(assignmentPopulate).sort({ dueDate: 1 }).lean()
  return { items: items.map(serializeAssignment) }
}

export async function createAssignment(payload, user) {
  const course = await resolveCourse(payload.courseId)
  if (course.status !== 'Active') throw httpError(400, 'Assignment course must be active')
  const staff = await resolveTeacherForCourse(payload.staffId ?? payload.teacherId, user, course._id, payload.academicYearId, payload.semesterId)
  const dueDate = parseDate(payload.dueDate, 'Assignment due date is required')
  const maxMarks = positiveNumber(payload.maxMarks, 'Assignment max marks must be greater than zero')
  const item = await Assignment.create({
    title: required(payload.title, 'Assignment title is required'),
    description: required(payload.description, 'Assignment description is required'),
    courseId: course._id,
    staffId: staff._id,
    academicYearId: payload.academicYearId,
    semesterId: payload.semesterId,
    dueDate,
    maxMarks,
    attachmentUrl: payload.attachmentUrl ?? '',
    status: payload.status ?? 'Draft',
    createdBy: actor(user),
  })
  if (item.status === 'Published') await notifyEnrolled(course._id, 'New assignment published', item.title, user)
  return getAssignment(item._id)
}

export async function getAssignment(id) {
  const item = await Assignment.findById(id).populate(assignmentPopulate).lean()
  if (!item) throw httpError(404, 'Assignment not found')
  return serializeAssignment(item)
}

export async function updateAssignment(id, payload, user) {
  const current = await Assignment.findById(id).lean()
  if (!current) throw httpError(404, 'Assignment not found')
  await ensureTeacherForCourse(user, current.courseId, current.academicYearId, current.semesterId)
  const update = {}
  for (const key of ['title', 'description', 'attachmentUrl', 'status']) if (payload[key] !== undefined) update[key] = payload[key]
  if (payload.dueDate) update.dueDate = parseDate(payload.dueDate, 'Assignment due date is invalid')
  if (payload.maxMarks) update.maxMarks = positiveNumber(payload.maxMarks, 'Assignment max marks must be greater than zero')
  const item = await Assignment.findByIdAndUpdate(id, update, { returnDocument: 'after', runValidators: true }).populate(assignmentPopulate).lean()
  if (update.status === 'Published') await notifyEnrolled(current.courseId, 'Assignment published', item.title, user)
  return serializeAssignment(item)
}

export async function deleteAssignment(id, user) {
  const current = await Assignment.findById(id).lean()
  if (!current) throw httpError(404, 'Assignment not found')
  await ensureTeacherForCourse(user, current.courseId, current.academicYearId, current.semesterId)
  const item = await Assignment.findByIdAndUpdate(id, { status: 'Cancelled' }, { returnDocument: 'after' }).populate(assignmentPopulate).lean()
  return serializeAssignment(item)
}

export async function listSubmissions(assignmentId, user) {
  const assignment = await Assignment.findById(assignmentId).lean()
  if (!assignment) throw httpError(404, 'Assignment not found')
  await ensureTeacherForCourse(user, assignment.courseId, assignment.academicYearId, assignment.semesterId)
  const items = await AssignmentSubmission.find({ assignmentId }).populate(submissionPopulate).sort({ submittedAt: -1 }).lean()
  return { items: items.map(serialize) }
}

export async function gradeSubmission(id, payload, user) {
  const submission = await AssignmentSubmission.findById(id).populate('assignmentId').lean()
  if (!submission) throw httpError(404, 'Submission not found')
  await ensureTeacherForCourse(user, submission.courseId, submission.assignmentId.academicYearId, submission.assignmentId.semesterId)
  const marks = Number(payload.marksObtained)
  if (!Number.isFinite(marks) || marks < 0 || marks > submission.assignmentId.maxMarks) throw httpError(400, 'Marks cannot be negative or greater than assignment max marks')
  const item = await AssignmentSubmission.findByIdAndUpdate(id, {
    marksObtained: marks,
    feedback: String(payload.feedback ?? '').trim(),
    status: payload.status ?? 'Graded',
    gradedBy: actor(user),
    gradedAt: new Date(),
  }, { returnDocument: 'after', runValidators: true }).populate(submissionPopulate).lean()
  await notifyStudent(submission.studentId, 'Assignment graded', submission.assignmentId.title, user)
  return serialize(item)
}

export async function listMaterials(filters = {}, user) {
  const query = {}
  if (filters.courseId) query.courseId = filters.courseId
  if (filters.visibility && filters.visibility !== 'All') query.visibility = filters.visibility
  if (user?.role === 'Teacher') query.courseId = { $in: await teacherCourseIds(user) }
  const items = await LearningMaterial.find(query).populate(materialPopulate).sort({ createdAt: -1 }).lean()
  return { items: items.map(serialize) }
}

export async function createMaterial(payload, user) {
  const course = await resolveCourse(payload.courseId)
  if (course.status !== 'Active') throw httpError(400, 'Learning material course must be active')
  const staff = await resolveTeacherForCourse(payload.staffId ?? payload.teacherId, user, course._id, payload.academicYearId, payload.semesterId)
  const item = await LearningMaterial.create({
    title: required(payload.title, 'Material title is required'),
    description: payload.description ?? '',
    courseId: course._id,
    staffId: staff._id,
    academicYearId: payload.academicYearId,
    semesterId: payload.semesterId,
    materialType: payload.materialType ?? 'Notes',
    fileUrl: payload.fileUrl ?? '',
    externalUrl: payload.externalUrl ?? '',
    visibility: payload.visibility ?? 'Draft',
    createdBy: actor(user),
  })
  if (item.visibility === 'Published') await notifyEnrolled(course._id, 'New learning material published', item.title, user)
  return serialize(await LearningMaterial.findById(item._id).populate(materialPopulate).lean())
}

export async function updateMaterial(id, payload, user) {
  const current = await LearningMaterial.findById(id).lean()
  if (!current) throw httpError(404, 'Learning material not found')
  await ensureTeacherForCourse(user, current.courseId, current.academicYearId, current.semesterId)
  const update = {}
  for (const key of ['title', 'description', 'materialType', 'fileUrl', 'externalUrl', 'visibility']) if (payload[key] !== undefined) update[key] = payload[key]
  const item = await LearningMaterial.findByIdAndUpdate(id, update, { returnDocument: 'after', runValidators: true }).populate(materialPopulate).lean()
  if (update.visibility === 'Published') await notifyEnrolled(current.courseId, 'Learning material published', item.title, user)
  return serialize(item)
}

export async function deleteMaterial(id, user) {
  const current = await LearningMaterial.findById(id).lean()
  if (!current) throw httpError(404, 'Learning material not found')
  await ensureTeacherForCourse(user, current.courseId, current.academicYearId, current.semesterId)
  const item = await LearningMaterial.findByIdAndUpdate(id, { visibility: 'Archived' }, { returnDocument: 'after' }).populate(materialPopulate).lean()
  return serialize(item)
}

export async function listStudentAssignments(user) {
  const courseIds = await enrolledCourseIds(user.student.id)
  const items = await Assignment.find({ courseId: { $in: courseIds }, status: 'Published' }).populate(assignmentPopulate).sort({ dueDate: 1 }).lean()
  return { items: items.map(serializeAssignment) }
}

export async function getStudentAssignment(user, id) {
  const assignment = await Assignment.findById(id).populate(assignmentPopulate).lean()
  if (!assignment || assignment.status !== 'Published') throw httpError(404, 'Assignment not found')
  await ensureEnrollment(user.student.id, assignment.courseId._id ?? assignment.courseId)
  return serializeAssignment(assignment)
}

export async function submitAssignment(user, assignmentId, payload) {
  const assignment = await Assignment.findById(assignmentId).lean()
  if (!assignment || assignment.status === 'Cancelled' || assignment.status === 'Closed') throw httpError(400, 'Assignment is not open for submission')
  if (assignment.status !== 'Published') throw httpError(404, 'Assignment not found')
  await ensureEnrollment(user.student.id, assignment.courseId)
  const existing = await AssignmentSubmission.findOne({ assignmentId, studentId: user.student.id }).lean()
  if (existing && existing.status !== 'Resubmission Requested') throw httpError(409, 'Assignment already submitted')
  const submittedAt = new Date()
  const values = {
    assignmentId,
    studentId: user.student.id,
    courseId: assignment.courseId,
    submittedAt,
    submissionText: payload.submissionText ?? '',
    fileUrl: payload.fileUrl ?? '',
    fileName: payload.fileName ?? '',
    mimeType: payload.mimeType ?? '',
    fileSize: Number(payload.fileSize ?? 0),
    status: submittedAt > assignment.dueDate ? 'Late' : 'Submitted',
  }
  const item = existing
    ? await AssignmentSubmission.findByIdAndUpdate(existing._id, values, { returnDocument: 'after', runValidators: true })
    : await AssignmentSubmission.create(values)
  await notifyTeacher(assignment.staffId, 'Assignment submitted', assignment.title, user)
  return serialize(await AssignmentSubmission.findById(item._id).populate(submissionPopulate).lean())
}

export async function listStudentSubmissions(user) {
  const items = await AssignmentSubmission.find({ studentId: user.student.id }).populate(submissionPopulate).sort({ submittedAt: -1 }).lean()
  return { items: items.map(serialize) }
}

export async function listStudentMaterials(user) {
  const courseIds = await enrolledCourseIds(user.student.id)
  const items = await LearningMaterial.find({ courseId: { $in: courseIds }, visibility: 'Published' }).populate(materialPopulate).sort({ createdAt: -1 }).lean()
  return { items: items.map(serialize) }
}

async function resolveTeacherForCourse(staffId, user, courseId, academicYearId, semesterId) {
  if (user.role === 'Teacher') {
    const staff = await Staff.findOne({ $or: [{ userId: user.id }, { email: user.email }], category: 'Teaching', status: 'Active' }).lean()
    if (!staff) throw httpError(403, 'Only active teachers can manage LMS content')
    await ensureTeacherAssigned(staff._id, courseId, academicYearId, semesterId)
    return staff
  }
  const staff = await resolveStaff(staffId, { category: 'Teaching' })
  await ensureTeacherAssigned(staff._id, courseId, academicYearId, semesterId)
  return staff
}

async function ensureTeacherForCourse(user, courseId, academicYearId, semesterId) {
  if (['Admin', 'Super Admin'].includes(user.role)) return
  const staff = await Staff.findOne({ $or: [{ userId: user.id }, { email: user.email }], category: 'Teaching', status: 'Active' }).lean()
  if (!staff) throw httpError(403, 'Only active teachers can manage LMS content')
  await ensureTeacherAssigned(staff._id, courseId, academicYearId, semesterId)
}

async function ensureTeacherAssigned(staffId, courseId, academicYearId, semesterId) {
  const exists = await CourseAssignment.exists({ staffId, courseId, academicYearId, semesterId, status: 'Active' })
  if (!exists) throw httpError(403, 'Teacher can manage LMS content only for assigned courses')
}

async function teacherCourseIds(user) {
  const staff = await Staff.findOne({ $or: [{ userId: user.id }, { email: user.email }], category: 'Teaching', status: 'Active' }).lean()
  if (!staff) return []
  const rows = await CourseAssignment.find({ staffId: staff._id, status: 'Active' }).select('courseId').lean()
  return rows.map((row) => row.courseId)
}

async function enrolledCourseIds(studentId) {
  const rows = await StudentCourse.find({ studentId, status: 'Enrolled' }).select('courseId').lean()
  return rows.map((row) => row.courseId)
}

async function notifyEnrolled(courseId, title, message, sender) {
  const rows = await StudentCourse.find({ courseId, status: 'Enrolled' }).populate('studentId', 'email').lean()
  for (const row of rows) await notifyStudent(row.studentId?._id, title, message, sender)
}

async function notifyStudent(studentId, title, message, sender) {
  const user = await User.findOne({ studentId, role: 'Student', status: 'Active' }).lean()
  if (user) await createNotification({ title, message, type: 'info', recipient: { userId: user._id.toString(), role: 'Student' }, sender })
}

async function notifyTeacher(staffId, title, message, sender) {
  const staff = await Staff.findById(staffId).lean()
  const user = staff ? await User.findOne({ $or: [{ _id: staff.userId }, { email: staff.email }], status: 'Active' }).lean() : null
  if (user) await createNotification({ title, message, type: 'info', recipient: { userId: user._id.toString(), role: user.role }, sender })
}

function serializeAssignment(item) { return { ...serialize(item), isLate: item.dueDate ? new Date(item.dueDate) < new Date() : false } }
function serialize(item) { return { ...item, id: item._id?.toString?.() ?? item.id } }
function actor(user) { return { userId: user.id, name: user.name, role: user.role } }
function required(value, message) { const text = String(value ?? '').trim(); if (!text) throw httpError(400, message); return text }
function positiveNumber(value, message) { const number = Number(value); if (!Number.isFinite(number) || number <= 0) throw httpError(400, message); return number }
function parseDate(value, message) { const date = new Date(value); if (Number.isNaN(date.getTime())) throw httpError(400, message); return date }
