import { BookOpen, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/molecules/page-header'
import { CourseTable } from '@/components/organisms/course-table'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCourses } from '@/hooks/use-courses'

export function CourseListPage() {
  const { data, isLoading } = useCourses()
  const totalCapacity = (data ?? []).reduce((sum, course) => sum + course.capacity, 0)
  const totalEnrollment = (data ?? []).reduce((sum, course) => sum + course.enrolled, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Course Management"
        title="Courses"
        description="Manage catalog records, enrollment demand, faculty ownership, credits, and course status from one responsive workspace."
        actions={
          <Button asChild type="button">
            <Link to="/courses/new">
              <Plus />
              Add Course
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)
        ) : (
          <>
            <SummaryCard label="Total Courses" value={String(data?.length ?? 0)} />
            <SummaryCard label="Active Courses" value={String(data?.filter((course) => course.status === 'Active').length ?? 0)} />
            <SummaryCard label="Enrollment" value={String(totalEnrollment)} />
            <SummaryCard label="Capacity Used" value={`${Math.round((totalEnrollment / Math.max(totalCapacity, 1)) * 100)}%`} />
          </>
        )}
      </section>

      <CourseTable courses={data} isLoading={isLoading} />
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard className="flex items-center justify-between gap-4 p-5">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      </div>
      <div className="grid size-12 place-items-center rounded-[18px] bg-primary/10 text-primary">
        <BookOpen className="size-5" aria-hidden="true" />
      </div>
    </GlassCard>
  )
}
