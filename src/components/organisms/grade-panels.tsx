import { motion } from 'framer-motion'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { GradeData } from '@/hooks/use-grades'
import { cn } from '@/lib/utils'

const toneClass = {
  green: 'bg-emerald-500',
  blue: 'bg-sky-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
}

type AnalyticsTone = keyof typeof toneClass

export function AssessmentPanels({ data, isLoading }: { data?: GradeData; isLoading: boolean }) {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <AssessmentList title="Assignments" items={data?.assignments} isLoading={isLoading} />
      <AssessmentList title="Exams" items={data?.exams} isLoading={isLoading} />
    </section>
  )
}

function AssessmentList({
  title,
  items,
  isLoading,
}: {
  title: string
  items?: Array<{ id: string; title: string; course: string; average: number; status?: string; dueDate?: string; date?: string; submitted?: number; total?: number }>
  isLoading: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Recent academic assessment activity and scoring health.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20 w-full" />)
          : items?.map((item) => (
              <div key={item.id} className="rounded-[20px] border border-border/70 bg-muted/35 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{item.title}</p>
                    <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{item.course}</p>
                  </div>
                  <Badge>{item.average}% avg</Badge>
                </div>
                <p className="mt-3 text-xs font-semibold text-muted-foreground">
                  {'submitted' in item && item.submitted !== undefined
                    ? `${item.submitted}/${item.total} submitted`
                    : `${item.status} - ${item.date}`}
                </p>
              </div>
            ))}
      </CardContent>
    </Card>
  )
}

export function PerformanceCharts({ data, isLoading }: { data?: GradeData; isLoading: boolean }) {
  const maxAverage = Math.max(...(data?.performance.map((item) => item.average) ?? [100]))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Charts</CardTitle>
        <CardDescription>Monthly average score and GPA progression across the term.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid h-72 grid-cols-6 items-end gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-48 w-full rounded-t-[18px]" />
            ))}
          </div>
        ) : (
          <div className="grid h-72 grid-cols-6 items-end gap-3 rounded-[20px] border border-border/70 bg-background/60 p-4">
            {data?.performance.map((item, index) => (
              <div key={item.label} className="flex h-full min-w-0 flex-col justify-end gap-3">
                <motion.div
                  className="min-h-8 rounded-t-[18px] bg-primary shadow-soft"
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((item.average / maxAverage) * 100, 14)}%` }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                />
                <div className="text-center">
                  <p className="text-xs font-bold text-foreground">{item.label}</p>
                  <p className="hidden text-[11px] font-medium text-muted-foreground sm:block">
                    GPA {item.gpa.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function GradeAnalytics({ data, isLoading }: { data?: GradeData; isLoading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <CardDescription>Grade distribution and academic risk concentration.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)
          : data?.analytics.map((item) => {
              const tone = item.tone as AnalyticsTone

              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-muted-foreground">{item.label}</span>
                    <span className="font-bold text-foreground">{item.value}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div className={cn('h-full rounded-full', toneClass[tone])} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              )
            })}
      </CardContent>
    </Card>
  )
}
