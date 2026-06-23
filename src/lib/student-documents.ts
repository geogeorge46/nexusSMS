import { api } from '@/lib/api'

export const documentCategories = [
  'All',
  'Identity',
  'Academic',
  'Financial',
  'Medical',
  'Consent',
  'Transfer',
  'Other',
] as const

export type DocumentCategory = (typeof documentCategories)[number]

export type StudentDocument = {
  _id: string
  title: string
  originalName: string
  category: Exclude<DocumentCategory, 'All'>
  studentName: string
  registerNumber: string
  mimeType: string
  size: number
  secureUrl: string
  downloadUrl: string
  scanStatus: 'queued' | 'passed' | 'failed'
  uploadedBy: string
  createdAt: string
}

export type DocumentGroup = {
  category: Exclude<DocumentCategory, 'All'>
  count: number
}

export type DocumentListResponse = {
  documents: StudentDocument[]
  grouped: DocumentGroup[]
  total: number
}

export type UploadDocumentPayload = {
  files: File[]
  category: string
  title: string
  studentName: string
  registerNumber: string
  uploadedBy?: string
}

export const acceptedDocumentTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
export const acceptedDocumentExtensions = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx'
export const maxDocumentSizeMb = 10

export async function fetchStudentDocuments(params: {
  category: DocumentCategory
  search: string
}): Promise<DocumentListResponse> {
  const response = await api.get<DocumentListResponse>('/documents', {
    params: {
      category: params.category === 'All' ? undefined : params.category,
      search: params.search || undefined,
    },
  })

  return response.data
}

export async function uploadStudentDocuments(
  payload: UploadDocumentPayload,
  onProgress?: (progress: number) => void,
) {
  const formData = new FormData()

  for (const file of payload.files) {
    formData.append('documents', file)
  }

  formData.append('category', payload.category)
  formData.append('title', payload.title)
  formData.append('studentName', payload.studentName)
  formData.append('registerNumber', payload.registerNumber)
  formData.append('uploadedBy', payload.uploadedBy ?? 'Nexus Admin')

  const response = await api.post<{ message: string; documents: StudentDocument[] }>(
    '/documents',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
      onUploadProgress(event) {
        if (event.total) {
          onProgress?.(Math.round((event.loaded / event.total) * 100))
        }
      },
    },
  )

  return response.data
}

export async function deleteStudentDocument(documentId: string) {
  await api.delete(`/documents/${documentId}`)
}

export function getStudentDocumentDownloadUrl(documentId: string) {
  return `${api.defaults.baseURL}/documents/${documentId}/download`
}

export function validateDocumentFiles(files: File[]) {
  return files.flatMap((file) => {
    const errors: string[] = []
    const extensionAllowed = /\.(pdf|jpe?g|png|webp|docx?)$/i.test(file.name)
    const mimeAllowed =
      acceptedDocumentTypes.includes(file.type) ||
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    if (!extensionAllowed || (!mimeAllowed && file.type)) {
      errors.push(`${file.name}: unsupported file type`)
    }

    if (file.size > maxDocumentSizeMb * 1024 * 1024) {
      errors.push(`${file.name}: exceeds ${maxDocumentSizeMb}MB`)
    }

    return errors
  })
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const fallbackDocumentData: DocumentListResponse = {
  total: 4,
  grouped: [
    { category: 'Identity', count: 1 },
    { category: 'Academic', count: 2 },
    { category: 'Financial', count: 0 },
    { category: 'Medical', count: 1 },
    { category: 'Consent', count: 0 },
    { category: 'Transfer', count: 0 },
    { category: 'Other', count: 0 },
  ],
  documents: [
    {
      _id: 'demo-1',
      title: 'Aarav identity proof',
      originalName: 'aarav-passport.pdf',
      category: 'Identity',
      studentName: 'Aarav Mehta',
      registerNumber: 'NX-2026-1001',
      mimeType: 'application/pdf',
      size: 1840000,
      secureUrl: '',
      downloadUrl: '',
      scanStatus: 'passed',
      uploadedBy: 'Nexus Admin',
      createdAt: '2026-06-20T09:30:00.000Z',
    },
    {
      _id: 'demo-2',
      title: 'Transcript semester 4',
      originalName: 'semester-4-transcript.pdf',
      category: 'Academic',
      studentName: 'Maya Rao',
      registerNumber: 'NX-2026-1002',
      mimeType: 'application/pdf',
      size: 920000,
      secureUrl: '',
      downloadUrl: '',
      scanStatus: 'passed',
      uploadedBy: 'Registrar',
      createdAt: '2026-06-19T12:10:00.000Z',
    },
    {
      _id: 'demo-3',
      title: 'Medical declaration',
      originalName: 'medical-declaration.png',
      category: 'Medical',
      studentName: 'Isha Kapoor',
      registerNumber: 'NX-2026-1007',
      mimeType: 'image/png',
      size: 730000,
      secureUrl: '',
      downloadUrl: '',
      scanStatus: 'passed',
      uploadedBy: 'Student Affairs',
      createdAt: '2026-06-18T14:45:00.000Z',
    },
    {
      _id: 'demo-4',
      title: 'Course completion letter',
      originalName: 'completion-letter.docx',
      category: 'Academic',
      studentName: 'Kabir Nair',
      registerNumber: 'NX-2026-1011',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 430000,
      secureUrl: '',
      downloadUrl: '',
      scanStatus: 'passed',
      uploadedBy: 'Program Office',
      createdAt: '2026-06-17T11:00:00.000Z',
    },
  ],
}
