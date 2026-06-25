import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { CapacityIndicator } from '@/components/molecules/capacity-indicator'
import { CourseStatusChip } from '@/components/molecules/course-status-chip'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { getCourseErrorMessage, useDeleteCourse, type Course, type CourseFilters } from '@/hooks/use-courses'

const allStatuses = ['All', 'Active', 'Inactive']
const allDepartments = ['All', 'Engineering', 'Science', 'Business', 'Arts', 'Humanities']

export function CourseTable({
  courses = [],
  filters,
  isFetching,
  isLoading,
  onFiltersChange,
  onPageChange,
  pagination,
}: {
  courses?: Course[]
  filters: CourseFilters
  isFetching: boolean
  isLoading: boolean
  onFiltersChange: (filters: Partial<CourseFilters>) => void
  onPageChange: (page: number) => void
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}) {
  const currentPage = pagination?.page ?? filters.page
  const pageCount = pagination?.pages ?? 1
  const total = pagination?.total ?? 0

  function updateQuery(value: string) {
    onFiltersChange({ search: value })
  }

  function updateStatus(value: string) {
    onFiltersChange({ status: value })
  }

  function updateDepartment(value: string) {
    onFiltersChange({ department: value })
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Course List</CardTitle>
            <CardDescription>Search, filter, paginate, and manage course catalog records.</CardDescription>
          </div>
          <Button type="button" variant="glass">
            <Download />
            Export
          </Button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
          <label className="relative">
            <span className="sr-only">Search courses</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-12 w-full rounded-[18px] border border-border bg-background/75 pl-11 pr-4 text-sm font-medium outline-none transition focus:ring-2 focus:ring-ring"
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Search course, code, faculty, department..."
              type="search"
              value={filters.search}
            />
          </label>
          <FilterSelect label="Status" onChange={updateStatus} options={allStatuses} value={filters.status} />
          <FilterSelect
            label="Department"
            onChange={updateDepartment}
            options={allDepartments}
            value={filters.department}
          />
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <CourseTableSkeleton />
        ) : (
          <>
            <DesktopTable courses={courses} />
            <MobileCards courses={courses} />
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {isFetching ? 'Refreshing courses...' : `Showing ${courses.length} of ${total} courses`}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  disabled={currentPage === 1}
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  size="sm"
                  type="button"
                  variant="glass"
                >
                  <ChevronLeft />
                  Previous
                </Button>
                <span className="rounded-full border border-border bg-muted px-3 py-1 text-sm font-bold text-foreground">
                  {currentPage} / {pageCount}
                </span>
                <Button
                  disabled={currentPage === pageCount}
                  onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
                  size="sm"
                  type="button"
                  variant="glass"
                >
                  Next
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function FilterSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <select
        className="h-12 w-full appearance-none rounded-[18px] border border-border bg-background/75 pl-11 pr-4 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-ring"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

function DesktopTable({ courses }: { courses: Course[] }) {
  return (
    <div className="hidden overflow-hidden rounded-[20px] border border-border/70 xl:block">
      <table className="w-full border-collapse text-left">
        <thead className="bg-muted/60 text-xs font-bold uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Course</th>
            <th className="px-4 py-3">Faculty</th>
            <th className="px-4 py-3">Credits</th>
            <th className="px-4 py-3">Enrollment</th>
            <th className="px-4 py-3">Capacity</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {courses.map((course) => (
            <tr key={course.id} className="bg-background/40 transition hover:bg-muted/35">
              <td className="px-4 py-4">
                <CourseIdentity course={course} />
              </td>
              <td className="px-4 py-4 text-sm font-semibold text-foreground">{course.faculty}</td>
              <td className="px-4 py-4 text-sm font-bold text-foreground">{course.credits}</td>
              <td className="px-4 py-4 text-sm font-bold text-foreground">{course.enrolled}</td>
              <td className="w-44 px-4 py-4">
                <CapacityIndicator compact enrolled={course.enrolled} capacity={course.capacity} />
              </td>
              <td className="px-4 py-4">
                <CourseStatusChip status={course.status} />
              </td>
              <td className="px-4 py-4 text-right">
                <CourseActions course={course} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {courses.length === 0 && <EmptyState />}
    </div>
  )
}

function MobileCards({ courses }: { courses: Course[] }) {
  return (
    <div className="grid gap-3 xl:hidden">
      {courses.map((course) => (
        <div key={course.id} className="rounded-[20px] border border-border/70 bg-background/50 p-4">
          <div className="flex items-start justify-between gap-3">
            <CourseIdentity course={course} />
            <CourseActions course={course} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <MobileFact label="Faculty" value={course.faculty} />
            <MobileFact label="Credits" value={String(course.credits)} />
            <MobileFact label="Enrollment" value={String(course.enrolled)} />
            <MobileFact label="Room" value={course.room} />
          </div>
          <div className="mt-4 grid gap-3">
            <CapacityIndicator enrolled={course.enrolled} capacity={course.capacity} />
            <CourseStatusChip status={course.status} />
          </div>
        </div>
      ))}
      {courses.length === 0 && <EmptyState />}
    </div>
  )
}

function CourseIdentity({ course }: { course: Course }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-bold text-foreground">{course.title}</p>
      <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
        {course.code} - {course.department}
      </p>
      <p className="mt-1 text-xs font-bold text-primary">{course.id}</p>
    </div>
  )
}

function CourseActions({ course }: { course: Course }) {
  const deleteCourse = useDeleteCourse()

  async function handleDelete() {
    const confirmed = window.confirm(`Delete ${course.title}? This action cannot be undone.`)
    if (!confirmed) return

    try {
      await deleteCourse.mutateAsync(course.id)
    } catch (caught) {
      window.alert(getCourseErrorMessage(caught))
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={`Open actions for ${course.title}`} size="icon" type="button" variant="ghost">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to={`/courses/${course.id}`}>
            <Eye className="size-4" />
            View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/courses/${course.id}/edit`}>
            <Pencil className="size-4" />
            Edit Course
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={deleteCourse.isPending} onClick={() => void handleDelete()}>
          <Trash2 className="size-4" />
          Delete Course
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MobileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/45 p-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-foreground">{value}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="p-8 text-center">
      <p className="text-sm font-bold text-foreground">No courses found</p>
      <p className="mt-1 text-sm text-muted-foreground">Adjust search or filters to widen the course list.</p>
    </div>
  )
}

function CourseTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 7 }).map((_, index) => (
        <Skeleton key={index} className="h-20 w-full" />
      ))}
    </div>
  )
}
