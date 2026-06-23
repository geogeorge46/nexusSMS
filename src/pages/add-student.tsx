import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/molecules/page-header'
import { StudentForm } from '@/components/organisms/student-form'
import { Button } from '@/components/ui/button'

export function AddStudentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student Management"
        title="Add Student"
        description="Create a new dummy student record using the reusable student form scaffold."
        actions={
          <Button asChild type="button" variant="glass">
            <Link to="/students">Back to List</Link>
          </Button>
        }
      />
      <StudentForm mode="add" />
    </div>
  )
}
