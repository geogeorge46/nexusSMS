#!/usr/bin/env node

import 'dotenv/config'
import assert from 'node:assert/strict'

import { connectDatabase, disconnectDatabase } from '../server/config/db.js'
import { env, validateRuntimeEnv } from '../server/config/env.js'
import { AssignmentSubmission } from '../server/models/AssignmentSubmission.js'
import { CourseAssignment } from '../server/models/CourseAssignment.js'
import { StudentCourse } from '../server/models/StudentCourse.js'
import { createAssignment, createMaterial, gradeSubmission, listStudentAssignments, listStudentMaterials, listStudentSubmissions, submitAssignment } from '../server/services/lmsService.js'

const admin = { id: 'lms-test', name: 'LMS Test Admin', role: 'Super Admin' }

try {
  validateRuntimeEnv()
  await connectDatabase(env.mongoUri)
  const assignment = await CourseAssignment.findOne({ status: 'Active' }).populate('courseId').populate('staffId').lean()
  assert.ok(assignment?.courseId && assignment?.staffId, 'Active assignment mapping exists')
  const enrollment = await StudentCourse.findOne({ courseId: assignment.courseId._id, status: 'Enrolled' }).lean()
  assert.ok(enrollment, 'Enrollment exists')
  const teacher = { id: String(assignment.staffId.userId ?? ''), name: assignment.staffId.name, email: assignment.staffId.email, role: 'Teacher' }

  const item = await createAssignment({
    title: `LMS Test ${Date.now()}`,
    description: 'Smoke test assignment',
    courseId: assignment.courseId._id.toString(),
    staffId: assignment.staffId._id.toString(),
    academicYearId: assignment.academicYearId.toString(),
    semesterId: assignment.semesterId.toString(),
    dueDate: new Date(Date.now() - 1000).toISOString(),
    maxMarks: 20,
    status: 'Published',
  }, admin)
  const otherAssignment = await CourseAssignment.findOne({ courseId: { $ne: assignment.courseId._id }, status: 'Active' }).populate('courseId').lean()
  if (otherAssignment?.courseId) {
    await assert.rejects(() => createAssignment({
      title: `Bad LMS ${Date.now()}`,
      description: 'Should fail',
      courseId: otherAssignment.courseId._id.toString(),
      academicYearId: otherAssignment.academicYearId.toString(),
      semesterId: otherAssignment.semesterId.toString(),
      dueDate: new Date().toISOString(),
      maxMarks: 10,
      status: 'Published',
    }, teacher), /only for assigned courses/)
  }

  const studentUser = { id: 'student-test', name: 'Student Test', role: 'Student', student: { id: enrollment.studentId.toString() } }
  const portalAssignments = await listStudentAssignments(studentUser)
  assert.equal(portalAssignments.items.some((row) => row.id === item.id), true, 'Student sees enrolled assignment')
  const submission = await submitAssignment(studentUser, item.id, { submissionText: 'Late smoke submission' })
  assert.equal(submission.status, 'Late', 'Late submission marked Late')
  await assert.rejects(() => submitAssignment(studentUser, item.id, { submissionText: 'Duplicate' }), /already submitted/)
  await assert.rejects(() => gradeSubmission(submission.id, { marksObtained: 21 }, admin), /greater than assignment max/)
  await gradeSubmission(submission.id, { marksObtained: 18, feedback: 'Well done.' }, teacher)
  const ownSubmissions = await listStudentSubmissions(studentUser)
  assert.equal(ownSubmissions.items.some((row) => row.feedback === 'Well done.'), true, 'Student sees own feedback')

  await AssignmentSubmission.findByIdAndUpdate(submission.id, { status: 'Resubmission Requested' })
  await submitAssignment(studentUser, item.id, { submissionText: 'Resubmission allowed' })
  await createMaterial({
    title: `LMS Material ${Date.now()}`,
    description: 'Published material',
    courseId: assignment.courseId._id.toString(),
    staffId: assignment.staffId._id.toString(),
    academicYearId: assignment.academicYearId.toString(),
    semesterId: assignment.semesterId.toString(),
    materialType: 'Notes',
    visibility: 'Published',
  }, teacher)
  const materials = await listStudentMaterials(studentUser)
  assert.ok(materials.items.length > 0, 'Student sees published materials for enrolled courses')
  console.log('LMS workflow smoke tests passed')
} catch (error) {
  console.error('LMS workflow smoke tests failed:')
  console.error(error)
  process.exitCode = 1
} finally {
  await disconnectDatabase()
}
