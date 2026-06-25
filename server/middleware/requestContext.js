import { User } from '../models/User.js'
import { verifyAuthToken } from '../services/authTokenService.js'

const adminRoles = new Set(['Admin', 'Super Admin'])

export async function attachRequestContext(req, _res, next) {
  try {
    const token = getBearerToken(req)

    if (token) {
      const payload = verifyAuthToken(token)
      const user = await User.findById(payload.sub).select('name email role status').lean()

      if (user?.status === 'Active') {
        req.user = {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        }
      }
    }

    next()
  } catch {
    req.user = undefined
    next()
  }
}

export function requireAuthenticated(req, _res, next) {
  if (!req.user) {
    const error = new Error('Authentication required')
    error.statusCode = 401
    next(error)
    return
  }

  next()
}

export function requireAdmin(req, _res, next) {
  if (!req.user) {
    next(authError())
    return
  }

  if (!adminRoles.has(req.user?.role)) {
    const error = new Error('Admin access required')
    error.statusCode = 403
    next(error)
    return
  }

  next()
}

function getBearerToken(req) {
  const header = req.header('authorization') ?? ''
  const [scheme, token] = header.split(' ')

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null
  }

  return token
}

export function requireSuperAdmin(req, _res, next) {
  if (!req.user) {
    next(authError())
    return
  }

  if (req.user?.role !== 'Super Admin') {
    const error = new Error('Super Admin access required')
    error.statusCode = 403
    next(error)
    return
  }

  next()
}

function authError() {
  const error = new Error('Authentication required')
  error.statusCode = 401
  return error
}
