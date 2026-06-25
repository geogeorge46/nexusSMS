import { getAuditContext } from '../middleware/auditMiddleware.js'
import { createAuditLog } from '../services/auditLogService.js'
import { reportToCsv, reportToExcel, reportToPdf } from '../services/reportExportService.js'
import { buildReport, isReportType } from '../services/reportService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const reportFilters = (query) => ({
  dateFrom: query.dateFrom,
  dateTo: query.dateTo,
  department: query.department,
  course: query.course,
  semester: query.semester,
  student: query.student,
  status: query.status,
  page: query.page,
  limit: query.limit,
})

export const getStudentReport = reportHandler('students')
export const getAttendanceReport = reportHandler('attendance')
export const getGradeReport = reportHandler('grades')
export const getCourseReport = reportHandler('courses')

export const exportReport = asyncHandler(async (req, res) => {
  const type = String(req.query.type ?? 'students').toLowerCase()
  if (!isReportType(type)) {
    const error = new Error('Invalid report type')
    error.statusCode = 400
    throw error
  }

  const filters = reportFilters(req.query)
  const report = await buildReport(type, filters, { all: true })
  const format = req.path.endsWith('/excel') ? 'excel' : req.path.endsWith('/csv') ? 'csv' : 'pdf'
  const fileBase = `nexus-${type}-report-${new Date().toISOString().slice(0, 10)}`
  let body
  let contentType
  let extension

  if (format === 'excel') {
    body = Buffer.from(await reportToExcel(report, filters))
    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    extension = 'xlsx'
  } else if (format === 'csv') {
    body = reportToCsv(report)
    contentType = 'text/csv;charset=utf-8'
    extension = 'csv'
  } else {
    body = await reportToPdf(report, filters)
    contentType = 'application/pdf'
    extension = 'pdf'
  }

  await createAuditLog({
    ...getAuditContext(req),
    action: 'REPORT_EXPORT',
    module: 'Reports',
    description: `Exported ${report.title} as ${format.toUpperCase()}`,
    metadata: { type, format, filters, rowCount: report.pagination.total },
  })

  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.${extension}"`)
  res.send(body)
})

function reportHandler(type) {
  return asyncHandler(async (req, res) => {
    res.json(await buildReport(type, reportFilters(req.query)))
  })
}
