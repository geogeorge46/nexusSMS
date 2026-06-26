import { User } from '../models/User.js'
import { signAuthToken } from './authTokenService.js'
import { hashPassword, validatePasswordStrength, verifyPassword } from './passwordService.js'

const loginRoles = new Set(['Admin', 'Super Admin', 'Teacher', 'Staff'])

export async function signupUser({ name, email, password, role = 'Admin' }) {
  const normalizedEmail = normalizeEmail(email)
  const passwordErrors = validatePasswordStrength(password ?? '')

  if (!name || !normalizedEmail || !password) {
    const error = new Error('Name, email, and password are required')
    error.statusCode = 400
    throw error
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    const error = new Error('Email format is invalid')
    error.statusCode = 400
    throw error
  }

  if (passwordErrors.length > 0) {
    const error = new Error('Password does not meet security requirements')
    error.statusCode = 400
    error.details = passwordErrors
    throw error
  }

  const existing = await User.findOne({ email: normalizedEmail }).lean()

  if (existing) {
    const error = new Error('An account with this email already exists')
    error.statusCode = 409
    throw error
  }

  const { salt, hash } = await hashPassword(password)
  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash: hash,
    passwordSalt: salt,
    role: role === 'Super Admin' ? 'Super Admin' : 'Admin',
  })

  return buildAuthResponse(user)
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: normalizeEmail(email) })

  if (!user || user.status !== 'Active' || !loginRoles.has(user.role)) {
    const error = new Error('Invalid email or password')
    error.statusCode = 401
    throw error
  }

  const valid = await verifyPassword(password ?? '', user.passwordSalt, user.passwordHash)

  if (!valid) {
    const error = new Error('Invalid email or password')
    error.statusCode = 401
    throw error
  }

  user.lastLoginAt = new Date()
  await user.save()

  return buildAuthResponse(user)
}

export function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  }
}

function buildAuthResponse(user) {
  const safeUser = sanitizeUser(user)
  const token = signAuthToken({
    sub: safeUser.id,
    email: safeUser.email,
    name: safeUser.name,
    role: safeUser.role,
  })

  return { user: safeUser, token }
}

function normalizeEmail(email = '') {
  return email.trim().toLowerCase()
}
