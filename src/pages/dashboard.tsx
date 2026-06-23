import { motion } from 'framer-motion'
import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarCheck,
  GraduationCap,
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
  GlassCard,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardData, type DashboardData } from '@/hooks/use-dashboard-data'
import { cn } from '@/lib/utils'

type StatTone = 'blue' | 'green' | 'violet' | 'amber'

const statIcons: Record<string, LucideIcon> = {
  students: UsersRound,
  courses: BookOpen,
  attendance: CalendarCheck,
  gpa: GraduationCap,
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
  const { data, isLoading } = useDashboardData()

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

function DashboardHero({
  data,
  isLoading,
}: {
  data?: DashboardData
  isLoading: boolean
}) {
  return (
    <motion.section variants={reveal}>
      <GlassCard className="relative overflow-hidden p-5 sm:p-6 lg:p-7">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(37,99,235,0.16),transparent_42%),radial-gradient(circle_at_82%_18%,rgba(16,185,129,0.14),transparent_28%)] dark:bg-[linear-gradient(115deg,rgba(14,165,233,0.13),transparent_42%),radial-gradient(circle_at_82%_18%,rgba(245,158,11,0.12),transparent_28%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge className="border-primary/20 bg-primary/10 text-primary">
                <Sparkles className="mr-1 size-3.5" aria-hidden="true" />
                Command Center
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
                  Welcome back, {data?.profile.name}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                  Keep enrollment, academics, attendance, and department health moving from one
                  polished dashboard.
                </p>
              </>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="button">
                <Plus />
                New Student
              </Button>
              <Button type="button" variant="glass">
                <BarChart3 />
                View Reports
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
                  <MiniSignal label="Retention" value="97%" />
                  <MiniSignal label="On Track" value="91%" />
                </div>
              </>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.section>
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
