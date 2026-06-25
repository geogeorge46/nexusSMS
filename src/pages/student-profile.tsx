import { CalendarDays, Mail, MapPin, Phone, UserRoundPen, type LucideIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { StudentAvatar } from '@/components/molecules/student-avatar'
import { PageHeader } from '@/components/molecules/page-header'
import { StudentStatusBadge } from '@/components/molecules/student-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getStudentErrorMessage, useStudent } from '@/hooks/use-students'

export function StudentProfilePage() {
  const { studentId } = useParams()
  const { data: student, error, isError, isLoading } = useStudent(studentId)

  if (isLoading) {
    return <Skeleton className="h-[620px] w-full" />
  }

  if (isError || !student) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-lg font-bold text-foreground">{isError ? 'Unable to load student' : 'Student not found'}</p>
          {isError && <p className="mt-2 text-sm text-muted-foreground">{getStudentErrorMessage(error)}</p>}
          <Button asChild className="mt-5">
            <Link to="/students">Return to Students</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student Profile"
        title={student.name}
        description={`${student.program} student in ${student.department}.`}
        actions={
          <Button asChild type="button">
            <Link to={`/students/${student.id}/edit`}>
              <UserRoundPen />
              Edit Student
            </Link>
          </Button>
        }
      />

      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <StudentAvatar className="size-16" name={student.name} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-2xl font-bold text-foreground">{student.name}</h2>
                <StudentStatusBadge status={student.status} />
              </div>
              <p className="mt-1 text-sm font-bold text-primary">{student.id}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <ProfileMetric label="GPA" value={student.gpa.toFixed(2)} />
            <ProfileMetric label="Attendance" value={`${student.attendance}%`} />
            <ProfileMetric label="Year" value={student.year.replace('Grade ', 'G')} />
          </div>
        </div>
      </GlassCard>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <InfoItem icon={Mail} label="Email" value={student.email} />
            <InfoItem icon={Phone} label="Phone" value={student.phone} />
            <InfoItem icon={CalendarDays} label="Enrolled" value={student.enrolledAt} />
            <InfoItem icon={UserRoundPen} label="Advisor" value={student.advisor} />
            <InfoItem className="md:col-span-2" icon={MapPin} label="Address" value={student.address} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academic Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SnapshotBar label="Attendance" value={student.attendance} />
            <SnapshotBar label="GPA Strength" value={Math.round((student.gpa / 4) * 100)} />
            <SnapshotBar label="Profile Completion" value={92} />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
    </div>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: LucideIcon
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <div className="flex gap-3 rounded-[20px] border border-border/70 bg-muted/35 p-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="mt-1 break-words text-sm font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  )
}

function SnapshotBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-muted-foreground">{label}</span>
        <span className="font-bold text-foreground">{value}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
