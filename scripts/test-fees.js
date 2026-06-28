#!/usr/bin/env node

import 'dotenv/config'
import assert from 'node:assert/strict'

import { connectDatabase, disconnectDatabase } from '../server/config/db.js'
import { env, validateRuntimeEnv } from '../server/config/env.js'
import { FeeCategory } from '../server/models/FeeCategory.js'
import { FeeStructure } from '../server/models/FeeStructure.js'
import { StudentFee } from '../server/models/StudentFee.js'
import {
  assignStudentFees,
  createFeeCategory,
  createFeeStructure,
  listOwnStudentFees,
  recordFeePayment,
} from '../server/services/feeService.js'

const actor = { id: 'fee-test', name: 'Fee Test Admin', role: 'Super Admin', student: { id: '' } }

try {
  validateRuntimeEnv()
  await connectDatabase(env.mongoUri)

  const category = await FeeCategory.findOne({ name: 'Tuition Fee', status: 'Active' }).lean()
  const structure = await FeeStructure.findOne({ status: 'Active' }).lean()
  const studentFee = await StudentFee.findOne({ feeStructureId: structure._id }).lean()
  assert.ok(category, 'Fee category seed exists')
  assert.ok(structure, 'Fee structure seed exists')
  assert.ok(studentFee, 'Student fee seed exists')

  await assert.rejects(() => createFeeCategory({ name: 'Tuition Fee' }), /already exists/)
  await assert.rejects(
    () => createFeeStructure({
      name: 'Duplicate Structure',
      departmentId: structure.departmentId.toString(),
      programId: structure.programId.toString(),
      academicYearId: structure.academicYearId.toString(),
      semesterId: structure.semesterId.toString(),
      dueDate: structure.dueDate,
      items: [{ feeCategoryId: category._id.toString(), amount: 100 }],
    }),
    /already exists/,
  )

  const payable = await StudentFee.findOne({ dueAmount: { $gt: 10 }, status: { $nin: ['Paid', 'Cancelled', 'Waived'] } }).lean()
  assert.ok(payable, 'At least one payable fee record exists')
  await assert.rejects(() => assignStudentFees({ feeStructureId: structure._id.toString(), studentIds: [studentFee.studentId.toString()] }, actor), /already assigned/)
  await assert.rejects(() => recordFeePayment({ studentFeeId: payable._id.toString(), amount: payable.dueAmount + 1, method: 'Cash' }, actor), /greater than the due amount/)

  if (payable) {
    const result = await recordFeePayment({ studentFeeId: payable._id.toString(), amount: 10, method: 'Cash', transactionId: `FEE-TEST-${Date.now()}` }, actor)
    assert.ok(result.receipt.receiptNumber, 'Receipt is generated for a valid payment')
  }

  actor.student.id = studentFee.studentId.toString()
  const ownFees = await listOwnStudentFees(actor)
  assert.ok(ownFees.items.every((item) => item.studentId._id.toString() === actor.student.id), 'Student portal returns only own fee records')

  console.log('Fee workflow smoke tests passed')
} catch (error) {
  console.error('Fee workflow smoke tests failed:')
  console.error(error)
  process.exitCode = 1
} finally {
  await disconnectDatabase()
}
