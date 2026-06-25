import { AuditLog } from '../models/AuditLog.js'

export async function createAuditLog({
  user,
  role,
  action,
  module,
  description,
  ipAddress,
  browser,
  device,
  metadata,
}) {
  return AuditLog.create({
    user,
    role,
    action,
    module,
    description,
    ipAddress,
    browser,
    device,
    metadata,
    timestamp: new Date(),
  })
}

export async function listAuditLogs(filters = {}) {
  const page = Math.max(Number(filters.page ?? 1), 1)
  const limit = Math.min(Math.max(Number(filters.limit ?? 10), 1), 50)
  const query = buildAuditQuery(filters)

  const [items, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(query),
  ])

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(Math.ceil(total / limit), 1),
    },
  }
}

export async function getAuditLogsForExport(filters = {}) {
  return AuditLog.find(buildAuditQuery(filters)).sort({ timestamp: -1 }).lean()
}

export function auditRowsToCsv(rows) {
  const headers = ['timestamp', 'user', 'role', 'action', 'module', 'description', 'ipAddress', 'browser', 'device']
  const lines = rows.map((row) =>
    headers
      .map((key) => {
        const value = row[key] instanceof Date ? row[key].toISOString() : row[key] ?? ''
        const safeValue = /^[=+\-@]/.test(String(value)) ? `'${value}` : value
        return `"${String(safeValue).replaceAll('"', '""')}"`
      })
      .join(','),
  )

  return [headers.join(','), ...lines].join('\n')
}

export function auditRowsToExcelHtml(rows) {
  const headers = ['Timestamp', 'User', 'Role', 'Action', 'Module', 'Description', 'IP Address', 'Browser', 'Device']
  const keys = ['timestamp', 'user', 'role', 'action', 'module', 'description', 'ipAddress', 'browser', 'device']
  const escape = (value) =>
    String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')

  return `<!doctype html><html><body><table><thead><tr>${headers
    .map((header) => `<th>${escape(header)}</th>`)
    .join('')}</tr></thead><tbody>${rows
    .map(
      (row) =>
        `<tr>${keys
          .map((key) => `<td>${escape(row[key] instanceof Date ? row[key].toISOString() : row[key])}</td>`)
          .join('')}</tr>`,
    )
    .join('')}</tbody></table></body></html>`
}

function buildAuditQuery(filters) {
  const query = {}

  if (filters.search) query.$text = { $search: filters.search }
  if (filters.role && filters.role !== 'All') query.role = filters.role
  if (filters.action && filters.action !== 'All') query.action = filters.action
  if (filters.module && filters.module !== 'All') query.module = filters.module

  const timestamp = buildDateRange(filters.dateFrom, filters.dateTo)
  if (timestamp) query.timestamp = timestamp

  return query
}

function buildDateRange(dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return null

  const range = {}
  if (dateFrom) range.$gte = parseDateBoundary(dateFrom, false)
  if (dateTo) range.$lte = parseDateBoundary(dateTo, true)
  if (range.$gte && range.$lte && range.$gte > range.$lte) {
    throw httpError(400, 'Start date must be before or equal to end date')
  }
  return range
}

function parseDateBoundary(value, endOfDay) {
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`)
  if (Number.isNaN(date.getTime())) throw httpError(400, 'Invalid audit log date range')
  return date
}

function httpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}
