import { Router } from 'express'

import {
  deleteStudentDocument,
  downloadStudentDocument,
  listStudentDocuments,
  uploadStudentDocuments,
} from '../controllers/studentDocumentController.js'
import { auditAction } from '../middleware/auditMiddleware.js'
import { requireAdmin } from '../middleware/requestContext.js'
import { uploadStudentDocuments as uploadDocumentsMiddleware } from '../middleware/upload.js'

export const studentDocumentRouter = Router()

studentDocumentRouter.use(requireAdmin)
studentDocumentRouter.get('/', listStudentDocuments)
studentDocumentRouter.post(
  '/',
  uploadDocumentsMiddleware.array('documents', 8),
  auditAction({
    action: 'DOCUMENT_UPLOAD',
    module: 'Documents',
    description: (req) => `Uploaded ${req.files?.length ?? 0} student document(s)`,
  }),
  uploadStudentDocuments,
)
studentDocumentRouter.get('/:documentId/download', downloadStudentDocument)
studentDocumentRouter.delete(
  '/:documentId',
  auditAction({
    action: 'DOCUMENT_DELETE',
    module: 'Documents',
    description: (req) => `Deleted student document ${req.params.documentId}`,
  }),
  deleteStudentDocument,
)
