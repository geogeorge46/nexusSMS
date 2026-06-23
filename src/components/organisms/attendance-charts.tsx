import { motion } from 'framer-motion'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { AttendanceData } from '@/hooks/use-attendance'

export function AttendanceTrendChart({
  data,
  isLoading,
}: {
  data?: AttendanceData
  isLoading: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Charts</CardTitle>
        <CardDescription>Daily present, late, and absent patterns for the current week.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid h-72 grid-cols-5 items-end gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-48 w-full rounded-t-[18px]" />
            ))}
          </div>
        ) : (
          <div className="grid h-72 grid-cols-5 items-end gap-3 rounded-[20px] border border-border/70 bg-background/60 p-4">
            {data?.dailyTrend.map((day, index) => (
              <div key={day.day} className="flex h-full min-w-0 flex-col justify-end gap-2">
                <div className="flex h-full items-end gap-1.5">
                  <motion.div
                    className="w-full rounded-t-xl bg-emerald-500"
                    initial={{ height: 0 }}
                    animate={{ height: `${day.present}%` }}
                    transition={{ delay: index * 0.05, duration: 0.45 }}
                  />
                  <motion.div
                    className="w-full rounded-t-xl bg-amber-500"
                    initial={{ height: 0 }}
                    animate={{ height: `${day.late * 8}%` }}
                    transition={{ delay: index * 0.06, duration: 0.45 }}
                  />
                  <motion.div
                    className="w-full rounded-t-xl bg-rose-500"
                    initial={{ height: 0 }}
                    animate={{ height: `${day.absent * 10}%` }}
                    transition={{ delay: index * 0.07, duration: 0.45 }}
                  />
                </div>
                <p className="text-center text-xs font-bold text-foreground">{day.day}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function AttendanceHeatmap({
  data,
  isLoading,
}: {
  data?: AttendanceData
  isLoading: boolean
}) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

  return (
    <Card>
      <CardHeader>
        <CardTitle>Heatmap</CardTitle>
        <CardDescription>Attendance intensity by grade and weekday.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-[88px_repeat(5,minmax(0,1fr))] gap-2 text-center text-xs font-bold text-muted-foreground">
              <span />
              {days.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            {data?.heatmap.map((row) => (
              <div key={row.label} className="grid grid-cols-[88px_repeat(5,minmax(0,1fr))] items-center gap-2">
                <p className="truncate text-xs font-bold text-foreground">{row.label}</p>
                {row.values.map((value, index) => (
                  <div
                    key={`${row.label}-${index}`}
                    className="grid h-11 place-items-center rounded-2xl text-xs font-bold text-foreground"
                    style={{ backgroundColor: `hsl(160 84% ${104 - value}%)` }}
                  >
                    {value}%
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
