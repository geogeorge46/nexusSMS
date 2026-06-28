import { getAuditContext } from '../middleware/auditMiddleware.js'
import { createAuditLog } from '../services/auditLogService.js'
import {
  createAssignment,
  createMaterial,
  deleteAssignment,
  deleteMaterial,
  gradeSubmission,
  listAssignments,
  listMaterials,
  listSubmissions,
  updateAssignment,
  updateMaterial,
} from '../services/lmsService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const getAssignments = asyncHandler(async (req, res) => res.json(await listAssignments(req.query, req.user)))
export const postAssignment = asyncHandler(async (req, res) => {
  const item = await createAssignment(req.body, req.user)
  await audit(req, 'ASSIGNMENT_CREATE', 'Assignments', 'created an assignment', { id: item.id })
  res.status(201).json({ item })
})
export const patchAssignment = asyncHandler(async (req, res) => {
  const item = await updateAssignment(req.params.id, req.body, req.user)
  await audit(req, 'ASSIGNMENT_UPDATE', 'Assignments', 'updated an assignment', { id: item.id })
  res.json({ item })
})
export const removeAssignment = asyncHandler(async (req, res) => {
  const item = await deleteAssignment(req.params.id, req.user)
  await audit(req, 'ASSIGNMENT_DELETE', 'Assignments', 'cancelled an assignment', { id: item.id })
  res.json({ item })
})
export const getAssignmentSubmissions = asyncHandler(async (req, res) => res.json(await listSubmissions(req.params.id, req.user)))
export const patchSubmissionGrade = asyncHandler(async (req, res) => {
  const item = await gradeSubmission(req.params.id, req.body, req.user)
  await audit(req, 'ASSIGNMENT_GRADE', 'AssignmentSubmissions', 'graded an assignment submission', { id: item.id })
  res.json({ item })
})
export const getMaterials = asyncHandler(async (req, res) => res.json(await listMaterials(req.query, req.user)))
export const postMaterial = asyncHandler(async (req, res) => {
  const item = await createMaterial(req.body, req.user)
  await audit(req, 'LEARNING_MATERIAL_CREATE', 'LearningMaterials', 'created learning material', { id: item.id })
  res.status(201).json({ item })
})
export const patchMaterial = asyncHandler(async (req, res) => {
  const item = await updateMaterial(req.params.id, req.body, req.user)
  await audit(req, 'LEARNING_MATERIAL_UPDATE', 'LearningMaterials', 'updated learning material', { id: item.id })
  res.json({ item })
})
export const removeMaterial = asyncHandler(async (req, res) => {
  const item = await deleteMaterial(req.params.id, req.user)
  await audit(req, 'LEARNING_MATERIAL_DELETE', 'LearningMaterials', 'archived learning material', { id: item.id })
  res.json({ item })
})

function audit(req, action, module, description, metadata) {
  return createAuditLog({ ...getAuditContext(req), action, module, description: `${req.user.name} ${description}`, metadata })
}
