import { FileText } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { InsightsData } from '@/hooks/use-insights'
import { cn } from '@/lib/utils'

const statusClass = {
  Ready: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Review: 'border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  Draft: 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
}

type ReportStatus = keyof typeof statusClass

export function ReportsTable({ data, isLoading }: { data?: InsightsData; isLoading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
        <CardDescription>Generated operational reports ready for review or export.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16 w-full" />)}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[20px] border border-border/70">
            {data?.reports.map((report) => (
              <div
                key={report.id}
                className="grid gap-3 border-b border-border/70 p-4 last:border-b-0 lg:grid-cols-[1fr_140px_160px_120px]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <FileText className="size-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{report.name}</p>
                    <p className="mt-1 text-xs font-bold text-primary">{report.id}</p>
                  </div>
                </div>
                <p className="self-center text-sm font-semibold text-muted-foreground">{report.type}</p>
                <p className="self-center text-sm font-semibold text-muted-foreground">{report.updated}</p>
                <div className="self-center">
                  <Badge className={cn(statusClass[report.status as ReportStatus])}>{report.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
