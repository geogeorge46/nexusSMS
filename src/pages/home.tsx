import { DashboardPage } from '@/pages/dashboard'
import { ParentDashboardPage } from '@/pages/parent-portal-pages'
import { StudentPortalDashboardPage } from '@/pages/student-portal-dashboard'
import { useAuth } from '@/hooks/use-auth'
import { isParent, isStudent } from '@/lib/permissions'

export function HomePage() {
  const { user } = useAuth()

  if (isStudent(user)) return <StudentPortalDashboardPage />
  if (isParent(user)) return <ParentDashboardPage />
  return <DashboardPage />
}
