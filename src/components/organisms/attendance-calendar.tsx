import { CalendarDays } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { AttendanceData } from '@/hooks/use-attendance'
import { cn } from '@/lib/utils'

const tone = {
  Strong: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Watch: 'border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  Concern: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

type CalendarStatus = keyof typeof tone

export function AttendanceCalendar({
  data,
  isLoading,
}: {
  data?: AttendanceData
  isLoading: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
        <CardDescription>Daily attendance rate snapshots for June 2026.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {Array.from({ length: 15 }).map((_, index) => (
              <Skeleton key={index} className="h-20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {data?.calendar.map((day) => {
              const date = new Date(`${day.date}T00:00:00`)
              const dayNumber = date.getDate()

              return (
                <div
                  key={day.date}
                  className={cn('rounded-[18px] border p-3', tone[day.status as CalendarStatus])}
                >
                  <div className="flex items-center justify-between gap-2">
                    <CalendarDays className="size-4" aria-hidden="true" />
                    <span className="text-xs font-bold">{day.status}</span>
                  </div>
                  <p className="mt-3 text-2xl font-bold">{dayNumber}</p>
                  <p className="text-xs font-semibold">{day.rate}% present</p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
