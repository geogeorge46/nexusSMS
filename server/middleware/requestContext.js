import { User } from '../models/User.js'
import { Staff } from '../models/Staff.js'
import { Student } from '../models/Student.js'
import { ParentProfile } from '../models/ParentProfile.js'
import { verifyAuthToken } from '../services/authTokenService.js'

const adminRoles = new Set(['Admin', 'Super Admin'])
const academicRoles = new Set(['Admin', 'Super Admin', 'Teacher'])
const studentWriteDesignations = new Set(['Admission Officer', 'Office Clerk'])
const documentWriteDesignations = new Set(['Admission Officer', 'Office Clerk', 'Accountant'])
const financeDesignations = new Set(['Accountant'])
const timetableViewDesignations = new Set(['Admission Officer', 'Office Clerk', 'Librarian', 'Lab Assistant'])

export async function attachRequestContext(req, _res, next) {
  try {
    const token = getBearerToken(req)

    if (token) {
      const payload = verifyAuthToken(token)
      const user = await User.findById(payload.sub).select('name email role status studentId').lean()

      if (user?.status === 'Active') {
        const staff = user.role === 'Teacher' || user.role === 'Staff'
          ? await Staff.findOne({
              $or: [{ userId: user._id }, { email: user.email }],
              status: 'Active',
            }).select('employeeNumber category designation departmentId').lean()
          : null
        const studentQuery = user.studentId
          ? { $or: [{ _id: user.studentId }, { email: user.email }], status: { $ne: 'Inactive' } }
          : { email: user.email, status: { $ne: 'Inactive' } }
        const student = user.role === 'Student'
          ? await Student.findOne(studentQuery).select('name email registerNumber department program semesterId').lean()
          : null
        const parent = user.role === 'Parent'
          ? await ParentProfile.findOne({ userId: user._id, status: 'Active' }).select('name email phone relationship linkedStudentIds').lean()
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
          student: student
            ? {
                id: student._id.toString(),
                registerNumber: student.registerNumber,
                name: student.name,
                email: student.email,
                department: student.department,
                program: student.program,
                semesterId: student.semesterId?.toString?.() ?? '',
            }
            : undefined,
          parent: parent
            ? {
                id: parent._id.toString(),
                relationship: parent.relationship,
                phone: parent.phone,
                linkedStudentIds: parent.linkedStudentIds.map((id) => id.toString()),
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

export function requireNonStudent(req, _res, next) {
  if (!req.user) {
    next(authError())
    return
  }

  if (req.user.role === 'Student' || req.user.role === 'Parent') {
    const error = new Error('Student and Parent accounts can only access their portal endpoints')
    error.statusCode = 403
    next(error)
    return
  }

  next()
}

export function requireStudent(req, _res, next) {
  if (!req.user) {
    next(authError())
    return
  }

  if (req.user.role !== 'Student') {
    const error = new Error('Student portal access requires a student account')
    error.statusCode = 403
    next(error)
    return
  }

  if (!req.user.student?.id) {
    const error = new Error('Student account is not linked to an active student record')
    error.statusCode = 403
    next(error)
    return
  }

  next()
}

export function requireParent(req, _res, next) {
  if (!req.user) {
    next(authError())
    return
  }

  if (req.user.role !== 'Parent') {
    const error = new Error('Parent portal access requires a parent account')
    error.statusCode = 403
    next(error)
    return
  }

  if (!req.user.parent?.linkedStudentIds?.length) {
    const error = new Error('Parent account is not linked to any active student')
    error.statusCode = 403
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

export function requireFeeReadAccess(req, _res, next) {
  if (!req.user) {
    next(authError())
    return
  }

  if (adminRoles.has(req.user.role) || staffHasDesignation(req, financeDesignations)) {
    next()
    return
  }

  const error = new Error('Fee access requires an Admin, Super Admin, or Accountant account')
  error.statusCode = 403
  next(error)
}

export function requireFeeManageAccess(req, _res, next) {
  if (!req.user) {
    next(authError())
    return
  }

  if (adminRoles.has(req.user.role)) {
    next()
    return
  }

  const error = new Error('Only Admins and Super Admins can manage fee categories, structures, and assignments')
  error.statusCode = 403
  next(error)
}

export function requirePaymentAccess(req, _res, next) {
  if (!req.user) {
    next(authError())
    return
  }

  if (adminRoles.has(req.user.role) || staffHasDesignation(req, financeDesignations)) {
    next()
    return
  }

  const error = new Error('Only Admins, Super Admins, and Accountants can record fee payments')
  error.statusCode = 403
  next(error)
}

export function requireTimetableReadAccess(req, _res, next) {
  if (!req.user) {
    next(authError())
    return
  }

  if (adminRoles.has(req.user.role) || req.user.role === 'Teacher' || staffHasDesignation(req, timetableViewDesignations)) {
    next()
    return
  }

  const error = new Error('Timetable access requires an Admin, Teacher, or approved staff account')
  error.statusCode = 403
  next(error)
}

export function requireTimetableManageAccess(req, _res, next) {
  if (!req.user) {
    next(authError())
    return
  }

  if (adminRoles.has(req.user.role)) {
    next()
    return
  }

  const error = new Error('Only Admins and Super Admins can manage rooms and timetable slots')
  error.statusCode = 403
  next(error)
}

export function requireExamReadAccess(req, _res, next) {
  if (!req.user) {
    next(authError())
    return
  }

  if (adminRoles.has(req.user.role) || req.user.role === 'Teacher') {
    next()
    return
  }

  const error = new Error('Exam access requires an Admin or Teacher account')
  error.statusCode = 403
  next(error)
}

export function requireExamManageAccess(req, _res, next) {
  if (!req.user) {
    next(authError())
    return
  }

  if (adminRoles.has(req.user.role)) {
    next()
    return
  }

  const error = new Error('Only Admins and Super Admins can manage exams, schedules, hall tickets, and result publishing')
  error.statusCode = 403
  next(error)
}

export function requireLmsAccess(req, _res, next) {
  if (!req.user) {
    next(authError())
    return
  }

  if (adminRoles.has(req.user.role) || req.user.role === 'Teacher') {
    next()
    return
  }

  const error = new Error('LMS access requires an Admin or Teacher account')
  error.statusCode = 403
  next(error)
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
