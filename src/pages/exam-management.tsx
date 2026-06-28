import { ClipboardCheck, FileCheck2, Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { PageHeader } from '@/components/molecules/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCatalog } from '@/hooks/use-catalog'
import { useCourses } from '@/hooks/use-courses'
import {
  examLabel,
  getExamErrorMessage,
  useCreateExam,
  useCreateExamSchedule,
  useExamResults,
  useExamSchedules,
  useExams,
  useGenerateHallTickets,
  useHallTickets,
  usePublishExamResults,
  useSaveExamResult,
  useTeacherExamSchedules,
  type Exam,
  type ExamSchedule,
} from '@/hooks/use-exams'
import { useRooms } from '@/hooks/use-timetable'
import { useStudents } from '@/hooks/use-students'
import { useAuth } from '@/hooks/use-auth'
import { canManageExams, isTeacher } from '@/lib/permissions'

type ExamForm = { title: string; examType: string; academicYearId: string; programId: string; semesterId: string; status: string }
type ScheduleForm = { courseId: string; date: string; startTime: string; endTime: string; roomId: string; maxMarks: number; passingMarks: number; status: string }
type ResultForm = { scheduleId: string; studentId: string; marksObtained: number; resultStatus: string; remarks: string }

export function ExamManagementPage() {
  const { user } = useAuth()
  const canManage = canManageExams(user)
  const teacherOnly = isTeacher(user) && !canManage
  const [selectedExamId, setSelectedExamId] = useState('')
  const [message, setMessage] = useState('')

  const exams = useExams()
  const activeExamId = selectedExamId || exams.data?.items[0]?.id || ''
  const schedules = useExamSchedules(activeExamId)
  const teacherSchedules = useTeacherExamSchedules(teacherOnly)
  const tickets = useHallTickets(activeExamId)
  const results = useExamResults()
  const departments = useCatalog('departments', { status: 'Active' })
  const programs = useCatalog('programs', { status: 'Active' })
  const years = useCatalog('academicYears', { status: 'Active' })
  const semesters = useCatalog('semesters', { status: 'Active' })
  const courses = useCourses({ search: '', status: 'Active', department: 'All', page: 1, limit: 300 })
  const rooms = useRooms()
  const students = useStudents({ search: '', status: 'Active', department: 'All', page: 1, limit: 300 })

  const createExam = useCreateExam()
  const createSchedule = useCreateExamSchedule(activeExamId)
  const generateTickets = useGenerateHallTickets()
  const saveResult = useSaveExamResult()
  const publishResults = usePublishExamResults()

  const visibleSchedules = teacherOnly ? teacherSchedules.data?.items ?? [] : schedules.data?.items ?? []
  const error = [exams.error, schedules.error, teacherSchedules.error, tickets.error, results.error, createExam.error, createSchedule.error, generateTickets.error, saveResult.error, publishResults.error].find(Boolean)
  const loading = [exams, departments, programs, years, semesters, courses, rooms, students].some((query) => query.isLoading) || (teacherOnly ? teacherSchedules.isLoading : false)

  async function createExamSubmit(values: ExamForm) {
    setMessage('')
    const item = await createExam.mutateAsync(values)
    setSelectedExamId(item.id)
    setMessage('Exam created.')
  }
  async function createScheduleSubmit(values: ScheduleForm) {
    setMessage('')
    await createSchedule.mutateAsync({ ...values, maxMarks: Number(values.maxMarks), passingMarks: Number(values.passingMarks) })
    setMessage('Exam schedule created.')
  }
  async function resultSubmit(values: ResultForm) {
    setMessage('')
    await saveResult.mutateAsync({ ...values, marksObtained: Number(values.marksObtained) })
    setMessage('Result saved as draft.')
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Exams" title={teacherOnly ? 'My Exam Duties' : 'Exam Management'} description={teacherOnly ? 'Assigned exam schedules and result entry for your courses.' : 'Manage exams, schedules, hall tickets, result entry, publishing, and reports.'} />
      {message && <p className="rounded-[18px] border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{message}</p>}
      {error && <p className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-semibold text-rose-700 dark:text-rose-300">{getExamErrorMessage(error)}</p>}
      {loading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-24" />)}</div> : (
        <>
          {!teacherOnly && (
            <section className="grid gap-6 xl:grid-cols-2">
              {canManage && <ExamFormPanel academicYears={years.data?.items ?? []} programs={programs.data?.items ?? []} semesters={semesters.data?.items ?? []} onSubmit={(values) => void createExamSubmit(values)} pending={createExam.isPending} />}
              <Card>
                <CardHeader><CardTitle>Exam Selector</CardTitle><CardDescription>Choose the exam used by schedules, hall tickets, and publishing.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <Select label="Exam" value={activeExamId} onChange={(event) => setSelectedExamId(event.target.value)}>{options(exams.data?.items ?? [], 'title')}</Select>
                  <DataList items={exams.data?.items ?? []} render={(exam: Exam) => <><p className="font-bold">{exam.title}</p><p className="text-xs text-muted-foreground">{exam.examType} - {exam.status}</p></>} />
                </CardContent>
              </Card>
            </section>
          )}
          {canManage && activeExamId && <ScheduleFormPanel courses={courses.data?.items ?? []} rooms={rooms.data?.items ?? []} onSubmit={(values) => void createScheduleSubmit(values)} pending={createSchedule.isPending} />}
          <ScheduleGrid schedules={visibleSchedules} />
          <section className="grid gap-6 xl:grid-cols-2">
            <ResultPanel schedules={visibleSchedules} students={students.data?.items ?? []} onSubmit={(values) => void resultSubmit(values)} pending={saveResult.isPending} />
            {!teacherOnly && activeExamId && (
              <Card>
                <CardHeader><CardTitle>Hall Tickets & Publishing</CardTitle><CardDescription>Generate eligibility-checked tickets and publish results.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Button disabled={generateTickets.isPending} onClick={() => void generateTickets.mutateAsync(activeExamId).then(() => setMessage('Hall tickets generated.'))}><FileCheck2 />Generate Hall Tickets</Button>
                    <Button disabled={publishResults.isPending} onClick={() => void publishResults.mutateAsync(activeExamId).then(() => setMessage('Results published.'))} variant="glass"><ClipboardCheck />Publish Results</Button>
                  </div>
                  <DataList items={tickets.data?.items ?? []} render={(ticket) => <><p className="font-bold">{ticket.hallTicketNumber}</p><p className="text-xs text-muted-foreground">{examLabel(ticket.studentId, 'name')} - {ticket.status}</p>{ticket.reason && <p className="text-xs font-semibold text-rose-600">{ticket.reason}</p>}</>} />
                </CardContent>
              </Card>
            )}
          </section>
          <Records title="Results" items={results.data?.items ?? []} />
        </>
      )}
    </div>
  )
}

function ExamFormPanel({ academicYears, programs, semesters, onSubmit, pending }: { academicYears: Array<{ id: string; name?: string }>; programs: Array<{ id: string; name?: string }>; semesters: Array<{ id: string; name?: string }>; onSubmit: (values: ExamForm) => void; pending: boolean }) {
  const form = useForm<ExamForm>({ defaultValues: { title: '', examType: 'Internal', academicYearId: '', programId: '', semesterId: '', status: 'Draft' } })
  return <Card><CardHeader><CardTitle>Create Exam</CardTitle><CardDescription>Exam scope is locked to one program and semester.</CardDescription></CardHeader><CardContent><form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}><Input label="Title" {...form.register('title', { required: true })} /><Select label="Type" {...form.register('examType')}><option>Internal</option><option>Midterm</option><option>Final</option><option>Practical</option><option>Supplementary</option><option>Other</option></Select><Select label="Academic Year" {...form.register('academicYearId', { required: true })}>{options(academicYears)}</Select><Select label="Program" {...form.register('programId', { required: true })}>{options(programs)}</Select><Select label="Semester" {...form.register('semesterId', { required: true })}>{options(semesters)}</Select><Select label="Status" {...form.register('status')}><option>Draft</option><option>Scheduled</option><option>Ongoing</option><option>Completed</option><option>Published</option><option>Cancelled</option></Select><Button className="sm:col-span-2" disabled={pending}><Plus />Create Exam</Button></form></CardContent></Card>
}

function ScheduleFormPanel({ courses, rooms, onSubmit, pending }: { courses: Array<{ databaseId: string; title: string }>; rooms: Array<{ id: string; name: string; roomNumber: string; status: string }>; onSubmit: (values: ScheduleForm) => void; pending: boolean }) {
  const form = useForm<ScheduleForm>({ defaultValues: { courseId: '', date: '', startTime: '09:00', endTime: '10:00', roomId: '', maxMarks: 100, passingMarks: 40, status: 'Scheduled' } })
  return <Card><CardHeader><CardTitle>Exam Schedule</CardTitle><CardDescription>Room and course conflicts are checked by the backend.</CardDescription></CardHeader><CardContent><form className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}><Select label="Course" {...form.register('courseId', { required: true })}><option value="">Select</option>{courses.map((course) => <option key={course.databaseId} value={course.databaseId}>{course.title}</option>)}</Select><Input label="Date" type="date" {...form.register('date', { required: true })} /><Input label="Start" type="time" {...form.register('startTime', { required: true })} /><Input label="End" type="time" {...form.register('endTime', { required: true })} /><Select label="Room" {...form.register('roomId')}><option value="">No room</option>{rooms.filter((room) => room.status === 'Active').map((room) => <option key={room.id} value={room.id}>{room.name} ({room.roomNumber})</option>)}</Select><Input label="Max Marks" type="number" {...form.register('maxMarks', { valueAsNumber: true })} /><Input label="Passing Marks" type="number" {...form.register('passingMarks', { valueAsNumber: true })} /><Select label="Status" {...form.register('status')}><option>Scheduled</option><option>Ongoing</option><option>Completed</option><option>Cancelled</option></Select><Button className="xl:col-span-4" disabled={pending}><Plus />Create Schedule</Button></form></CardContent></Card>
}

function ResultPanel({ schedules, students, onSubmit, pending }: { schedules: ExamSchedule[]; students: Array<{ databaseId: string; name: string }>; onSubmit: (values: ResultForm) => void; pending: boolean }) {
  const form = useForm<ResultForm>({ defaultValues: { scheduleId: '', studentId: '', marksObtained: 0, resultStatus: 'Pass', remarks: '' } })
  return <Card><CardHeader><CardTitle>Result Entry</CardTitle><CardDescription>Teachers can save results only for assigned course schedules.</CardDescription></CardHeader><CardContent><form className="grid gap-3" onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}><Select label="Schedule" {...form.register('scheduleId', { required: true })}><option value="">Select</option>{schedules.map((schedule) => <option key={schedule.id} value={schedule.id}>{examLabel(schedule.courseId, 'title')} - {new Date(schedule.date).toLocaleDateString()}</option>)}</Select><Select label="Student" {...form.register('studentId', { required: true })}><option value="">Select</option>{students.map((student) => <option key={student.databaseId} value={student.databaseId}>{student.name}</option>)}</Select><Input label="Marks" type="number" {...form.register('marksObtained', { valueAsNumber: true })} /><Select label="Status" {...form.register('resultStatus')}><option>Pass</option><option>Fail</option><option>Absent</option><option>Withheld</option></Select><Input label="Remarks" {...form.register('remarks')} /><Button disabled={pending}><ClipboardCheck />Save Result</Button></form></CardContent></Card>
}

function ScheduleGrid({ schedules }: { schedules: ExamSchedule[] }) {
  return <GlassCard className="p-5"><h2 className="text-xl font-bold">Exam Schedules</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{schedules.length ? schedules.map((schedule) => <article className="rounded-[16px] border border-border/70 bg-muted/35 p-4" key={schedule.id}><Badge>{schedule.status}</Badge><p className="mt-3 font-bold">{examLabel(schedule.courseId, 'title')}</p><p className="text-sm text-muted-foreground">{new Date(schedule.date).toLocaleDateString()} - {schedule.startTime} to {schedule.endTime}</p><p className="text-sm text-muted-foreground">{examLabel(schedule.roomId, 'name')}</p></article>) : <p className="text-sm text-muted-foreground">No schedules yet.</p>}</div></GlassCard>
}

function Records({ title, items }: { title: string; items: Array<Record<string, unknown> & { id: string }> }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{items.length} records</CardDescription></CardHeader><CardContent><DataList items={items} render={(item) => <><p className="font-bold">{examLabel(item.studentId, 'name')} - {examLabel(item.courseId, 'title')}</p><p className="text-xs text-muted-foreground">{String(item.marksObtained ?? '-')} / {String(item.maxMarks ?? '-')} - {String(item.gradeLetter ?? '-')} - {String(item.resultStatus ?? '-')}</p></>} /></CardContent></Card>
}

function DataList<T extends { id: string }>({ items, render }: { items: T[]; render: (item: T) => React.ReactNode }) {
  return <div className="divide-y divide-border/70 overflow-hidden rounded-[18px] border border-border/70">{items.map((item) => <div className="space-y-1 p-4" key={item.id}>{render(item)}</div>)}{items.length === 0 && <p className="p-6 text-center text-sm font-semibold text-muted-foreground">No records available.</p>}</div>
}
function Input({ label, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className={`space-y-2 ${className}`}><span className="text-sm font-semibold">{label}</span><input className="h-11 w-full rounded-[16px] border border-border bg-background/75 px-3 text-sm outline-none focus:ring-2 focus:ring-ring" {...props} /></label>
}
function Select({ label, className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return <label className={`space-y-2 ${className}`}><span className="text-sm font-semibold">{label}</span><select className="h-11 w-full rounded-[16px] border border-border bg-background/75 px-3 text-sm outline-none focus:ring-2 focus:ring-ring" {...props}>{children}</select></label>
}
function options(items: Array<{ id: string; name?: string; title?: string }>, key: 'name' | 'title' = 'name') {
  return <><option value="">Select</option>{items.map((item) => <option key={item.id} value={item.id}>{key === 'title' ? item.title : item.name}</option>)}</>
}
