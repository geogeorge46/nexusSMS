import { Router } from 'express'

import {
  getExams,
  getHallTickets,
  getReports,
  getResults,
  getSchedules,
  getTeacherSchedules,
  patchExam,
  patchResult,
  patchSchedule,
  postExam,
  postHallTickets,
  postPublishResults,
  postResult,
  postSchedule,
  removeExam,
  removeSchedule,
} from '../controllers/examController.js'
import { requireAuthenticated, requireExamManageAccess, requireExamReadAccess } from '../middleware/requestContext.js'

export const examRouter = Router()

examRouter.use(requireAuthenticated)
examRouter.get('/', requireExamReadAccess, getExams)
examRouter.post('/', requireExamManageAccess, postExam)
examRouter.patch('/:examId', requireExamManageAccess, patchExam)
examRouter.delete('/:examId', requireExamManageAccess, removeExam)

examRouter.get('/teacher/schedules', requireExamReadAccess, getTeacherSchedules)
examRouter.get('/results', requireExamReadAccess, getResults)
examRouter.post('/results', requireExamReadAccess, postResult)
examRouter.patch('/results/:id', requireExamReadAccess, patchResult)
examRouter.get('/reports', requireExamManageAccess, getReports)

examRouter.get('/:examId/schedules', requireExamReadAccess, getSchedules)
examRouter.post('/:examId/schedules', requireExamManageAccess, postSchedule)
examRouter.patch('/:examId/schedules/:scheduleId', requireExamManageAccess, patchSchedule)
examRouter.delete('/:examId/schedules/:scheduleId', requireExamManageAccess, removeSchedule)
examRouter.post('/:examId/hall-tickets/generate', requireExamManageAccess, postHallTickets)
examRouter.get('/:examId/hall-tickets', requireExamManageAccess, getHallTickets)
examRouter.post('/:examId/publish-results', requireExamManageAccess, postPublishResults)
