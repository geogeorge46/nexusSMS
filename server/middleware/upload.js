import multer from 'multer'

const allowedMimeTypes = new Set([
  'text/csv',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

export const uploadStudentImport = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(_req, file, callback) {
    if (allowedMimeTypes.has(file.mimetype) || /\.(csv|tsv|txt|xls|xlsx)$/i.test(file.originalname)) {
      callback(null, true)
      return
    }

    callback(new Error('Only CSV, TSV, XLS, and XLSX files are allowed'))
  },
})

const allowedDocumentMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const maxDocumentUploadMb = Number(process.env.MAX_DOCUMENT_UPLOAD_MB ?? 10)

export const uploadStudentDocuments = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxDocumentUploadMb * 1024 * 1024,
    files: 8,
  },
  fileFilter(_req, file, callback) {
    const hasAllowedMimeType = allowedDocumentMimeTypes.has(file.mimetype)
    const hasAllowedExtension = /\.(pdf|jpe?g|png|doc|docx)$/i.test(file.originalname)

    if (hasAllowedMimeType && hasAllowedExtension) {
      callback(null, true)
      return
    }

    const error = new Error('Only PDF, JPG, PNG, DOC, and DOCX documents are allowed')
    error.statusCode = 400
    callback(error)
  },
})
