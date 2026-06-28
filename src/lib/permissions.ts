import type { AuthUser } from '@/lib/auth-api'

const adminRoles = new Set(['Admin', 'Super Admin'])
const studentWriters = new Set(['Admission Officer', 'Office Clerk'])
const documentWriters = new Set(['Admission Officer', 'Office Clerk', 'Accountant'])
const financeStaff = new Set(['Accountant'])
const timetableViewers = new Set(['Admission Officer', 'Office Clerk', 'Librarian', 'Lab Assistant'])

export function isAdmin(user?: AuthUser | null) {
  return Boolean(user && adminRoles.has(user.role))
}

export function isTeacher(user?: AuthUser | null) {
  return user?.role === 'Teacher'
}

export function isStaff(user?: AuthUser | null) {
  return user?.role === 'Staff'
}

export function isStudent(user?: AuthUser | null) {
  return user?.role === 'Student'
}

export function isParent(user?: AuthUser | null) {
  return user?.role === 'Parent'
}

export function staffDesignation(user?: AuthUser | null) {
  return user?.staff?.designation ?? ''
}

export function canWriteStudents(user?: AuthUser | null) {
  return !isStudent(user) && !isParent(user) && (isAdmin(user) || (isStaff(user) && studentWriters.has(staffDesignation(user))))
}

export function canWriteDocuments(user?: AuthUser | null) {
  return !isStudent(user) && !isParent(user) && (isAdmin(user) || (isStaff(user) && documentWriters.has(staffDesignation(user))))
}

export function canManageCourses(user?: AuthUser | null) {
  return !isStudent(user) && !isParent(user) && isAdmin(user)
}

export function canManageInstitution(user?: AuthUser | null) {
  return !isStudent(user) && !isParent(user) && isAdmin(user)
}

export function canUseAcademicTools(user?: AuthUser | null) {
  return !isStudent(user) && !isParent(user) && (isAdmin(user) || isTeacher(user))
}

export function canViewInstitutionModule(user: AuthUser | null | undefined, module: string) {
  if (isParent(user)) return false
  if (isAdmin(user)) return true
  if (user?.role === 'Teacher') return ['departments', 'programs', 'academic-years', 'semesters'].includes(module)
  if (staffDesignation(user) === 'Admission Officer') return ['departments', 'programs', 'academic-years', 'semesters'].includes(module)
  return false
}

export function canViewFees(user?: AuthUser | null) {
  return !isStudent(user) && !isParent(user) && (isAdmin(user) || (isStaff(user) && financeStaff.has(staffDesignation(user))))
}

export function canManageFees(user?: AuthUser | null) {
  return !isStudent(user) && !isParent(user) && isAdmin(user)
}

export function canRecordFeePayments(user?: AuthUser | null) {
  return !isStudent(user) && !isParent(user) && (isAdmin(user) || (isStaff(user) && financeStaff.has(staffDesignation(user))))
}

export function canViewTimetable(user?: AuthUser | null) {
  return !isStudent(user) && !isParent(user) && (isAdmin(user) || isTeacher(user) || (isStaff(user) && timetableViewers.has(staffDesignation(user))))
}

export function canManageTimetable(user?: AuthUser | null) {
  return !isStudent(user) && !isParent(user) && isAdmin(user)
}

export function canViewExams(user?: AuthUser | null) {
  return !isStudent(user) && !isParent(user) && (isAdmin(user) || isTeacher(user))
}

export function canManageExams(user?: AuthUser | null) {
  return !isStudent(user) && !isParent(user) && isAdmin(user)
}

export function canViewLms(user?: AuthUser | null) {
  return !isStudent(user) && !isParent(user) && (isAdmin(user) || isTeacher(user))
}

export function canManageLms(user?: AuthUser | null) {
  return canViewLms(user)
}
