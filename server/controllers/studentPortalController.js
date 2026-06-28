import {
  getStudentPortalCalendar,
  getStudentPortalSupport,
  getStudentPortalProfile,
  listStudentPortalAttendance,
  listStudentPortalCourses,
  listStudentPortalDocuments,
  listStudentPortalGrades,
  listStudentPortalNotifications,
  listStudentPortalTimetable,
  markStudentPortalNotificationRead,
  updateStudentPortalProfile,
} from '../services/studentPortalService.js'
import { getOwnReceipt, listOwnReceipts, listOwnStudentFees } from '../services/feeService.js'
import { getStudentPortalExams, getStudentPortalResults, getStudentPortalTickets } from '../services/examService.js'
import {
  getStudentAssignment,
  listStudentAssignments,
  listStudentMaterials,
  listStudentSubmissions,
  submitAssignment,
} from '../services/lmsService.js'
import { getAuditContext } from '../middleware/auditMiddleware.js'
import { createAuditLog } from '../services/auditLogService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const getPortalProfile = asyncHandler(async (req, res) => {
  res.json(await getStudentPortalProfile(req.user))
})

export const patchPortalProfile = asyncHandler(async (req, res) => {
  const student = await updateStudentPortalProfile(req.user, req.body)

  await createAuditLog({
    ...getAuditContext(req),
    action: 'STUDENT_UPDATE',
    module: 'Students',
    description: `${req.user.name} updated student portal contact details`,
    metadata: { studentId: student.databaseId },
  })

  res.json({ student })
})

export const getPortalCourses = asyncHandler(async (req, res) => {
  res.json(await listStudentPortalCourses(req.user))
})

export const getPortalTimetable = asyncHandler(async (req, res) => {
  res.json(await listStudentPortalTimetable(req.user))
})

export const getPortalAttendance = asyncHandler(async (req, res) => {
  res.json(await listStudentPortalAttendance(req.user))
})

export const getPortalGrades = asyncHandler(async (req, res) => {
  res.json(await listStudentPortalGrades(req.user))
})

export const getPortalDocuments = asyncHandler(async (req, res) => {
  res.json(await listStudentPortalDocuments(req.user))
})

export const getPortalNotifications = asyncHandler(async (req, res) => {
  res.json(await listStudentPortalNotifications(req.user, req.query))
})

export const patchPortalNotificationRead = asyncHandler(async (req, res) => {
  const notification = await markStudentPortalNotificationRead(req.user, req.params.notificationId)

  await createAuditLog({
    ...getAuditContext(req),
    action: 'NOTIFICATION_READ',
    module: 'Notifications',
    description: `${req.user.name} marked notification as read`,
    metadata: { notificationId: req.params.notificationId },
  })

  res.json(notification)
})

export const getPortalCalendar = asyncHandler(async (_req, res) => {
  res.json(getStudentPortalCalendar())
})

export const getPortalSupport = asyncHandler(async (_req, res) => {
  res.json(getStudentPortalSupport())
})

export const getPortalFees = asyncHandler(async (req, res) => {
  res.json(await listOwnStudentFees(req.user))
})

export const getPortalReceipts = asyncHandler(async (req, res) => {
  res.json(await listOwnReceipts(req.user))
})

export const getPortalReceiptById = asyncHandler(async (req, res) => {
  res.json(await getOwnReceipt(req.user, req.params.id))
})

export const getPortalExams = asyncHandler(async (req, res) => {
  res.json(await getStudentPortalExams(req.user))
})

export const getPortalHallTickets = asyncHandler(async (req, res) => {
  res.json(await getStudentPortalTickets(req.user))
})

export const getPortalExamResults = asyncHandler(async (req, res) => {
  res.json(await getStudentPortalResults(req.user))
})

export const getPortalAssignments = asyncHandler(async (req, res) => {
  res.json(await listStudentAssignments(req.user))
})

export const getPortalAssignmentById = asyncHandler(async (req, res) => {
  res.json({ item: await getStudentAssignment(req.user, req.params.id) })
})

export const postPortalAssignmentSubmission = asyncHandler(async (req, res) => {
  const item = await submitAssignment(req.user, req.params.id, req.body)
  await createAuditLog({
    ...getAuditContext(req),
    action: 'ASSIGNMENT_SUBMIT',
    module: 'AssignmentSubmissions',
    description: `${req.user.name} submitted an assignment`,
    metadata: { id: item.id },
  })
  res.status(201).json({ item })
})

export const getPortalSubmissions = asyncHandler(async (req, res) => {
  res.json(await listStudentSubmissions(req.user))
})

export const getPortalMaterials = asyncHandler(async (req, res) => {
  res.json(await listStudentMaterials(req.user))
})
