import { getAuditContext } from '../middleware/auditMiddleware.js'
import { createAuditLog } from '../services/auditLogService.js'
import { createGrade, deleteGrade, getCourseGrades, getGrade, getStudentGrades, listGrades, updateGrade } from '../services/gradeService.js'

export async function getGrades(req, res) { res.json(await listGrades(req.query)) }
export async function getGradeById(req, res) { res.json({ grade: await getGrade(req.params.gradeId) }) }
export async function getGradesByStudent(req, res) { res.json(await getStudentGrades(req.params.studentId)) }
export async function getGradesByCourse(req, res) { res.json(await getCourseGrades(req.params.courseId)) }

export async function postGrade(req, res) {
  const grade = await createGrade(req.body, req.user)
  await audit(req, 'GRADE_CREATE', `${req.user.name} created a grade for ${grade.student}`, grade)
  res.status(201).json({ grade })
}

export async function patchGrade(req, res) {
  const grade = await updateGrade(req.params.gradeId, req.body, req.user)
  await audit(req, 'GRADE_UPDATE', `${req.user.name} updated a grade for ${grade.student}`, grade)
  res.json({ grade })
}

export async function removeGrade(req, res) {
  const grade = await deleteGrade(req.params.gradeId)
  await audit(req, 'GRADE_DELETE', `${req.user.name} deleted grade ${grade.id}`, grade)
  res.json({ grade })
}

function audit(req, action, description, grade) {
  return createAuditLog({ ...getAuditContext(req), action, module: 'Grades', description, metadata: { gradeId: grade.id } })
}
