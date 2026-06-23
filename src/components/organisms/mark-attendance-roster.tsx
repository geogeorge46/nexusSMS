import { Check, Clock, MinusCircle, X } from 'lucide-react'
import { useState } from 'react'

import { AttendanceStatusChip } from '@/components/molecules/attendance-status-chip'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { AttendanceData, AttendanceStatus } from '@/hooks/use-attendance'
import { cn } from '@/lib/utils'

const statusOptions: Array<{ label: AttendanceStatus; icon: typeof Check }> = [
  { label: 'Present', icon: Check },
  { label: 'Late', icon: Clock },
  { label: 'Absent', icon: X },
  { label: 'Excused', icon: MinusCircle },
]

export function MarkAttendanceRoster({
  data,
  isLoading,
}: {
  data?: AttendanceData
  isLoading: boolean
}) {
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({})

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mark Attendance</CardTitle>
        <CardDescription>Dummy roster controls for recording daily attendance status.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {data?.markRoster.map((student) => {
              const currentStatus = statuses[student.id] ?? student.status

              return (
                <div key={student.id} className="rounded-[20px] border border-border/70 bg-background/55 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-foreground">{student.name}</p>
                        <AttendanceStatusChip status={currentStatus} />
                      </div>
                      <p className="mt-1 text-sm font-medium text-muted-foreground">
                        {student.course} - {student.grade}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {statusOptions.map((option) => {
                        const Icon = option.icon
                        const active = currentStatus === option.label

                        return (
                          <Button
                            key={option.label}
                            className={cn(active && 'ring-2 ring-ring')}
                            onClick={() =>
                              setStatuses((value) => ({ ...value, [student.id]: option.label }))
                            }
                            size="sm"
                            type="button"
                            variant={active ? 'default' : 'glass'}
                          >
                            <Icon />
                            {option.label}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
