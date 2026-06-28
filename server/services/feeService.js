import mongoose from 'mongoose'

import { AcademicYear } from '../models/AcademicYear.js'
import { FeeCategory } from '../models/FeeCategory.js'
import { FeePayment } from '../models/FeePayment.js'
import { FeeReceipt } from '../models/FeeReceipt.js'
import { FeeStructure } from '../models/FeeStructure.js'
import { Program } from '../models/Program.js'
import { Semester } from '../models/Semester.js'
import { Student } from '../models/Student.js'
import { StudentFee } from '../models/StudentFee.js'
import { User } from '../models/User.js'
import { createNotification } from './notificationService.js'
import {
  httpError,
  resolveAcademicYear,
  resolveDepartment,
  resolveProgram,
  resolveSemester,
  resolveStudent,
} from './institutionService.js'

const populateFeeStructure = [
  { path: 'departmentId', select: 'name code' },
  { path: 'programId', select: 'name code' },
  { path: 'academicYearId', select: 'name' },
  { path: 'semesterId', select: 'name number' },
  { path: 'items.feeCategoryId', select: 'name' },
]

const populateStudentFee = [
  { path: 'studentId', select: 'name email registerNumber department program' },
  { path: 'feeStructureId', select: 'name totalAmount dueDate', populate: { path: 'items.feeCategoryId', select: 'name' } },
  { path: 'academicYearId', select: 'name' },
  { path: 'semesterId', select: 'name number' },
]

export async function listFeeCategories(filters = {}) {
  const query = {}
  if (filters.status && filters.status !== 'All') query.status = filters.status
  if (filters.search) query.$text = { $search: filters.search }
  const items = await FeeCategory.find(query).sort({ name: 1 }).lean()
  return { items: items.map(serialize) }
}

export async function createFeeCategory(payload) {
  const name = requiredText(payload.name, 'Category name is required')
  const exists = await FeeCategory.findOne({ name: textRegex(name), status: 'Active' }).lean()
  if (exists) throw httpError(409, 'Active fee category already exists')
  return serialize(await FeeCategory.create({ name, description: payload.description ?? '', status: payload.status ?? 'Active' }))
}

export async function updateFeeCategory(id, payload) {
  const update = pick(payload, ['name', 'description', 'status'])
  if (update.name) {
    update.name = requiredText(update.name, 'Category name is required')
    const exists = await FeeCategory.findOne({ _id: { $ne: id }, name: textRegex(update.name), status: 'Active' }).lean()
    if (exists && update.status !== 'Inactive') throw httpError(409, 'Active fee category already exists')
  }
  return requireUpdated(FeeCategory.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean(), 'Fee category not found')
}

export async function deactivateFeeCategory(id) {
  return requireUpdated(FeeCategory.findByIdAndUpdate(id, { status: 'Inactive' }, { new: true }).lean(), 'Fee category not found')
}

export async function listFeeStructures(filters = {}) {
  const query = {}
  if (filters.status && filters.status !== 'All') query.status = filters.status
  if (filters.programId) query.programId = filters.programId
  if (filters.academicYearId) query.academicYearId = filters.academicYearId
  if (filters.semesterId) query.semesterId = filters.semesterId
  const items = await FeeStructure.find(query).populate(populateFeeStructure).sort({ createdAt: -1 }).lean()
  return { items: items.map(serialize) }
}

export async function createFeeStructure(payload) {
  const scope = await validateFeeStructureScope(payload)
  const items = await normalizeItems(payload.items)
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
  if (totalAmount <= 0) throw httpError(400, 'Fee structure total amount must be greater than zero')

  const exists = await FeeStructure.findOne({
    programId: scope.programId,
    academicYearId: scope.academicYearId,
    semesterId: scope.semesterId,
  }).lean()
  if (exists) throw httpError(409, 'A fee structure already exists for this program, academic year, and semester')

  const created = await FeeStructure.create({
    name: requiredText(payload.name, 'Fee structure name is required'),
    ...scope,
    items,
    totalAmount,
    dueDate: parseRequiredDate(payload.dueDate, 'Due date is required'),
    status: payload.status ?? 'Active',
  })

  return serialize(await FeeStructure.findById(created._id).populate(populateFeeStructure).lean())
}

export async function updateFeeStructure(id, payload) {
  const current = await FeeStructure.findById(id).lean()
  if (!current) throw httpError(404, 'Fee structure not found')

  const update = pick(payload, ['name', 'dueDate', 'status'])
  if (payload.departmentId || payload.programId || payload.academicYearId || payload.semesterId) {
    Object.assign(update, await validateFeeStructureScope({ ...current, ...payload }))
  }
  if (payload.items) {
    update.items = await normalizeItems(payload.items)
    update.totalAmount = update.items.reduce((sum, item) => sum + item.amount, 0)
    if (update.totalAmount <= 0) throw httpError(400, 'Fee structure total amount must be greater than zero')
  }
  if (update.name) update.name = requiredText(update.name, 'Fee structure name is required')
  if (update.dueDate) update.dueDate = parseRequiredDate(update.dueDate, 'Due date is required')

  const nextProgramId = update.programId ?? current.programId
  const nextAcademicYearId = update.academicYearId ?? current.academicYearId
  const nextSemesterId = update.semesterId ?? current.semesterId
  const duplicate = await FeeStructure.findOne({
    _id: { $ne: id },
    programId: nextProgramId,
    academicYearId: nextAcademicYearId,
    semesterId: nextSemesterId,
  }).lean()
  if (duplicate) throw httpError(409, 'A fee structure already exists for this program, academic year, and semester')

  const updated = await FeeStructure.findByIdAndUpdate(id, update, { new: true, runValidators: true })
    .populate(populateFeeStructure)
    .lean()
  return serialize(updated)
}

export async function deactivateFeeStructure(id) {
  const updated = await FeeStructure.findByIdAndUpdate(id, { status: 'Inactive' }, { new: true })
    .populate(populateFeeStructure)
    .lean()
  if (!updated) throw httpError(404, 'Fee structure not found')
  return serialize(updated)
}

export async function assignStudentFees(payload, user) {
  const structure = await FeeStructure.findById(payload.feeStructureId).lean()
  if (!structure) throw httpError(404, 'Fee structure not found')
  if (structure.status !== 'Active') throw httpError(400, 'Only active fee structures can be assigned')

  const students = await resolveStudentsForAssignment(payload.studentIds, structure)
  const created = []
  const skipped = []

  for (const student of students) {
    validateStudentMatchesStructure(student, structure)
    const existing = await StudentFee.findOne({ studentId: student._id, feeStructureId: structure._id }).lean()
    if (existing) {
      skipped.push({ studentId: student._id.toString(), reason: 'Fee already assigned' })
      continue
    }

    const item = await StudentFee.create({
      studentId: student._id,
      feeStructureId: structure._id,
      academicYearId: structure.academicYearId,
      semesterId: structure.semesterId,
      totalAmount: structure.totalAmount,
      paidAmount: 0,
      dueAmount: structure.totalAmount,
      dueDate: structure.dueDate,
      status: structure.dueDate < new Date() ? 'Overdue' : 'Unpaid',
      assignedBy: actor(user),
    })
    created.push(serialize(await StudentFee.findById(item._id).populate(populateStudentFee).lean()))
  }

  if (created.length === 0 && students.length === 1) throw httpError(409, 'Student fee is already assigned')
  return { created, skipped, summary: { requested: students.length, created: created.length, skipped: skipped.length } }
}

export async function listStudentFees(filters = {}) {
  const query = {}
  if (filters.studentId) query.studentId = filters.studentId
  if (filters.status && filters.status !== 'All') query.status = filters.status
  if (filters.academicYearId) query.academicYearId = filters.academicYearId
  if (filters.semesterId) query.semesterId = filters.semesterId
  const items = await StudentFee.find(query).populate(populateStudentFee).sort({ dueDate: 1 }).lean()
  return { items: items.map(serializeStudentFee) }
}

export async function recordFeePayment(payload, user) {
  const amount = Number(payload.amount)
  if (!Number.isFinite(amount) || amount <= 0) throw httpError(400, 'Payment amount must be greater than zero')

  const studentFee = await StudentFee.findById(payload.studentFeeId).lean()
  if (!studentFee) throw httpError(404, 'Student fee record not found')
  if (['Paid', 'Waived', 'Cancelled'].includes(studentFee.status)) throw httpError(400, 'This student fee cannot accept more payments')
  if (amount > studentFee.dueAmount) throw httpError(400, 'Payment amount cannot be greater than the due amount')

  const session = await mongoose.startSession()
  try {
    let payment
    let receipt
    await session.withTransaction(async () => {
      payment = await FeePayment.create([{
        studentFeeId: studentFee._id,
        studentId: studentFee.studentId,
        amount,
        method: payload.method,
        transactionId: String(payload.transactionId ?? '').trim() || undefined,
        paidAt: payload.paidAt ? new Date(payload.paidAt) : new Date(),
        receivedBy: actor(user),
        remarks: payload.remarks ?? '',
      }], { session }).then(([item]) => item)

      const paidAmount = studentFee.paidAmount + amount
      const dueAmount = Math.max(studentFee.totalAmount - paidAmount, 0)
      await StudentFee.updateOne(
        { _id: studentFee._id },
        { paidAmount, dueAmount, status: dueAmount === 0 ? 'Paid' : 'Partially Paid' },
        { session },
      )

      receipt = await FeeReceipt.create([{
        receiptNumber: await nextReceiptNumber(session),
        paymentId: payment._id,
        studentFeeId: studentFee._id,
        studentId: studentFee.studentId,
        amount,
        issuedBy: actor(user),
      }], { session }).then(([item]) => item)
    })

    await notifyPayment(studentFee.studentId, amount)
    return {
      payment: serialize(payment.toObject()),
      receipt: serialize(receipt.toObject()),
      studentFee: serializeStudentFee(await StudentFee.findById(studentFee._id).populate(populateStudentFee).lean()),
    }
  } finally {
    await session.endSession()
  }
}

export async function listReceipts(filters = {}) {
  const query = {}
  if (filters.studentId) query.studentId = filters.studentId
  const items = await FeeReceipt.find(query)
    .populate({ path: 'studentId', select: 'name email registerNumber' })
    .populate({ path: 'paymentId', select: 'method transactionId paidAt remarks' })
    .sort({ issuedAt: -1 })
    .lean()
  return { items: items.map(serialize) }
}

export async function getReceipt(receiptId) {
  const receipt = await FeeReceipt.findById(receiptId)
    .populate({ path: 'studentId', select: 'name email registerNumber department program' })
    .populate({ path: 'studentFeeId', select: 'totalAmount paidAmount dueAmount status dueDate', populate: { path: 'feeStructureId', select: 'name' } })
    .populate({ path: 'paymentId', select: 'amount method transactionId paidAt remarks receivedBy' })
    .lean()
  if (!receipt) throw httpError(404, 'Fee receipt not found')
  return serialize(receipt)
}

export async function getFeeReports() {
  const [fees, payments] = await Promise.all([
    StudentFee.find().lean(),
    FeePayment.find().lean(),
  ])
  const totalAssigned = fees.reduce((sum, item) => sum + item.totalAmount, 0)
  const totalPaid = payments.reduce((sum, item) => sum + item.amount, 0)
  const overdue = fees.filter((item) => item.status === 'Overdue' || (item.dueAmount > 0 && item.dueDate < new Date()))

  return {
    summary: {
      totalAssigned,
      totalPaid,
      totalDue: Math.max(totalAssigned - totalPaid, 0),
      records: fees.length,
      paidRecords: fees.filter((item) => item.status === 'Paid').length,
      overdueRecords: overdue.length,
    },
    byStatus: countBy(fees, 'status'),
    recentPayments: payments
      .sort((a, b) => b.paidAt - a.paidAt)
      .slice(0, 10)
      .map(serialize),
  }
}

export async function listOwnStudentFees(user) {
  return listStudentFees({ studentId: user.student.id })
}

export async function listOwnReceipts(user) {
  return listReceipts({ studentId: user.student.id })
}

export async function getOwnReceipt(user, receiptId) {
  const receipt = await getReceipt(receiptId)
  const studentId = String(receipt.studentId?._id ?? receipt.studentId?.id ?? receipt.studentId)
  if (studentId !== user.student.id) throw httpError(403, 'Students can only access their own fee receipts')
  return receipt
}

async function validateFeeStructureScope(payload) {
  const department = await resolveDepartment(payload.departmentId)
  const program = await resolveProgram(payload.programId, { departmentId: department._id })
  const academicYear = await resolveAcademicYear(payload.academicYearId)
  const semester = await resolveSemester(payload.semesterId, { academicYearId: academicYear._id })
  return {
    departmentId: department._id,
    programId: program._id,
    academicYearId: academicYear._id,
    semesterId: semester._id,
  }
}

async function normalizeItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) throw httpError(400, 'At least one fee item is required')
  const seen = new Set()
  const normalized = []
  for (const item of items) {
    const category = await FeeCategory.findById(item.feeCategoryId).lean()
    if (!category || category.status !== 'Active') throw httpError(400, 'Fee item uses an inactive or missing category')
    const key = category._id.toString()
    if (seen.has(key)) throw httpError(400, 'Duplicate fee category in one structure is not allowed')
    seen.add(key)
    const amount = Number(item.amount)
    if (!Number.isFinite(amount) || amount < 0) throw httpError(400, 'Fee item amount must be zero or greater')
    normalized.push({ feeCategoryId: category._id, amount, isOptional: Boolean(item.isOptional) })
  }
  return normalized
}

async function resolveStudentsForAssignment(studentIds, structure) {
  if (Array.isArray(studentIds) && studentIds.length > 0) {
    const students = []
    for (const studentId of studentIds) students.push(await resolveStudent(studentId))
    return students
  }

  return Student.find({
    programId: structure.programId,
    academicYearId: structure.academicYearId,
    semesterId: structure.semesterId,
    status: { $in: ['Active', 'Pending', 'Review'] },
  }).lean()
}

function validateStudentMatchesStructure(student, structure) {
  if (student.programId?.toString() !== structure.programId.toString()) throw httpError(400, 'Student program does not match the selected fee structure')
  if (student.academicYearId?.toString() !== structure.academicYearId.toString()) throw httpError(400, 'Student academic year does not match the selected fee structure')
  if (student.semesterId?.toString() !== structure.semesterId.toString()) throw httpError(400, 'Student semester does not match the selected fee structure')
}

async function nextReceiptNumber(session) {
  const year = new Date().getFullYear()
  const count = await FeeReceipt.countDocuments({ receiptNumber: new RegExp(`^NX-FEE-${year}-`) }).session(session)
  return `NX-FEE-${year}-${String(count + 1).padStart(5, '0')}`
}

async function notifyPayment(studentId, amount) {
  const student = await Student.findById(studentId).select('email name').lean()
  if (!student) return
  const user = await User.findOne({ $or: [{ studentId }, { email: student.email }], role: 'Student', status: 'Active' }).lean()
  if (!user) return
  await createNotification({
    title: 'Fee payment received',
    message: `Your fee payment of ${amount} has been recorded.`,
    type: 'success',
    recipient: { userId: user._id.toString(), role: 'Student' },
  })
}

function serializeStudentFee(item) {
  const serialized = serialize(item)
  return {
    ...serialized,
    isOverdue: serialized.dueAmount > 0 && new Date(serialized.dueDate) < new Date(),
  }
}

function serialize(item) {
  if (!item) return item
  return { ...item, id: item._id?.toString?.() ?? item.id }
}

async function requireUpdated(promise, message) {
  const item = await promise
  if (!item) throw httpError(404, message)
  return serialize(item)
}

function actor(user) {
  return { userId: user.id, name: user.name, role: user.role }
}

function pick(payload, keys) {
  return Object.fromEntries(keys.filter((key) => payload[key] !== undefined).map((key) => [key, payload[key]]))
}

function requiredText(value, message) {
  const text = String(value ?? '').trim()
  if (!text) throw httpError(400, message)
  return text
}

function parseRequiredDate(value, message) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw httpError(400, message)
  return date
}

function textRegex(value) {
  return new RegExp(`^${String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] ?? 0) + 1
    return acc
  }, {})
}
