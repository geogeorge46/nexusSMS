import { Router } from 'express'

import {
  getPortalAttendance,
  getPortalAssignmentById,
  getPortalAssignments,
  getPortalCalendar,
  getPortalCourses,
  getPortalDocuments,
  getPortalExamResults,
  getPortalExams,
  getPortalGrades,
  getPortalHallTickets,
  getPortalMaterials,
  getPortalNotifications,
  getPortalProfile,
  getPortalReceiptById,
  getPortalReceipts,
  getPortalFees,
  getPortalSupport,
  getPortalSubmissions,
  getPortalTimetable,
  patchPortalNotificationRead,
  patchPortalProfile,
  postPortalAssignmentSubmission,
} from '../controllers/studentPortalController.js'
import { requireAuthenticated, requireStudent } from '../middleware/requestContext.js'

export const studentPortalRouter = Router()

studentPortalRouter.use(requireAuthenticated)
studentPortalRouter.use(requireStudent)
studentPortalRouter.get('/me', getPortalProfile)
studentPortalRouter.get('/profile', getPortalProfile)
studentPortalRouter.patch('/profile', patchPortalProfile)
studentPortalRouter.get('/courses', getPortalCourses)
studentPortalRouter.get('/timetable', getPortalTimetable)
studentPortalRouter.get('/attendance', getPortalAttendance)
studentPortalRouter.get('/grades', getPortalGrades)
studentPortalRouter.get('/documents', getPortalDocuments)
studentPortalRouter.get('/fees', getPortalFees)
studentPortalRouter.get('/receipts', getPortalReceipts)
studentPortalRouter.get('/receipts/:id', getPortalReceiptById)
studentPortalRouter.get('/exams', getPortalExams)
studentPortalRouter.get('/hall-tickets', getPortalHallTickets)
studentPortalRouter.get('/results', getPortalExamResults)
studentPortalRouter.get('/assignments', getPortalAssignments)
studentPortalRouter.get('/assignments/:id', getPortalAssignmentById)
studentPortalRouter.post('/assignments/:id/submit', postPortalAssignmentSubmission)
studentPortalRouter.get('/submissions', getPortalSubmissions)
studentPortalRouter.get('/materials', getPortalMaterials)
studentPortalRouter.get('/notifications', getPortalNotifications)
studentPortalRouter.patch('/notifications/:notificationId/read', patchPortalNotificationRead)
studentPortalRouter.get('/calendar', getPortalCalendar)
studentPortalRouter.get('/support', getPortalSupport)
