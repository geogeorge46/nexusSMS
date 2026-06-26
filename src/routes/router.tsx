import { ShieldCheck } from 'lucide-react'
import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '@/components/templates/app-shell'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { NotFoundPage } from '@/pages/not-found'
import { SimplePage } from '@/pages/simple-page'
import {
  PublicOnlyRoute,
  RequireAcademicTools,
  RequireAdmin,
  RequireAuth,
  RequireCourseManager,
  RequireCourseViewer,
  RequireReports,
  RequireStudentWriter,
  RequireSuperAdmin,
} from '@/routes/auth-gates'

const DashboardPage = lazyPage(() => import('@/pages/dashboard'), 'DashboardPage')
const LoginPage = lazyPage(() => import('@/pages/login'), 'LoginPage')
const StudentListPage = lazyPage(() => import('@/pages/student-list'), 'StudentListPage')
const AddStudentPage = lazyPage(() => import('@/pages/add-student'), 'AddStudentPage')
const StudentImportPage = lazyPage(() => import('@/pages/student-import'), 'StudentImportPage')
const StudentDocumentsPage = lazyPage(() => import('@/pages/student-documents'), 'StudentDocumentsPage')
const StudentProfilePage = lazyPage(() => import('@/pages/student-profile'), 'StudentProfilePage')
const EditStudentPage = lazyPage(() => import('@/pages/edit-student'), 'EditStudentPage')
const CourseListPage = lazyPage(() => import('@/pages/course-list'), 'CourseListPage')
const AddCoursePage = lazyPage(() => import('@/pages/add-course'), 'AddCoursePage')
const CourseDetailsPage = lazyPage(() => import('@/pages/course-details'), 'CourseDetailsPage')
const EditCoursePage = lazyPage(() => import('@/pages/edit-course'), 'EditCoursePage')
const AttendanceDashboardPage = lazyPage(
  () => import('@/pages/attendance-dashboard'),
  'AttendanceDashboardPage',
)
const MarkAttendancePage = lazyPage(() => import('@/pages/mark-attendance'), 'MarkAttendancePage')
const GradeManagementPage = lazyPage(() => import('@/pages/grade-management'), 'GradeManagementPage')
const ReportsPage = lazyPage(() => import('@/pages/reports'), 'ReportsPage')
const AnalyticsPage = lazyPage(() => import('@/pages/analytics'), 'AnalyticsPage')
const AuditLogsPage = lazyPage(() => import('@/pages/audit-logs'), 'AuditLogsPage')
const SettingsPage = lazyPage(() => import('@/pages/settings'), 'SettingsPage')
const AdminManagementPage = lazyPage(() => import('@/pages/admin-management'), 'AdminManagementPage')
const InstitutionalModulePage = lazyPage(() => import('@/pages/institutional-module'), 'InstitutionalModulePage')

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login', element: withRouteSuspense(<LoginPage />) },
      // TODO: Reintroduce admin account creation through a protected Admin Management module.
      { path: '/signup', element: <Navigate replace to="/login" /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        errorElement: <NotFoundPage />,
        children: [
          { index: true, element: withRouteSuspense(<DashboardPage />) },
          { path: 'students', element: withRouteSuspense(<StudentListPage />) },
          { path: 'students/new', element: <RequireStudentWriter>{withRouteSuspense(<AddStudentPage />)}</RequireStudentWriter> },
          { path: 'students/import', element: <RequireStudentWriter>{withRouteSuspense(<StudentImportPage />)}</RequireStudentWriter> },
          { path: 'documents', element: withRouteSuspense(<StudentDocumentsPage />) },
          { path: 'students/:studentId', element: withRouteSuspense(<StudentProfilePage />) },
          { path: 'students/:studentId/edit', element: <RequireStudentWriter>{withRouteSuspense(<EditStudentPage />)}</RequireStudentWriter> },
          { path: 'courses', element: <RequireCourseViewer>{withRouteSuspense(<CourseListPage />)}</RequireCourseViewer> },
          { path: 'courses/new', element: <RequireCourseManager>{withRouteSuspense(<AddCoursePage />)}</RequireCourseManager> },
          { path: 'courses/:courseId', element: <RequireCourseViewer>{withRouteSuspense(<CourseDetailsPage />)}</RequireCourseViewer> },
          { path: 'courses/:courseId/edit', element: <RequireCourseManager>{withRouteSuspense(<EditCoursePage />)}</RequireCourseManager> },
          { path: 'attendance', element: <RequireAcademicTools>{withRouteSuspense(<AttendanceDashboardPage />)}</RequireAcademicTools> },
          { path: 'attendance/mark', element: <RequireAcademicTools>{withRouteSuspense(<MarkAttendancePage />)}</RequireAcademicTools> },
          { path: 'grades', element: <RequireAcademicTools>{withRouteSuspense(<GradeManagementPage />)}</RequireAcademicTools> },
          { path: 'reports', element: <RequireReports>{withRouteSuspense(<ReportsPage />)}</RequireReports> },
          { path: 'analytics', element: <RequireAdmin>{withRouteSuspense(<AnalyticsPage />)}</RequireAdmin> },
          { path: 'institution/:module', element: withRouteSuspense(<InstitutionalModulePage />) },
          { path: 'audit-logs', element: <RequireAdmin>{withRouteSuspense(<AuditLogsPage />)}</RequireAdmin> },
          {
            path: 'admins',
            element: <RequireSuperAdmin>{withRouteSuspense(<AdminManagementPage />)}</RequireSuperAdmin>,
          },
          {
            path: 'governance',
            element: (
              <RequireAdmin>
                <SimplePage
                  eyebrow="Controls"
                  title="Governance"
                  description="Placeholder structure for roles, audit trails, compliance checks, and secure administrative review."
                  icon={ShieldCheck}
                />
              </RequireAdmin>
            ),
          },
          { path: 'settings', element: withRouteSuspense(<SettingsPage />) },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])

function lazyPage<TModule extends Record<TKey, ComponentType>, TKey extends keyof TModule>(
  loader: () => Promise<TModule>,
  exportName: TKey,
) {
  return lazy(async () => {
    const module = await loader()
    return { default: module[exportName] }
  })
}

function withRouteSuspense(children: ReactNode) {
  return <Suspense fallback={<RouteLoadingState />}>{children}</Suspense>
}

function RouteLoadingState() {
  return (
    <GlassCard className="p-5">
      <div className="space-y-5">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    </GlassCard>
  )
}
