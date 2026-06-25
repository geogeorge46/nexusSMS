import axios from 'axios'

import { api } from '@/lib/api'

export type ReportType = 'students' | 'attendance' | 'grades' | 'courses'
export type ReportFormat = 'pdf' | 'excel' | 'csv'

export type ReportFilters = {
  dateFrom: string
  dateTo: string
  department: string
  course: string
  semester: string
  student: string
  status: string
  page: number
}

export type ReportResponse = {
  type: ReportType
  title: string
  columns: Array<{ key: string; label: string }>
  rows: Array<Record<string, string | number>>
  metrics: Array<{ label: string; value: string | number }>
  filterOptions: {
    departments: string[]
    semesters: string[]
    students: Array<{ value: string; label: string }>
    courses: Array<{ value: string; label: string }>
    statuses: string[]
  }
  pagination: { page: number; limit: number; total: number; pages: number }
}

export async function fetchReport(type: ReportType, filters: ReportFilters) {
  const response = await api.get<ReportResponse>(`/reports/${type}`, {
    params: reportParams(filters),
  })
  return response.data
}

export async function downloadReport(type: ReportType, format: ReportFormat, filters: ReportFilters) {
  const response = await api.get<Blob>(`/reports/export/${format}`, {
    params: { type, ...reportParams(filters), page: undefined, limit: undefined },
    responseType: 'blob',
    timeout: 120000,
  })
  const disposition = String(response.headers['content-disposition'] ?? '')
  const extension = format === 'excel' ? 'xlsx' : format
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? `nexus-${type}-report.${extension}`
  const url = URL.createObjectURL(response.data)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function getReportErrorMessage(caught: unknown) {
  if (axios.isAxiosError<{ message?: string }>(caught)) {
    return caught.response?.data?.message ?? 'Report request failed'
  }
  return caught instanceof Error ? caught.message : 'Report request failed'
}

function reportParams(filters: ReportFilters) {
  return {
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    department: filters.department === 'All' ? undefined : filters.department,
    course: filters.course === 'All' ? undefined : filters.course,
    semester: filters.semester === 'All' ? undefined : filters.semester,
    student: filters.student === 'All' ? undefined : filters.student,
    status: filters.status === 'All' ? undefined : filters.status,
    page: filters.page,
    limit: 10,
  }
}
