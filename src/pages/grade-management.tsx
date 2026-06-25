import { Award, BookMarked, ChartNoAxesCombined, ClipboardCheck, TrendingUp } from 'lucide-react'

import { PageHeader } from '@/components/molecules/page-header'
import { AssessmentPanels, GradeAnalytics, PerformanceCharts } from '@/components/organisms/grade-panels'
import { GradeTable } from '@/components/organisms/grade-table'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useGrades } from '@/hooks/use-grades'

export function GradeManagementPage() {
  const { data, isLoading, isError, error } = useGrades()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Grade Management"
        title="Grades"
        description="Track assignments, exams, GPA, CGPA, performance trends, and academic analytics from one responsive workspace."
      />

      {isError && <div className="rounded-[20px] border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-700">{error instanceof Error ? error.message : 'Unable to load grades.'}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {isLoading || !data ? (
          Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-28" />)
        ) : (
          <>
            <SummaryCard icon={Award} label="GPA" value={data.summary.gpa.toFixed(2)} />
            <SummaryCard icon={TrendingUp} label="CGPA" value={data.summary.cgpa.toFixed(2)} />
            <SummaryCard icon={ClipboardCheck} label="Graded" value={String(data.summary.graded)} />
            <SummaryCard icon={BookMarked} label="Pending" value={String(data.summary.pending)} />
            <SummaryCard icon={ChartNoAxesCombined} label="At Risk" value={String(data.summary.atRisk)} />
          </>
        )}
      </section>

      <AssessmentPanels data={data} isLoading={isLoading} />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <PerformanceCharts data={data} isLoading={isLoading} />
        <GradeAnalytics data={data} isLoading={isLoading} />
      </section>

      <GradeTable data={data} isLoading={isLoading} />
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Award
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
