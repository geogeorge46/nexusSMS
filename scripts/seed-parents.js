#!/usr/bin/env node

import 'dotenv/config'

import { connectDatabase, disconnectDatabase } from '../server/config/db.js'
import { env, validateRuntimeEnv } from '../server/config/env.js'
import { ParentProfile } from '../server/models/ParentProfile.js'
import { Student } from '../server/models/Student.js'
import { User } from '../server/models/User.js'
import { hashPassword } from '../server/services/passwordService.js'
import { assertSafeSeed } from './seedSafety.js'

const password = 'Parent@12345'

try {
  assertSafeSeed('seed:parents')
  validateRuntimeEnv()
  await connectDatabase(env.mongoUri)
  const students = await Student.find({ status: { $ne: 'Inactive' } }).sort({ name: 1 }).limit(4)
  if (students.length < 2) throw new Error('Run npm run seed:institution before npm run seed:parents')

  await seedParent('parent.aarav@nexus.local', 'Aarav Parent', 'Father', [students[0]], 'Active')
  await seedParent('parent.maya@nexus.local', 'Maya Parent', 'Mother', [students[1]], 'Active')
  await seedParent('parent.family@nexus.local', 'Family Guardian', 'Guardian', [students[0], students[1]], 'Active')
  await seedParent('parent.inactive@nexus.local', 'Inactive Parent', 'Guardian', [students[0]], 'Inactive')

  console.log('Parent demo accounts ready')
  console.log('Password: Parent@12345')
  console.log('Accounts: parent.aarav@nexus.local, parent.maya@nexus.local, parent.family@nexus.local')
} catch (error) {
  console.error('Failed to seed parent data:')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await disconnectDatabase()
}

async function seedParent(email, name, relationship, linkedStudents, status) {
  let user = await User.findOne({ email })
  if (!user) {
    const { salt, hash } = await hashPassword(password)
    user = await User.create({ name, email, passwordHash: hash, passwordSalt: salt, role: 'Parent', status: 'Active' })
  } else {
    user.role = 'Parent'
    user.status = 'Active'
    await user.save()
  }
  await ParentProfile.findOneAndUpdate(
    { userId: user._id },
    {
      $set: {
        userId: user._id,
        name,
        email,
        phone: '+91 90000 30000',
        relationship,
        linkedStudentIds: linkedStudents.map((student) => student._id),
        status,
      },
    },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  )
}
