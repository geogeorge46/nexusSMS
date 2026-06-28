#!/usr/bin/env node

import 'dotenv/config'

import { connectDatabase, disconnectDatabase } from '../server/config/db.js'
import { env, validateRuntimeEnv } from '../server/config/env.js'
import { FeeCategory } from '../server/models/FeeCategory.js'
import { FeePayment } from '../server/models/FeePayment.js'
import { FeeReceipt } from '../server/models/FeeReceipt.js'
import { FeeStructure } from '../server/models/FeeStructure.js'
import { Student } from '../server/models/Student.js'
import { StudentFee } from '../server/models/StudentFee.js'
import { createFeeStructure, recordFeePayment } from '../server/services/feeService.js'
import { assertSafeSeed } from './seedSafety.js'

const systemUser = { id: 'seed-fees', name: 'Nexus Seed', role: 'Super Admin' }

try {
  assertSafeSeed('seed:fees')
  validateRuntimeEnv()
  await connectDatabase(env.mongoUri)

  const categories = await seedCategories()
  const students = await Student.find({
    departmentId: { $exists: true },
    programId: { $exists: true },
    academicYearId: { $exists: true },
    semesterId: { $exists: true },
    status: { $in: ['Active', 'Pending', 'Review'] },
  }).limit(6).lean()

  if (students.length === 0) throw new Error('Run npm run seed:institution before npm run seed:fees')

  const structures = []
  for (const student of students) {
    structures.push(await upsertStructureForStudent(student, categories))
  }

  const assigned = []
  for (const student of students) {
    const structure = structures.find((item) => sameId(item.programId, student.programId) && sameId(item.semesterId, student.semesterId))
    if (!structure) continue
    assigned.push(await upsertStudentFee(student, structure))
  }

  await seedPayments(assigned)

  console.log('Fee demo data ready')
  console.log(`Categories: ${Object.keys(categories).join(', ')}`)
  console.log(`Student fee records: ${assigned.length}`)
} catch (error) {
  console.error('Failed to seed fee data:')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await disconnectDatabase()
}

async function seedCategories() {
  const rows = [
    ['Admission Fee', 'One-time admission processing charge'],
    ['Tuition Fee', 'Core academic tuition fee'],
    ['Library Fee', 'Library access and digital resources'],
    ['Lab Fee', 'Laboratory consumables and equipment use'],
    ['Exam Fee', 'Internal and semester examination fee'],
    ['Hostel Fee', 'Residential accommodation fee'],
    ['Transport Fee', 'Campus transport facility fee'],
    ['Scholarship Adjustment', 'Approved fee adjustment or waiver head'],
  ]

  const entries = await Promise.all(rows.map(async ([name, description]) => {
    const category = await FeeCategory.findOneAndUpdate(
      { name },
      { $set: { name, description, status: 'Active' } },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    )
    return [name, category]
  }))
  return Object.fromEntries(entries)
}

async function upsertStructureForStudent(student, categories) {
  const existing = await FeeStructure.findOne({
    programId: student.programId,
    academicYearId: student.academicYearId,
    semesterId: student.semesterId,
  })
  if (existing) return existing

  return createFeeStructure({
    name: `${student.program} ${student.batch || 'Semester'} Fee Plan`,
    departmentId: student.departmentId.toString(),
    programId: student.programId.toString(),
    academicYearId: student.academicYearId.toString(),
    semesterId: student.semesterId.toString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Active',
    items: [
      { feeCategoryId: categories['Tuition Fee']._id.toString(), amount: 45000 },
      { feeCategoryId: categories['Library Fee']._id.toString(), amount: 3500 },
      { feeCategoryId: categories['Lab Fee']._id.toString(), amount: 7500 },
      { feeCategoryId: categories['Exam Fee']._id.toString(), amount: 2500 },
    ],
  })
}

async function upsertStudentFee(student, structure) {
  const structureId = idOf(structure)
  const existing = await StudentFee.findOne({ studentId: student._id, feeStructureId: structureId })
  if (existing) return existing

  return StudentFee.create({
    studentId: student._id,
    feeStructureId: structureId,
    academicYearId: student.academicYearId,
    semesterId: student.semesterId,
    totalAmount: structure.totalAmount,
    paidAmount: 0,
    dueAmount: structure.totalAmount,
    dueDate: structure.dueDate,
    status: 'Unpaid',
    assignedBy: systemUser,
  })
}

async function seedPayments(studentFees) {
  for (const [index, fee] of studentFees.entries()) {
    const hasPayment = await FeePayment.exists({ studentFeeId: fee._id })
    if (hasPayment) continue
    if (index === 0) await recordFeePayment({ studentFeeId: fee._id.toString(), amount: fee.totalAmount, method: 'UPI', transactionId: `SEED-FULL-${Date.now()}` }, systemUser)
    if (index === 1) await recordFeePayment({ studentFeeId: fee._id.toString(), amount: Math.round(fee.totalAmount / 2), method: 'Cash', transactionId: `SEED-PART-${Date.now()}` }, systemUser)
  }

  await FeeReceipt.find().limit(1).lean()
}

function sameId(left, right) {
  return idOf(left) === idOf(right)
}

function idOf(value) {
  if (!value) return ''
  if (value._id) return value._id.toString()
  if (value.id) return value.id.toString()
  return value.toString()
}
