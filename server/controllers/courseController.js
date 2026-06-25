import { getAuditContext } from '../middleware/auditMiddleware.js'
import { createAuditLog } from '../services/auditLogService.js'
import {
  createCourse,
  deleteCourse,
  getCourse,
  listCourses,
  updateCourse,
} from '../services/courseService.js'

export async function getCourses(req, res) {
  const result = await listCourses(req.query)
  res.json(result)
}

export async function getCourseById(req, res) {
  const course = await getCourse(req.params.courseId)
  res.json({ course })
}

export async function postCourse(req, res) {
  const course = await createCourse(req.body)

  await writeCourseAudit(req, {
    action: 'COURSE_CREATE',
    description: `${req.user.name} created course ${course.title}`,
    course,
  })

  res.status(201).json({ course })
}

export async function patchCourse(req, res) {
  const course = await updateCourse(req.params.courseId, req.body)

  await writeCourseAudit(req, {
    action: 'COURSE_UPDATE',
    description: `${req.user.name} updated course ${course.title}`,
    course,
  })

  res.json({ course })
}

export async function removeCourse(req, res) {
  const course = await deleteCourse(req.params.courseId)

  await writeCourseAudit(req, {
    action: 'COURSE_DELETE',
    description: `${req.user.name} deleted course ${course.title}`,
    course,
  })

  res.json({ course })
}

function writeCourseAudit(req, { action, description, course }) {
  return createAuditLog({
    ...getAuditContext(req),
    action,
    module: 'Courses',
    description,
    metadata: {
      courseId: course.id,
      databaseId: course.databaseId,
    },
  })
}
