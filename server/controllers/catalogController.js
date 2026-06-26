import { getAuditContext } from '../middleware/auditMiddleware.js'
import { createAuditLog } from '../services/auditLogService.js'
import { createResource, deleteResource, listResource, updateResource } from '../services/catalogService.js'

const auditMap = {
  departments: ['Departments', 'DEPARTMENT'],
  programs: ['Programs', 'PROGRAM'],
  academicYears: ['AcademicYears', 'ACADEMIC_YEAR'],
  semesters: ['Semesters', 'SEMESTER'],
  staff: ['Staff', 'STAFF'],
  studentcourses: ['StudentCourses', 'STUDENT_COURSE'],
  courseassignments: ['CourseAssignments', 'COURSE_ASSIGNMENT'],
}

export async function getCatalog(req, res) {
  res.json(await listResource(req.params.resource, req.query))
}

export async function postCatalog(req, res) {
  const item = await createResource(req.params.resource, req.body)
  await audit(req, req.params.resource, 'CREATE', item)
  res.status(201).json({ item })
}

export async function patchCatalog(req, res) {
  const item = await updateResource(req.params.resource, req.params.id, req.body)
  await audit(req, req.params.resource, 'UPDATE', item)
  res.json({ item })
}

export async function removeCatalog(req, res) {
  const item = await deleteResource(req.params.resource, req.params.id)
  await audit(req, req.params.resource, 'DELETE', item)
  res.json({ item })
}

function audit(req, resource, verb, item) {
  const [module, actionPrefix] = auditMap[resource] ?? ['Settings', 'SETTINGS']
  const action = resource === 'studentcourses' && verb === 'CREATE'
    ? 'STUDENT_COURSE_ENROLL'
    : `${actionPrefix}_${verb}`

  return createAuditLog({
    ...getAuditContext(req),
    action,
    module,
    description: `${req.user.name} ${verb.toLowerCase()}d ${resource}`,
    metadata: { id: item.id },
  })
}
