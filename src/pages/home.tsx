import { DashboardPage } from '@/pages/dashboard'
import { StudentPortalDashboardPage } from '@/pages/student-portal-dashboard'
import { useAuth } from '@/hooks/use-auth'
import { isStudent } from '@/lib/permissions'

export function HomePage() {
  const { user } = useAuth()

  return isStudent(user) ? <StudentPortalDashboardPage /> : <DashboardPage />
}
