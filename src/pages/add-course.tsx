import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/molecules/page-header'
import { CourseForm } from '@/components/organisms/course-form'
import { Button } from '@/components/ui/button'

export function AddCoursePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Course Management"
        title="Add Course"
        description="Create a new course record with faculty, credits, capacity, schedule, and status metadata."
        actions={
          <Button asChild type="button" variant="glass">
            <Link to="/courses">Back to List</Link>
          </Button>
        }
      />
      <CourseForm mode="add" />
    </div>
  )
}
