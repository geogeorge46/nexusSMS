import { Router } from 'express'

import {
  getCourseById,
  getCourses,
  patchCourse,
  postCourse,
  removeCourse,
} from '../controllers/courseController.js'
import { requireAdmin, requireAuthenticated } from '../middleware/requestContext.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const courseRouter = Router()

courseRouter.use(requireAuthenticated)
courseRouter.get('/', asyncHandler(getCourses))
courseRouter.post('/', requireAdmin, asyncHandler(postCourse))
courseRouter.get('/:courseId', asyncHandler(getCourseById))
courseRouter.patch('/:courseId', requireAdmin, asyncHandler(patchCourse))
courseRouter.delete('/:courseId', requireAdmin, asyncHandler(removeCourse))
