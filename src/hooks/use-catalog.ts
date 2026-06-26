import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

import { api } from '@/lib/api'

export type CatalogResource =
  | 'departments'
  | 'programs'
  | 'academicYears'
  | 'semesters'
  | 'staff'
  | 'studentcourses'
  | 'courseassignments'

export type CatalogItem = {
  id: string
  _id?: string
  resource?: CatalogResource
  name?: string
  code?: string
  status?: string
  description?: string
  departmentId?: string
  programId?: string
  academicYearId?: string
  semesterId?: string
  staffId?: string
  studentId?: string
  courseId?: string
  employeeNumber?: string
  email?: string
  phone?: string
  category?: 'Teaching' | 'Non-Teaching'
  designation?: string
  level?: string
  durationSemesters?: number
  number?: number
  startDate?: string
  endDate?: string
  role?: 'Primary' | 'Assistant'
  enrolledAt?: string
  createdAt?: string
  updatedAt?: string
}

export type CatalogPayload = Record<string, string | number | undefined>

type CatalogResponse = {
  items: CatalogItem[]
}

type CatalogMutationResponse = {
  item: CatalogItem
}

export function useCatalog(resource: CatalogResource, filters: { status?: string } = {}) {
  return useQuery({
    queryKey: ['catalog', resource, filters],
    queryFn: async (): Promise<CatalogResponse> => {
      const response = await api.get<CatalogResponse>(`/catalog/${resource}`, {
        params: {
          status: filters.status === 'All' ? undefined : filters.status,
        },
      })

      return response.data
    },
  })
}

export function useCreateCatalogItem(resource: CatalogResource) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CatalogPayload) => {
      const response = await api.post<CatalogMutationResponse>(`/catalog/${resource}`, payload)
      return response.data.item
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['catalog'] })
      void queryClient.invalidateQueries({ queryKey: ['students'] })
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
      void queryClient.invalidateQueries({ queryKey: ['attendance-summary'] })
      void queryClient.invalidateQueries({ queryKey: ['grades'] })
    },
  })
}

export function useUpdateCatalogItem(resource: CatalogResource) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: CatalogPayload }) => {
      const response = await api.patch<CatalogMutationResponse>(`/catalog/${resource}/${id}`, payload)
      return response.data.item
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['catalog'] })
      void queryClient.invalidateQueries({ queryKey: ['students'] })
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
  })
}

export function useDeleteCatalogItem(resource: CatalogResource) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<CatalogMutationResponse>(`/catalog/${resource}/${id}`)
      return response.data.item
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['catalog'] })
      void queryClient.invalidateQueries({ queryKey: ['students'] })
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
  })
}

export function getCatalogErrorMessage(caught: unknown) {
  if (axios.isAxiosError<{ message?: string; details?: string[] }>(caught)) {
    return caught.response?.data?.details?.join(' ') ?? caught.response?.data?.message ?? 'Catalog request failed'
  }

  return caught instanceof Error ? caught.message : 'Catalog request failed'
}
