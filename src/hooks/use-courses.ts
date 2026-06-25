import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

import { api } from '@/lib/api'

export type CourseStatus = 'Active' | 'Inactive'

export type Course = {
  id: string
  databaseId: string
  title: string
  code: string
  department: string
  faculty: string
  credits: number
  status: CourseStatus
  enrolled: number
  capacity: number
  schedule: string
  room: string
  term: string
  semester: string
  description: string
  createdAt?: string
  updatedAt?: string
}

export type CourseFilters = {
  search: string
  status: string
  department: string
  page: number
  limit: number
}

export type CoursePayload = Pick<
  Course,
  | 'title'
  | 'code'
  | 'department'
  | 'faculty'
  | 'credits'
  | 'status'
  | 'enrolled'
  | 'capacity'
  | 'schedule'
  | 'room'
  | 'term'
  | 'description'
>

type CourseListResponse = {
  items: Course[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  summary: {
    total: number
    active: number
    enrollment: number
    capacityUsed: number
  }
}

type CourseResponse = {
  course: Course
}

const defaultCourseFilters: CourseFilters = {
  search: '',
  status: 'All',
  department: 'All',
  page: 1,
  limit: 7,
}

export function useCourses(filters = defaultCourseFilters) {
  return useQuery({
    queryKey: ['courses', filters],
    queryFn: async (): Promise<CourseListResponse> => {
      const response = await api.get<CourseListResponse>('/courses', {
        params: {
          search: filters.search || undefined,
          status: filters.status === 'All' ? undefined : filters.status,
          department: filters.department === 'All' ? undefined : filters.department,
          page: filters.page,
          limit: filters.limit,
        },
      })

      return response.data
    },
  })
}

export function useCourse(courseId?: string) {
  return useQuery({
    enabled: Boolean(courseId),
    queryKey: ['courses', courseId],
    queryFn: async (): Promise<Course> => {
      const response = await api.get<CourseResponse>(`/courses/${courseId}`)
      return response.data.course
    },
  })
}

export function useCreateCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CoursePayload) => {
      const response = await api.post<CourseResponse>('/courses', payload)
      return response.data.course
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
  })
}

export function useUpdateCourse(courseId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CoursePayload) => {
      const response = await api.patch<CourseResponse>(`/courses/${courseId}`, payload)
      return response.data.course
    },
    onSuccess: (course) => {
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
      void queryClient.setQueryData(['courses', course.id], course)
    },
  })
}

export function useDeleteCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await api.delete<CourseResponse>(`/courses/${courseId}`)
      return response.data.course
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
  })
}

export function getCourseErrorMessage(caught: unknown) {
  if (axios.isAxiosError<{ message?: string; details?: string[] }>(caught)) {
    return caught.response?.data?.details?.join(' ') ?? caught.response?.data?.message ?? 'Course request failed'
  }

  return caught instanceof Error ? caught.message : 'Course request failed'
}
