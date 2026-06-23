import { ShieldCheck } from 'lucide-react'
import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import { AppShell } from '@/components/templates/app-shell'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { NotFoundPage } from '@/pages/not-found'
import { SimplePage } from '@/pages/simple-page'

const DashboardPage = lazyPage(() => import('@/pages/dashboard'), 'DashboardPage')
const LoginPage = lazyPage(() => import('@/pages/login'), 'LoginPage')
const SignupPage = lazyPage(() => import('@/pages/signup'), 'SignupPage')
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

export const router = createBrowserRouter([
  { path: '/login', element: withRouteSuspense(<LoginPage />) },
  { path: '/signup', element: withRouteSuspense(<SignupPage />) },
  {
    path: '/',
    element: <AppShell />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: withRouteSuspense(<DashboardPage />) },
      { path: 'students', element: withRouteSuspense(<StudentListPage />) },
      { path: 'students/new', element: withRouteSuspense(<AddStudentPage />) },
      { path: 'students/import', element: withRouteSuspense(<StudentImportPage />) },
      { path: 'documents', element: withRouteSuspense(<StudentDocumentsPage />) },
      { path: 'students/:studentId', element: withRouteSuspense(<StudentProfilePage />) },
      { path: 'students/:studentId/edit', element: withRouteSuspense(<EditStudentPage />) },
      { path: 'courses', element: withRouteSuspense(<CourseListPage />) },
      { path: 'courses/new', element: withRouteSuspense(<AddCoursePage />) },
      { path: 'courses/:courseId', element: withRouteSuspense(<CourseDetailsPage />) },
      { path: 'courses/:courseId/edit', element: withRouteSuspense(<EditCoursePage />) },
      { path: 'attendance', element: withRouteSuspense(<AttendanceDashboardPage />) },
      { path: 'attendance/mark', element: withRouteSuspense(<MarkAttendancePage />) },
      { path: 'grades', element: withRouteSuspense(<GradeManagementPage />) },
      { path: 'reports', element: withRouteSuspense(<ReportsPage />) },
      { path: 'analytics', element: withRouteSuspense(<AnalyticsPage />) },
      { path: 'audit-logs', element: withRouteSuspense(<AuditLogsPage />) },
      {
        path: 'governance',
        element: (
          <SimplePage
            eyebrow="Controls"
            title="Governance"
            description="Placeholder structure for roles, audit trails, compliance checks, and secure administrative review."
            icon={ShieldCheck}
          />
        ),
      },
      { path: 'settings', element: withRouteSuspense(<SettingsPage />) },
      { path: '*', element: <NotFoundPage /> },
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
