import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

import { api } from '@/lib/api'

export type ParentStudent = { id: string; registerNumber: string; name: string; email: string; department: string; program: string; year: string; batch?: string; status: string }

export function useParentStudents() {
  return useQuery({ queryKey: ['parent-portal', 'students'], queryFn: async (): Promise<{ items: ParentStudent[] }> => (await api.get('/parent-portal/students')).data })
}
export function useParentMe() {
  return useQuery({ queryKey: ['parent-portal', 'me'], queryFn: async () => (await api.get('/parent-portal/me')).data })
}
export function useParentChildResource(studentId: string, resource: string) {
  return useQuery({
    enabled: Boolean(studentId),
    queryKey: ['parent-portal', studentId, resource],
    queryFn: async () => (await api.get(`/parent-portal/students/${studentId}/${resource}`)).data,
  })
}
export function useParentNotifications(page = 1) {
  return useQuery({ queryKey: ['parent-portal', 'notifications', page], queryFn: async () => (await api.get('/parent-portal/notifications', { params: { page, limit: 8 } })).data })
}
export function useMarkParentNotificationRead() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async (id: string) => (await api.patch(`/parent-portal/notifications/${id}/read`, {})).data, onSuccess: () => void qc.invalidateQueries({ queryKey: ['parent-portal', 'notifications'] }) })
}
export function getParentPortalErrorMessage(caught: unknown) {
  if (axios.isAxiosError<{ message?: string; details?: string[] }>(caught)) return caught.response?.data?.details?.join(' ') ?? caught.response?.data?.message ?? 'Parent portal request failed'
  return caught instanceof Error ? caught.message : 'Parent portal request failed'
}
export function parentLabel(value: unknown, key = 'name') {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return String(record[key] ?? record.title ?? record.name ?? record.course ?? record.documentType ?? '-')
  }
  return String(value ?? '-')
}
