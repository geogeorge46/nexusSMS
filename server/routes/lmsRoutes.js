import { Router } from 'express'

import {
  getAssignmentSubmissions,
  getAssignments,
  getMaterials,
  patchAssignment,
  patchMaterial,
  patchSubmissionGrade,
  postAssignment,
  postMaterial,
  removeAssignment,
  removeMaterial,
} from '../controllers/lmsController.js'
import { requireAuthenticated, requireLmsAccess } from '../middleware/requestContext.js'

export const lmsRouter = Router()

lmsRouter.use(requireAuthenticated)
lmsRouter.use(requireLmsAccess)
lmsRouter.get('/assignments', getAssignments)
lmsRouter.post('/assignments', postAssignment)
lmsRouter.patch('/assignments/:id', patchAssignment)
lmsRouter.delete('/assignments/:id', removeAssignment)
lmsRouter.get('/assignments/:id/submissions', getAssignmentSubmissions)
lmsRouter.patch('/submissions/:id/grade', patchSubmissionGrade)
lmsRouter.get('/materials', getMaterials)
lmsRouter.post('/materials', postMaterial)
lmsRouter.patch('/materials/:id', patchMaterial)
lmsRouter.delete('/materials/:id', removeMaterial)
