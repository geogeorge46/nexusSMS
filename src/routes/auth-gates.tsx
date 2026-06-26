import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import {
  canManageCourses,
  canUseAcademicTools,
  canViewInstitutionModule,
  canWriteStudents,
  isAdmin,
  isTeacher,
  staffDesignation,
} from '@/lib/permissions'

export function RequireAuth() {
  const location = useLocation()
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) return <AuthLoadingState />

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) return <AuthLoadingState />

  if (isAuthenticated) {
    return <Navigate replace to="/" />
  }

  return <Outlet />
}

export function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const { user, isBootstrapping } = useAuth()

  if (isBootstrapping) return <AuthLoadingState />
  if (user?.role !== 'Super Admin') return <Navigate replace to="/" />
  return children
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isBootstrapping } = useAuth()

  if (isBootstrapping) return <AuthLoadingState />
  if (!isAdmin(user)) return <Navigate replace to="/" />
  return children
}

export function RequireStudentWriter({ children }: { children: ReactNode }) {
  const { user, isBootstrapping } = useAuth()

  if (isBootstrapping) return <AuthLoadingState />
  if (!canWriteStudents(user)) return <Navigate replace to="/students" />
  return children
}

export function RequireCourseManager({ children }: { children: ReactNode }) {
  const { user, isBootstrapping } = useAuth()

  if (isBootstrapping) return <AuthLoadingState />
  if (!canManageCourses(user)) return <Navigate replace to="/courses" />
  return children
}

export function RequireAcademicTools({ children }: { children: ReactNode }) {
  const { user, isBootstrapping } = useAuth()

  if (isBootstrapping) return <AuthLoadingState />
  if (!canUseAcademicTools(user)) return <Navigate replace to="/" />
  return children
}

export function RequireReports({ children }: { children: ReactNode }) {
  const { user, isBootstrapping } = useAuth()

  if (isBootstrapping) return <AuthLoadingState />
  if (!user) return <Navigate replace to="/login" />
  return children
}

export function RequireInstitutionModule({ module, children }: { module: string; children: ReactNode }) {
  const { user, isBootstrapping } = useAuth()

  if (isBootstrapping) return <AuthLoadingState />
  if (!canViewInstitutionModule(user, module)) return <Navigate replace to="/" />
  return children
}

export function RequireCourseViewer({ children }: { children: ReactNode }) {
  const { user, isBootstrapping } = useAuth()

  if (isBootstrapping) return <AuthLoadingState />
  if (
    !user
    || (!isAdmin(user)
      && !isTeacher(user)
      && !['Admission Officer', 'Librarian', 'Lab Assistant'].includes(staffDesignation(user)))
  ) {
    return <Navigate replace to="/" />
  }

  return children
}

function AuthLoadingState() {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-4">
      <GlassCard className="w-full max-w-md p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </GlassCard>
    </div>
  )
}
