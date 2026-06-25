import { User } from '../models/User.js'
import { hashPassword, validatePasswordStrength } from './passwordService.js'

const roles = new Set(['Admin', 'Super Admin'])
const statuses = new Set(['Active', 'Suspended'])

export async function listAdmins(filters = {}) {
  const pageValue = Number(filters.page ?? 1)
  const limitValue = Number(filters.limit ?? 10)
  const page = Number.isFinite(pageValue) ? Math.max(pageValue, 1) : 1
  const limit = Number.isFinite(limitValue) ? Math.min(Math.max(limitValue, 1), 50) : 10
  const query = buildQuery(filters)
  const [items, total, active, suspended, superAdmins] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(query),
    User.countDocuments({ status: 'Active' }),
    User.countDocuments({ status: 'Suspended' }),
    User.countDocuments({ role: 'Super Admin', status: 'Active' }),
  ])

  return {
    items: items.map(serializeAdmin),
    summary: { total: await User.countDocuments(), active, suspended, superAdmins },
    pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) },
  }
}

export async function getAdmin(adminId) {
  const admin = await User.findById(adminId).lean()
  if (!admin) throw httpError(404, 'Admin account not found')
  return serializeAdmin(admin)
}

export async function createAdmin(payload) {
  const name = clean(payload.name)
  const email = clean(payload.email).toLowerCase()
  const role = roles.has(payload.role) ? payload.role : 'Admin'
  validateIdentity(name, email)
  validatePassword(payload.password)

  if (await User.exists({ email })) throw httpError(409, 'An account with this email already exists')
  const { salt, hash } = await hashPassword(payload.password)
  const admin = await User.create({ name, email, role, status: 'Active', passwordHash: hash, passwordSalt: salt })
  return serializeAdmin(admin)
}

export async function updateAdmin(adminId, payload, actor) {
  const admin = await User.findById(adminId)
  if (!admin) throw httpError(404, 'Admin account not found')

  const nextName = payload.name === undefined ? admin.name : clean(payload.name)
  const nextEmail = payload.email === undefined ? admin.email : clean(payload.email).toLowerCase()
  const nextRole = payload.role === undefined ? admin.role : payload.role
  const nextStatus = payload.status === undefined ? admin.status : payload.status
  validateIdentity(nextName, nextEmail)
  if (!roles.has(nextRole)) throw httpError(400, 'Invalid admin role')
  if (!statuses.has(nextStatus)) throw httpError(400, 'Invalid admin status')
  if (actor.id === admin.id && nextStatus === 'Suspended') throw httpError(400, 'You cannot suspend your own account')
  await assertLastSuperAdminPreserved(admin, nextRole, nextStatus)

  const duplicate = await User.exists({ email: nextEmail, _id: { $ne: admin._id } })
  if (duplicate) throw httpError(409, 'An account with this email already exists')

  const changes = []
  if (admin.name !== nextName || admin.email !== nextEmail) changes.push('profile')
  if (admin.role !== nextRole) changes.push('role')
  if (admin.status !== nextStatus) changes.push('status')
  if (changes.length === 0) return { admin: serializeAdmin(admin), changes }

  admin.name = nextName
  admin.email = nextEmail
  admin.role = nextRole
  admin.status = nextStatus
  await admin.save()
  return { admin: serializeAdmin(admin), changes }
}

export async function resetAdminPassword(adminId, password) {
  validatePassword(password)
  const admin = await User.findById(adminId)
  if (!admin) throw httpError(404, 'Admin account not found')
  const { salt, hash } = await hashPassword(password)
  admin.passwordSalt = salt
  admin.passwordHash = hash
  await admin.save()
  return serializeAdmin(admin)
}

export async function deleteAdmin(adminId, actor) {
  const admin = await User.findById(adminId)
  if (!admin) throw httpError(404, 'Admin account not found')
  if (actor.id === admin.id) throw httpError(400, 'You cannot delete your own account')
  await assertLastSuperAdminPreserved(admin, 'Admin', 'Suspended')
  await admin.deleteOne()
  return serializeAdmin(admin)
}

async function assertLastSuperAdminPreserved(admin, nextRole, nextStatus) {
  const removesActiveSuperAdmin = admin.role === 'Super Admin'
    && admin.status === 'Active'
    && (nextRole !== 'Super Admin' || nextStatus !== 'Active')
  if (!removesActiveSuperAdmin) return
  if (await User.countDocuments({ role: 'Super Admin', status: 'Active' }) <= 1) {
    throw httpError(409, 'At least one active Super Admin is required')
  }
}

function buildQuery(filters) {
  const query = {}
  if (filters.search) {
    const pattern = escapeRegex(clean(filters.search))
    query.$or = [{ name: { $regex: pattern, $options: 'i' } }, { email: { $regex: pattern, $options: 'i' } }]
  }
  if (roles.has(filters.role)) query.role = filters.role
  if (statuses.has(filters.status)) query.status = filters.status
  return query
}

function serializeAdmin(admin) {
  const source = typeof admin.toObject === 'function' ? admin.toObject() : admin
  return {
    id: source._id.toString(), name: source.name, email: source.email, role: source.role,
    status: source.status, lastLoginAt: source.lastLoginAt ?? null,
    createdAt: source.createdAt, updatedAt: source.updatedAt,
  }
}

function validateIdentity(name, email) {
  if (!name) throw httpError(400, 'Admin name is required')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw httpError(400, 'A valid admin email is required')
}

function validatePassword(password) {
  const errors = validatePasswordStrength(String(password ?? ''))
  if (errors.length > 0) {
    const error = httpError(400, 'Password does not meet security requirements')
    error.details = errors
    throw error
  }
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function httpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}
