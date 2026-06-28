#!/usr/bin/env node

import 'dotenv/config'
import assert from 'node:assert/strict'

import { connectDatabase, disconnectDatabase } from '../server/config/db.js'
import { env, validateRuntimeEnv } from '../server/config/env.js'
import { ParentProfile } from '../server/models/ParentProfile.js'
import { Student } from '../server/models/Student.js'
import { loginUser } from '../server/services/authService.js'
import {
  getParentStudentAssignments,
  getParentStudentAttendance,
  getParentStudentDocuments,
  getParentStudentFees,
  getParentStudentGrades,
  getParentStudentProfile,
  getParentStudentResults,
  getParentStudentTimetable,
  listParentStudents,
} from '../server/services/parentPortalService.js'

try {
  validateRuntimeEnv()
  await connectDatabase(env.mongoUri)

  const login = await loginUser({ email: 'parent.family@nexus.local', password: 'Parent@12345' })
  assert.equal(login.user.role, 'Parent', 'Parent login works')
  const profile = await ParentProfile.findOne({ email: 'parent.family@nexus.local' }).lean()
  const user = { id: login.user.id, name: login.user.name, email: login.user.email, role: 'Parent', parent: { id: profile._id.toString(), linkedStudentIds: profile.linkedStudentIds.map((id) => id.toString()) } }
  const linked = await listParentStudents(user)
  assert.ok(linked.items.length >= 2, 'Parent with two students can switch child')
  await getParentStudentProfile(user, linked.items[0].id)
  await getParentStudentAttendance(user, linked.items[0].id)
  await getParentStudentGrades(user, linked.items[0].id)
  await getParentStudentResults(user, linked.items[0].id)
  await getParentStudentFees(user, linked.items[0].id)
  await getParentStudentAssignments(user, linked.items[0].id)
  await getParentStudentTimetable(user, linked.items[0].id)
  await getParentStudentDocuments(user, linked.items[0].id)
  const unlinked = await Student.findOne({ _id: { $nin: profile.linkedStudentIds }, status: { $ne: 'Inactive' } }).lean()
  if (unlinked) await assert.rejects(() => getParentStudentProfile(user, unlinked._id.toString()), /unlinked student/)
  await assert.rejects(() => loginUser({ email: 'parent.inactive@nexus.local', password: 'Parent@12345' }), /inactive/)

  console.log('Parent portal smoke tests passed')
} catch (error) {
  console.error('Parent portal smoke tests failed:')
  console.error(error)
  process.exitCode = 1
} finally {
  await disconnectDatabase()
}
