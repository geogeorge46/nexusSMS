import { auditRowsToCsv, auditRowsToExcelHtml, listAuditLogs } from '../services/auditLogService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await listAuditLogs({
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    role: req.query.role,
    action: req.query.action,
    module: req.query.module,
  })

  res.json(result)
})

export const exportAuditLogs = asyncHandler(async (req, res) => {
  const result = await listAuditLogs({
    page: 1,
    limit: 1000,
    search: req.query.search,
    role: req.query.role,
    action: req.query.action,
    module: req.query.module,
  })

  const format = req.query.format === 'excel' ? 'excel' : 'csv'

  if (format === 'excel') {
    res.setHeader('Content-Type', 'application/vnd.ms-excel;charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="nexus-audit-log.xls"')
    res.send(auditRowsToExcelHtml(result.items))
    return
  }

  res.setHeader('Content-Type', 'text/csv;charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="nexus-audit-log.csv"')
  res.send(auditRowsToCsv(result.items))
})
