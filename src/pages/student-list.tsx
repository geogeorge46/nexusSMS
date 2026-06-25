import { FileUp, Plus, UsersRound } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/molecules/page-header'
import { StudentTable } from '@/components/organisms/student-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getStudentErrorMessage, useStudents, type StudentFilters } from '@/hooks/use-students'

const pageSize = 8

export function StudentListPage() {
  const [filters, setFilters] = useState<StudentFilters>({
    search: '',
    status: 'All',
    department: 'All',
    page: 1,
    limit: pageSize,
  })
  const deferredSearch = useDeferredValue(filters.search)
  const queryFilters = { ...filters, search: deferredSearch }
  const { data, error, isError, isFetching, isLoading } = useStudents(queryFilters)

  function updateFilters(nextFilters: Partial<StudentFilters>) {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
      page: nextFilters.page ?? 1,
    }))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student Management"
        title="Students"
        description="Manage enrollment profiles, academic standing, attendance health, and student records from a searchable table."
        actions={
          <>
            <Button asChild type="button" variant="glass">
              <Link to="/students/import">
                <FileUp />
                Import
              </Link>
            </Button>
            <Button asChild type="button">
              <Link to="/students/new">
                <Plus />
                Add Student
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)
        ) : (
          <>
            <SummaryCard label="Total Students" value={String(data?.summary.total ?? 0)} />
            <SummaryCard label="Active" value={String(data?.summary.active ?? 0)} />
            <SummaryCard label="Needs Review" value={String(data?.summary.review ?? 0)} />
            <SummaryCard label="Avg Attendance" value={`${data?.summary.averageAttendance ?? 0}%`} />
          </>
        )}
      </section>

      {isError ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg font-bold text-foreground">Unable to load students</p>
            <p className="mt-2 text-sm text-muted-foreground">{getStudentErrorMessage(error)}</p>
          </CardContent>
        </Card>
      ) : (
        <StudentTable
          filters={filters}
          isLoading={isLoading}
          isFetching={isFetching}
          onFiltersChange={updateFilters}
          onPageChange={(page) => updateFilters({ page })}
          pagination={data?.pagination}
          students={data?.items}
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
        <UsersRound className="size-5" aria-hidden="true" />
      </div>
    </GlassCard>
  )
}
