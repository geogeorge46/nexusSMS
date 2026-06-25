import { useQueries } from '@tanstack/react-query'

import { api } from '@/lib/api'

type DashboardSummary = {
  profile: { name: string; role: string; campus: string; term: string }
  stats: Array<{ label: string; value: string; helper: string; trend: string; tone: string; icon: string }>
  widgets: { todayAttendance: { present: number; absent: number; late: number; excused: number; rate: string } }
}

type DashboardCharts = {
  studentsByDepartment: Array<{ name: string; students: number; color: string }>
  attendanceTrend: Array<{ date: string; rate: number; present: number; late: number; absent: number }>
  gradeDistribution: Array<{ grade: string; count: number }>
  courseEnrollmentTrend: Array<{ month: string; students: number }>
  monthlyActivity: Array<{ month: string; events: number }>
}

type DashboardActivity = {
  recentStudents: Array<{ id: string; name: string; program: string; status: string; gpa: string }>
  recentCourses: Array<{ id: string; name: string; faculty: string; enrolled: number; capacity: number; trend: string }>
  recentActivity: Array<{ id: string; title: string; time: string; type: string }>
  recentAuditLogs: Array<{ id: string; user: string; role: string; action: string; module: string; description: string; ipAddress: string; time: string }>
  notifications: Array<{ id: string; title: string; message: string; type: 'info' | 'success' | 'warning'; time: string }>
}

export type DashboardData = DashboardSummary & {
  departments: DashboardCharts['studentsByDepartment']
  enrollment: DashboardCharts['courseEnrollmentTrend']
  attendanceTrend: DashboardCharts['attendanceTrend']
  gradeDistribution: DashboardCharts['gradeDistribution']
  monthlyActivity: DashboardCharts['monthlyActivity']
  recentStudents: DashboardActivity['recentStudents']
  activity: DashboardActivity['recentActivity']
  recentAuditLogs: DashboardActivity['recentAuditLogs']
  widgets: DashboardSummary['widgets'] & {
    topCourses: DashboardActivity['recentCourses']
    notifications: DashboardActivity['notifications']
  }
}

export function useDashboardData() {
  const [summaryQuery, chartsQuery, activityQuery] = useQueries({
    queries: [
      dashboardQuery<DashboardSummary>('summary'),
      dashboardQuery<DashboardCharts>('charts'),
      dashboardQuery<DashboardActivity>('activity'),
    ],
  })
  const data = summaryQuery.data && chartsQuery.data && activityQuery.data
    ? {
        ...summaryQuery.data,
        departments: chartsQuery.data.studentsByDepartment,
        enrollment: chartsQuery.data.courseEnrollmentTrend,
        attendanceTrend: chartsQuery.data.attendanceTrend,
        gradeDistribution: chartsQuery.data.gradeDistribution,
        monthlyActivity: chartsQuery.data.monthlyActivity,
        recentStudents: activityQuery.data.recentStudents,
        activity: activityQuery.data.recentActivity,
        recentAuditLogs: activityQuery.data.recentAuditLogs,
        widgets: {
          ...summaryQuery.data.widgets,
          topCourses: activityQuery.data.recentCourses,
          notifications: activityQuery.data.notifications,
        },
      }
    : undefined

  return {
    data,
    isLoading: summaryQuery.isLoading || chartsQuery.isLoading || activityQuery.isLoading,
    isError: summaryQuery.isError || chartsQuery.isError || activityQuery.isError,
    error: summaryQuery.error ?? chartsQuery.error ?? activityQuery.error,
  }
}

function dashboardQuery<T>(endpoint: 'summary' | 'charts' | 'activity') {
  return {
    queryKey: ['dashboard', endpoint],
    queryFn: async (): Promise<T> => (await api.get<T>(`/dashboard/${endpoint}`)).data,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 1,
  }
}
