import { Link, useParams } from 'react-router-dom'

import { PageHeader } from '@/components/molecules/page-header'
import { CourseForm } from '@/components/organisms/course-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getCourseErrorMessage, useCourse } from '@/hooks/use-courses'

export function EditCoursePage() {
  const { courseId } = useParams()
  const { data: course, error, isError, isLoading } = useCourse(courseId)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Course Management"
        title="Edit Course"
        description="Update course catalog details, enrollment, capacity, and operational metadata."
        actions={
          <Button asChild type="button" variant="glass">
            <Link to="/courses">Back to List</Link>
          </Button>
        }
      />
      {isLoading ? <Skeleton className="h-[560px] w-full" /> : null}
      {isError ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg font-bold text-foreground">Unable to load course</p>
            <p className="mt-2 text-sm text-muted-foreground">{getCourseErrorMessage(error)}</p>
          </CardContent>
        </Card>
      ) : null}
      {!isLoading && course ? <CourseForm mode="edit" course={course} /> : null}
    </div>
  )
}
