import { Router } from 'express'

import {
  commitStudentImport,
  downloadErrorReport,
  downloadStudentImportTemplate,
  validateStudentImportFile,
} from '../controllers/studentImportController.js'
import { requireAdmin } from '../middleware/requestContext.js'
import { uploadStudentImport } from '../middleware/upload.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const studentImportRouter = Router()

studentImportRouter.use(requireAdmin)
studentImportRouter.get('/template', asyncHandler(downloadStudentImportTemplate))
studentImportRouter.post('/validate', uploadStudentImport.single('file'), asyncHandler(validateStudentImportFile))
studentImportRouter.post('/commit', uploadStudentImport.single('file'), asyncHandler(commitStudentImport))
studentImportRouter.post('/errors', asyncHandler(downloadErrorReport))
