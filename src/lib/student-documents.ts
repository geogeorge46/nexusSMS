import { api } from '@/lib/api'
import axios from 'axios'

export const documentCategories = ['All', 'Identity', 'Academic', 'Financial', 'Medical', 'Consent', 'Transfer', 'Other'] as const
export type DocumentCategory = (typeof documentCategories)[number]

export type StudentDocument = {
  _id: string
  studentId: string
  documentType: Exclude<DocumentCategory, 'All'>
  category: Exclude<DocumentCategory, 'All'>
  title: string
  fileName: string
  originalName: string
  fileUrl: string
  secureUrl: string
  cloudinaryPublicId: string
  mimeType: string
  fileSize: number
  size: number
  studentName: string
  registerNumber: string
  downloadUrl: string
  scanStatus: 'queued' | 'passed' | 'failed'
  uploadedBy: string
  uploadedAt: string
  createdAt: string
}

export type DocumentListResponse = {
  documents: StudentDocument[]
  grouped: { category: Exclude<DocumentCategory, 'All'>; count: number }[]
  total: number
}

export type UploadDocumentPayload = {
  files: File[]
  category: string
  title: string
  studentId: string
}

export const acceptedDocumentTypes = ['application/pdf', 'image/jpeg', 'image/png']
export const acceptedDocumentExtensions = '.pdf,.jpg,.jpeg,.png,.doc,.docx'
export const maxDocumentSizeMb = 10
export const maxDocumentCount = 8

export async function fetchStudentDocuments(params: { category: DocumentCategory; search: string; studentId?: string }) {
  const endpoint = params.studentId ? `/documents/student/${params.studentId}` : '/documents'
  const response = await api.get<DocumentListResponse>(endpoint, {
    params: {
      category: params.category === 'All' ? undefined : params.category,
      search: params.search || undefined,
    },
  })
  return response.data
}

export async function uploadStudentDocuments(payload: UploadDocumentPayload, onProgress?: (progress: number) => void) {
  const formData = new FormData()
  for (const file of payload.files) formData.append('documents', file)
  formData.append('studentId', payload.studentId)
  formData.append('category', payload.category)
  formData.append('title', payload.title)

  const response = await api.post<{ message: string; documents: StudentDocument[] }>('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
    onUploadProgress(event) {
      if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100))
    },
  })
  return response.data
}

export async function deleteStudentDocument(documentId: string) {
  await api.delete(`/documents/${documentId}`)
}

export function getStudentDocumentDownloadUrl(document: StudentDocument) {
  return document.downloadUrl || document.fileUrl
}

export function validateDocumentFiles(files: File[]) {
  const errors = files.flatMap((file) => {
    const errors: string[] = []
    const extensionAllowed = /\.(pdf|jpe?g|png|docx?)$/i.test(file.name)
    const mimeAllowed = acceptedDocumentTypes.includes(file.type)
      || file.type === 'application/msword'
      || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    if (!extensionAllowed || (!mimeAllowed && file.type)) errors.push(`${file.name}: unsupported file type`)
    if (file.size > maxDocumentSizeMb * 1024 * 1024) errors.push(`${file.name}: exceeds ${maxDocumentSizeMb}MB`)
    return errors
  })

  if (files.length > maxDocumentCount) errors.unshift(`Select no more than ${maxDocumentCount} documents at once`)
  return errors
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function getStudentDocumentErrorMessage(caught: unknown) {
  if (axios.isAxiosError<{ message?: string }>(caught)) {
    return caught.response?.data?.message ?? 'Document request failed'
  }

  return caught instanceof Error ? caught.message : 'Document request failed'
}
