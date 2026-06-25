import { Router } from 'express'

import {
  exportReport,
  getAttendanceReport,
  getCourseReport,
  getGradeReport,
  getStudentReport,
} from '../controllers/reportController.js'
import { requireAdmin } from '../middleware/requestContext.js'

export const reportRouter = Router()

reportRouter.use(requireAdmin)
reportRouter.get('/students', getStudentReport)
reportRouter.get('/attendance', getAttendanceReport)
reportRouter.get('/grades', getGradeReport)
reportRouter.get('/courses', getCourseReport)
reportRouter.get('/export/pdf', exportReport)
reportRouter.get('/export/excel', exportReport)
reportRouter.get('/export/csv', exportReport)
