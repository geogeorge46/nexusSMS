import {
  auditRowsToCsv,
  auditRowsToExcelHtml,
  getAuditLogsForExport,
  listAuditLogs,
} from '../services/auditLogService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await listAuditLogs({
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    role: req.query.role,
    action: req.query.action,
    module: req.query.module,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
  })

  res.json(result)
})

export const exportAuditLogs = asyncHandler(async (req, res) => {
  const rows = await getAuditLogsForExport({
    search: req.query.search,
    role: req.query.role,
    action: req.query.action,
    module: req.query.module,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
  })

  const requestedFormat = req.query.format ?? (req.path.endsWith('/excel') ? 'excel' : 'csv')
  const format = requestedFormat === 'excel' ? 'excel' : 'csv'

  if (format === 'excel') {
    res.setHeader('Content-Type', 'application/vnd.ms-excel;charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="nexus-audit-log.xls"')
    res.send(auditRowsToExcelHtml(rows))
    return
  }

  res.setHeader('Content-Type', 'text/csv;charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="nexus-audit-log.csv"')
  res.send(auditRowsToCsv(rows))
})
