import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { api } from '@/lib/api'

export type GradeStatus = 'Published' | 'Review' | 'Draft'
export type GradeRecord = { id: string; studentId: string; courseId: string; student: string; course: string; department: string; type: string; assessmentType: string; marksObtained: number; maxMarks: number; score: number; percentage: number; letter: string; gradeLetter: string; semester: string; remarks: string; gpa: number; cgpa: number; status: GradeStatus; createdAt: string }
export type GradeData = { summary: { gpa: number; cgpa: number; graded: number; pending: number; atRisk: number }; assignments: Assessment[]; exams: Assessment[]; grades: GradeRecord[]; performance: { label: string; average: number; gpa: number }[]; analytics: { label: string; value: number; tone: string }[] }
type Assessment = { id: string; title: string; course: string; average: number; status?: string; date?: string; submitted?: number; total?: number }
export type GradePayload = { studentId: string; courseId: string; assessmentType: string; marksObtained: number; maxMarks: number; semester: string; remarks: string }
export type GradeFilters = { student?: string; course?: string; semester?: string; department?: string; assessmentType?: string }

export function useGrades(filters: GradeFilters = {}) {
  return useQuery({ queryKey: ['grades', filters], queryFn: async () => (await api.get<GradeData>('/grades', { params: filters })).data })
}
export function useStudentGrades(studentId?: string) {
  return useQuery({ enabled: Boolean(studentId), queryKey: ['grades', 'student', studentId], queryFn: async () => (await api.get<GradeData>(`/grades/student/${studentId}`)).data })
}
export function useCourseGrades(courseId?: string) {
  return useQuery({ enabled: Boolean(courseId), queryKey: ['grades', 'course', courseId], queryFn: async () => (await api.get<GradeData>(`/grades/course/${courseId}`)).data })
}
export function useCreateGrade() {
  const client = useQueryClient()
  return useMutation({ mutationFn: async (payload: GradePayload) => (await api.post<{ grade: GradeRecord }>('/grades', payload)).data.grade, onSuccess: () => void client.invalidateQueries({ queryKey: ['grades'] }) })
}
export function useUpdateGrade() {
  const client = useQueryClient()
  return useMutation({ mutationFn: async ({ id, payload }: { id: string; payload: GradePayload }) => (await api.patch<{ grade: GradeRecord }>(`/grades/${id}`, payload)).data.grade, onSuccess: () => void client.invalidateQueries({ queryKey: ['grades'] }) })
}
export function useDeleteGrade() {
  const client = useQueryClient()
  return useMutation({ mutationFn: async (id: string) => api.delete(`/grades/${id}`), onSuccess: () => void client.invalidateQueries({ queryKey: ['grades'] }) })
}
export function getGradeErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string; details?: string[] }>(error)) return error.response?.data?.details?.join(' ') ?? error.response?.data?.message ?? 'Grade request failed'
  return error instanceof Error ? error.message : 'Grade request failed'
}
