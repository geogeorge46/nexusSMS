import { Router } from 'express'

import {
  deleteStudentDocument,
  downloadStudentDocument,
  listStudentDocuments,
  listStudentDocumentsByStudent,
  uploadStudentDocuments,
} from '../controllers/studentDocumentController.js'
import { auditAction } from '../middleware/auditMiddleware.js'
import { requireAuthenticated, requireDocumentWriteAccess, requireNonStudent } from '../middleware/requestContext.js'
import { uploadStudentDocuments as uploadDocumentsMiddleware } from '../middleware/upload.js'

export const studentDocumentRouter = Router()

studentDocumentRouter.use(requireAuthenticated)
studentDocumentRouter.get('/', requireNonStudent, listStudentDocuments)
studentDocumentRouter.get('/student/:studentId', requireNonStudent, listStudentDocumentsByStudent)
studentDocumentRouter.post(
  '/upload',
  requireDocumentWriteAccess,
  uploadDocumentsMiddleware.array('documents', 8),
  auditAction({
    action: 'DOCUMENT_UPLOAD',
    module: 'Documents',
    description: (req) => `Uploaded ${req.files?.length ?? 0} student document(s)`,
  }),
  uploadStudentDocuments,
)
// Keep the original endpoint for clients deployed before the API path was standardized.
studentDocumentRouter.post(
  '/',
  requireDocumentWriteAccess,
  uploadDocumentsMiddleware.array('documents', 8),
  auditAction({ action: 'DOCUMENT_UPLOAD', module: 'Documents', description: (req) => `Uploaded ${req.files?.length ?? 0} student document(s)` }),
  uploadStudentDocuments,
)
studentDocumentRouter.get('/:documentId/download', requireNonStudent, downloadStudentDocument)
studentDocumentRouter.delete(
  '/:documentId',
  requireDocumentWriteAccess,
  auditAction({
    action: 'DOCUMENT_DELETE',
    module: 'Documents',
    description: (req) => `Deleted student document ${req.params.documentId}`,
  }),
  deleteStudentDocument,
)
