import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  CloudSun,
  FileBarChart,
  ListTodo,
  Plus,
  RefreshCcw,
  Sparkles,
  SunMedium,
  UserRoundPlus,
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
  | 'recent-students'
  | 'top-courses'
  | 'calendar'
  | 'weather'
  | 'activity'
  | 'notifications'
  | 'quick-actions'
  | 'deadlines'

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
    id: 'recent-students',
    title: 'Recent Students',
    description: 'Newest profiles moving through enrollment.',
    icon: UsersRound,
    size: 'wide',
  },
  {
    id: 'top-courses',
    title: 'Top Courses',
    description: 'Highest demand courses by enrollment.',
    icon: BookOpen,
    size: 'standard',
  },
  {
    id: 'calendar',
    title: 'Calendar',
    description: 'Upcoming campus events and checkpoints.',
    icon: CalendarDays,
    size: 'standard',
  },
  {
    id: 'weather',
    title: 'Weather',
    description: 'Campus conditions for daily operations.',
    icon: CloudSun,
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
    id: 'quick-actions',
    title: 'Quick Actions',
    description: 'Fast paths for common administrative work.',
    icon: Sparkles,
    size: 'standard',
  },
  {
    id: 'deadlines',
    title: 'Upcoming Deadlines',
    description: 'Time-sensitive academic and operations work.',
    icon: ListTodo,
    size: 'standard',
  },
]

const priorityTone: Record<string, string> = {
  High: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  Medium: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Low: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
}

const notificationTone: Record<string, string> = {
  warning: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  info: 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
}

const actionIcons: Record<string, LucideIcon> = {
  add: UserRoundPlus,
  course: BookOpen,
  report: FileBarChart,
  sync: RefreshCcw,
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
    case 'recent-students':
      return <RecentStudentsWidget students={data.recentStudents} />
    case 'top-courses':
      return <TopCoursesWidget courses={data.widgets.topCourses} />
    case 'calendar':
      return <CalendarWidget events={data.widgets.calendar} />
    case 'weather':
      return <WeatherWidget weather={data.widgets.weather} />
    case 'activity':
      return <ActivityWidget activity={data.activity} />
    case 'notifications':
      return <NotificationsWidget notifications={data.widgets.notifications} />
    case 'quick-actions':
      return <QuickActionsWidget actions={data.quickActions} />
    case 'deadlines':
      return <DeadlinesWidget deadlines={data.widgets.deadlines} />
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
            style={{ width: `${(segment.value / total) * 100}%` }}
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
        <div className="rounded-[18px] border border-border/70 bg-muted/35 p-4" key={student.name}>
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
  return (
    <div className="space-y-3">
      {courses.map((course) => {
        const capacity = Math.round((course.enrolled / course.capacity) * 100)

        return (
          <div className="rounded-[18px] border border-border/70 bg-muted/35 p-4" key={course.name}>
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

function CalendarWidget({ events }: { events: DashboardData['widgets']['calendar'] }) {
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div className="flex gap-3 rounded-[18px] border border-border/70 bg-muted/35 p-4" key={event.title}>
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-center text-primary">
            <div>
              <p className="text-xs font-bold">{event.day}</p>
              <p className="text-lg font-bold">{event.date}</p>
            </div>
          </div>
          <div className="min-w-0 self-center">
            <p className="truncate text-sm font-bold text-foreground">{event.title}</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">{event.time}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function WeatherWidget({ weather }: { weather: DashboardData['widgets']['weather'] }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-[20px] border border-border/70 bg-muted/35 p-4">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{weather.location}</p>
          <p className="mt-2 text-4xl font-bold text-foreground">{weather.temperature}</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">{weather.condition}</p>
        </div>
        <div className="grid size-16 place-items-center rounded-[20px] bg-amber-500/10 text-amber-600 dark:text-amber-300">
          <SunMedium className="size-8" aria-hidden="true" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <MiniWeather label="Humidity" value={weather.humidity} />
        <MiniWeather label="Wind" value={weather.wind} />
        <MiniWeather label="AQI" value={weather.airQuality} />
      </div>
    </div>
  )
}

function MiniWeather({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/55 p-3 text-center">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
    </div>
  )
}

function ActivityWidget({ activity }: { activity: DashboardData['activity'] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {activity.map((event) => (
        <div className="flex gap-3 rounded-[18px] border border-border/70 bg-muted/35 p-4" key={event.title}>
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
        <div className="rounded-[18px] border border-border/70 bg-muted/35 p-4" key={notification.title}>
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

function QuickActionsWidget({ actions }: { actions: DashboardData['quickActions'] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {actions.map((action) => {
        const Icon = actionIcons[action.icon] ?? Plus

        return (
          <button
            className="flex min-h-20 items-center gap-3 rounded-[18px] border border-border/70 bg-muted/35 p-4 text-left outline-none transition hover:-translate-y-0.5 hover:bg-muted/60 hover:shadow-soft focus-visible:ring-2 focus-visible:ring-ring"
            key={action.label}
            type="button"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-foreground">{action.label}</span>
              <span className="mt-1 block text-xs font-medium leading-5 text-muted-foreground">
                {action.description}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function DeadlinesWidget({ deadlines }: { deadlines: DashboardData['widgets']['deadlines'] }) {
  return (
    <div className="space-y-3">
      {deadlines.map((deadline) => (
        <div className="rounded-[18px] border border-border/70 bg-muted/35 p-4" key={deadline.title}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{deadline.title}</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">{deadline.module}</p>
            </div>
            <Badge className={priorityTone[deadline.priority]}>{deadline.priority}</Badge>
          </div>
          <p className="mt-4 text-sm font-bold text-foreground">Due {deadline.due}</p>
        </div>
      ))}
    </div>
  )
}
