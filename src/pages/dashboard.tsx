import { motion } from 'framer-motion'
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  FileText,
  Plus,
  Sparkles,
  TrendingUp,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'

import { DashboardWidgetGrid } from '@/components/organisms/dashboard-widget-grid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  GlassCard,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardData, type DashboardData } from '@/hooks/use-dashboard-data'
import { useAuth } from '@/hooks/use-auth'
import { canViewFees, canViewLms, canViewTimetable, canWriteStudents, isStaff, isTeacher, staffDesignation } from '@/lib/permissions'
import { cn } from '@/lib/utils'

type StatTone = 'blue' | 'green' | 'violet' | 'amber'

const statIcons: Record<string, LucideIcon> = {
  students: UsersRound,
  courses: BookOpen,
  attendance: CalendarCheck,
  gpa: GraduationCap,
  documents: FileText,
  notifications: Bell,
}

const statToneClass: Record<StatTone, string> = {
  blue: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
  green: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
  violet: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
  amber: 'bg-amber-500/14 text-amber-800 dark:text-amber-300',
}

const reveal = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
}

export function DashboardPage() {
  const { data, error, isError, isLoading } = useDashboardData()

  if (isError) {
    return <DashboardError error={error} />
  }

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: 0.06 }}
    >
      <DashboardHero data={data} isLoading={isLoading} />
      <StatsGrid data={data} isLoading={isLoading} />
      <DashboardWidgetGrid data={data} isLoading={isLoading} />
    </motion.div>
  )
}

function DashboardError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'Dashboard summary could not be loaded.'

  return (
    <Card>
      <CardContent className="p-8 text-center">
        <p className="text-lg font-bold text-foreground">Unable to load dashboard</p>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}

function DashboardHero({
  data,
  isLoading,
}: {
  data?: DashboardData
  isLoading: boolean
}) {
  const { user } = useAuth()
  const roleContent = getRoleDashboardContent(user)

  return (
    <motion.section variants={reveal}>
      <GlassCard className="relative overflow-hidden p-5 sm:p-6 lg:p-7">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(37,99,235,0.16),transparent_42%),radial-gradient(circle_at_82%_18%,rgba(16,185,129,0.14),transparent_28%)] dark:bg-[linear-gradient(115deg,rgba(14,165,233,0.13),transparent_42%),radial-gradient(circle_at_82%_18%,rgba(245,158,11,0.12),transparent_28%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge className="border-primary/20 bg-primary/10 text-primary">
                <Sparkles className="mr-1 size-3.5" aria-hidden="true" />
                {roleContent.badge}
              </Badge>
              <Badge>{data?.profile.term ?? 'Spring 2026'}</Badge>
            </div>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-11 max-w-xl" />
                <Skeleton className="h-5 max-w-2xl" />
                <Skeleton className="h-5 max-w-lg" />
              </div>
            ) : (
              <>
                <h1 className="max-w-4xl text-3xl font-bold tracking-normal text-foreground sm:text-4xl lg:text-5xl">
                  {roleContent.title}, {data?.profile.name}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                  {roleContent.description}
                </p>
              </>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              {canWriteStudents(user) && (
                <Button asChild type="button">
                  <a href="/students/new">
                  <Plus />
                  New Student
                  </a>
                </Button>
              )}
              <Button asChild type="button" variant="glass">
                <a href={roleContent.secondaryHref}>
                <BarChart3 />
                {roleContent.secondaryLabel}
                </a>
              </Button>
            </div>
          </div>

          <div className="rounded-[20px] border border-white/45 bg-background/70 p-4 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-9 w-44" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-muted-foreground">{data?.profile.role}</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{data?.profile.campus}</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MiniSignal
                    label="Attendance"
                    value={data?.stats.find((stat) => stat.label === 'Attendance')?.value ?? '0%'}
                  />
                  <MiniSignal
                    label="Average GPA"
                    value={data?.stats.find((stat) => stat.label === 'Average GPA')?.value ?? '0.00'}
                  />
                </div>
                <div className="mt-4 space-y-3">
                  <ProgressSignal label="Operational readiness" value={roleContent.progress} />
                  <ProgressSignal label="Daily attention" value={Math.max(12, 100 - roleContent.progress)} />
                </div>
              </>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.section>
  )
}

function ProgressSignal({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  )
}

function MiniSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/45 p-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
    </div>
  )
}

function StatsGrid({ data, isLoading }: { data?: DashboardData; isLoading: boolean }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {isLoading
        ? Array.from({ length: 4 }).map((_, index) => <StatCardSkeleton key={index} />)
        : data?.stats.map((stat, index) => (
            <DashboardStatCard key={stat.label} stat={stat} index={index} />
          ))}
    </section>
  )
}

function DashboardStatCard({
  stat,
  index,
}: {
  stat: DashboardData['stats'][number]
  index: number
}) {
  const Icon = statIcons[stat.icon] ?? Activity
  const tone = stat.tone as StatTone

  return (
    <motion.div variants={reveal} transition={{ delay: index * 0.04 }}>
      <GlassCard className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold tracking-normal text-foreground">{stat.value}</p>
          </div>
          <div className={cn('grid size-12 place-items-center rounded-[18px]', statToneClass[tone])}>
            <Icon className="size-5" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-medium text-muted-foreground">{stat.helper}</p>
          <Badge className="shrink-0 border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <TrendingUp className="mr-1 size-3" aria-hidden="true" />
            {stat.trend}
          </Badge>
        </div>
      </GlassCard>
    </motion.div>
  )
}

function StatCardSkeleton() {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="size-12 rounded-[18px]" />
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>
    </GlassCard>
  )
}

function getRoleDashboardContent(user: ReturnType<typeof useAuth>['user']) {
  if (isTeacher(user)) {
    return {
      badge: 'Teacher Workspace',
      title: 'Ready for class',
      description: 'Review assigned courses, attendance, grades, exams, LMS activity, and your teaching timetable from one focused workspace.',
      secondaryHref: canViewLms(user) ? '/lms' : '/teacher-timetable',
      secondaryLabel: canViewLms(user) ? 'Open LMS' : 'My Timetable',
      progress: 82,
    }
  }

  if (isStaff(user)) {
    const designation = staffDesignation(user) || 'Staff'
    return {
      badge: `${designation} Desk`,
      title: 'Welcome back',
      description: canViewFees(user)
        ? 'Track student records, fee operations, finance documents, and day-to-day office workload with clear role boundaries.'
        : canViewTimetable(user)
          ? 'Review students, courses, timetable context, documents, and office work without exposing restricted academic actions.'
          : 'Review students, documents, reports, and daily office activity with staff-safe access controls.',
      secondaryHref: canViewFees(user) ? '/fees' : canViewTimetable(user) ? '/timetable' : '/reports',
      secondaryLabel: canViewFees(user) ? 'Open Fees' : canViewTimetable(user) ? 'View Timetable' : 'View Reports',
      progress: canViewFees(user) ? 76 : 68,
    }
  }

  return {
    badge: 'Command Center',
    title: 'Welcome back',
    description: 'Keep enrollment, academics, attendance, finance, and department health moving from one polished dashboard.',
    secondaryHref: '/reports',
    secondaryLabel: 'View Reports',
    progress: 88,
  }
}
