import { Link, useParams } from 'react-router-dom'

import { PageHeader } from '@/components/molecules/page-header'
import { CourseForm } from '@/components/organisms/course-form'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCourse } from '@/hooks/use-courses'

export function EditCoursePage() {
  const { courseId } = useParams()
  const { data: course, isLoading } = useCourse(courseId)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Course Management"
        title="Edit Course"
        description="Update the dummy course catalog record and operational metadata."
        actions={
          <Button asChild type="button" variant="glass">
            <Link to="/courses">Back to List</Link>
          </Button>
        }
      />
      {isLoading ? <Skeleton className="h-[560px] w-full" /> : <CourseForm mode="edit" course={course} />}
    </div>
  )
}
