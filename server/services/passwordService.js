import crypto from 'node:crypto'
import { promisify } from 'node:util'

import { env } from '../config/env.js'

const scrypt = promisify(crypto.scrypt)
const keyLength = 64

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = await derivePassword(password, salt)

  return { salt, hash }
}

export async function verifyPassword(password, salt, expectedHash) {
  const hash = await derivePassword(password, salt)
  const hashBuffer = Buffer.from(hash, 'hex')
  const expectedBuffer = Buffer.from(expectedHash, 'hex')

  return hashBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(hashBuffer, expectedBuffer)
}

export function validatePasswordStrength(password) {
  const errors = []

  if (password.length < 10) errors.push('Password must be at least 10 characters.')
  if (!/[A-Z]/.test(password)) errors.push('Password must include an uppercase letter.')
  if (!/[a-z]/.test(password)) errors.push('Password must include a lowercase letter.')
  if (!/\d/.test(password)) errors.push('Password must include a number.')
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Password must include a special character.')

  return errors
}

async function derivePassword(password, salt) {
  const derived = await scrypt(`${password}${env.passwordPepper}`, salt, keyLength)
  return derived.toString('hex')
}
