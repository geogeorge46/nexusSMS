import { Router } from 'express'

import {
  getStudentById,
  getStudents,
  patchStudent,
  postStudent,
  removeStudent,
} from '../controllers/studentController.js'
import { requireAdmin } from '../middleware/requestContext.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const studentRouter = Router()

studentRouter.use(requireAdmin)
studentRouter.get('/', asyncHandler(getStudents))
studentRouter.post('/', asyncHandler(postStudent))
studentRouter.get('/:studentId', asyncHandler(getStudentById))
studentRouter.patch('/:studentId', asyncHandler(patchStudent))
studentRouter.delete('/:studentId', asyncHandler(removeStudent))
