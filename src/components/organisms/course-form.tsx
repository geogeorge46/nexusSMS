import { useForm, useWatch, type UseFormRegisterReturn } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCatalog, type CatalogItem } from '@/hooks/use-catalog'
import {
  getCourseErrorMessage,
  useCreateCourse,
  useUpdateCourse,
  type Course,
  type CoursePayload,
} from '@/hooks/use-courses'

type CourseFormValues = Pick<
  Course,
  | 'title'
  | 'code'
  | 'department'
  | 'program'
  | 'faculty'
  | 'departmentId'
  | 'programId'
  | 'semesterId'
  | 'facultyStaffId'
  | 'credits'
  | 'status'
  | 'enrolled'
  | 'capacity'
  | 'schedule'
  | 'room'
  | 'term'
  | 'description'
>

const emptyCourse: CourseFormValues = {
  title: '',
  code: '',
  department: '',
  program: '',
  faculty: '',
  departmentId: '',
  programId: '',
  semesterId: '',
  facultyStaffId: '',
  credits: 3,
  status: 'Active',
  enrolled: 0,
  capacity: 30,
  schedule: '',
  room: '',
  term: 'Spring 2026',
  description: '',
}

export function CourseForm({ mode, course }: { mode: 'add' | 'edit'; course?: Course }) {
  const navigate = useNavigate()
  const createCourse = useCreateCourse()
  const updateCourse = useUpdateCourse(course?.id)
  const departments = useCatalog('departments', { status: 'Active' })
  const programs = useCatalog('programs', { status: 'Active' })
  const semesters = useCatalog('semesters', { status: 'Active' })
  const staff = useCatalog('staff', { status: 'Active' })
  const mutation = mode === 'add' ? createCourse : updateCourse
  const { register, handleSubmit, control } = useForm<CourseFormValues>({
    defaultValues: course ?? emptyCourse,
  })
  const departmentId = useWatch({ control, name: 'departmentId' })
  const filteredPrograms = (programs.data?.items ?? []).filter((program) => !departmentId || program.departmentId === departmentId)
  const teachingStaff = (staff.data?.items ?? []).filter((item) => item.category === 'Teaching')

  async function onSubmit(values: CourseFormValues) {
    const department = findById(departments.data?.items, values.departmentId)
    const program = findById(programs.data?.items, values.programId)
    const semester = findById(semesters.data?.items, values.semesterId)
    const faculty = findById(staff.data?.items, values.facultyStaffId)
    const payload: CoursePayload = {
      ...values,
      department: department?.name ?? values.department,
      program: program?.name ?? values.program,
      term: semester?.name ?? values.term,
      faculty: faculty?.name ?? values.faculty,
    }
    const savedCourse = await mutation.mutateAsync(payload)
    navigate(`/courses/${savedCourse.id}`, { replace: true })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'add' ? 'Course Details' : 'Edit Course Details'}</CardTitle>
        <CardDescription>Manage course catalog details, enrollment, capacity, and faculty ownership.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5 lg:grid-cols-2" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
          <Field label="Course Title" registration={register('title')} />
          <Field label="Course Code" registration={register('code')} />
          <SelectField label="Department" registration={register('departmentId')} options={toOptions(departments.data?.items, 'Select department')} />
          <SelectField label="Program" registration={register('programId')} options={toOptions(filteredPrograms, 'Select program')} />
          <SelectField label="Semester" registration={register('semesterId')} options={toOptions(semesters.data?.items, 'Select semester')} />
          <SelectField label="Faculty" registration={register('facultyStaffId')} options={toOptions(teachingStaff, 'Select teaching staff')} />
          <Field label="Credits" registration={register('credits', { valueAsNumber: true })} type="number" />
          <SelectField label="Status" registration={register('status')} options={['Active', 'Inactive']} />
          <Field label="Enrollment" registration={register('enrolled', { valueAsNumber: true })} type="number" />
          <Field label="Capacity" registration={register('capacity', { valueAsNumber: true })} type="number" />
          <Field label="Legacy Department Text" registration={register('department')} />
          <Field label="Legacy Program Text" registration={register('program')} />
          <Field label="Legacy Faculty Text" registration={register('faculty')} />
          <Field label="Legacy Semester Text" registration={register('term')} />
          <Field label="Schedule" registration={register('schedule')} />
          <Field label="Room" registration={register('room')} />
          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-semibold text-foreground">Description</span>
            <textarea
              className="min-h-28 w-full resize-none rounded-[18px] border border-border bg-background/75 px-4 py-3 text-sm font-medium outline-none transition focus:ring-2 focus:ring-ring"
              {...register('description')}
            />
          </label>
          {mutation.isError && (
            <p className="rounded-2xl bg-rose-500/10 p-3 text-sm font-semibold text-rose-700 dark:text-rose-300 lg:col-span-2">
              {getCourseErrorMessage(mutation.error)}
            </p>
          )}
          {(departments.isError || programs.isError || semesters.isError || staff.isError) && (
            <p className="rounded-2xl bg-rose-500/10 p-3 text-sm font-semibold text-rose-700 dark:text-rose-300 lg:col-span-2">
              Unable to load course catalog dropdowns.
            </p>
          )}
          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <Button disabled={mutation.isPending || departments.isLoading || programs.isLoading || semesters.isLoading || staff.isLoading} type="submit">
              {mutation.isPending ? 'Saving...' : mode === 'add' ? 'Create Course' : 'Save Changes'}
            </Button>
            <Button asChild type="button" variant="glass">
              <Link to="/courses">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  registration,
  type = 'text',
}: {
  label: string
  registration: UseFormRegisterReturn
  type?: string
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <input
        className="h-12 w-full rounded-[18px] border border-border bg-background/75 px-4 text-sm font-medium outline-none transition focus:ring-2 focus:ring-ring"
        type={type}
        {...registration}
      />
    </label>
  )
}

function SelectField({
  label,
  registration,
  options,
}: {
  label: string
  registration: UseFormRegisterReturn
  options: Array<string | { label: string; value: string }>
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <select
        className="h-12 w-full rounded-[18px] border border-border bg-background/75 px-4 text-sm font-medium outline-none transition focus:ring-2 focus:ring-ring"
        {...registration}
      >
        {options.map((option) => (
          <option key={typeof option === 'string' ? option : option.value} value={typeof option === 'string' ? option : option.value}>
            {typeof option === 'string' ? option : option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function toOptions(items: CatalogItem[] | undefined, placeholder: string) {
  return [
    { label: placeholder, value: '' },
    ...(items ?? []).map((item) => ({ label: item.name ?? item.code ?? item.id, value: item.id })),
  ]
}

function findById(items: CatalogItem[] | undefined, id?: string) {
  return (items ?? []).find((item) => item.id === id)
}
