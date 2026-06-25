import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/molecules/page-header'
import { StudentImportWorkflow } from '@/components/organisms/student-import-workflow'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useStudents } from '@/hooks/use-students'

export function StudentImportPage() {
  const { data, isLoading } = useStudents()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student Management"
        title="Import Students"
        description="Import CSV or Excel-compatible student files with validation, duplicate detection, preview, error reporting, and rollback-safe bulk insert."
        actions={
          <Button asChild type="button" variant="glass">
            <Link to="/students">Back to List</Link>
          </Button>
        }
      />

      {isLoading ? <Skeleton className="h-[620px] w-full" /> : <StudentImportWorkflow existingStudents={data?.items ?? []} />}
    </div>
  )
}
