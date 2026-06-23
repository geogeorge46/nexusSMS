import { api } from '@/lib/api'
import type { ImportResult } from '@/lib/student-import'

type BackendImportRow = {
  rowNumber: number
  data: {
    registerNumber: string
    name: string
    email: string
    program: string
    department: string
    year: string
    status: 'Active' | 'Pending' | 'Review' | 'Inactive'
    attendance: number
    gpa: number
    advisor: string
    phone: string
    address: string
    enrolledAt: string
  }
  errors: ImportResult['errors']
  duplicate: boolean
}

type BackendImportResult = {
  rows: BackendImportRow[]
  errors: ImportResult['errors']
}

type CommitResult = {
  insertedCount: number
  skippedCount: number
}

export async function validateStudentImportWithApi(file: File): Promise<ImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post<BackendImportResult>('/students/import/validate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return {
    errors: response.data.errors,
    rows: response.data.rows.map((row) => ({
      rowNumber: row.rowNumber,
      errors: row.errors,
      duplicate: row.duplicate,
      student: {
        id: row.data.registerNumber,
        name: row.data.name,
        email: row.data.email,
        program: row.data.program,
        department: row.data.department,
        year: row.data.year,
        status: row.data.status,
        attendance: row.data.attendance,
        gpa: row.data.gpa,
        advisor: row.data.advisor,
        phone: row.data.phone,
        address: row.data.address,
        enrolledAt: row.data.enrolledAt,
      },
    })),
  }
}

export async function commitStudentImportWithApi(file: File): Promise<CommitResult> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post<CommitResult>('/students/import/commit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  })

  return response.data
}
