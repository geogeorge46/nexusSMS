import { getAuditContext } from '../middleware/auditMiddleware.js'
import { createAuditLog } from '../services/auditLogService.js'
import {
  getParentProfile,
  getParentStudentAssignments,
  getParentStudentAttendance,
  getParentStudentDocuments,
  getParentStudentFees,
  getParentStudentGrades,
  getParentStudentMaterials,
  getParentStudentProfile,
  getParentStudentReceipts,
  getParentStudentResults,
  getParentStudentTimetable,
  listParentNotifications,
  listParentStudents,
  markParentNotificationRead,
} from '../services/parentPortalService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const getParentMe = asyncHandler(async (req, res) => res.json(await getParentProfile(req.user)))
export const getParentStudents = asyncHandler(async (req, res) => res.json(await listParentStudents(req.user)))
export const getChildProfile = asyncHandler(async (req, res) => res.json(await getParentStudentProfile(req.user, req.params.studentId)))
export const getChildAttendance = asyncHandler(async (req, res) => res.json(await getParentStudentAttendance(req.user, req.params.studentId)))
export const getChildGrades = asyncHandler(async (req, res) => res.json(await getParentStudentGrades(req.user, req.params.studentId)))
export const getChildResults = asyncHandler(async (req, res) => res.json(await getParentStudentResults(req.user, req.params.studentId)))
export const getChildFees = asyncHandler(async (req, res) => res.json(await getParentStudentFees(req.user, req.params.studentId)))
export const getChildReceipts = asyncHandler(async (req, res) => res.json(await getParentStudentReceipts(req.user, req.params.studentId)))
export const getChildAssignments = asyncHandler(async (req, res) => res.json(await getParentStudentAssignments(req.user, req.params.studentId)))
export const getChildMaterials = asyncHandler(async (req, res) => res.json(await getParentStudentMaterials(req.user, req.params.studentId)))
export const getChildTimetable = asyncHandler(async (req, res) => res.json(await getParentStudentTimetable(req.user, req.params.studentId)))
export const getChildDocuments = asyncHandler(async (req, res) => res.json(await getParentStudentDocuments(req.user, req.params.studentId)))
export const getParentNotifications = asyncHandler(async (req, res) => res.json(await listParentNotifications(req.user, req.query)))
export const patchParentNotificationRead = asyncHandler(async (req, res) => {
  const notification = await markParentNotificationRead(req.user, req.params.id)
  await createAuditLog({
    ...getAuditContext(req),
    action: 'NOTIFICATION_READ',
    module: 'Notifications',
    description: `${req.user.name} marked parent notification as read`,
    metadata: { notificationId: req.params.id },
  })
  res.json(notification)
})
