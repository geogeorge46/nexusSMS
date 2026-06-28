import { ArrowUpDown, ChevronLeft, ChevronRight, Download, Eye, MoreHorizontal, Pencil, Search, SlidersHorizontal, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { StudentAvatar } from '@/components/molecules/student-avatar'
import { StudentStatusBadge } from '@/components/molecules/student-status-badge'
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
import { getStudentErrorMessage, useDeleteStudent, type Student, type StudentFilters } from '@/hooks/use-students'

const allStatuses = ['All', 'Active', 'Pending', 'Review', 'Inactive']
const allDepartments = ['All', 'Engineering', 'Science', 'Business', 'Arts', 'Humanities']
type SortKey = 'name' | 'program' | 'department' | 'attendance' | 'gpa' | 'status'
type SortDirection = 'asc' | 'desc'

export function StudentTable({
  filters,
  students = [],
  isLoading,
  isFetching,
  onFiltersChange,
  onPageChange,
  pagination,
  canManageStudents,
  canDeleteStudents,
}: {
  filters: StudentFilters
  students?: Student[]
  isLoading: boolean
  isFetching: boolean
  onFiltersChange: (filters: Partial<StudentFilters>) => void
  onPageChange: (page: number) => void
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  canManageStudents: boolean
  canDeleteStudents: boolean
}) {
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'name', direction: 'asc' })
  const currentPage = pagination?.page ?? filters.page
  const pageCount = pagination?.pages ?? 1
  const total = pagination?.total ?? 0
  const visibleStudents = useMemo(() => sortStudents(students, sort.key, sort.direction), [students, sort])

  function updateSort(key: SortKey) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

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
            <CardTitle>Student List</CardTitle>
            <CardDescription>Search, filter, paginate, review, and manage student records.</CardDescription>
          </div>
          <Button type="button" variant="glass">
            <Download />
            Export
          </Button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
          <label className="relative">
            <span className="sr-only">Search students</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-12 w-full rounded-[18px] border border-border bg-background/75 pl-11 pr-4 text-sm font-medium outline-none transition focus:ring-2 focus:ring-ring"
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Search name, email, ID, program..."
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
          <StudentTableSkeleton />
        ) : (
          <>
            <DesktopTable students={visibleStudents} canManageStudents={canManageStudents} canDeleteStudents={canDeleteStudents} sort={sort} onSort={updateSort} />
            <MobileCards students={visibleStudents} canManageStudents={canManageStudents} canDeleteStudents={canDeleteStudents} />
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {isFetching ? 'Refreshing students...' : `Showing ${visibleStudents.length} of ${total} students`}
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

function DesktopTable({
  students,
  canManageStudents,
  canDeleteStudents,
  sort,
  onSort,
}: {
  students: Student[]
  canManageStudents: boolean
  canDeleteStudents: boolean
  sort: { key: SortKey; direction: SortDirection }
  onSort: (key: SortKey) => void
}) {
  return (
    <div className="hidden overflow-hidden rounded-[20px] border border-border/70 lg:block">
      <table className="w-full border-collapse text-left">
        <thead className="bg-muted/60 text-xs font-bold uppercase text-muted-foreground">
          <tr>
            <SortableHeader label="Student" sortKey="name" sort={sort} onSort={onSort} />
            <SortableHeader label="Program" sortKey="program" sort={sort} onSort={onSort} />
            <SortableHeader label="Department" sortKey="department" sort={sort} onSort={onSort} />
            <SortableHeader label="Attendance" sortKey="attendance" sort={sort} onSort={onSort} />
            <SortableHeader label="GPA" sortKey="gpa" sort={sort} onSort={onSort} />
            <SortableHeader label="Status" sortKey="status" sort={sort} onSort={onSort} />
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {students.map((student) => (
            <tr key={student.id} className="bg-background/40 transition hover:bg-muted/35">
              <td className="px-4 py-4">
                <StudentIdentity student={student} />
              </td>
              <td className="px-4 py-4 text-sm font-semibold text-foreground">{student.program}</td>
              <td className="px-4 py-4 text-sm font-medium text-muted-foreground">{student.department}</td>
              <td className="px-4 py-4 text-sm font-bold text-foreground">{student.attendance}%</td>
              <td className="px-4 py-4 text-sm font-bold text-foreground">{student.gpa.toFixed(2)}</td>
              <td className="px-4 py-4">
                <StudentStatusBadge status={student.status} />
              </td>
              <td className="px-4 py-4 text-right">
                <StudentActions student={student} canManageStudents={canManageStudents} canDeleteStudents={canDeleteStudents} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {students.length === 0 && <EmptyState />}
    </div>
  )
}

function SortableHeader({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string
  sortKey: SortKey
  sort: { key: SortKey; direction: SortDirection }
  onSort: (key: SortKey) => void
}) {
  const active = sort.key === sortKey
  return (
    <th className="px-4 py-3">
      <button className="inline-flex items-center gap-1 rounded-lg text-xs font-bold uppercase text-muted-foreground transition hover:text-foreground" onClick={() => onSort(sortKey)} type="button">
        {label}
        <ArrowUpDown className={active ? 'size-3 text-primary' : 'size-3'} />
        <span className="sr-only">{active ? `sorted ${sort.direction}` : 'sort column'}</span>
      </button>
    </th>
  )
}

function MobileCards({ students, canManageStudents, canDeleteStudents }: { students: Student[]; canManageStudents: boolean; canDeleteStudents: boolean }) {
  return (
    <div className="grid gap-3 lg:hidden">
      {students.map((student) => (
        <div key={student.id} className="rounded-[20px] border border-border/70 bg-background/50 p-4">
          <div className="flex items-start justify-between gap-3">
            <StudentIdentity student={student} />
            <StudentActions student={student} canManageStudents={canManageStudents} canDeleteStudents={canDeleteStudents} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <MobileFact label="Program" value={student.program} />
            <MobileFact label="Department" value={student.department} />
            <MobileFact label="Attendance" value={`${student.attendance}%`} />
            <MobileFact label="GPA" value={student.gpa.toFixed(2)} />
          </div>
          <div className="mt-4">
            <StudentStatusBadge status={student.status} />
          </div>
        </div>
      ))}
      {students.length === 0 && <EmptyState />}
    </div>
  )
}

function StudentIdentity({ student }: { student: Student }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <StudentAvatar name={student.name} />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-foreground">{student.name}</p>
        <p className="truncate text-xs font-medium text-muted-foreground">{student.email}</p>
        <p className="mt-1 text-xs font-bold text-primary">{student.id}</p>
      </div>
    </div>
  )
}

function StudentActions({ student, canManageStudents, canDeleteStudents }: { student: Student; canManageStudents: boolean; canDeleteStudents: boolean }) {
  const deleteStudent = useDeleteStudent()

  async function handleDelete() {
    const confirmed = window.confirm(`Delete ${student.name}? This action cannot be undone.`)
    if (!confirmed) return

    try {
      await deleteStudent.mutateAsync(student.id)
    } catch (caught) {
      window.alert(getStudentErrorMessage(caught))
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={`Open actions for ${student.name}`} size="icon" type="button" variant="ghost">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to={`/students/${student.id}`}>
            <Eye className="size-4" />
            View Profile
          </Link>
        </DropdownMenuItem>
        {canManageStudents && (
          <>
            <DropdownMenuItem asChild>
              <Link to={`/students/${student.id}/edit`}>
                <Pencil className="size-4" />
                Edit Student
              </Link>
            </DropdownMenuItem>
            {canDeleteStudents && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={deleteStudent.isPending} onClick={() => void handleDelete()}>
                  <Trash2 className="size-4" />
                  Delete Student
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
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
      <p className="text-sm font-bold text-foreground">No students found</p>
      <p className="mt-1 text-sm text-muted-foreground">Adjust search or filters to widen the result set.</p>
    </div>
  )
}

function StudentTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-20 w-full" />
      ))}
    </div>
  )
}

function sortStudents(students: Student[], key: SortKey, direction: SortDirection) {
  const multiplier = direction === 'asc' ? 1 : -1
  return [...students].sort((a, b) => {
    const aValue = a[key]
    const bValue = b[key]
    if (typeof aValue === 'number' && typeof bValue === 'number') return (aValue - bValue) * multiplier
    return String(aValue ?? '').localeCompare(String(bValue ?? '')) * multiplier
  })
}
