import { Router } from 'express'
import { getGradeById, getGrades, getGradesByCourse, getGradesByStudent, patchGrade, postGrade, removeGrade } from '../controllers/gradeController.js'
import { requireAcademicAccess } from '../middleware/requestContext.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const gradeRouter = Router()
gradeRouter.use(requireAcademicAccess)
gradeRouter.get('/', asyncHandler(getGrades))
gradeRouter.get('/student/:studentId', asyncHandler(getGradesByStudent))
gradeRouter.get('/course/:courseId', asyncHandler(getGradesByCourse))
gradeRouter.get('/:gradeId', asyncHandler(getGradeById))
gradeRouter.post('/', asyncHandler(postGrade))
gradeRouter.patch('/:gradeId', asyncHandler(patchGrade))
gradeRouter.delete('/:gradeId', asyncHandler(removeGrade))
