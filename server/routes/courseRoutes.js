import { Router } from 'express'

import {
  getCourseById,
  getCourses,
  patchCourse,
  postCourse,
  removeCourse,
} from '../controllers/courseController.js'
import { requireAdmin } from '../middleware/requestContext.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const courseRouter = Router()

courseRouter.use(requireAdmin)
courseRouter.get('/', asyncHandler(getCourses))
courseRouter.post('/', asyncHandler(postCourse))
courseRouter.get('/:courseId', asyncHandler(getCourseById))
courseRouter.patch('/:courseId', asyncHandler(patchCourse))
courseRouter.delete('/:courseId', asyncHandler(removeCourse))
