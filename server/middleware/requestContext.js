import { User } from '../models/User.js'
import { Staff } from '../models/Staff.js'
import { verifyAuthToken } from '../services/authTokenService.js'

const adminRoles = new Set(['Admin', 'Super Admin'])
const academicRoles = new Set(['Admin', 'Super Admin', 'Teacher'])
const studentWriteDesignations = new Set(['Admission Officer', 'Office Clerk'])
const documentWriteDesignations = new Set(['Admission Officer', 'Office Clerk', 'Accountant'])

export async function attachRequestContext(req, _res, next) {
  try {
    const token = getBearerToken(req)

    if (token) {
      const payload = verifyAuthToken(token)
      const user = await User.findById(payload.sub).select('name email role status').lean()

      if (user?.status === 'Active') {
        const staff = user.role === 'Teacher' || user.role === 'Staff'
          ? await Staff.findOne({
              $or: [{ userId: user._id }, { email: user.email }],
              status: 'Active',
            }).select('employeeNumber category designation departmentId').lean()
          : null

        req.user = {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          staff: staff
            ? {
                id: staff._id.toString(),
                employeeNumber: staff.employeeNumber,
                category: staff.category,
                designation: staff.designation,
                departmentId: staff.departmentId?.toString?.() ?? '',
              }
            : undefined,
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

export function requireAdminOrReadOnly(req, _res, next) {
  if (!req.user) {
    next(authError())
    return
  }

  if (req.method === 'GET' || adminRoles.has(req.user.role)) {
    next()
    return
  }

  const error = new Error('Admin access required to modify this data')
  error.statusCode = 403
  next(error)
}

export function requireStudentWriteAccess(req, _res, next) {
  if (!req.user) {
    next(authError())
    return
  }

  if (adminRoles.has(req.user.role) || staffHasDesignation(req, studentWriteDesignations)) {
    next()
    return
  }

  const error = new Error('Only Admins, Admission Officers, and Office Clerks can modify student records')
  error.statusCode = 403
  next(error)
}

export function requireDocumentWriteAccess(req, _res, next) {
  if (!req.user) {
    next(authError())
    return
  }

  if (adminRoles.has(req.user.role) || staffHasDesignation(req, documentWriteDesignations)) {
    next()
    return
  }

  const error = new Error('Only Admins, Admission Officers, Office Clerks, and Accountants can manage student documents')
  error.statusCode = 403
  next(error)
}

export function requireAcademicAccess(req, _res, next) {
  if (!req.user) {
    next(authError())
    return
  }

  if (!academicRoles.has(req.user?.role)) {
    const error = new Error('Academic access requires an admin or teaching staff account')
    error.statusCode = 403
    next(error)
    return
  }

  next()
}

export function requireReportAccess(type) {
  return (req, _res, next) => {
    if (!req.user) {
      next(authError())
      return
    }

    if (adminRoles.has(req.user.role)) {
      next()
      return
    }

    if (req.user.role === 'Staff' && ['students', 'courses'].includes(type)) {
      next()
      return
    }

    if (req.user.role === 'Teacher' && ['students', 'courses', 'attendance', 'grades'].includes(type)) {
      next()
      return
    }

    const error = new Error('You do not have permission to access this report')
    error.statusCode = 403
    next(error)
  }
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

function staffHasDesignation(req, designations) {
  return req.user?.role === 'Staff' && designations.has(req.user?.staff?.designation)
}
