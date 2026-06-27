import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getStudentPortalErrorMessage, useStudentPortalAttendance } from '@/hooks/use-student-portal'

export function MyAttendancePage() {
  const { data, error, isError, isLoading } = useStudentPortalAttendance()

  if (isError) return <Message title="Attendance unavailable" message={getStudentPortalErrorMessage(error)} />

  return (
    <div className="space-y-5">
      <GlassCard className="p-6">
        <Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">My Attendance</Badge>
        <h1 className="text-3xl font-bold tracking-normal text-foreground">{data?.summary.average ?? 0}% attendance</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Your attendance history across enrolled courses.</p>
      </GlassCard>

      <section className="grid gap-4 sm:grid-cols-4">
        {[
          ['Present', data?.summary.present ?? 0],
          ['Late', data?.summary.late ?? 0],
          ['Excused', data?.summary.excused ?? 0],
          ['Absent', data?.summary.absent ?? 0],
        ].map(([label, value]) => (
          <GlassCard className="p-4" key={label}>
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          </GlassCard>
        ))}
      </section>

      <GlassCard className="overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, index) => <Skeleton className="h-16" key={index} />)}
          </div>
        ) : data?.history.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Course</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {data.history.map((record) => (
                  <tr key={record.id}>
                    <td className="px-5 py-4">{record.date}</td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-foreground">{record.course}</p>
                      <p className="text-xs text-muted-foreground">{record.courseNumber}</p>
                    </td>
                    <td className="px-5 py-4"><Badge>{record.status}</Badge></td>
                    <td className="px-5 py-4">{record.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Message title="No attendance records" message="Marked attendance will appear here." compact />
        )}
      </GlassCard>
    </div>
  )
}

function Message({ title, message, compact = false }: { title: string; message: string; compact?: boolean }) {
  const className = compact ? 'p-8 text-center' : 'rounded-[18px] border border-border/70 bg-background/70 p-8 text-center'
  return (
    <div className={className}>
      <p className="text-lg font-bold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
