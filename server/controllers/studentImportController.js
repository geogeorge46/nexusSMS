import {
  bulkInsertStudents,
  getTemplateRows,
  validateStudentImport,
} from '../services/studentImportService.js'

export async function downloadStudentImportTemplate(_req, res) {
  const csv = rowsToCsv(getTemplateRows())

  res.header('Content-Type', 'text/csv')
  res.attachment('student-import-template.csv')
  res.send(csv)
}

export async function validateStudentImportFile(req, res) {
  const result = await validateStudentImport(req.file)
  res.json(result)
}

export async function commitStudentImport(req, res) {
  const result = await bulkInsertStudents(req.file)
  res.status(201).json(result)
}

export function downloadErrorReport(req, res) {
  const errors = Array.isArray(req.body?.errors) ? req.body.errors : []
  const csv = rowsToCsv([
    ['row', 'field', 'message'],
    ...errors.map((error) => [String(error.row), error.field, error.message]),
  ])

  res.header('Content-Type', 'text/csv')
  res.attachment('student-import-errors.csv')
  res.send(csv)
}

function rowsToCsv(rows) {
  return rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
}
