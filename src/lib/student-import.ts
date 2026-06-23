import type { Student, StudentStatus } from '@/hooks/use-students'

export type ImportStudent = {
  id: string
  name: string
  email: string
  program: string
  department: string
  year: string
  status: StudentStatus
  attendance: number
  gpa: number
  advisor: string
  phone: string
  address: string
  enrolledAt: string
}

export type ImportError = {
  row: number
  field: string
  message: string
}

export type ImportRow = {
  rowNumber: number
  student: ImportStudent
  errors: ImportError[]
  duplicate: boolean
}

export type ImportResult = {
  rows: ImportRow[]
  errors: ImportError[]
}

const headers = [
  'id',
  'name',
  'email',
  'program',
  'department',
  'year',
  'status',
  'attendance',
  'gpa',
  'advisor',
  'phone',
  'address',
  'enrolledAt',
]

const validStatuses: StudentStatus[] = ['Active', 'Pending', 'Review', 'Inactive']

export function getStudentImportTemplateRows() {
  return [
    headers,
    [
      'STU-2001',
      'Riya Kapoor',
      'riya.kapoor@nexus.edu',
      'Computer Science',
      'Engineering',
      'Grade 11',
      'Active',
      '96',
      '3.84',
      'Dr. Harper Stone',
      '+1 415 555 0201',
      '100 Campus Drive',
      '2026-06-23',
    ],
    [
      'STU-2002',
      'Daniel Scott',
      'daniel.scott@nexus.edu',
      'Business Analytics',
      'Business',
      'Grade 10',
      'Pending',
      '91',
      '3.42',
      'Dr. Tomas Reed',
      '+1 415 555 0202',
      '101 Campus Drive',
      '2026-06-23',
    ],
  ]
}

export function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function rowsToCsv(rows: string[][]) {
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')
}

export function rowsToExcelHtml(rows: string[][]) {
  const tableRows = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`,
    )
    .join('')

  return `<!doctype html><html><head><meta charset="utf-8" /></head><body><table>${tableRows}</table></body></html>`
}

export async function parseStudentImportFile(file: File, existingStudents: Student[]) {
  const text = await file.text()
  const extension = file.name.split('.').pop()?.toLowerCase()
  const rows =
    extension === 'csv'
      ? parseDelimited(text, ',')
      : extension === 'xls' || text.toLowerCase().includes('<table')
        ? parseExcelCompatibleText(text)
        : parseDelimited(text, '\t')

  return validateImportRows(rows, existingStudents)
}

export function exportImportErrors(errors: ImportError[]) {
  const rows = [
    ['row', 'field', 'message'],
    ...errors.map((error) => [String(error.row), error.field, error.message]),
  ]
  downloadTextFile('student-import-errors.csv', rowsToCsv(rows), 'text/csv;charset=utf-8')
}

function validateImportRows(rows: string[][], existingStudents: Student[]): ImportResult {
  const normalizedHeaders = rows[0]?.map((header) => canonicalHeader(header)) ?? []
  const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell.trim()))
  const existingIds = new Set(existingStudents.map((student) => student.id.toLowerCase()))
  const existingEmails = new Set(existingStudents.map((student) => student.email.toLowerCase()))
  const uploadedIds = new Set<string>()
  const uploadedEmails = new Set<string>()

  const importRows = dataRows.map((row, index) => {
    const rowNumber = index + 2
    const record = Object.fromEntries(
      normalizedHeaders.map((header, headerIndex) => [header, row[headerIndex]?.trim() ?? '']),
    )
    const errors: ImportError[] = []

    for (const header of headers) {
      if (!record[header]) {
        errors.push({ row: rowNumber, field: header, message: 'Required field is missing.' })
      }
    }

    const status = record.status as StudentStatus
    if (record.status && !validStatuses.includes(status)) {
      errors.push({
        row: rowNumber,
        field: 'status',
        message: `Status must be one of: ${validStatuses.join(', ')}.`,
      })
    }

    if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
      errors.push({ row: rowNumber, field: 'email', message: 'Email format is invalid.' })
    }

    const attendance = Number(record.attendance)
    if (record.attendance && (!Number.isFinite(attendance) || attendance < 0 || attendance > 100)) {
      errors.push({ row: rowNumber, field: 'attendance', message: 'Attendance must be 0-100.' })
    }

    const gpa = Number(record.gpa)
    if (record.gpa && (!Number.isFinite(gpa) || gpa < 0 || gpa > 4)) {
      errors.push({ row: rowNumber, field: 'gpa', message: 'GPA must be 0-4.' })
    }

    const idKey = record.id.toLowerCase()
    const emailKey = record.email.toLowerCase()
    const duplicate =
      existingIds.has(idKey) ||
      existingEmails.has(emailKey) ||
      uploadedIds.has(idKey) ||
      uploadedEmails.has(emailKey)

    if (duplicate) {
      errors.push({
        row: rowNumber,
        field: 'duplicate',
        message: 'Student ID or email already exists in the system or upload.',
      })
    }

    if (idKey) uploadedIds.add(idKey)
    if (emailKey) uploadedEmails.add(emailKey)

    return {
      rowNumber,
      duplicate,
      errors,
      student: {
        id: record.id,
        name: record.name,
        email: record.email,
        program: record.program,
        department: record.department,
        year: record.year,
        status: validStatuses.includes(status) ? status : 'Pending',
        attendance: Number.isFinite(attendance) ? attendance : 0,
        gpa: Number.isFinite(gpa) ? gpa : 0,
        advisor: record.advisor,
        phone: record.phone,
        address: record.address,
        enrolledAt: record.enrolledAt,
      },
    }
  })

  return {
    rows: importRows,
    errors: importRows.flatMap((row) => row.errors),
  }
}

function parseExcelCompatibleText(text: string) {
  if (text.toLowerCase().includes('<table')) {
    const document = new DOMParser().parseFromString(text, 'text/html')
    return Array.from(document.querySelectorAll('tr')).map((row) =>
      Array.from(row.querySelectorAll('th,td')).map((cell) => cell.textContent?.trim() ?? ''),
    )
  }

  return parseDelimited(text, '\t')
}

function parseDelimited(text: string, delimiter: ',' | '\t') {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"' && quoted && next === '"') {
      cell += '"'
      index += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === delimiter && !quoted) {
      row.push(cell)
      cell = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }

  row.push(cell)
  rows.push(row)
  return rows.filter((candidate) => candidate.some((value) => value.trim()))
}

function canonicalHeader(value: string) {
  const normalized = value.trim().replace(/\s+/g, '').replace(/_/g, '').toLowerCase()
  return headers.find((header) => header.toLowerCase() === normalized) ?? normalized
}

function escapeCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
