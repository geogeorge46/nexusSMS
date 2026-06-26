import { Router } from 'express'

import {
  getAttendance,
  getAttendanceSummaryController,
  patchAttendance,
  postAttendanceMark,
  removeAttendance,
} from '../controllers/attendanceController.js'
import { requireAcademicAccess } from '../middleware/requestContext.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const attendanceRouter = Router()

attendanceRouter.use(requireAcademicAccess)
attendanceRouter.get('/', asyncHandler(getAttendance))
attendanceRouter.get('/summary', asyncHandler(getAttendanceSummaryController))
attendanceRouter.post('/mark', asyncHandler(postAttendanceMark))
attendanceRouter.patch('/:attendanceId', asyncHandler(patchAttendance))
attendanceRouter.delete('/:attendanceId', asyncHandler(removeAttendance))
