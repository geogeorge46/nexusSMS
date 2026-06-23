import { api } from '@/lib/api'
import { adminHeaders } from '@/lib/notifications'

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
    headers: adminHeaders(),
  })

  return response.data
}

export function getAuditExportUrl(filters: AuditFilters, format: 'csv' | 'excel') {
  const params = new URLSearchParams()
  params.set('format', format)

  if (filters.search) params.set('search', filters.search)
  if (filters.role !== 'All') params.set('role', filters.role)
  if (filters.action !== 'All') params.set('action', filters.action)
  if (filters.module !== 'All') params.set('module', filters.module)

  return `${api.defaults.baseURL}/audit-logs/export?${params.toString()}`
}

export const fallbackAuditLogs: AuditLogResponse = {
  pagination: { page: 1, limit: 10, total: 6, pages: 1 },
  items: [
    {
      _id: 'audit-1',
      user: 'Campus Admin',
      role: 'Super Admin',
      action: 'LOGIN',
      module: 'Auth',
      description: 'Super Admin signed in successfully',
      ipAddress: '127.0.0.1',
      browser: 'Chrome',
      device: 'Desktop',
      timestamp: '2026-06-23T09:30:00.000Z',
    },
    {
      _id: 'audit-2',
      user: 'Registrar Office',
      role: 'Admin',
      action: 'STUDENT_CREATE',
      module: 'Students',
      description: 'Created student record NX-2026-1042',
      ipAddress: '127.0.0.1',
      browser: 'Edge',
      device: 'Desktop',
      timestamp: '2026-06-23T08:58:00.000Z',
    },
    {
      _id: 'audit-3',
      user: 'Campus Admin',
      role: 'Super Admin',
      action: 'SETTINGS_CHANGE',
      module: 'Settings',
      description: 'Updated notification delivery preferences',
      ipAddress: '127.0.0.1',
      browser: 'Chrome',
      device: 'Desktop',
      timestamp: '2026-06-22T17:15:00.000Z',
    },
    {
      _id: 'audit-4',
      user: 'Reports Lead',
      role: 'Admin',
      action: 'REPORT_EXPORT',
      module: 'Reports',
      description: 'Exported attendance report as Excel',
      ipAddress: '127.0.0.1',
      browser: 'Firefox',
      device: 'Desktop',
      timestamp: '2026-06-22T14:45:00.000Z',
    },
    {
      _id: 'audit-5',
      user: 'Course Coordinator',
      role: 'Admin',
      action: 'COURSE_UPDATE',
      module: 'Courses',
      description: 'Updated course capacity for Data Structures',
      ipAddress: '127.0.0.1',
      browser: 'Safari',
      device: 'Tablet',
      timestamp: '2026-06-21T15:25:00.000Z',
    },
    {
      _id: 'audit-6',
      user: 'Campus Admin',
      role: 'Super Admin',
      action: 'LOGOUT',
      module: 'Auth',
      description: 'Super Admin signed out',
      ipAddress: '127.0.0.1',
      browser: 'Chrome',
      device: 'Desktop',
      timestamp: '2026-06-21T12:05:00.000Z',
    },
  ],
}
