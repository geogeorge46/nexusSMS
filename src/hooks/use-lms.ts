import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

import { api } from '@/lib/api'

export type Assignment = { id: string; title: string; description: string; courseId: unknown; staffId: unknown; academicYearId: unknown; semesterId: unknown; dueDate: string; maxMarks: number; attachmentUrl?: string; status: string; isLate?: boolean }
export type AssignmentSubmission = { id: string; assignmentId: unknown; studentId: unknown; courseId: unknown; submittedAt: string; submissionText: string; fileUrl?: string; fileName?: string; status: string; marksObtained?: number; feedback?: string; gradedAt?: string }
export type LearningMaterial = { id: string; title: string; description?: string; courseId: unknown; staffId: unknown; materialType: string; fileUrl?: string; externalUrl?: string; visibility: string; createdAt?: string }

export function useLmsAssignments() {
  return useQuery({ queryKey: ['lms', 'assignments'], queryFn: async (): Promise<{ items: Assignment[] }> => (await api.get('/lms/assignments')).data })
}
export function useCreateLmsAssignment() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async (payload: Partial<Assignment>) => (await api.post<{ item: Assignment }>('/lms/assignments', payload)).data.item, onSuccess: () => void qc.invalidateQueries({ queryKey: ['lms'] }) })
}
export function useUpdateLmsAssignment() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async ({ id, payload }: { id: string; payload: Partial<Assignment> }) => (await api.patch<{ item: Assignment }>(`/lms/assignments/${id}`, payload)).data.item, onSuccess: () => void qc.invalidateQueries({ queryKey: ['lms'] }) })
}
export function useAssignmentSubmissions(assignmentId?: string) {
  return useQuery({ enabled: Boolean(assignmentId), queryKey: ['lms', 'assignments', assignmentId, 'submissions'], queryFn: async (): Promise<{ items: AssignmentSubmission[] }> => (await api.get(`/lms/assignments/${assignmentId}/submissions`)).data })
}
export function useGradeSubmission() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async ({ id, payload }: { id: string; payload: { marksObtained: number; feedback?: string; status?: string } }) => (await api.patch<{ item: AssignmentSubmission }>(`/lms/submissions/${id}/grade`, payload)).data.item, onSuccess: () => void qc.invalidateQueries({ queryKey: ['lms'] }) })
}
export function useLmsMaterials() {
  return useQuery({ queryKey: ['lms', 'materials'], queryFn: async (): Promise<{ items: LearningMaterial[] }> => (await api.get('/lms/materials')).data })
}
export function useCreateLmsMaterial() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async (payload: Partial<LearningMaterial>) => (await api.post<{ item: LearningMaterial }>('/lms/materials', payload)).data.item, onSuccess: () => void qc.invalidateQueries({ queryKey: ['lms'] }) })
}
export function useStudentPortalAssignments() {
  return useQuery({ queryKey: ['student-portal', 'assignments'], queryFn: async (): Promise<{ items: Assignment[] }> => (await api.get('/student-portal/assignments')).data })
}
export function useStudentPortalSubmissions() {
  return useQuery({ queryKey: ['student-portal', 'submissions'], queryFn: async (): Promise<{ items: AssignmentSubmission[] }> => (await api.get('/student-portal/submissions')).data })
}
export function useSubmitAssignment() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async ({ id, payload }: { id: string; payload: { submissionText: string; fileUrl?: string; fileName?: string } }) => (await api.post<{ item: AssignmentSubmission }>(`/student-portal/assignments/${id}/submit`, payload)).data.item, onSuccess: () => void qc.invalidateQueries({ queryKey: ['student-portal'] }) })
}
export function useStudentPortalMaterials() {
  return useQuery({ queryKey: ['student-portal', 'materials'], queryFn: async (): Promise<{ items: LearningMaterial[] }> => (await api.get('/student-portal/materials')).data })
}
export function getLmsErrorMessage(caught: unknown) {
  if (axios.isAxiosError<{ message?: string; details?: string[] }>(caught)) return caught.response?.data?.details?.join(' ') ?? caught.response?.data?.message ?? 'LMS request failed'
  return caught instanceof Error ? caught.message : 'LMS request failed'
}
export function lmsLabel(value: unknown, key = 'title') {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return String(record[key] ?? record.name ?? record.title ?? record.registerNumber ?? '-')
  }
  return String(value ?? '-')
}
