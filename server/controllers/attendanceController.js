import { getAuditContext } from '../middleware/auditMiddleware.js'
import { createAuditLog } from '../services/auditLogService.js'
import {
  deleteAttendance,
  getAttendanceSummary,
  listAttendance,
  markAttendance,
  updateAttendance,
} from '../services/attendanceService.js'

export async function getAttendance(req, res) {
  const result = await listAttendance(req.query)
  res.json(result)
}

export async function getAttendanceSummaryController(req, res) {
  const result = await getAttendanceSummary(req.query)
  res.json(result)
}

export async function postAttendanceMark(req, res) {
  const attendance = await markAttendance(req.body, req.user)
  await writeAttendanceAudit(req, 'ATTENDANCE_MARK', `${req.user.name} marked attendance for ${attendance.student}`, attendance)
  res.status(201).json({ attendance })
}

export async function patchAttendance(req, res) {
  const attendance = await updateAttendance(req.params.attendanceId, req.body, req.user)
  await writeAttendanceAudit(req, 'ATTENDANCE_UPDATE', `${req.user.name} updated attendance for ${attendance.student}`, attendance)
  res.json({ attendance })
}

export async function removeAttendance(req, res) {
  const attendance = await deleteAttendance(req.params.attendanceId)
  await writeAttendanceAudit(req, 'ATTENDANCE_DELETE', `${req.user.name} deleted attendance ${attendance.id}`, attendance)
  res.json({ attendance })
}

function writeAttendanceAudit(req, action, description, attendance) {
  return createAuditLog({
    ...getAuditContext(req),
    action,
    module: 'Attendance',
    description,
    metadata: { attendanceId: attendance.id },
  })
}
