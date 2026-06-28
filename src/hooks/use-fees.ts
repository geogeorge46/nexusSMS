import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

import { api } from '@/lib/api'

export type FeeCategory = {
  id: string
  name: string
  description?: string
  status: 'Active' | 'Inactive'
}

export type FeeStructureItem = {
  feeCategoryId: string | FeeCategory
  amount: number
  isOptional?: boolean
}

export type FeeStructure = {
  id: string
  name: string
  departmentId: string | { _id: string; name: string; code: string }
  programId: string | { _id: string; name: string; code: string }
  academicYearId: string | { _id: string; name: string }
  semesterId: string | { _id: string; name: string; number: number }
  items: FeeStructureItem[]
  totalAmount: number
  dueDate: string
  status: 'Active' | 'Inactive'
}

export type StudentFee = {
  id: string
  studentId: string | { _id: string; name: string; email: string; registerNumber: string; department: string; program: string }
  feeStructureId: string | { _id: string; name: string; totalAmount: number; dueDate: string; items?: FeeStructureItem[] }
  academicYearId: string | { _id: string; name: string }
  semesterId: string | { _id: string; name: string; number: number }
  totalAmount: number
  paidAmount: number
  dueAmount: number
  dueDate: string
  status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Waived' | 'Cancelled'
  isOverdue?: boolean
}

export type FeeReceipt = {
  id: string
  receiptNumber: string
  paymentId: string | { _id: string; amount?: number; method: string; transactionId?: string; paidAt: string }
  studentFeeId: string | StudentFee
  studentId: string | { _id: string; name: string; email: string; registerNumber: string }
  amount: number
  issuedAt: string
}

export type FeeReports = {
  summary: {
    totalAssigned: number
    totalPaid: number
    totalDue: number
    records: number
    paidRecords: number
    overdueRecords: number
  }
  byStatus: Record<string, number>
  recentPayments: Array<{ id: string; amount: number; method: string; paidAt: string }>
}

export type FeeStructurePayload = {
  name: string
  departmentId: string
  programId: string
  academicYearId: string
  semesterId: string
  dueDate: string
  status: string
  items: Array<{ feeCategoryId: string; amount: number; isOptional?: boolean }>
}

export function useFeeCategories() {
  return useQuery({
    queryKey: ['fees', 'categories'],
    queryFn: async (): Promise<{ items: FeeCategory[] }> => (await api.get('/fees/categories')).data,
  })
}

export function useCreateFeeCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<FeeCategory>) => (await api.post<{ item: FeeCategory }>('/fees/categories', payload)).data.item,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['fees'] }),
  })
}

export function useUpdateFeeCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<FeeCategory> }) =>
      (await api.patch<{ item: FeeCategory }>(`/fees/categories/${id}`, payload)).data.item,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['fees'] }),
  })
}

export function useDeleteFeeCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await api.delete<{ item: FeeCategory }>(`/fees/categories/${id}`)).data.item,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['fees'] }),
  })
}

export function useFeeStructures() {
  return useQuery({
    queryKey: ['fees', 'structures'],
    queryFn: async (): Promise<{ items: FeeStructure[] }> => (await api.get('/fees/structures')).data,
  })
}

export function useCreateFeeStructure() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: FeeStructurePayload) => (await api.post<{ item: FeeStructure }>('/fees/structures', payload)).data.item,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['fees'] }),
  })
}

export function useUpdateFeeStructure() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: FeeStructurePayload }) =>
      (await api.patch<{ item: FeeStructure }>(`/fees/structures/${id}`, payload)).data.item,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['fees'] }),
  })
}

export function useDeleteFeeStructure() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await api.delete<{ item: FeeStructure }>(`/fees/structures/${id}`)).data.item,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['fees'] }),
  })
}

export function useAssignStudentFees() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { feeStructureId: string; studentIds?: string[] }) => (await api.post('/fees/assign', payload)).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['fees'] }),
  })
}

export function useStudentFees() {
  return useQuery({
    queryKey: ['fees', 'student-fees'],
    queryFn: async (): Promise<{ items: StudentFee[] }> => (await api.get('/fees/student-fees')).data,
  })
}

export function useRecordFeePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { studentFeeId: string; amount: number; method: string; transactionId?: string; paidAt?: string; remarks?: string }) =>
      (await api.post('/fees/payments', payload)).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['fees'] }),
  })
}

export function useFeeReceipts() {
  return useQuery({
    queryKey: ['fees', 'receipts'],
    queryFn: async (): Promise<{ items: FeeReceipt[] }> => (await api.get('/fees/receipts')).data,
  })
}

export function useFeeReports() {
  return useQuery({
    queryKey: ['fees', 'reports'],
    queryFn: async (): Promise<FeeReports> => (await api.get('/fees/reports')).data,
  })
}

export function useStudentPortalFees() {
  return useQuery({
    queryKey: ['student-portal', 'fees'],
    queryFn: async (): Promise<{ items: StudentFee[] }> => (await api.get('/student-portal/fees')).data,
  })
}

export function useStudentPortalReceipts() {
  return useQuery({
    queryKey: ['student-portal', 'receipts'],
    queryFn: async (): Promise<{ items: FeeReceipt[] }> => (await api.get('/student-portal/receipts')).data,
  })
}

export function getFeeErrorMessage(caught: unknown) {
  if (axios.isAxiosError<{ message?: string; details?: string[] }>(caught)) {
    return caught.response?.data?.details?.join(' ') ?? caught.response?.data?.message ?? 'Fee request failed'
  }
  return caught instanceof Error ? caught.message : 'Fee request failed'
}

export function displayRef(value: unknown, key = 'name') {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return String(record[key] ?? record.name ?? record.title ?? record._id ?? '-')
  }
  return String(value ?? '-')
}

export function refId(value: unknown) {
  if (value && typeof value === 'object') return String((value as { _id?: string; id?: string })._id ?? (value as { id?: string }).id ?? '')
  return String(value ?? '')
}
