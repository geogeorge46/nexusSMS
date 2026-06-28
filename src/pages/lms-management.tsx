import { BookOpenCheck, ClipboardCheck, Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { PageHeader } from '@/components/molecules/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCatalog } from '@/hooks/use-catalog'
import { useCourses } from '@/hooks/use-courses'
import { getLmsErrorMessage, lmsLabel, useAssignmentSubmissions, useCreateLmsAssignment, useCreateLmsMaterial, useGradeSubmission, useLmsAssignments, useLmsMaterials, type Assignment, type LearningMaterial } from '@/hooks/use-lms'
import { useAuth } from '@/hooks/use-auth'
import { canManageLms } from '@/lib/permissions'

type AssignmentForm = { title: string; description: string; courseId: string; staffId: string; academicYearId: string; semesterId: string; dueDate: string; maxMarks: number; attachmentUrl: string; status: string }
type MaterialForm = { title: string; description: string; courseId: string; staffId: string; academicYearId: string; semesterId: string; materialType: string; fileUrl: string; externalUrl: string; visibility: string }
type GradeForm = { submissionId: string; marksObtained: number; feedback: string; status: string }

export function LmsManagementPage() {
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [selectedAssignment, setSelectedAssignment] = useState('')
  const assignments = useLmsAssignments()
  const submissions = useAssignmentSubmissions(selectedAssignment)
  const materials = useLmsMaterials()
  const courses = useCourses({ search: '', status: 'Active', department: 'All', page: 1, limit: 300 })
  const years = useCatalog('academicYears', { status: 'Active' })
  const semesters = useCatalog('semesters', { status: 'Active' })
  const staff = useCatalog('staff', { status: 'Active' })
  const createAssignment = useCreateLmsAssignment()
  const createMaterial = useCreateLmsMaterial()
  const gradeSubmission = useGradeSubmission()
  const canManage = canManageLms(user)
  const error = [assignments.error, submissions.error, materials.error, createAssignment.error, createMaterial.error, gradeSubmission.error].find(Boolean)
  const loading = [assignments, materials, courses, years, semesters, staff].some((query) => query.isLoading)
  const teachingStaff = (staff.data?.items ?? []).filter((item) => item.category === 'Teaching')

  async function saveAssignment(values: AssignmentForm) {
    setMessage('')
    await createAssignment.mutateAsync({ ...values, maxMarks: Number(values.maxMarks) })
    setMessage('Assignment saved.')
  }
  async function saveMaterial(values: MaterialForm) {
    setMessage('')
    await createMaterial.mutateAsync(values)
    setMessage('Learning material saved.')
  }
  async function grade(values: GradeForm) {
    setMessage('')
    await gradeSubmission.mutateAsync({ id: values.submissionId, payload: { marksObtained: Number(values.marksObtained), feedback: values.feedback, status: values.status } })
    setMessage('Submission graded.')
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="LMS" title="Assignments & Learning Materials" description="Publish assignments, review submissions, grade work, and share course materials." />
      {message && <p className="rounded-[18px] border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{message}</p>}
      {error && <p className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-semibold text-rose-700 dark:text-rose-300">{getLmsErrorMessage(error)}</p>}
      {loading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton className="h-24" key={i} />)}</div> : (
        <>
          {canManage && <section className="grid gap-6 xl:grid-cols-2"><AssignmentPanel courses={courses.data?.items ?? []} years={years.data?.items ?? []} semesters={semesters.data?.items ?? []} staff={teachingStaff} onSubmit={(values) => void saveAssignment(values)} pending={createAssignment.isPending} /><MaterialPanel courses={courses.data?.items ?? []} years={years.data?.items ?? []} semesters={semesters.data?.items ?? []} staff={teachingStaff} onSubmit={(values) => void saveMaterial(values)} pending={createMaterial.isPending} /></section>}
          <section className="grid gap-6 xl:grid-cols-2">
            <Records title="Assignments" items={assignments.data?.items ?? []} onSelect={(item) => setSelectedAssignment(item.id)} selected={selectedAssignment} />
            <GradePanel submissions={submissions.data?.items ?? []} onSubmit={(values) => void grade(values)} pending={gradeSubmission.isPending} />
          </section>
          <Records title="Learning Materials" items={materials.data?.items ?? []} />
        </>
      )}
    </div>
  )
}

function AssignmentPanel({ courses, years, semesters, staff, onSubmit, pending }: { courses: Array<{ databaseId: string; title: string }>; years: Array<{ id: string; name?: string }>; semesters: Array<{ id: string; name?: string }>; staff: Array<{ id: string; name?: string }>; onSubmit: (values: AssignmentForm) => void; pending: boolean }) {
  const form = useForm<AssignmentForm>({ defaultValues: { title: '', description: '', courseId: '', staffId: '', academicYearId: '', semesterId: '', dueDate: '', maxMarks: 100, attachmentUrl: '', status: 'Published' } })
  return <Card><CardHeader><CardTitle><BookOpenCheck className="inline size-5 text-primary" /> Assignment Management</CardTitle><CardDescription>Create published or draft coursework for assigned courses.</CardDescription></CardHeader><CardContent><form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}><Input label="Title" {...form.register('title', { required: true })} /><Input label="Due Date" type="datetime-local" {...form.register('dueDate', { required: true })} /><Select label="Course" {...form.register('courseId', { required: true })}><option value="">Select</option>{courses.map((c) => <option key={c.databaseId} value={c.databaseId}>{c.title}</option>)}</Select><Select label="Teacher" {...form.register('staffId')}><option value="">Current teacher / select</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select><Select label="Year" {...form.register('academicYearId', { required: true })}>{opts(years)}</Select><Select label="Semester" {...form.register('semesterId', { required: true })}>{opts(semesters)}</Select><Input label="Max Marks" type="number" {...form.register('maxMarks', { valueAsNumber: true })} /><Select label="Status" {...form.register('status')}><option>Draft</option><option>Published</option><option>Closed</option><option>Cancelled</option></Select><Input className="sm:col-span-2" label="Attachment URL" {...form.register('attachmentUrl')} /><TextArea className="sm:col-span-2" label="Description" {...form.register('description', { required: true })} /><Button className="sm:col-span-2" disabled={pending}><Plus />Save Assignment</Button></form></CardContent></Card>
}

function MaterialPanel({ courses, years, semesters, staff, onSubmit, pending }: { courses: Array<{ databaseId: string; title: string }>; years: Array<{ id: string; name?: string }>; semesters: Array<{ id: string; name?: string }>; staff: Array<{ id: string; name?: string }>; onSubmit: (values: MaterialForm) => void; pending: boolean }) {
  const form = useForm<MaterialForm>({ defaultValues: { title: '', description: '', courseId: '', staffId: '', academicYearId: '', semesterId: '', materialType: 'Notes', fileUrl: '', externalUrl: '', visibility: 'Published' } })
  return <Card><CardHeader><CardTitle>Learning Materials</CardTitle><CardDescription>Publish notes, links, PDFs, slides, videos, and code resources.</CardDescription></CardHeader><CardContent><form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}><Input label="Title" {...form.register('title', { required: true })} /><Select label="Type" {...form.register('materialType')}><option>Notes</option><option>PDF</option><option>Video</option><option>Link</option><option>Slides</option><option>Code</option><option>Other</option></Select><Select label="Course" {...form.register('courseId', { required: true })}><option value="">Select</option>{courses.map((c) => <option key={c.databaseId} value={c.databaseId}>{c.title}</option>)}</Select><Select label="Teacher" {...form.register('staffId')}><option value="">Current teacher / select</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select><Select label="Year" {...form.register('academicYearId', { required: true })}>{opts(years)}</Select><Select label="Semester" {...form.register('semesterId', { required: true })}>{opts(semesters)}</Select><Input label="File URL" {...form.register('fileUrl')} /><Input label="External URL" {...form.register('externalUrl')} /><Select label="Visibility" {...form.register('visibility')}><option>Draft</option><option>Published</option><option>Archived</option></Select><TextArea className="sm:col-span-2" label="Description" {...form.register('description')} /><Button className="sm:col-span-2" disabled={pending}><Plus />Save Material</Button></form></CardContent></Card>
}

function GradePanel({ submissions, onSubmit, pending }: { submissions: Array<{ id: string; studentId: unknown; assignmentId: unknown; status: string }>; onSubmit: (values: GradeForm) => void; pending: boolean }) {
  const form = useForm<GradeForm>({ defaultValues: { submissionId: '', marksObtained: 0, feedback: '', status: 'Graded' } })
  return <Card><CardHeader><CardTitle><ClipboardCheck className="inline size-5 text-primary" /> Grade Submission</CardTitle><CardDescription>Choose a submission and provide marks plus feedback.</CardDescription></CardHeader><CardContent><form className="grid gap-3" onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}><Select label="Submission" {...form.register('submissionId', { required: true })}><option value="">Select</option>{submissions.map((s) => <option key={s.id} value={s.id}>{lmsLabel(s.studentId, 'name')} - {lmsLabel(s.assignmentId)}</option>)}</Select><Input label="Marks" type="number" {...form.register('marksObtained', { valueAsNumber: true })} /><Select label="Status" {...form.register('status')}><option>Graded</option><option>Resubmission Requested</option><option>Rejected</option></Select><TextArea label="Feedback" {...form.register('feedback')} /><Button disabled={pending}>Grade</Button></form></CardContent></Card>
}

function Records({ title, items, onSelect, selected }: { title: string; items: Assignment[] | Array<Record<string, unknown> & { id: string }>; onSelect?: (item: Assignment) => void; selected?: string }) {
  return <GlassCard className="p-5"><h2 className="text-xl font-bold">{title}</h2><div className="mt-4 grid gap-3">{items.length ? items.map((item) => <button className={`rounded-[16px] border border-border/70 bg-muted/35 p-4 text-left ${selected === item.id ? 'ring-2 ring-primary' : ''}`} key={item.id} onClick={() => onSelect?.(item as Assignment)} type="button"><Badge>{String((item as Assignment).status ?? (item as LearningMaterial).visibility ?? '')}</Badge><p className="mt-2 font-bold">{String(item.title ?? lmsLabel((item as Assignment).courseId))}</p><p className="text-sm text-muted-foreground">{lmsLabel((item as Assignment).courseId, 'title')}</p></button>) : <p className="text-sm text-muted-foreground">No records yet.</p>}</div></GlassCard>
}

function Input({ label, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <label className={`space-y-2 ${className}`}><span className="text-sm font-semibold">{label}</span><input className="h-11 w-full rounded-[16px] border border-border bg-background/75 px-3 text-sm outline-none focus:ring-2 focus:ring-ring" {...props} /></label> }
function TextArea({ label, className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) { return <label className={`space-y-2 ${className}`}><span className="text-sm font-semibold">{label}</span><textarea className="min-h-20 w-full rounded-[16px] border border-border bg-background/75 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" {...props} /></label> }
function Select({ label, className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) { return <label className={`space-y-2 ${className}`}><span className="text-sm font-semibold">{label}</span><select className="h-11 w-full rounded-[16px] border border-border bg-background/75 px-3 text-sm outline-none focus:ring-2 focus:ring-ring" {...props}>{children}</select></label> }
function opts(items: Array<{ id: string; name?: string }>) { return <><option value="">Select</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</> }
