import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

import { api } from '@/lib/api'

export type Room = {
  id: string
  name: string
  roomNumber: string
  building: string
  capacity: number
  type: 'Classroom' | 'Lab' | 'Seminar Hall' | 'Auditorium' | 'Other'
  status: 'Active' | 'Inactive'
}

export type TimetableSlot = {
  id: string
  departmentId: string | { _id: string; name: string }
  programId: string | { _id: string; name: string }
  semesterId: string | { _id: string; name: string }
  academicYearId: string | { _id: string; name: string }
  courseId: string | { _id: string; title: string; code: string }
  staffId: string | { _id: string; name: string }
  roomId: string | { _id: string; name: string; roomNumber: string; building: string }
  teacherId?: string | { _id: string; name: string }
  dayOfWeek: string
  startTime: string
  endTime: string
  time: string
  slotType: string
  status: string
  courseName?: string
  teacherName?: string
  roomName?: string
}

export type RoomPayload = Omit<Room, 'id'>
export type SlotPayload = {
  departmentId: string
  programId: string
  semesterId: string
  academicYearId: string
  courseId: string
  staffId: string
  roomId: string
  dayOfWeek: string
  startTime: string
  endTime: string
  slotType: string
  status: string
}

export function useRooms() {
  return useQuery({
    queryKey: ['timetable', 'rooms'],
    queryFn: async (): Promise<{ items: Room[] }> => (await api.get('/timetable/rooms')).data,
  })
}

export function useCreateRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: RoomPayload) => (await api.post<{ item: Room }>('/timetable/rooms', payload)).data.item,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['timetable'] }),
  })
}

export function useUpdateRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: RoomPayload }) => (await api.patch<{ item: Room }>(`/timetable/rooms/${id}`, payload)).data.item,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['timetable'] }),
  })
}

export function useDeleteRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await api.delete<{ item: Room }>(`/timetable/rooms/${id}`)).data.item,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['timetable'] }),
  })
}

export function useTimetableSlots() {
  return useQuery({
    queryKey: ['timetable', 'slots'],
    queryFn: async (): Promise<{ items: TimetableSlot[] }> => (await api.get('/timetable/slots')).data,
  })
}

export function useMyTeacherTimetable(enabled = true) {
  return useQuery({
    enabled,
    queryKey: ['timetable', 'teacher', 'me'],
    queryFn: async (): Promise<{ items: TimetableSlot[] }> => (await api.get('/timetable/teacher/me')).data,
  })
}

export function useCreateTimetableSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: SlotPayload) => (await api.post<{ item: TimetableSlot }>('/timetable/slots', payload)).data.item,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['timetable'] }),
  })
}

export function useUpdateTimetableSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: SlotPayload }) => (await api.patch<{ item: TimetableSlot }>(`/timetable/slots/${id}`, payload)).data.item,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['timetable'] }),
  })
}

export function useDeleteTimetableSlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await api.delete<{ item: TimetableSlot }>(`/timetable/slots/${id}`)).data.item,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['timetable'] }),
  })
}

export function getTimetableErrorMessage(caught: unknown) {
  if (axios.isAxiosError<{ message?: string; details?: string[] }>(caught)) {
    return caught.response?.data?.details?.join(' ') ?? caught.response?.data?.message ?? 'Timetable request failed'
  }
  return caught instanceof Error ? caught.message : 'Timetable request failed'
}

export function refLabel(value: unknown, key = 'name') {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return String(record[key] ?? record.title ?? record.name ?? record.roomNumber ?? '-')
  }
  return String(value ?? '-')
}

export function refValue(value: unknown) {
  if (value && typeof value === 'object') return String((value as { _id?: string; id?: string })._id ?? (value as { id?: string }).id ?? '')
  return String(value ?? '')
}
