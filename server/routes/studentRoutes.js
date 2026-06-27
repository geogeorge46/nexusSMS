import { Router } from 'express'

import {
  getStudentById,
  getStudents,
  patchStudent,
  postStudent,
  removeStudent,
} from '../controllers/studentController.js'
import { requireAdmin, requireAuthenticated, requireNonStudent, requireStudentWriteAccess } from '../middleware/requestContext.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const studentRouter = Router()

studentRouter.use(requireAuthenticated)
studentRouter.get('/', requireNonStudent, asyncHandler(getStudents))
studentRouter.post('/', requireStudentWriteAccess, asyncHandler(postStudent))
studentRouter.get('/:studentId', requireNonStudent, asyncHandler(getStudentById))
studentRouter.patch('/:studentId', requireStudentWriteAccess, asyncHandler(patchStudent))
studentRouter.delete('/:studentId', requireAdmin, asyncHandler(removeStudent))
