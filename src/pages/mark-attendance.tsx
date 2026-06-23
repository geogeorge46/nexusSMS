import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/molecules/page-header'
import { MarkAttendanceRoster } from '@/components/organisms/mark-attendance-roster'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAttendance } from '@/hooks/use-attendance'

export function MarkAttendancePage() {
  const { data, isLoading } = useAttendance()

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
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Select label="Course" options={['All Courses', 'Advanced Data Structures', 'Robotics Control Lab', 'Biomedical Research Methods']} />
          <Select label="Grade" options={['All Grades', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']} />
          <Select label="Date" options={['2026-06-19', '2026-06-18', '2026-06-17']} />
        </CardContent>
      </Card>

      <MarkAttendanceRoster data={data} isLoading={isLoading} />
    </div>
  )
}

function Select({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <select className="h-12 w-full rounded-[18px] border border-border bg-background/75 px-4 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-ring">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}
