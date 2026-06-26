import { Router } from 'express'

import {
  exportReport,
  getAttendanceReport,
  getCourseReport,
  getGradeReport,
  getStudentReport,
} from '../controllers/reportController.js'
import { requireAdmin, requireReportAccess } from '../middleware/requestContext.js'

export const reportRouter = Router()

reportRouter.get('/students', requireReportAccess('students'), getStudentReport)
reportRouter.get('/attendance', requireReportAccess('attendance'), getAttendanceReport)
reportRouter.get('/grades', requireReportAccess('grades'), getGradeReport)
reportRouter.get('/courses', requireReportAccess('courses'), getCourseReport)
reportRouter.get('/export/pdf', requireAdmin, exportReport)
reportRouter.get('/export/excel', requireAdmin, exportReport)
reportRouter.get('/export/csv', requireAdmin, exportReport)
