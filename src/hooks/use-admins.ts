import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

import { api } from '@/lib/api'

export type AdminRole = 'Admin' | 'Super Admin'
export type AdminStatus = 'Active' | 'Suspended'
export type AdminAccount = {
  id: string
  name: string
  email: string
  role: AdminRole
  status: AdminStatus
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export type AdminFilters = { search: string; role: string; status: string; page: number }
export type AdminListResponse = {
  items: AdminAccount[]
  summary: { total: number; active: number; suspended: number; superAdmins: number }
  pagination: { page: number; limit: number; total: number; pages: number }
}

export function useAdmins(filters: AdminFilters) {
  return useQuery({
    queryKey: ['admins', filters],
    queryFn: async (): Promise<AdminListResponse> => (await api.get('/admins', { params: { ...filters, limit: 10 } })).data,
  })
}

export function useCreateAdmin() {
  return useAdminMutation((payload: { name: string; email: string; role: AdminRole; password: string }) => api.post('/admins', payload))
}

export function useUpdateAdmin() {
  return useAdminMutation((payload: { id: string; name?: string; email?: string; role?: AdminRole; status?: AdminStatus }) => {
    const { id, ...values } = payload
    return api.patch(`/admins/${id}`, values)
  })
}

export function useResetAdminPassword() {
  return useAdminMutation((payload: { id: string; password: string }) => api.patch(`/admins/${payload.id}/password`, { password: payload.password }))
}

export function useDeleteAdmin() {
  return useAdminMutation((adminId: string) => api.delete(`/admins/${adminId}`))
}

export function getAdminErrorMessage(caught: unknown) {
  if (axios.isAxiosError<{ message?: string; details?: string[] }>(caught)) {
    return caught.response?.data?.details?.join(' ') ?? caught.response?.data?.message ?? 'Admin request failed'
  }
  return caught instanceof Error ? caught.message : 'Admin request failed'
}

function useAdminMutation<TPayload>(mutationFn: (payload: TPayload) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admins'] }),
  })
}
