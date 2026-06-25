import { BookOpen, CalendarDays, Clock, GraduationCap, MapPin, UserRoundPen } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { CapacityIndicator } from '@/components/molecules/capacity-indicator'
import { CourseStatusChip } from '@/components/molecules/course-status-chip'
import { PageHeader } from '@/components/molecules/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getCourseErrorMessage, useCourse } from '@/hooks/use-courses'

export function CourseDetailsPage() {
  const { courseId } = useParams()
  const { data: course, error, isError, isLoading } = useCourse(courseId)

  if (isLoading) {
    return <Skeleton className="h-[640px] w-full" />
  }

  if (isError || !course) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-lg font-bold text-foreground">{isError ? 'Unable to load course' : 'Course not found'}</p>
          {isError && <p className="mt-2 text-sm text-muted-foreground">{getCourseErrorMessage(error)}</p>}
          <Button asChild className="mt-5">
            <Link to="/courses">Return to Courses</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Course Details"
        title={course.title}
        description={`${course.code} in ${course.department}, taught by ${course.faculty}.`}
        actions={
          <Button asChild type="button">
            <Link to={`/courses/${course.id}/edit`}>
              <UserRoundPen />
              Edit Course
            </Link>
          </Button>
        }
      />

      <GlassCard className="p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CourseStatusChip status={course.status} />
              <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                {course.id}
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">{course.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{course.description}</p>
          </div>
          <div className="rounded-[20px] border border-border/70 bg-background/60 p-4">
            <CapacityIndicator enrolled={course.enrolled} capacity={course.capacity} />
          </div>
        </div>
      </GlassCard>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DetailMetric icon={GraduationCap} label="Credits" value={String(course.credits)} />
        <DetailMetric icon={BookOpen} label="Enrollment" value={String(course.enrolled)} />
        <DetailMetric icon={UserRoundPen} label="Faculty" value={course.faculty} />
        <DetailMetric icon={CalendarDays} label="Semester" value={course.semester} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Schedule and Location</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <InfoItem icon={Clock} label="Schedule" value={course.schedule} />
            <InfoItem icon={MapPin} label="Room" value={course.room} />
            <InfoItem icon={BookOpen} label="Code" value={course.code} />
            <InfoItem icon={GraduationCap} label="Department" value={course.department} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enrollment Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SnapshotBar label="Capacity Used" value={Math.round((course.enrolled / Math.max(course.capacity, 1)) * 100)} />
            <SnapshotBar label="Credit Weight" value={Math.min(100, course.credits * 22)} />
            <SnapshotBar label="Catalog Readiness" value={course.status === 'Active' ? 96 : 72} />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function DetailMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen
  label: string
  value: string
}) {
  return (
    <GlassCard className="flex items-center gap-4 p-5">
      <div className="grid size-11 shrink-0 place-items-center rounded-[18px] bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-xl font-bold text-foreground">{value}</p>
      </div>
    </GlassCard>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3 rounded-[20px] border border-border/70 bg-muted/35 p-4">
      <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-bold text-foreground">{value}</p>
      </div>
    </div>
  )
}

function SnapshotBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-muted-foreground">{label}</span>
        <span className="font-bold text-foreground">{value}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
