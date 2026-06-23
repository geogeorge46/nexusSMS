import { FileUp, Plus, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/molecules/page-header'
import { StudentTable } from '@/components/organisms/student-table'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useStudents } from '@/hooks/use-students'

export function StudentListPage() {
  const { data, isLoading } = useStudents()

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
            <SummaryCard label="Total Students" value={String(data?.length ?? 0)} />
            <SummaryCard label="Active" value={String(data?.filter((student) => student.status === 'Active').length ?? 0)} />
            <SummaryCard label="Needs Review" value={String(data?.filter((student) => student.status === 'Review').length ?? 0)} />
            <SummaryCard label="Avg Attendance" value={`${Math.round((data ?? []).reduce((sum, student) => sum + student.attendance, 0) / Math.max(data?.length ?? 1, 1))}%`} />
          </>
        )}
      </section>

      <StudentTable students={data} isLoading={isLoading} />
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
