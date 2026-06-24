#!/usr/bin/env node

import 'dotenv/config'

import { connectDatabase, disconnectDatabase } from '../server/config/db.js'
import { env, validateRuntimeEnv } from '../server/config/env.js'
import { User } from '../server/models/User.js'
import { hashPassword } from '../server/services/passwordService.js'

const name = process.env.SEED_ADMIN_NAME
const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.SEED_ADMIN_PASSWORD

try {
  validateRuntimeEnv()

  if (!name || !email || !password) {
    throw new Error('SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD are required')
  }

  await connectDatabase(env.mongoUri)

  const { salt, hash } = await hashPassword(password)
  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        name,
        email,
        passwordHash: hash,
        passwordSalt: salt,
        role: 'Super Admin',
        status: 'Active',
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )

  console.log(`Super Admin ready: ${user.email}`)
} catch (error) {
  console.error('Failed to seed Super Admin:')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await disconnectDatabase()
}
