import { Router } from 'express'

import {
  getPortalAttendance,
  getPortalCalendar,
  getPortalCourses,
  getPortalDocuments,
  getPortalGrades,
  getPortalNotifications,
  getPortalProfile,
  getPortalSupport,
  getPortalTimetable,
  patchPortalNotificationRead,
  patchPortalProfile,
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
studentPortalRouter.get('/notifications', getPortalNotifications)
studentPortalRouter.patch('/notifications/:notificationId/read', patchPortalNotificationRead)
studentPortalRouter.get('/calendar', getPortalCalendar)
studentPortalRouter.get('/support', getPortalSupport)
