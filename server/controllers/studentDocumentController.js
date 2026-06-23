import { asyncHandler } from '../utils/asyncHandler.js'
import {
  createDocuments,
  deleteDocument,
  getDocumentDownload,
  listDocuments,
} from '../services/studentDocumentService.js'

export const listStudentDocuments = asyncHandler(async (req, res) => {
  const result = await listDocuments({
    category: req.query.category,
    search: req.query.search,
  })

  res.json(result)
})

export const uploadStudentDocuments = asyncHandler(async (req, res) => {
  const documents = await createDocuments(req.files, {
    studentId: req.body.studentId,
    studentName: req.body.studentName,
    registerNumber: req.body.registerNumber,
    category: req.body.category,
    title: req.body.title,
    uploadedBy: req.body.uploadedBy,
  })

  res.status(201).json({
    message: `${documents.length} document${documents.length === 1 ? '' : 's'} uploaded`,
    documents,
  })
})

export const downloadStudentDocument = asyncHandler(async (req, res) => {
  const document = await getDocumentDownload(req.params.documentId)

  res.redirect(document.downloadUrl)
})

export const deleteStudentDocument = asyncHandler(async (req, res) => {
  const result = await deleteDocument(req.params.documentId)

  res.json({
    message: 'Document deleted',
    ...result,
  })
})
