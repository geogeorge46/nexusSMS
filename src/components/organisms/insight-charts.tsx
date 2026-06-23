import { motion } from 'framer-motion'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { InsightsData } from '@/hooks/use-insights'
import { cn } from '@/lib/utils'

const toneClass = {
  blue: 'bg-sky-500',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  rose: 'bg-rose-500',
}

type SegmentTone = keyof typeof toneClass

export function PerformanceAnalyticsChart({
  data,
  isLoading,
}: {
  data?: InsightsData
  isLoading: boolean
}) {
  const maxStudents = Math.max(...(data?.performance.map((point) => point.students) ?? [1]))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Charts</CardTitle>
        <CardDescription>Enrollment, attendance, and GPA movement across the current term.</CardDescription>
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
            {data?.performance.map((point, index) => (
              <div key={point.label} className="flex h-full min-w-0 flex-col justify-end gap-3">
                <motion.div
                  className="min-h-8 rounded-t-[18px] bg-primary shadow-soft"
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((point.students / maxStudents) * 100, 12)}%` }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                />
                <div className="text-center">
                  <p className="text-xs font-bold text-foreground">{point.label}</p>
                  <p className="hidden text-[11px] font-medium text-muted-foreground sm:block">
                    {point.attendance}% att.
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

export function SegmentAnalytics({
  data,
  isLoading,
}: {
  data?: InsightsData
  isLoading: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <CardDescription>Department distribution across the student system.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)
          : data?.segments.map((segment) => {
              const tone = segment.tone as SegmentTone

              return (
                <div key={segment.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-muted-foreground">{segment.label}</span>
                    <span className="font-bold text-foreground">{segment.value}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div className={cn('h-full rounded-full', toneClass[tone])} style={{ width: `${segment.value}%` }} />
                  </div>
                </div>
              )
            })}
      </CardContent>
    </Card>
  )
}
