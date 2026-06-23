import { CalendarCheck, Clock, TrendingUp, UserCheck, UserX } from 'lucide-react'
import { Link } from 'react-router-dom'

import { AttendanceCalendar } from '@/components/organisms/attendance-calendar'
import { AttendanceHeatmap, AttendanceTrendChart } from '@/components/organisms/attendance-charts'
import { AttendanceHistory } from '@/components/organisms/attendance-history'
import { PageHeader } from '@/components/molecules/page-header'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAttendance } from '@/hooks/use-attendance'

export function AttendanceDashboardPage() {
  const { data, isLoading } = useAttendance()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Attendance"
        title="Attendance Dashboard"
        description="Monitor daily attendance health, patterns, risk signals, and student-level history from one responsive command surface."
        actions={
          <Button asChild type="button">
            <Link to="/attendance/mark">
              <CalendarCheck />
              Mark Attendance
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)
        ) : (
          <>
            <SummaryCard icon={TrendingUp} label="Average" value={`${data.summary.average}%`} />
            <SummaryCard icon={UserCheck} label="Present" value={String(data.summary.present)} />
            <SummaryCard icon={Clock} label="Late" value={String(data.summary.late)} />
            <SummaryCard icon={UserX} label="At Risk" value={String(data.summary.atRisk)} />
          </>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <AttendanceTrendChart data={data} isLoading={isLoading} />
        <AttendanceHeatmap data={data} isLoading={isLoading} />
      </section>

      <AttendanceCalendar data={data} isLoading={isLoading} />
      <AttendanceHistory data={data} isLoading={isLoading} />
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof TrendingUp
  label: string
  value: string
}) {
  return (
    <GlassCard className="flex items-center justify-between gap-4 p-5">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      </div>
      <div className="grid size-12 place-items-center rounded-[18px] bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
    </GlassCard>
  )
}
