import { Router } from 'express'

import {
  getChildAssignments,
  getChildAttendance,
  getChildDocuments,
  getChildFees,
  getChildGrades,
  getChildMaterials,
  getChildProfile,
  getChildReceipts,
  getChildResults,
  getChildTimetable,
  getParentMe,
  getParentNotifications,
  getParentStudents,
  patchParentNotificationRead,
} from '../controllers/parentPortalController.js'
import { requireAuthenticated, requireParent } from '../middleware/requestContext.js'

export const parentPortalRouter = Router()

parentPortalRouter.use(requireAuthenticated)
parentPortalRouter.use(requireParent)
parentPortalRouter.get('/me', getParentMe)
parentPortalRouter.get('/students', getParentStudents)
parentPortalRouter.get('/students/:studentId/profile', getChildProfile)
parentPortalRouter.get('/students/:studentId/attendance', getChildAttendance)
parentPortalRouter.get('/students/:studentId/grades', getChildGrades)
parentPortalRouter.get('/students/:studentId/results', getChildResults)
parentPortalRouter.get('/students/:studentId/fees', getChildFees)
parentPortalRouter.get('/students/:studentId/receipts', getChildReceipts)
parentPortalRouter.get('/students/:studentId/assignments', getChildAssignments)
parentPortalRouter.get('/students/:studentId/materials', getChildMaterials)
parentPortalRouter.get('/students/:studentId/timetable', getChildTimetable)
parentPortalRouter.get('/students/:studentId/documents', getChildDocuments)
parentPortalRouter.get('/notifications', getParentNotifications)
parentPortalRouter.patch('/notifications/:id/read', patchParentNotificationRead)
