import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

import { api } from '@/lib/api'

export type Exam = { id: string; title: string; examType: string; academicYearId: unknown; programId: unknown; semesterId: unknown; status: string }
export type ExamSchedule = { id: string; examId: unknown; courseId: unknown; date: string; startTime: string; endTime: string; roomId?: unknown; maxMarks: number; passingMarks: number; status: string; time?: string }
export type ExamResult = { id: string; examId: unknown; scheduleId: unknown; studentId: unknown; courseId: unknown; marksObtained: number; maxMarks: number; percentage: number; gradeLetter: string; resultStatus: string; remarks?: string; publishedAt?: string }
export type HallTicket = { id: string; studentId: unknown; examId: unknown; hallTicketNumber: string; eligibleCourses: unknown[]; blockedCourses: unknown[]; status: string; reason?: string; generatedAt: string }

export function useExams() {
  return useQuery({ queryKey: ['exams'], queryFn: async (): Promise<{ items: Exam[] }> => (await api.get('/exams')).data })
}
export function useCreateExam() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async (payload: Partial<Exam>) => (await api.post<{ item: Exam }>('/exams', payload)).data.item, onSuccess: () => void qc.invalidateQueries({ queryKey: ['exams'] }) })
}
export function useUpdateExam() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async ({ id, payload }: { id: string; payload: Partial<Exam> }) => (await api.patch<{ item: Exam }>(`/exams/${id}`, payload)).data.item, onSuccess: () => void qc.invalidateQueries({ queryKey: ['exams'] }) })
}
export function useDeleteExam() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async (id: string) => (await api.delete<{ item: Exam }>(`/exams/${id}`)).data.item, onSuccess: () => void qc.invalidateQueries({ queryKey: ['exams'] }) })
}
export function useExamSchedules(examId?: string) {
  return useQuery({ enabled: Boolean(examId), queryKey: ['exams', examId, 'schedules'], queryFn: async (): Promise<{ items: ExamSchedule[] }> => (await api.get(`/exams/${examId}/schedules`)).data })
}
export function useTeacherExamSchedules(enabled: boolean) {
  return useQuery({ enabled, queryKey: ['exams', 'teacher', 'schedules'], queryFn: async (): Promise<{ items: ExamSchedule[] }> => (await api.get('/exams/teacher/schedules')).data })
}
export function useCreateExamSchedule(examId?: string) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async (payload: Partial<ExamSchedule>) => (await api.post<{ item: ExamSchedule }>(`/exams/${examId}/schedules`, payload)).data.item, onSuccess: () => void qc.invalidateQueries({ queryKey: ['exams'] }) })
}
export function useGenerateHallTickets() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async (examId: string) => (await api.post(`/exams/${examId}/hall-tickets/generate`, {})).data, onSuccess: () => void qc.invalidateQueries({ queryKey: ['exams'] }) })
}
export function useHallTickets(examId?: string) {
  return useQuery({ enabled: Boolean(examId), queryKey: ['exams', examId, 'hall-tickets'], queryFn: async (): Promise<{ items: HallTicket[] }> => (await api.get(`/exams/${examId}/hall-tickets`)).data })
}
export function useExamResults() {
  return useQuery({ queryKey: ['exams', 'results'], queryFn: async (): Promise<{ items: ExamResult[] }> => (await api.get('/exams/results')).data })
}
export function useSaveExamResult() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async (payload: Partial<ExamResult>) => (await api.post<{ item: ExamResult }>('/exams/results', payload)).data.item, onSuccess: () => void qc.invalidateQueries({ queryKey: ['exams'] }) })
}
export function usePublishExamResults() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async (examId: string) => (await api.post(`/exams/${examId}/publish-results`, {})).data, onSuccess: () => void qc.invalidateQueries({ queryKey: ['exams'] }) })
}
export function useStudentPortalExams() {
  return useQuery({ queryKey: ['student-portal', 'exams'], queryFn: async (): Promise<{ items: Exam[] }> => (await api.get('/student-portal/exams')).data })
}
export function useStudentPortalHallTickets() {
  return useQuery({ queryKey: ['student-portal', 'hall-tickets'], queryFn: async (): Promise<{ items: HallTicket[] }> => (await api.get('/student-portal/hall-tickets')).data })
}
export function useStudentPortalExamResults() {
  return useQuery({ queryKey: ['student-portal', 'results'], queryFn: async (): Promise<{ items: ExamResult[] }> => (await api.get('/student-portal/results')).data })
}
export function getExamErrorMessage(caught: unknown) {
  if (axios.isAxiosError<{ message?: string; details?: string[] }>(caught)) return caught.response?.data?.details?.join(' ') ?? caught.response?.data?.message ?? 'Exam request failed'
  return caught instanceof Error ? caught.message : 'Exam request failed'
}
export function examLabel(value: unknown, key = 'title') {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return String(record[key] ?? record.name ?? record.title ?? record.registerNumber ?? '-')
  }
  return String(value ?? '-')
}
export function examId(value: unknown) {
  if (value && typeof value === 'object') return String((value as { _id?: string; id?: string })._id ?? (value as { id?: string }).id ?? '')
  return String(value ?? '')
}
