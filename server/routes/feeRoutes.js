import { Router } from 'express'

import {
  deleteCategory,
  deleteStructure,
  getCategories,
  getReceiptById,
  getReceipts,
  getReports,
  getStructures,
  getStudentFees,
  patchCategory,
  patchStructure,
  postAssignFees,
  postCategory,
  postPayment,
  postStructure,
} from '../controllers/feeController.js'
import {
  requireAuthenticated,
  requireFeeManageAccess,
  requireFeeReadAccess,
  requirePaymentAccess,
} from '../middleware/requestContext.js'

export const feeRouter = Router()

feeRouter.use(requireAuthenticated)

feeRouter.get('/categories', requireFeeReadAccess, getCategories)
feeRouter.post('/categories', requireFeeManageAccess, postCategory)
feeRouter.patch('/categories/:id', requireFeeManageAccess, patchCategory)
feeRouter.delete('/categories/:id', requireFeeManageAccess, deleteCategory)

feeRouter.get('/structures', requireFeeReadAccess, getStructures)
feeRouter.post('/structures', requireFeeManageAccess, postStructure)
feeRouter.patch('/structures/:id', requireFeeManageAccess, patchStructure)
feeRouter.delete('/structures/:id', requireFeeManageAccess, deleteStructure)

feeRouter.post('/assign', requireFeeManageAccess, postAssignFees)
feeRouter.get('/student-fees', requireFeeReadAccess, getStudentFees)
feeRouter.post('/payments', requirePaymentAccess, postPayment)
feeRouter.get('/receipts', requireFeeReadAccess, getReceipts)
feeRouter.get('/receipts/:id', requireFeeReadAccess, getReceiptById)
feeRouter.get('/reports', requireFeeReadAccess, getReports)
