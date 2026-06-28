import { getAuditContext } from '../middleware/auditMiddleware.js'
import { createAuditLog } from '../services/auditLogService.js'
import {
  createExam,
  createSchedule,
  deleteExam,
  deleteSchedule,
  generateHallTickets,
  getExamReports,
  listAssignedTeacherSchedules,
  listExams,
  listHallTickets,
  listResults,
  listSchedules,
  publishResults,
  updateExam,
  updateSchedule,
  upsertResult,
} from '../services/examService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const getExams = asyncHandler(async (req, res) => res.json(await listExams(req.query)))
export const postExam = asyncHandler(async (req, res) => {
  const item = await createExam(req.body, req.user)
  await audit(req, 'EXAM_CREATE', 'Exams', 'created an exam', { id: item.id })
  res.status(201).json({ item })
})
export const patchExam = asyncHandler(async (req, res) => {
  const item = await updateExam(req.params.examId, req.body)
  await audit(req, 'EXAM_UPDATE', 'Exams', 'updated an exam', { id: item.id })
  res.json({ item })
})
export const removeExam = asyncHandler(async (req, res) => {
  const item = await deleteExam(req.params.examId)
  await audit(req, 'EXAM_DELETE', 'Exams', 'cancelled an exam', { id: item.id })
  res.json({ item })
})

export const getSchedules = asyncHandler(async (req, res) => res.json(await listSchedules(req.params.examId, req.query)))
export const postSchedule = asyncHandler(async (req, res) => {
  const item = await createSchedule(req.params.examId, req.body)
  await audit(req, 'EXAM_SCHEDULE_CREATE', 'ExamSchedules', 'created an exam schedule', { id: item.id })
  res.status(201).json({ item })
})
export const patchSchedule = asyncHandler(async (req, res) => {
  const item = await updateSchedule(req.params.scheduleId, req.body)
  await audit(req, 'EXAM_SCHEDULE_UPDATE', 'ExamSchedules', 'updated an exam schedule', { id: item.id })
  res.json({ item })
})
export const removeSchedule = asyncHandler(async (req, res) => {
  const item = await deleteSchedule(req.params.scheduleId)
  await audit(req, 'EXAM_SCHEDULE_DELETE', 'ExamSchedules', 'cancelled an exam schedule', { id: item.id })
  res.json({ item })
})

export const getTeacherSchedules = asyncHandler(async (req, res) => res.json(await listAssignedTeacherSchedules(req.user)))
export const getHallTickets = asyncHandler(async (req, res) => res.json(await listHallTickets(req.params.examId, req.query)))
export const postHallTickets = asyncHandler(async (req, res) => {
  const result = await generateHallTickets(req.params.examId, req.user)
  await audit(req, 'HALL_TICKET_GENERATE', 'HallTickets', 'generated hall tickets', result.summary)
  res.status(201).json(result)
})
export const getResults = asyncHandler(async (req, res) => res.json(await listResults(req.query)))
export const postResult = asyncHandler(async (req, res) => {
  const item = await upsertResult(req.body, req.user)
  await audit(req, 'EXAM_RESULT_CREATE', 'ExamResults', 'entered an exam result', { id: item.id })
  res.status(201).json({ item })
})
export const patchResult = asyncHandler(async (req, res) => {
  const item = await upsertResult(req.body, req.user, req.params.id)
  await audit(req, 'EXAM_RESULT_UPDATE', 'ExamResults', 'updated an exam result', { id: item.id })
  res.json({ item })
})
export const postPublishResults = asyncHandler(async (req, res) => {
  const result = await publishResults(req.params.examId)
  await audit(req, 'EXAM_RESULT_PUBLISH', 'ExamResults', 'published exam results', result)
  res.json(result)
})
export const getReports = asyncHandler(async (_req, res) => res.json(await getExamReports()))

function audit(req, action, module, description, metadata) {
  return createAuditLog({ ...getAuditContext(req), action, module, description: `${req.user.name} ${description}`, metadata })
}
