import type { AuthUser } from '@/lib/auth-api'

const adminRoles = new Set(['Admin', 'Super Admin'])
const studentWriters = new Set(['Admission Officer', 'Office Clerk'])
const documentWriters = new Set(['Admission Officer', 'Office Clerk', 'Accountant'])

export function isAdmin(user?: AuthUser | null) {
  return Boolean(user && adminRoles.has(user.role))
}

export function isTeacher(user?: AuthUser | null) {
  return user?.role === 'Teacher'
}

export function isStaff(user?: AuthUser | null) {
  return user?.role === 'Staff'
}

export function staffDesignation(user?: AuthUser | null) {
  return user?.staff?.designation ?? ''
}

export function canWriteStudents(user?: AuthUser | null) {
  return isAdmin(user) || (isStaff(user) && studentWriters.has(staffDesignation(user)))
}

export function canWriteDocuments(user?: AuthUser | null) {
  return isAdmin(user) || (isStaff(user) && documentWriters.has(staffDesignation(user)))
}

export function canManageCourses(user?: AuthUser | null) {
  return isAdmin(user)
}

export function canManageInstitution(user?: AuthUser | null) {
  return isAdmin(user)
}

export function canUseAcademicTools(user?: AuthUser | null) {
  return isAdmin(user) || isTeacher(user)
}

export function canViewInstitutionModule(user: AuthUser | null | undefined, module: string) {
  if (isAdmin(user)) return true
  if (user?.role === 'Teacher') return ['departments', 'programs', 'academic-years', 'semesters'].includes(module)
  if (staffDesignation(user) === 'Admission Officer') return ['departments', 'programs', 'academic-years', 'semesters'].includes(module)
  return false
}
