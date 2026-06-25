import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

import { api } from '@/lib/api'

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused'

export type AttendanceFilters = {
  date: string
  course: string
  student: string
  department: string
  status: string
}

export type AttendanceRecord = {
  id: string
  studentId: string
  courseId: string
  student: string
  course: string
  department: string
  grade: string
  date: string
  status: AttendanceStatus
  remarks: string
  checkIn: string
}

export type AttendanceData = {
  summary: {
    average: number
    present: number
    absent: number
    late: number
    atRisk: number
  }
  dailyTrend: Array<{
    day: string
    present: number
    late: number
    absent: number
  }>
  calendar: Array<{
    date: string
    rate: number
    status: 'Strong' | 'Watch' | 'Concern'
  }>
  heatmap: Array<{
    label: string
    values: number[]
  }>
  history: AttendanceRecord[]
  markRoster: Array<{
    id: string
    databaseId: string
    attendanceId: string
    name: string
    course: string
    courseId: string
    grade: string
    status: AttendanceStatus
  }>
}

export type AttendancePayload = {
  studentId: string
  courseId: string
  date: string
  status: AttendanceStatus
  remarks?: string
}

type AttendanceListResponse = {
  history: AttendanceRecord[]
}

type AttendanceResponse = {
  attendance: AttendanceRecord
}

const defaultAttendanceFilters: AttendanceFilters = {
  date: '',
  course: 'All',
  student: '',
  department: 'All',
  status: 'All',
}

export function useAttendance(filters = defaultAttendanceFilters) {
  return useQuery({
    queryKey: ['attendance-summary', filters],
    queryFn: async (): Promise<AttendanceData> => {
      const response = await api.get<AttendanceData>('/attendance/summary', {
        params: normalizeFilters(filters),
      })
      return response.data
    },
  })
}

export function useAttendanceHistory(filters = defaultAttendanceFilters) {
  return useQuery({
    queryKey: ['attendance-history', filters],
    queryFn: async (): Promise<AttendanceListResponse> => {
      const response = await api.get<AttendanceListResponse>('/attendance', {
        params: normalizeFilters(filters),
      })
      return response.data
    },
  })
}

export function useMarkAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AttendancePayload) => {
      const response = await api.post<AttendanceResponse>('/attendance/mark', payload)
      return response.data.attendance
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attendance-summary'] })
      void queryClient.invalidateQueries({ queryKey: ['attendance-history'] })
    },
  })
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      attendanceId,
      payload,
    }: {
      attendanceId: string
      payload: Partial<AttendancePayload>
    }) => {
      const response = await api.patch<AttendanceResponse>(`/attendance/${attendanceId}`, payload)
      return response.data.attendance
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attendance-summary'] })
      void queryClient.invalidateQueries({ queryKey: ['attendance-history'] })
    },
  })
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (attendanceId: string) => {
      const response = await api.delete<AttendanceResponse>(`/attendance/${attendanceId}`)
      return response.data.attendance
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attendance-summary'] })
      void queryClient.invalidateQueries({ queryKey: ['attendance-history'] })
    },
  })
}

export function getAttendanceErrorMessage(caught: unknown) {
  if (axios.isAxiosError<{ message?: string; details?: string[] }>(caught)) {
    return caught.response?.data?.details?.join(' ') ?? caught.response?.data?.message ?? 'Attendance request failed'
  }

  return caught instanceof Error ? caught.message : 'Attendance request failed'
}

function normalizeFilters(filters: AttendanceFilters) {
  return {
    date: filters.date || undefined,
    course: filters.course === 'All' ? undefined : filters.course,
    student: filters.student || undefined,
    department: filters.department === 'All' ? undefined : filters.department,
    status: filters.status === 'All' ? undefined : filters.status,
  }
}
