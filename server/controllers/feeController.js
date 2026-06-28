import { getAuditContext } from '../middleware/auditMiddleware.js'
import { createAuditLog } from '../services/auditLogService.js'
import {
  assignStudentFees,
  createFeeCategory,
  createFeeStructure,
  deactivateFeeCategory,
  deactivateFeeStructure,
  getFeeReports,
  getReceipt,
  listFeeCategories,
  listFeeStructures,
  listReceipts,
  listStudentFees,
  recordFeePayment,
  updateFeeCategory,
  updateFeeStructure,
} from '../services/feeService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const getCategories = asyncHandler(async (req, res) => res.json(await listFeeCategories(req.query)))

export const postCategory = asyncHandler(async (req, res) => {
  const item = await createFeeCategory(req.body)
  await audit(req, 'FEE_CATEGORY_CREATE', 'FeeCategories', 'created a fee category', { id: item.id })
  res.status(201).json({ item })
})

export const patchCategory = asyncHandler(async (req, res) => {
  const item = await updateFeeCategory(req.params.id, req.body)
  await audit(req, 'FEE_CATEGORY_UPDATE', 'FeeCategories', 'updated a fee category', { id: item.id })
  res.json({ item })
})

export const deleteCategory = asyncHandler(async (req, res) => {
  const item = await deactivateFeeCategory(req.params.id)
  await audit(req, 'FEE_CATEGORY_DELETE', 'FeeCategories', 'deactivated a fee category', { id: item.id })
  res.json({ item })
})

export const getStructures = asyncHandler(async (req, res) => res.json(await listFeeStructures(req.query)))

export const postStructure = asyncHandler(async (req, res) => {
  const item = await createFeeStructure(req.body)
  await audit(req, 'FEE_STRUCTURE_CREATE', 'FeeStructures', 'created a fee structure', { id: item.id })
  res.status(201).json({ item })
})

export const patchStructure = asyncHandler(async (req, res) => {
  const item = await updateFeeStructure(req.params.id, req.body)
  await audit(req, 'FEE_STRUCTURE_UPDATE', 'FeeStructures', 'updated a fee structure', { id: item.id })
  res.json({ item })
})

export const deleteStructure = asyncHandler(async (req, res) => {
  const item = await deactivateFeeStructure(req.params.id)
  await audit(req, 'FEE_STRUCTURE_DELETE', 'FeeStructures', 'deactivated a fee structure', { id: item.id })
  res.json({ item })
})

export const postAssignFees = asyncHandler(async (req, res) => {
  const result = await assignStudentFees(req.body, req.user)
  await audit(req, 'STUDENT_FEE_ASSIGN', 'StudentFees', 'assigned student fees', result.summary)
  res.status(201).json(result)
})

export const getStudentFees = asyncHandler(async (req, res) => res.json(await listStudentFees(req.query)))

export const postPayment = asyncHandler(async (req, res) => {
  const result = await recordFeePayment(req.body, req.user)
  await audit(req, 'FEE_PAYMENT_CREATE', 'FeePayments', 'recorded a fee payment', {
    paymentId: result.payment.id,
    receiptId: result.receipt.id,
  })
  await audit(req, 'FEE_RECEIPT_CREATE', 'FeeReceipts', 'created a fee receipt', { receiptId: result.receipt.id })
  res.status(201).json(result)
})

export const getReceipts = asyncHandler(async (req, res) => res.json(await listReceipts(req.query)))

export const getReceiptById = asyncHandler(async (req, res) => res.json(await getReceipt(req.params.id)))

export const getReports = asyncHandler(async (_req, res) => res.json(await getFeeReports()))

function audit(req, action, module, description, metadata) {
  return createAuditLog({
    ...getAuditContext(req),
    action,
    module,
    description: `${req.user.name} ${description}`,
    metadata,
  })
}
