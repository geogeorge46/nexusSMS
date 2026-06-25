import { Check, Clock, MinusCircle, X } from 'lucide-react'
import { useState } from 'react'

import { AttendanceStatusChip } from '@/components/molecules/attendance-status-chip'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getAttendanceErrorMessage,
  useMarkAttendance,
  useUpdateAttendance,
  type AttendanceData,
  type AttendanceStatus,
} from '@/hooks/use-attendance'
import { cn } from '@/lib/utils'

const statusOptions: Array<{ label: AttendanceStatus; icon: typeof Check }> = [
  { label: 'Present', icon: Check },
  { label: 'Late', icon: Clock },
  { label: 'Absent', icon: X },
  { label: 'Excused', icon: MinusCircle },
]

export function MarkAttendanceRoster({
  courseId,
  data,
  date,
  isLoading,
}: {
  courseId: string
  data?: AttendanceData
  date: string
  isLoading: boolean
}) {
  const markAttendance = useMarkAttendance()
  const updateAttendance = useUpdateAttendance()
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({})
  const [error, setError] = useState('')

  async function selectStatus(studentId: string, attendanceId: string, status: AttendanceStatus) {
    setStatuses((value) => ({ ...value, [studentId]: status }))
    setError('')

    if (!courseId || courseId === 'All') {
      setError('Select a course before marking attendance.')
      return
    }

    try {
      if (attendanceId) {
        await updateAttendance.mutateAsync({
          attendanceId,
          payload: { status },
        })
      } else {
        await markAttendance.mutateAsync({
          studentId,
          courseId,
          date,
          status,
        })
      }
    } catch (caught) {
      setError(getAttendanceErrorMessage(caught))
    }
  }

  const roster = data?.markRoster ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mark Attendance</CardTitle>
        <CardDescription>Record the selected course roster for the chosen date.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="mb-4 rounded-2xl bg-rose-500/10 p-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
            {error}
          </p>
        )}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
        ) : roster.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-border p-8 text-center">
            <p className="text-sm font-bold text-foreground">No students found</p>
            <p className="mt-1 text-sm text-muted-foreground">Adjust the selected course or department.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {roster.map((student) => {
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
                            disabled={markAttendance.isPending || updateAttendance.isPending}
                            onClick={() => void selectStatus(student.id, student.attendanceId, option.label)}
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
