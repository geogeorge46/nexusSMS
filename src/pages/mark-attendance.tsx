import { useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/molecules/page-header'
import { MarkAttendanceRoster } from '@/components/organisms/mark-attendance-roster'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getAttendanceErrorMessage, useAttendance } from '@/hooks/use-attendance'
import { useCourses } from '@/hooks/use-courses'
import { useStudents } from '@/hooks/use-students'

const today = new Date().toISOString().slice(0, 10)

export function MarkAttendancePage() {
  const [course, setCourse] = useState('All')
  const [student, setStudent] = useState('')
  const [department, setDepartment] = useState('All')
  const [date, setDate] = useState(today)
  const attendance = useAttendance({
    date,
    course,
    student,
    department,
    status: 'All',
  })
  const courses = useCourses({
    search: '',
    status: 'Active',
    department: 'All',
    page: 1,
    limit: 50,
  })
  const students = useStudents({
    search: '',
    status: 'All',
    department,
    page: 1,
    limit: 50,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Attendance"
        title="Mark Attendance"
        description="Record daily attendance with fast status controls and a clean roster workflow."
        actions={
          <Button asChild type="button" variant="glass">
            <Link to="/attendance">Back to Dashboard</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Session Filters</CardTitle>
          <CardDescription>Select a class session before marking the roster.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Select
            label="Course"
            onChange={setCourse}
            options={[
              { label: 'Select Course', value: 'All' },
              ...(courses.data?.items ?? []).map((item) => ({ label: item.title, value: item.id })),
            ]}
            value={course}
          />
          <Select
            label="Student"
            onChange={setStudent}
            options={[
              { label: 'All Students', value: '' },
              ...(students.data?.items ?? []).map((item) => ({ label: item.name, value: item.id })),
            ]}
            value={student}
          />
          <Select
            label="Department"
            onChange={setDepartment}
            options={['All', 'Engineering', 'Science', 'Business', 'Arts', 'Humanities'].map((value) => ({
              label: value === 'All' ? 'All Departments' : value,
              value,
            }))}
            value={department}
          />
          <label className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Date</span>
            <input
              className="h-12 w-full rounded-[18px] border border-border bg-background/75 px-4 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-ring"
              onChange={(event) => setDate(event.target.value)}
              type="date"
              value={date}
            />
          </label>
        </CardContent>
      </Card>

      {attendance.isError ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg font-bold text-foreground">Unable to load attendance roster</p>
            <p className="mt-2 text-sm text-muted-foreground">{getAttendanceErrorMessage(attendance.error)}</p>
          </CardContent>
        </Card>
      ) : (
        <MarkAttendanceRoster
          courseId={course}
          data={attendance.data}
          date={date}
          isLoading={attendance.isLoading || courses.isLoading || students.isLoading}
        />
      )}
    </div>
  )
}

function Select({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ label: string; value: string }>
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <select
        className="h-12 w-full rounded-[18px] border border-border bg-background/75 px-4 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-ring"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}
