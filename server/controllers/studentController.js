import { getAuditContext } from '../middleware/auditMiddleware.js'
import { createAuditLog } from '../services/auditLogService.js'
import {
  createStudent,
  deleteStudent,
  getStudent,
  listStudents,
  updateStudent,
} from '../services/studentService.js'

export async function getStudents(req, res) {
  const result = await listStudents(req.query)
  res.json(result)
}

export async function getStudentById(req, res) {
  const student = await getStudent(req.params.studentId)
  res.json({ student })
}

export async function postStudent(req, res) {
  const student = await createStudent(req.body)

  await writeStudentAudit(req, {
    action: 'STUDENT_CREATE',
    description: `${req.user.name} created student ${student.name}`,
    student,
  })

  res.status(201).json({ student })
}

export async function patchStudent(req, res) {
  const student = await updateStudent(req.params.studentId, req.body)

  await writeStudentAudit(req, {
    action: 'STUDENT_UPDATE',
    description: `${req.user.name} updated student ${student.name}`,
    student,
  })

  res.json({ student })
}

export async function removeStudent(req, res) {
  const student = await deleteStudent(req.params.studentId)

  await writeStudentAudit(req, {
    action: 'STUDENT_DELETE',
    description: `${req.user.name} deleted student ${student.name}`,
    student,
  })

  res.json({ student })
}

function writeStudentAudit(req, { action, description, student }) {
  return createAuditLog({
    ...getAuditContext(req),
    action,
    module: 'Students',
    description,
    metadata: {
      studentId: student.id,
      databaseId: student.databaseId,
    },
  })
}
