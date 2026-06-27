import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getStudentPortalErrorMessage, useStudentPortalTimetable } from '@/hooks/use-student-portal'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Unscheduled']

export function MyTimetablePage() {
  const { data, error, isError, isLoading } = useStudentPortalTimetable()

  if (isError) return <Message title="Timetable unavailable" message={getStudentPortalErrorMessage(error)} />

  return (
    <div className="space-y-5">
      <GlassCard className="p-6">
        <Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">My Timetable</Badge>
        <h1 className="text-3xl font-bold tracking-normal text-foreground">Weekly Schedule</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Generated from your enrolled course schedules. A dedicated timetable module can replace this later.</p>
      </GlassCard>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton className="h-44" key={index} />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {days.map((day) => {
            const items = data?.items.filter((item) => item.day === day) ?? []
            return (
              <GlassCard className="p-5" key={day}>
                <h2 className="text-base font-bold text-foreground">{day}</h2>
                <div className="mt-4 space-y-3">
                  {items.length ? items.map((item) => (
                    <div className="rounded-[16px] border border-border/70 bg-muted/35 p-3" key={item.id}>
                      <p className="text-sm font-bold text-foreground">{item.time}</p>
                      <p className="mt-1 text-sm text-foreground">{item.course}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.room} - {item.faculty}</p>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">No classes scheduled.</p>}
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Message({ title, message }: { title: string; message: string }) {
  return (
    <GlassCard className="p-8 text-center">
      <p className="text-lg font-bold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </GlassCard>
  )
}
