import { Link, useParams } from 'react-router-dom'

import { PageHeader } from '@/components/molecules/page-header'
import { StudentForm } from '@/components/organisms/student-form'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useStudent } from '@/hooks/use-students'

export function EditStudentPage() {
  const { studentId } = useParams()
  const { data: student, isLoading } = useStudent(studentId)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student Management"
        title="Edit Student"
        description="Update the dummy student profile details and academic metadata."
        actions={
          <Button asChild type="button" variant="glass">
            <Link to="/students">Back to List</Link>
          </Button>
        }
      />
      {isLoading ? <Skeleton className="h-[520px] w-full" /> : <StudentForm mode="edit" student={student} />}
    </div>
  )
}
