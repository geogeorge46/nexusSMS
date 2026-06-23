import { Activity, BarChart3, GraduationCap, TrendingUp } from 'lucide-react'

import { ExportActions } from '@/components/molecules/export-actions'
import { PageHeader } from '@/components/molecules/page-header'
import { PerformanceAnalyticsChart, SegmentAnalytics } from '@/components/organisms/insight-charts'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useInsights } from '@/hooks/use-insights'

export function AnalyticsPage() {
  const { data, isLoading } = useInsights()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Analytics"
        description="Monitor the operating pulse of Nexus across retention, attendance, academic performance, and course capacity."
        actions={<ExportActions filename="nexus-analytics" rows={data?.performance ?? []} />}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)
        ) : (
          <>
            <SummaryCard icon={TrendingUp} label="Retention" value={data.analyticsSummary.retention} />
            <SummaryCard icon={Activity} label="Attendance" value={data.analyticsSummary.attendance} />
            <SummaryCard icon={GraduationCap} label="Performance" value={data.analyticsSummary.performance} />
            <SummaryCard icon={BarChart3} label="Capacity" value={data.analyticsSummary.capacity} />
          </>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <PerformanceAnalyticsChart data={data} isLoading={isLoading} />
        <SegmentAnalytics data={data} isLoading={isLoading} />
      </section>
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
