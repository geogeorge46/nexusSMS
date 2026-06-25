import { api } from '@/lib/api'
import axios from 'axios'

export type AuditLog = {
  _id: string
  user: string
  role: 'Admin' | 'Super Admin'
  action: string
  module: string
  description: string
  ipAddress: string
  browser: string
  device: string
  timestamp: string
}

export type AuditLogResponse = {
  items: AuditLog[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export type AuditFilters = {
  search: string
  role: string
  action: string
  module: string
  dateFrom: string
  dateTo: string
  page: number
}

export async function fetchAuditLogs(filters: AuditFilters) {
  const response = await api.get<AuditLogResponse>('/audit-logs', {
    params: {
      ...filters,
      limit: 10,
      role: filters.role === 'All' ? undefined : filters.role,
      action: filters.action === 'All' ? undefined : filters.action,
      module: filters.module === 'All' ? undefined : filters.module,
    },
  })

  return response.data
}

export async function downloadAuditLogExport(filters: AuditFilters, format: 'csv' | 'excel') {
  const response = await api.get<Blob>(`/audit-logs/export/${format}`, {
    params: {
      search: filters.search || undefined,
      role: filters.role === 'All' ? undefined : filters.role,
      action: filters.action === 'All' ? undefined : filters.action,
      module: filters.module === 'All' ? undefined : filters.module,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    },
    responseType: 'blob',
  })

  const disposition = String(response.headers['content-disposition'] ?? '')
  const fileName = disposition.match(/filename="?([^";]+)"?/i)?.[1]
    ?? `nexus-audit-log.${format === 'excel' ? 'xls' : 'csv'}`
  const url = URL.createObjectURL(response.data)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function getAuditLogErrorMessage(caught: unknown) {
  if (axios.isAxiosError<{ message?: string }>(caught)) {
    return caught.response?.data?.message ?? 'Audit log request failed'
  }

  return caught instanceof Error ? caught.message : 'Audit log request failed'
}
