import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getStudentPortalErrorMessage, useStudentPortalCalendar } from '@/hooks/use-student-portal'

export function AcademicCalendarPage() {
  const { data, error, isError, isLoading } = useStudentPortalCalendar()

  if (isError) return <Message title="Calendar unavailable" message={getStudentPortalErrorMessage(error)} />

  return (
    <div className="space-y-5">
      <GlassCard className="p-6">
        <Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">Academic Calendar</Badge>
        <h1 className="text-3xl font-bold tracking-normal text-foreground">Important Dates</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Student-facing dates. This is ready to connect to a future events module.</p>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => <Skeleton className="h-28" key={index} />)
          : data?.items.map((item) => (
              <GlassCard className="p-5" key={item.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge>{item.type}</Badge>
                  <span className="text-sm font-semibold text-muted-foreground">{item.date}</span>
                </div>
                <h2 className="mt-4 text-lg font-bold text-foreground">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </GlassCard>
            ))}
      </div>
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
