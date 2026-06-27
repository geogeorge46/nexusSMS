import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getStudentPortalErrorMessage, useStudentPortalCourses } from '@/hooks/use-student-portal'

export function MyCoursesPage() {
  const { data, error, isError, isLoading } = useStudentPortalCourses()

  if (isError) return <Message title="Courses unavailable" message={getStudentPortalErrorMessage(error)} />

  return (
    <div className="space-y-5">
      <GlassCard className="p-6">
        <Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">My Courses</Badge>
        <h1 className="text-3xl font-bold tracking-normal text-foreground">Enrolled Courses</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Courses currently linked to your student enrollment.</p>
      </GlassCard>

      <GlassCard className="overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton className="h-20" key={index} />)}
          </div>
        ) : data?.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Course</th>
                  <th className="px-5 py-3">Faculty</th>
                  <th className="px-5 py-3">Schedule</th>
                  <th className="px-5 py-3">Semester</th>
                  <th className="px-5 py-3">Credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {data.items.map((item) => (
                  <tr key={item.enrollmentId}>
                    <td className="px-5 py-4">
                      <p className="font-bold text-foreground">{item.course.title}</p>
                      <p className="text-xs text-muted-foreground">{item.course.code} - {item.course.department}</p>
                    </td>
                    <td className="px-5 py-4">{item.course.faculty}</td>
                    <td className="px-5 py-4">{item.course.schedule} - {item.course.room}</td>
                    <td className="px-5 py-4">{item.semester || item.course.semester}</td>
                    <td className="px-5 py-4">{item.course.credits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Message title="No enrollments yet" message="Your enrolled courses will appear here after admission enrollment is completed." compact />
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
