import { Link, useParams } from 'react-router-dom'

import { PageHeader } from '@/components/molecules/page-header'
import { StudentForm } from '@/components/organisms/student-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getStudentErrorMessage, useStudent } from '@/hooks/use-students'

export function EditStudentPage() {
  const { studentId } = useParams()
  const { data: student, error, isError, isLoading } = useStudent(studentId)

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
      {isLoading ? <Skeleton className="h-[520px] w-full" /> : null}
      {isError ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg font-bold text-foreground">Unable to load student</p>
            <p className="mt-2 text-sm text-muted-foreground">{getStudentErrorMessage(error)}</p>
          </CardContent>
        </Card>
      ) : null}
      {!isLoading && student ? <StudentForm mode="edit" student={student} /> : null}
    </div>
  )
}
