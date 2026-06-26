import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

import { api } from '@/lib/api'

export type StudentStatus = 'Active' | 'Pending' | 'Review' | 'Inactive'

export type Student = {
  id: string
  databaseId: string
  name: string
  email: string
  program: string
  department: string
  year: string
  status: StudentStatus
  attendance: number
  gpa: number
  advisor: string
  phone: string
  address: string
  departmentId?: string
  programId?: string
  academicYearId?: string
  semesterId?: string
  batch?: string
  enrolledAt: string
  createdAt?: string
  updatedAt?: string
}

export type StudentFilters = {
  search: string
  status: string
  department: string
  page: number
  limit: number
}

export type StudentPayload = Pick<
  Student,
  'name' | 'email' | 'program' | 'department' | 'year' | 'status' | 'advisor' | 'phone' | 'address'
> & Partial<Pick<Student, 'departmentId' | 'programId' | 'academicYearId' | 'semesterId' | 'batch'>>

type StudentListResponse = {
  items: Student[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  summary: {
    total: number
    active: number
    review: number
    averageAttendance: number
  }
}

type StudentResponse = {
  student: Student
}

const defaultStudentFilters: StudentFilters = {
  search: '',
  status: 'All',
  department: 'All',
  page: 1,
  limit: 50,
}

export function useStudents(filters = defaultStudentFilters) {
  const resolvedFilters = filters ?? defaultStudentFilters

  return useQuery({
    queryKey: ['students', resolvedFilters],
    queryFn: async (): Promise<StudentListResponse> => {
      const response = await api.get<StudentListResponse>('/students', {
        params: {
          search: resolvedFilters.search || undefined,
          status: resolvedFilters.status === 'All' ? undefined : resolvedFilters.status,
          department: resolvedFilters.department === 'All' ? undefined : resolvedFilters.department,
          page: resolvedFilters.page,
          limit: resolvedFilters.limit,
        },
      })

      return response.data
    },
  })
}

export function useStudentCount() {
  return useQuery({
    queryKey: ['students', 'count'],
    queryFn: async (): Promise<number> => {
      const response = await api.get<StudentListResponse>('/students', {
        params: {
          page: 1,
          limit: 1,
        },
      })

      return response.data.summary.total
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
  })
}

export function useStudent(studentId?: string) {
  return useQuery({
    enabled: Boolean(studentId),
    queryKey: ['students', studentId],
    queryFn: async (): Promise<Student> => {
      const response = await api.get<StudentResponse>(`/students/${studentId}`)
      return response.data.student
    },
  })
}

export function useCreateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: StudentPayload) => {
      const response = await api.post<StudentResponse>('/students', payload)
      return response.data.student
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}

export function useUpdateStudent(studentId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: StudentPayload) => {
      const response = await api.patch<StudentResponse>(`/students/${studentId}`, payload)
      return response.data.student
    },
    onSuccess: (student) => {
      void queryClient.invalidateQueries({ queryKey: ['students'] })
      void queryClient.setQueryData(['students', student.id], student)
    },
  })
}

export function useDeleteStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (studentId: string) => {
      const response = await api.delete<StudentResponse>(`/students/${studentId}`)
      return response.data.student
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })
}

export function getStudentErrorMessage(caught: unknown) {
  if (axios.isAxiosError<{ message?: string; details?: string[] }>(caught)) {
    return caught.response?.data?.details?.join(' ') ?? caught.response?.data?.message ?? 'Student request failed'
  }

  return caught instanceof Error ? caught.message : 'Student request failed'
}
