import { Readable } from 'node:stream'

import csvParser from 'csv-parser'
import mongoose from 'mongoose'
import readXlsxFile from 'read-excel-file/node'

import { Student } from '../models/Student.js'

const requiredColumns = [
  'registerNumber',
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

const validStatuses = new Set(['Active', 'Pending', 'Review', 'Inactive'])

const aliases = new Map([
  ['id', 'registerNumber'],
  ['registernumber', 'registerNumber'],
  ['registerno', 'registerNumber'],
  ['registrationnumber', 'registerNumber'],
  ['studentid', 'registerNumber'],
  ['enrolledat', 'enrolledAt'],
])

export function getTemplateRows() {
  return [
    requiredColumns,
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
  ]
}

export async function parseImportFile(file) {
  if (!file) {
    const error = new Error('Import file is required')
    error.statusCode = 400
    throw error
  }

  if (/\.xlsx$/i.test(file.originalname)) {
    return parseWorkbook(file.buffer)
  }

  if (/\.xls$/i.test(file.originalname)) {
    const text = file.buffer.toString('utf8')
    if (text.toLowerCase().includes('<table')) {
      return parseHtmlTable(text)
    }
  }

  return parseDelimitedBuffer(file.buffer, /\.tsv$/i.test(file.originalname) ? '\t' : ',')
}

export async function validateStudentImport(file) {
  const rawRows = await parseImportFile(file)
  const normalizedRows = normalizeRows(rawRows)
  return validateRows(normalizedRows)
}

export async function bulkInsertStudents(file) {
  const validation = await validateStudentImport(file)

  if (validation.errors.length > 0) {
    const error = new Error('Import validation failed')
    error.statusCode = 422
    error.details = validation
    throw error
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const inserted = await Student.insertMany(validation.validRows, {
      ordered: true,
      session,
    })

    await session.commitTransaction()

    return {
      insertedCount: inserted.length,
      skippedCount: validation.duplicates.length,
      imported: inserted.map((student) => ({
        id: student._id,
        registerNumber: student.registerNumber,
        email: student.email,
      })),
    }
  } catch (error) {
    await session.abortTransaction()
    error.message = `Bulk insert failed and was rolled back: ${error.message}`
    throw error
  } finally {
    session.endSession()
  }
}

async function validateRows(rows) {
  const errors = []
  const duplicates = []
  const seenRegisterNumbers = new Set()
  const seenEmails = new Set()

  if (rows.length === 0) {
    errors.push({ row: 1, field: 'file', message: 'No data rows found.' })
    return { rows: [], validRows: [], errors, duplicates, summary: getSummary(0, errors, duplicates) }
  }

  const registerNumbers = rows.map((row) => row.registerNumber).filter(Boolean)
  const emails = rows.map((row) => row.email?.toLowerCase()).filter(Boolean)

  const existingStudents = await Student.find({
    $or: [{ registerNumber: { $in: registerNumbers } }, { email: { $in: emails } }],
  })
    .select('registerNumber email')
    .lean()

  const existingRegisterNumbers = new Set(existingStudents.map((student) => student.registerNumber))
  const existingEmails = new Set(existingStudents.map((student) => student.email))

  const annotatedRows = rows.map((row, index) => {
    const rowNumber = index + 2
    const rowErrors = validateRow(row, rowNumber)
    const emailKey = row.email?.toLowerCase()
    const duplicate =
      existingRegisterNumbers.has(row.registerNumber) ||
      existingEmails.has(emailKey) ||
      seenRegisterNumbers.has(row.registerNumber) ||
      seenEmails.has(emailKey)

    if (duplicate) {
      const duplicateError = {
        row: rowNumber,
        field: 'duplicate',
        message: 'Email or register number already exists in database or upload.',
      }
      rowErrors.push(duplicateError)
      duplicates.push(duplicateError)
    }

    if (row.registerNumber) seenRegisterNumbers.add(row.registerNumber)
    if (emailKey) seenEmails.add(emailKey)

    errors.push(...rowErrors)

    return {
      rowNumber,
      data: row,
      errors: rowErrors,
      duplicate,
      valid: rowErrors.length === 0,
    }
  })

  const validRows = annotatedRows.filter((row) => row.valid).map((row) => row.data)

  return {
    rows: annotatedRows,
    validRows,
    errors,
    duplicates,
    summary: getSummary(rows.length, errors, duplicates),
  }
}

function validateRow(row, rowNumber) {
  const errors = []

  for (const column of requiredColumns) {
    if (row[column] === undefined || row[column] === '') {
      errors.push({ row: rowNumber, field: column, message: 'Required field is missing.' })
    }
  }

  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    errors.push({ row: rowNumber, field: 'email', message: 'Email format is invalid.' })
  }

  if (row.status && !validStatuses.has(row.status)) {
    errors.push({
      row: rowNumber,
      field: 'status',
      message: 'Status must be Active, Pending, Review, or Inactive.',
    })
  }

  if (!Number.isFinite(row.attendance) || row.attendance < 0 || row.attendance > 100) {
    errors.push({ row: rowNumber, field: 'attendance', message: 'Attendance must be 0-100.' })
  }

  if (!Number.isFinite(row.gpa) || row.gpa < 0 || row.gpa > 4) {
    errors.push({ row: rowNumber, field: 'gpa', message: 'GPA must be 0-4.' })
  }

  if (Number.isNaN(Date.parse(row.enrolledAt))) {
    errors.push({ row: rowNumber, field: 'enrolledAt', message: 'Enrollment date is invalid.' })
  }

  return errors
}

function normalizeRows(rows) {
  if (rows.length === 0) return []

  return rows.map((row) => {
    const normalized = {}

    for (const [key, value] of Object.entries(row)) {
      const canonicalKey = canonicalColumn(key)
      normalized[canonicalKey] = normalizeValue(value)
    }

    return {
      registerNumber: normalized.registerNumber ?? '',
      name: normalized.name ?? '',
      email: normalized.email?.toLowerCase() ?? '',
      program: normalized.program ?? '',
      department: normalized.department ?? '',
      year: normalized.year ?? '',
      status: normalized.status ?? '',
      attendance: Number(normalized.attendance),
      gpa: Number(normalized.gpa),
      advisor: normalized.advisor ?? '',
      phone: normalized.phone ?? '',
      address: normalized.address ?? '',
      enrolledAt: normalized.enrolledAt ?? '',
    }
  })
}

function canonicalColumn(column) {
  const normalized = column.trim().replace(/\s+/g, '').replace(/_/g, '').toLowerCase()
  return aliases.get(normalized) ?? normalized
}

function normalizeValue(value) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

async function parseWorkbook(buffer) {
  const rows = await readXlsxFile(buffer)
  return matrixToObjects(rows)
}

function parseHtmlTable(html) {
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((rowMatch) =>
    [...rowMatch[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cellMatch) =>
      decodeHtml(stripTags(cellMatch[1])).trim(),
    ),
  )

  return matrixToObjects(rows)
}

function matrixToObjects(rows) {
  const [headers = [], ...dataRows] = rows
  const normalizedHeaders = headers.map((header) => canonicalColumn(String(header ?? '')))

  return dataRows
    .filter((row) => row.some((cell) => normalizeValue(cell) !== ''))
    .map((row) =>
      normalizedHeaders.reduce((record, header, index) => {
        if (header) {
          record[header] = row[index] ?? ''
        }

        return record
      }, {}),
    )
}

function stripTags(value) {
  return value.replace(/<[^>]*>/g, '')
}

function decodeHtml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
}

function parseDelimitedBuffer(buffer, separator) {
  return new Promise((resolve, reject) => {
    const rows = []
    Readable.from(buffer)
      .pipe(csvParser({ separator, mapHeaders: ({ header }) => canonicalColumn(header) }))
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject)
  })
}

function getSummary(totalRows, errors, duplicates) {
  return {
    totalRows,
    validRows: Math.max(totalRows - errors.length, 0),
    errorCount: errors.length,
    duplicateCount: duplicates.length,
  }
}
