import { Bell, BookOpen, CalendarCheck, FileArchive, GraduationCap, ListChecks } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getStudentPortalErrorMessage, useStudentPortalProfile } from '@/hooks/use-student-portal'

const statItems = [
  { key: 'enrolledCourses', label: 'Courses', icon: BookOpen },
  { key: 'attendanceAverage', label: 'Attendance', icon: CalendarCheck, suffix: '%' },
  { key: 'gpa', label: 'GPA', icon: GraduationCap },
  { key: 'creditsCompleted', label: 'Credits Done', icon: ListChecks },
  { key: 'creditsRemaining', label: 'Credits Left', icon: BookOpen },
  { key: 'unreadNotifications', label: 'Unread', icon: Bell },
  { key: 'documents', label: 'Documents', icon: FileArchive },
] as const

export function StudentPortalDashboardPage() {
  const { data, error, isError, isLoading } = useStudentPortalProfile()

  if (isError) return <PortalError message={getStudentPortalErrorMessage(error)} />

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
        ) : (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">Student Portal</Badge>
              <h1 className="text-3xl font-bold tracking-normal text-foreground">Welcome, {data?.student.name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {data?.student.program} - {data?.student.department} - {data?.student.batch || data?.student.year}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="glass"><Link to="/my-courses">My Courses</Link></Button>
              <Button asChild variant="glass"><Link to="/my-timetable">Timetable</Link></Button>
              <Button asChild><Link to="/my-grades">My Grades</Link></Button>
            </div>
          </div>
        )}
      </GlassCard>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => <Skeleton className="h-28" key={index} />)
          : statItems.map((item) => {
              const Icon = item.icon
              const value = data?.summary[item.key] ?? 0
              return (
                <GlassCard className="p-5" key={item.key}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">{item.label}</p>
                      <p className="mt-2 text-3xl font-bold tracking-normal text-foreground">
                        {value}{'suffix' in item ? item.suffix : ''}
                      </p>
                    </div>
                    <div className="grid size-12 place-items-center rounded-[18px] bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                  </div>
                </GlassCard>
              )
            })}
      </section>

      {!isLoading && data && (
        <section className="grid gap-4 xl:grid-cols-3">
          <DashboardList
            empty="No classes scheduled for today."
            items={data.summary.todayClasses.map((item) => `${item.time} - ${item.course} (${item.room})`)}
            title="Today's Classes"
          />
          <DashboardList
            empty="No upcoming exam records yet."
            items={data.summary.upcomingExams.map((item) => `${item.title} - ${item.course}`)}
            title="Upcoming Exams"
          />
          <DashboardList
            empty="Assignment tracking will appear when the module is enabled."
            items={data.summary.pendingAssignments.map((item) => item.title)}
            title="Pending Assignments"
          />
          <DashboardList
            empty="No recent documents."
            items={data.summary.recentDocuments.map((document) => `${document.documentType} - ${document.title}`)}
            title="Recent Documents"
          />
          <GlassCard className="p-5">
            <p className="text-sm font-semibold text-muted-foreground">Academic Status</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge>{data.student.status}</Badge>
              {data.summary.attendanceAverage < 75 && <Badge className="bg-amber-500/10 text-amber-700">Low attendance</Badge>}
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Eligibility is based on attendance and published academic records. Final clearance remains subject to office verification.
            </p>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="text-sm font-semibold text-muted-foreground">Quick Links</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="glass"><Link to="/my-documents">Documents</Link></Button>
              <Button asChild size="sm" variant="glass"><Link to="/academic-calendar">Calendar</Link></Button>
              <Button asChild size="sm" variant="glass"><Link to="/help-support">Support</Link></Button>
            </div>
          </GlassCard>
        </section>
      )}
    </div>
  )
}

function DashboardList({ empty, items, title }: { empty: string; items: string[]; title: string }) {
  return (
    <GlassCard className="p-5">
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      {items.length ? (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div className="rounded-[14px] border border-border/70 bg-muted/35 p-3 text-sm font-medium text-foreground" key={item}>
              {item}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{empty}</p>
      )}
    </GlassCard>
  )
}

function PortalError({ message }: { message: string }) {
  return (
    <GlassCard className="p-8 text-center">
      <p className="text-lg font-bold text-foreground">Unable to load student portal</p>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </GlassCard>
  )
}
