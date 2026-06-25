import { BookOpen, Plus } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/molecules/page-header'
import { CourseTable } from '@/components/organisms/course-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getCourseErrorMessage, useCourses, type CourseFilters } from '@/hooks/use-courses'

const pageSize = 7

export function CourseListPage() {
  const [filters, setFilters] = useState<CourseFilters>({
    search: '',
    status: 'All',
    department: 'All',
    page: 1,
    limit: pageSize,
  })
  const deferredSearch = useDeferredValue(filters.search)
  const queryFilters = { ...filters, search: deferredSearch }
  const { data, error, isError, isFetching, isLoading } = useCourses(queryFilters)

  function updateFilters(nextFilters: Partial<CourseFilters>) {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
      page: nextFilters.page ?? 1,
    }))
  }

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
            <SummaryCard label="Total Courses" value={String(data?.summary.total ?? 0)} />
            <SummaryCard label="Active Courses" value={String(data?.summary.active ?? 0)} />
            <SummaryCard label="Enrollment" value={String(data?.summary.enrollment ?? 0)} />
            <SummaryCard label="Capacity Used" value={`${data?.summary.capacityUsed ?? 0}%`} />
          </>
        )}
      </section>

      {isError ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg font-bold text-foreground">Unable to load courses</p>
            <p className="mt-2 text-sm text-muted-foreground">{getCourseErrorMessage(error)}</p>
          </CardContent>
        </Card>
      ) : (
        <CourseTable
          courses={data?.items}
          filters={filters}
          isFetching={isFetching}
          isLoading={isLoading}
          onFiltersChange={updateFilters}
          onPageChange={(page) => updateFilters({ page })}
          pagination={data?.pagination}
        />
      )}
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
