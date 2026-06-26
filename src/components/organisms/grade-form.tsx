import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { useCatalog } from '@/hooks/use-catalog'
import { useCourses } from '@/hooks/use-courses'
import { getGradeErrorMessage, useCreateGrade, useUpdateGrade, type GradePayload, type GradeRecord } from '@/hooks/use-grades'
import { useStudents } from '@/hooks/use-students'

const emptyGrade: GradePayload = { studentId: '', courseId: '', assessmentType: 'Assignment', marksObtained: 0, maxMarks: 100, semester: 'Spring 2026', remarks: '' }

export function GradeForm({ grade, open, onOpenChange }: { grade?: GradeRecord; open: boolean; onOpenChange: (open: boolean) => void }) {
  const students = useStudents({ search: '', status: 'All', department: 'All', page: 1, limit: 100 })
  const courses = useCourses({ search: '', status: 'All', department: 'All', page: 1, limit: 100 })
  const enrollments = useCatalog('studentcourses')
  const createGrade = useCreateGrade()
  const updateGrade = useUpdateGrade()
  const mutation = grade ? updateGrade : createGrade
  const { register, handleSubmit, reset, control } = useForm<GradePayload>({ defaultValues: emptyGrade })
  const selectedStudentId = useWatch({ control, name: 'studentId' })
  const selectedCourseId = useWatch({ control, name: 'courseId' })
  const enrolledPairs = (enrollments.data?.items ?? []).filter((item) => item.status === 'Enrolled')
  const allowedStudentIds = new Set(
    enrolledPairs
      .filter((item) => !selectedCourseId || item.courseId === selectedCourseId)
      .map((item) => item.studentId),
  )
  const allowedCourseIds = new Set(
    enrolledPairs
      .filter((item) => !selectedStudentId || item.studentId === selectedStudentId)
      .map((item) => item.courseId),
  )
  const studentOptions = (students.data?.items ?? []).filter((item) => allowedStudentIds.has(item.databaseId))
  const courseOptions = (courses.data?.items ?? []).filter((item) => allowedCourseIds.has(item.databaseId) || (!selectedStudentId && enrolledPairs.some((pair) => pair.courseId === item.databaseId)))

  useEffect(() => {
    reset(grade ? { studentId: grade.studentId, courseId: grade.courseId, assessmentType: grade.assessmentType, marksObtained: grade.marksObtained, maxMarks: grade.maxMarks, semester: grade.semester, remarks: grade.remarks } : emptyGrade)
  }, [grade, reset, open])

  async function submit(payload: GradePayload) {
    if (grade) await updateGrade.mutateAsync({ id: grade.id, payload })
    else await createGrade.mutateAsync(payload)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="left-auto right-3 w-[min(520px,calc(100vw-24px))] overflow-y-auto p-6">
        <SheetTitle className="pr-12 text-xl font-bold">{grade ? 'Edit Grade' : 'Add Grade'}</SheetTitle>
        <SheetDescription className="mt-1 text-sm text-muted-foreground">Percentage and grade letter are calculated automatically.</SheetDescription>
        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={(event) => void handleSubmit(submit)(event)}>
          <Select label="Student" registration={register('studentId', { required: true })} options={studentOptions.map((item) => ({ value: item.databaseId, label: `${item.name} (${item.id})` }))} />
          <Select label="Course" registration={register('courseId', { required: true })} options={courseOptions.map((item) => ({ value: item.databaseId, label: item.title }))} />
          <Select label="Assessment" registration={register('assessmentType')} options={['Assignment', 'Exam', 'Project', 'Quiz'].map((value) => ({ value, label: value }))} />
          <Field label="Semester" registration={register('semester', { required: true })} />
          <Field label="Marks Obtained" type="number" registration={register('marksObtained', { valueAsNumber: true, required: true })} />
          <Field label="Maximum Marks" type="number" registration={register('maxMarks', { valueAsNumber: true, required: true })} />
          <label className="space-y-2 sm:col-span-2"><span className="text-sm font-semibold">Remarks</span><textarea className="min-h-24 w-full rounded-[18px] border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" {...register('remarks')} /></label>
          {!enrollments.isLoading && enrolledPairs.length === 0 && <p className="sm:col-span-2 rounded-2xl bg-amber-500/10 p-3 text-sm font-semibold text-amber-700">No enrolled student-course combinations exist yet. Complete Student Course Enrollment first.</p>}
          {selectedStudentId && selectedCourseId && !enrolledPairs.some((item) => item.studentId === selectedStudentId && item.courseId === selectedCourseId) && <p className="sm:col-span-2 rounded-2xl bg-rose-500/10 p-3 text-sm font-semibold text-rose-700">Selected student is not enrolled in the selected course.</p>}
          {(students.isError || courses.isError || enrollments.isError) && <p className="sm:col-span-2 text-sm font-semibold text-rose-600">Unable to load enrolled student or course choices.</p>}
          {mutation.isError && <p className="sm:col-span-2 rounded-2xl bg-rose-500/10 p-3 text-sm font-semibold text-rose-700">{getGradeErrorMessage(mutation.error)}</p>}
          <div className="flex gap-3 sm:col-span-2"><Button disabled={mutation.isPending || students.isLoading || courses.isLoading || enrollments.isLoading || enrolledPairs.length === 0} type="submit">{mutation.isPending ? 'Saving...' : grade ? 'Save Changes' : 'Add Grade'}</Button><Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button></div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function Field({ label, registration, type = 'text' }: { label: string; registration: ReturnType<typeof useForm<GradePayload>>['register'] extends (...args: never[]) => infer R ? R : never; type?: string }) {
  return <label className="space-y-2"><span className="text-sm font-semibold">{label}</span><input className="h-12 w-full rounded-[18px] border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring" type={type} {...registration} /></label>
}
function Select({ label, registration, options }: { label: string; registration: ReturnType<typeof useForm<GradePayload>>['register'] extends (...args: never[]) => infer R ? R : never; options: { value: string; label: string }[] }) {
  return <label className="space-y-2"><span className="text-sm font-semibold">{label}</span><select className="h-12 w-full rounded-[18px] border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring" {...registration}><option value="">Select {label.toLowerCase()}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}
