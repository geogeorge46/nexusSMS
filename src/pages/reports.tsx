import { Clock, FileText, Send, ShieldCheck } from 'lucide-react'

import { ExportActions } from '@/components/molecules/export-actions'
import { PageHeader } from '@/components/molecules/page-header'
import { ReportsTable } from '@/components/organisms/reports-table'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useInsights } from '@/hooks/use-insights'

export function ReportsPage() {
  const { data, isLoading } = useInsights()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reports"
        title="Reports Center"
        description="Generate, review, and export student management reports for enrollment, attendance, grades, and course planning."
        actions={<ExportActions filename="nexus-reports" rows={data?.reports ?? []} />}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)
        ) : (
          <>
            <SummaryCard icon={FileText} label="Generated" value={String(data.reportSummary.generated)} />
            <SummaryCard icon={Clock} label="Scheduled" value={String(data.reportSummary.scheduled)} />
            <SummaryCard icon={ShieldCheck} label="In Review" value={String(data.reportSummary.review)} />
            <SummaryCard icon={Send} label="Exports" value={String(data.reportSummary.exports)} />
          </>
        )}
      </section>

      <ReportsTable data={data} isLoading={isLoading} />
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText
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
