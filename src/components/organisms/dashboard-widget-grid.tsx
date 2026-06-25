import {
  Bell,
  BookOpen,
  CheckCircle2,
  Clock,
  FileBarChart,
  ListTodo,
  Sparkles,
  TrendingUp,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

import {
  DashboardWidget,
  WidgetEmptyState,
  WidgetSkeleton,
} from '@/components/molecules/dashboard-widget'
import { Badge } from '@/components/ui/badge'
import type { DashboardData } from '@/hooks/use-dashboard-data'
import { cn } from '@/lib/utils'

type WidgetId =
  | 'attendance'
  | 'departments'
  | 'enrollment'
  | 'recent-students'
  | 'top-courses'
  | 'grades'
  | 'attendance-trend'
  | 'activity'
  | 'notifications'
  | 'monthly-activity'
  | 'audit-logs'

type WidgetConfig = {
  id: WidgetId
  title: string
  description: string
  icon: LucideIcon
  size: 'wide' | 'standard'
}

const widgetConfig: WidgetConfig[] = [
  {
    id: 'attendance',
    title: "Today's Attendance",
    description: 'Daily attendance health across active cohorts.',
    icon: CheckCircle2,
    size: 'standard',
  },
  {
    id: 'departments',
    title: 'Departments',
    description: 'Student distribution by department.',
    icon: UsersRound,
    size: 'standard',
  },
  {
    id: 'enrollment',
    title: 'Course Enrollment Trend',
    description: 'Enrollment totals for recently created courses.',
    icon: TrendingUp,
    size: 'wide',
  },
  {
    id: 'recent-students',
    title: 'Recent Students',
    description: 'Newest profiles moving through enrollment.',
    icon: UsersRound,
    size: 'wide',
  },
  {
    id: 'top-courses',
    title: 'Recent Courses',
    description: 'Newest courses and their current enrollment.',
    icon: BookOpen,
    size: 'standard',
  },
  {
    id: 'grades',
    title: 'Grade Distribution',
    description: 'Published grade outcomes across assessments.',
    icon: FileBarChart,
    size: 'standard',
  },
  {
    id: 'attendance-trend',
    title: 'Attendance Trend',
    description: 'Recent daily attendance rates from marked records.',
    icon: CheckCircle2,
    size: 'standard',
  },
  {
    id: 'activity',
    title: 'Recent Activity',
    description: 'Operational changes queued for review.',
    icon: Clock,
    size: 'wide',
  },
  {
    id: 'notifications',
    title: 'Latest Notifications',
    description: 'Admin alerts from the Nexus control plane.',
    icon: Bell,
    size: 'standard',
  },
  {
    id: 'monthly-activity',
    title: 'Monthly Activity',
    description: 'System actions recorded in the audit trail.',
    icon: Sparkles,
    size: 'standard',
  },
  {
    id: 'audit-logs',
    title: 'Recent Audit Logs',
    description: 'Latest secured administrative actions.',
    icon: ListTodo,
    size: 'standard',
  },
]

const notificationTone: Record<string, string> = {
  warning: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  info: 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
}

export function DashboardWidgetGrid({
  data,
  isLoading,
}: {
  data?: DashboardData
  isLoading: boolean
}) {
  const [widgets, setWidgets] = useState(widgetConfig)
  const [draggingId, setDraggingId] = useState<WidgetId | null>(null)

  function reorder(overId: WidgetId) {
    if (!draggingId || draggingId === overId) return

    setWidgets((current) => {
      const from = current.findIndex((widget) => widget.id === draggingId)
      const to = current.findIndex((widget) => widget.id === overId)
      const next = [...current]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  return (
    <section className="grid auto-rows-fr gap-5 md:grid-cols-2 2xl:grid-cols-3">
      {widgets.map((widget, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={cn(widget.size === 'wide' && '2xl:col-span-2')}
          initial={{ opacity: 0, y: 12 }}
          key={widget.id}
          transition={{ delay: index * 0.035 }}
        >
          <DashboardWidget
            description={widget.description}
            draggable
            icon={widget.icon}
            isDragging={draggingId === widget.id}
            onDragEnd={() => setDraggingId(null)}
            onDragEnter={() => reorder(widget.id)}
            onDragStart={() => setDraggingId(widget.id)}
            title={widget.title}
          >
            <WidgetBody id={widget.id} data={data} isLoading={isLoading} />
          </DashboardWidget>
        </motion.div>
      ))}
    </section>
  )
}

function WidgetBody({
  id,
  data,
  isLoading,
}: {
  id: WidgetId
  data?: DashboardData
  isLoading: boolean
}) {
  if (isLoading || !data) {
    return <WidgetSkeleton lines={id === 'recent-students' || id === 'activity' ? 4 : 3} />
  }

  switch (id) {
    case 'attendance':
      return <AttendanceWidget data={data.widgets.todayAttendance} />
    case 'departments':
      return <DepartmentsWidget departments={data.departments} />
    case 'enrollment':
      return <EnrollmentWidget enrollment={data.enrollment} />
    case 'recent-students':
      return <RecentStudentsWidget students={data.recentStudents} />
    case 'top-courses':
      return <TopCoursesWidget courses={data.widgets.topCourses} />
    case 'grades':
      return <GradeDistributionWidget grades={data.gradeDistribution} />
    case 'attendance-trend':
      return <AttendanceTrendWidget trend={data.attendanceTrend} />
    case 'activity':
      return <ActivityWidget activity={data.activity} />
    case 'notifications':
      return <NotificationsWidget notifications={data.widgets.notifications} />
    case 'monthly-activity':
      return <MonthlyActivityWidget activity={data.monthlyActivity} />
    case 'audit-logs':
      return <AuditLogsWidget logs={data.recentAuditLogs} />
  }
}

function AttendanceWidget({ data }: { data: DashboardData['widgets']['todayAttendance'] }) {
  const total = data.present + data.absent + data.late + data.excused
  const segments = [
    { label: 'Present', value: data.present, className: 'bg-emerald-500' },
    { label: 'Late', value: data.late, className: 'bg-amber-500' },
    { label: 'Excused', value: data.excused, className: 'bg-sky-500' },
    { label: 'Absent', value: data.absent, className: 'bg-rose-500' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Attendance Rate</p>
          <p className="mt-1 text-4xl font-bold text-foreground">{data.rate}</p>
        </div>
        <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          Live
        </Badge>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {segments.map((segment) => (
          <span
            className={segment.className}
            key={segment.label}
            style={{ width: `${(segment.value / Math.max(total, 1)) * 100}%` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {segments.map((segment) => (
          <div className="rounded-2xl border border-border/70 bg-muted/35 p-3" key={segment.label}>
            <p className="text-xs font-semibold text-muted-foreground">{segment.label}</p>
            <p className="mt-1 text-xl font-bold text-foreground">{segment.value.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function DepartmentsWidget({ departments }: { departments: DashboardData['departments'] }) {
  if (departments.length === 0) {
    return (
      <WidgetEmptyState
        description="Department totals will appear after student records are created."
        icon={UsersRound}
        title="No department data"
      />
    )
  }

  const total = departments.reduce((sum, department) => sum + department.students, 0)

  return (
    <div className="space-y-3">
      {departments.map((department) => {
        const percent = Math.round((department.students / Math.max(total, 1)) * 100)

        return (
          <div className="rounded-[18px] border border-border/70 bg-muted/35 p-4" key={department.name}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-bold text-foreground">{department.name}</span>
              <span className="font-semibold text-muted-foreground">{department.students.toLocaleString()}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-background">
              <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EnrollmentWidget({ enrollment }: { enrollment: DashboardData['enrollment'] }) {
  if (enrollment.length === 0) {
    return (
      <WidgetEmptyState
        description="Enrollment metrics will appear as student records accumulate."
        icon={TrendingUp}
        title="No enrollment metrics"
      />
    )
  }

  const maxStudents = Math.max(...enrollment.map((point) => point.students), 1)

  return (
    <div className="flex min-h-52 items-end gap-3 rounded-[20px] border border-border/70 bg-muted/35 p-4">
      {enrollment.map((point) => (
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={point.month}>
          <div className="flex h-36 w-full items-end">
            <div
              className="w-full rounded-t-2xl bg-primary"
              style={{ height: `${Math.max((point.students / maxStudents) * 100, 8)}%` }}
            />
          </div>
          <p className="text-xs font-bold text-foreground">{point.month}</p>
          <p className="text-xs font-semibold text-muted-foreground">{point.students.toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}

function RecentStudentsWidget({ students }: { students: DashboardData['recentStudents'] }) {
  if (students.length === 0) {
    return (
      <WidgetEmptyState
        description="New student records will appear here after enrollment."
        icon={UsersRound}
        title="No recent students"
      />
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {students.map((student) => (
        <div className="rounded-[18px] border border-border/70 bg-muted/35 p-4" key={student.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{student.name}</p>
              <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">{student.program}</p>
            </div>
            <Badge>{student.status}</Badge>
          </div>
          <p className="mt-4 text-sm font-bold text-foreground">GPA {student.gpa}</p>
        </div>
      ))}
    </div>
  )
}

function TopCoursesWidget({ courses }: { courses: DashboardData['widgets']['topCourses'] }) {
  if (courses.length === 0) {
    return <WidgetEmptyState description="New course records will appear here." icon={BookOpen} title="No recent courses" />
  }

  return (
    <div className="space-y-3">
      {courses.map((course) => {
        const capacity = Math.round((course.enrolled / Math.max(course.capacity, 1)) * 100)

        return (
          <div className="rounded-[18px] border border-border/70 bg-muted/35 p-4" key={course.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{course.name}</p>
                <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">{course.faculty}</p>
              </div>
              <Badge>{course.trend}</Badge>
            </div>
            <div className="mt-3">
              <div className="mb-2 flex justify-between text-xs font-semibold text-muted-foreground">
                <span>{course.enrolled} enrolled</span>
                <span>{capacity}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-background">
                <div className="h-full rounded-full bg-primary" style={{ width: `${capacity}%` }} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function GradeDistributionWidget({ grades }: { grades: DashboardData['gradeDistribution'] }) {
  if (grades.length === 0) {
    return <WidgetEmptyState description="Grade distribution will appear after assessments are recorded." icon={FileBarChart} title="No grade data" />
  }

  const max = Math.max(...grades.map((grade) => grade.count), 1)

  return (
    <div className="space-y-3">
      {grades.map((grade) => (
        <div className="rounded-[18px] border border-border/70 bg-muted/35 p-4" key={grade.grade}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-bold text-foreground">Grade {grade.grade}</span>
            <span className="font-semibold text-muted-foreground">{grade.count}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-background">
            <div className="h-full rounded-full bg-violet-500" style={{ width: `${(grade.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function AttendanceTrendWidget({ trend }: { trend: DashboardData['attendanceTrend'] }) {
  if (trend.length === 0) {
    return <WidgetEmptyState description="Attendance trends will appear after attendance is marked." icon={CheckCircle2} title="No attendance trend" />
  }

  return (
    <div className="flex min-h-52 items-end gap-2 rounded-[20px] border border-border/70 bg-muted/35 p-4">
      {trend.map((point) => (
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={point.date}>
          <div className="flex h-36 w-full items-end">
            <div className="w-full rounded-t-xl bg-emerald-500" style={{ height: `${Math.max(point.rate, 5)}%` }} />
          </div>
          <p className="text-[10px] font-bold text-foreground">{point.date.slice(5)}</p>
          <p className="text-[10px] font-semibold text-muted-foreground">{point.rate}%</p>
        </div>
      ))}
    </div>
  )
}

function ActivityWidget({ activity }: { activity: DashboardData['activity'] }) {
  if (activity.length === 0) {
    return <WidgetEmptyState description="Administrative activity will appear here." icon={Clock} title="No recent activity" />
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {activity.map((event) => (
        <div className="flex gap-3 rounded-[18px] border border-border/70 bg-muted/35 p-4" key={event.id}>
          <span className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{event.title}</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              {event.type} - {event.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function NotificationsWidget({
  notifications,
}: {
  notifications: DashboardData['widgets']['notifications']
}) {
  if (notifications.length === 0) {
    return (
      <WidgetEmptyState
        description="System and admin notifications will appear here."
        icon={Bell}
        title="No notifications"
      />
    )
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div className="rounded-[18px] border border-border/70 bg-muted/35 p-4" key={notification.id}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <Badge className={notificationTone[notification.type]}>{notification.type}</Badge>
            <span className="text-xs font-semibold text-muted-foreground">{notification.time}</span>
          </div>
          <p className="text-sm font-bold text-foreground">{notification.title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.message}</p>
        </div>
      ))}
    </div>
  )
}

function MonthlyActivityWidget({ activity }: { activity: DashboardData['monthlyActivity'] }) {
  if (activity.length === 0) {
    return <WidgetEmptyState description="Monthly activity will appear as audit events accumulate." icon={Sparkles} title="No monthly activity" />
  }

  const max = Math.max(...activity.map((point) => point.events), 1)

  return (
    <div className="flex min-h-52 items-end gap-3 rounded-[20px] border border-border/70 bg-muted/35 p-4">
      {activity.map((point) => (
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={point.month}>
          <div className="flex h-36 w-full items-end">
            <div className="w-full rounded-t-2xl bg-sky-500" style={{ height: `${Math.max((point.events / max) * 100, 8)}%` }} />
          </div>
          <p className="text-xs font-bold text-foreground">{point.month}</p>
          <p className="text-xs font-semibold text-muted-foreground">{point.events}</p>
        </div>
      ))}
    </div>
  )
}

function AuditLogsWidget({ logs }: { logs: DashboardData['recentAuditLogs'] }) {
  if (logs.length === 0) {
    return <WidgetEmptyState description="Secured audit events will appear here." icon={ListTodo} title="No audit logs" />
  }

  return (
    <div className="space-y-3">
      {logs.slice(0, 5).map((log) => (
        <div className="rounded-[18px] border border-border/70 bg-muted/35 p-4" key={log.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{log.description}</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">{log.user} · {log.module}</p>
            </div>
            <Badge>{log.action}</Badge>
          </div>
          <p className="mt-3 text-xs font-semibold text-muted-foreground">{log.time}</p>
        </div>
      ))}
    </div>
  )
}
