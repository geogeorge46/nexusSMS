import { Bell, FileArchive, GraduationCap, UsersRound } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getParentPortalErrorMessage,
  parentLabel,
  useMarkParentNotificationRead,
  useParentChildResource,
  useParentNotifications,
  useParentStudents,
  type ParentStudent,
} from '@/hooks/use-parent-portal'

type ResourceConfig = {
  title: string
  badge: string
  resource: string
  description: string
}

export function ParentDashboardPage() {
  const students = useParentStudents()
  const first = students.data?.items[0]
  const attendance = useParentChildResource(first?.id ?? '', 'attendance')
  const fees = useParentChildResource(first?.id ?? '', 'fees')
  const assignments = useParentChildResource(first?.id ?? '', 'assignments')

  return (
    <div className="space-y-5">
      <GlassCard className="overflow-hidden p-0">
        <div className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
          <div>
            <Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">Parent Portal</Badge>
            <h1 className="text-3xl font-bold tracking-normal text-foreground">Family Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">A read-only view of linked student academics, fees, documents, assignments, and updates.</p>
          </div>
          <div className="rounded-[18px] border border-border/70 bg-muted/35 p-4">
            <p className="text-sm font-semibold text-muted-foreground">Selected child</p>
            <p className="mt-2 text-xl font-bold text-foreground">{first?.name ?? 'No linked child'}</p>
            <p className="mt-1 text-sm text-muted-foreground">{first?.program ?? 'Contact the office to link a student.'}</p>
          </div>
        </div>
      </GlassCard>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Summary label="Linked Children" value={String(students.data?.items.length ?? 0)} isLoading={students.isLoading} />
        <Summary label="Attendance" value={`${attendance.data?.summary?.average ?? 0}%`} isLoading={attendance.isLoading} progress={attendance.data?.summary?.average ?? 0} />
        <Summary label="Fee Records" value={String(fees.data?.items?.length ?? 0)} isLoading={fees.isLoading} />
        <Summary label="Assignments" value={String(assignments.data?.items?.length ?? 0)} isLoading={assignments.isLoading} />
      </section>
      <ChildrenList students={students.data?.items ?? []} isLoading={students.isLoading} />
    </div>
  )
}

export function ParentChildrenPage() {
  const students = useParentStudents()
  return (
    <div className="space-y-5">
      <PageIntro badge="My Children" title="Linked Students" description="Only students linked to your parent profile are visible." />
      <ChildrenList students={students.data?.items ?? []} isLoading={students.isLoading} />
    </div>
  )
}

export function ParentAttendancePage() {
  return <ResourcePage config={{ title: 'Child Attendance', badge: 'Attendance', resource: 'attendance', description: 'Attendance summary and class history.' }} />
}

export function ParentGradesPage() {
  const students = useParentStudents()
  const [selectedId, setSelectedId] = useState('')
  const selectedStudentId = selectedId || students.data?.items[0]?.id || ''
  const grades = useParentChildResource(selectedStudentId, 'grades')
  const results = useParentChildResource(selectedStudentId, 'results')

  return (
    <div className="space-y-5">
      <PageIntro badge="Grades" title="Child Grades & Results" description="Class grades and published exam results for the selected child." />
      <ChildSelector students={students.data?.items ?? []} selectedId={selectedStudentId} onChange={setSelectedId} />
      <ResourceSection title="Grade Records" resource="grades" query={grades} />
      <ResourceSection title="Published Exam Results" resource="results" query={results} />
    </div>
  )
}

export function ParentFeesPage() {
  return <ResourcePage config={{ title: 'Child Fees', badge: 'Fees', resource: 'fees', description: 'Assigned fees, paid amount, due amount, and receipts context.' }} />
}

export function ParentAssignmentsPage() {
  return <ResourcePage config={{ title: 'Child Assignments', badge: 'Assignments', resource: 'assignments', description: 'Published assignments for enrolled courses.' }} />
}

export function ParentTimetablePage() {
  return <ResourcePage config={{ title: 'Child Timetable', badge: 'Timetable', resource: 'timetable', description: 'Weekly classes from approved timetable slots.' }} />
}

export function ParentDocumentsPage() {
  return <ResourcePage config={{ title: 'Child Documents', badge: 'Documents', resource: 'documents', description: 'Student documents available to parents as read-only records.' }} />
}

export function ParentNotificationsPage() {
  const notifications = useParentNotifications()
  const markRead = useMarkParentNotificationRead()
  return (
    <div className="space-y-5">
      <PageIntro badge="Notifications" title="Parent Notifications" description="Updates sent to your parent account." />
      <GlassCard className="p-5">
        {notifications.isLoading ? <Skeleton className="h-40" /> : (
          <div className="space-y-3">
            {(notifications.data?.items ?? []).map((item: { id?: string; _id?: string; title: string; message: string; isRead?: boolean }) => (
              <div className="rounded-[16px] border border-border/70 bg-muted/35 p-4" key={item.id ?? item._id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="font-bold">{item.title}</p><p className="text-sm text-muted-foreground">{item.message}</p></div>
                  {!item.isRead && <Button onClick={() => void markRead.mutateAsync(String(item.id ?? item._id))} size="sm" variant="glass"><Bell />Read</Button>}
                </div>
              </div>
            ))}
            {(notifications.data?.items ?? []).length === 0 && <Empty message="No notifications yet." />}
          </div>
        )}
      </GlassCard>
    </div>
  )
}

function ResourcePage({ config }: { config: ResourceConfig }) {
  const students = useParentStudents()
  const [selectedId, setSelectedId] = useState('')
  const selectedStudentId = selectedId || students.data?.items[0]?.id || ''
  const resource = useParentChildResource(selectedStudentId, config.resource)
  const records = normalizeRecords(resource.data, config.resource)

  return (
    <div className="space-y-5">
      <PageIntro badge={config.badge} title={config.title} description={config.description} />
      <ChildSelector students={students.data?.items ?? []} selectedId={selectedStudentId} onChange={setSelectedId} />
      {resource.isError && <p className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-semibold text-rose-700">{getParentPortalErrorMessage(resource.error)}</p>}
      {resource.isLoading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton className="h-24" key={index} />)}</div> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {records.length ? records.map((record, index) => <RecordCard key={String(record.id ?? record._id ?? index)} record={record} />) : <Empty message="No records available." />}
        </div>
      )}
    </div>
  )
}

function ResourceSection({ title, resource, query }: { title: string; resource: string; query: ReturnType<typeof useParentChildResource> }) {
  const records = normalizeRecords(query.data, resource)
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold tracking-normal text-foreground">{title}</h2>
      {query.isError && <p className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-semibold text-rose-700">{getParentPortalErrorMessage(query.error)}</p>}
      {query.isLoading ? <div className="space-y-3">{Array.from({ length: 3 }).map((_, index) => <Skeleton className="h-24" key={index} />)}</div> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {records.length ? records.map((record, index) => <RecordCard key={String(record.id ?? record._id ?? index)} record={record} />) : <Empty message="No records available." />}
        </div>
      )}
    </section>
  )
}

function ChildSelector({ students, selectedId, onChange }: { students: ParentStudent[]; selectedId: string; onChange: (id: string) => void }) {
  if (!students.length) return <Empty message="No linked students found." />

  return (
    <GlassCard className="p-4">
      <label className="space-y-2">
        <span className="text-sm font-semibold">Selected child</span>
        <select className="h-11 w-full rounded-[16px] border border-border bg-background/75 px-3 text-sm outline-none focus:ring-2 focus:ring-ring" value={selectedId} onChange={(event) => onChange(event.target.value)}>
          {students.map((student) => <option key={student.id} value={student.id}>{student.name} ({student.registerNumber})</option>)}
        </select>
      </label>
    </GlassCard>
  )
}

function ChildrenList({ students, isLoading }: { students: ParentStudent[]; isLoading: boolean }) {
  if (isLoading) return <Skeleton className="h-48" />
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {students.map((student) => (
        <GlassCard className="p-5" key={student.id}>
          <UsersRound className="mb-3 size-7 text-primary" />
          <p className="text-lg font-bold">{student.name}</p>
          <p className="text-sm text-muted-foreground">{student.registerNumber}</p>
          <p className="mt-2 text-sm text-muted-foreground">{student.program} - {student.batch || student.year}</p>
          <Badge className="mt-3">{student.status}</Badge>
        </GlassCard>
      ))}
      {students.length === 0 && <Empty message="No linked students found." />}
    </div>
  )
}

function RecordCard({ record }: { record: Record<string, unknown> }) {
  const title = parentLabel(record.assignmentId) !== '-' ? parentLabel(record.assignmentId) : parentLabel(record.courseId, 'title') !== '-' ? parentLabel(record.courseId, 'title') : parentLabel(record)
  const status = String(record.status ?? record.resultStatus ?? record.gradeLetter ?? record.documentType ?? record.materialType ?? '')
  return (
    <GlassCard className="p-5">
      <GraduationCap className="mb-3 size-7 text-primary" />
      <p className="font-bold">{title}</p>
      {status && <Badge className="mt-3">{status}</Badge>}
      <dl className="mt-3 space-y-1 text-sm text-muted-foreground">
        {Object.entries(record).slice(0, 6).map(([key, value]) => (
          <div className="flex justify-between gap-3" key={key}>
            <dt className="capitalize">{key.replace(/Id$/, '').replace(/[A-Z]/g, ' $&')}</dt>
            <dd className="truncate font-medium text-foreground">{formatValue(value)}</dd>
          </div>
        ))}
      </dl>
    </GlassCard>
  )
}

function Summary({ label, value, isLoading, progress }: { label: string; value: string; isLoading?: boolean; progress?: number }) {
  if (isLoading) return <Skeleton className="h-28" />
  return (
    <GlassCard className="p-5">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {typeof progress === 'number' && (
        <div className="mt-4 h-2 rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      )}
    </GlassCard>
  )
}

function PageIntro({ badge, title, description }: { badge: string; title: string; description: string }) {
  return <GlassCard className="p-6"><Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">{badge}</Badge><h1 className="text-3xl font-bold tracking-normal text-foreground">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p></GlassCard>
}

function Empty({ message }: { message: string }) {
  return <GlassCard className="p-8 text-center"><FileArchive className="mx-auto mb-3 size-8 text-primary" /><p className="text-sm font-semibold text-muted-foreground">{message}</p></GlassCard>
}

function normalizeRecords(data: unknown, resource: string): Array<Record<string, unknown>> {
  const value = data as Record<string, unknown> | undefined
  if (!value) return []
  if (resource === 'profile' && value.student) return [value.student as Record<string, unknown>]
  if (Array.isArray(value.items)) return value.items as Array<Record<string, unknown>>
  if (Array.isArray(value.history)) return value.history as Array<Record<string, unknown>>
  if (Array.isArray(value.grades)) return value.grades as Array<Record<string, unknown>>
  if (Array.isArray(value.documents)) return value.documents as Array<Record<string, unknown>>
  return []
}

function formatValue(value: unknown) {
  if (value instanceof Date) return value.toLocaleDateString()
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return new Date(value).toLocaleDateString()
  if (value && typeof value === 'object') return parentLabel(value)
  return String(value ?? '-')
}
