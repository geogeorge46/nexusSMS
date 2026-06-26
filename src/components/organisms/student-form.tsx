import { useForm, useWatch, type UseFormRegisterReturn } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCatalog, type CatalogItem } from '@/hooks/use-catalog'
import {
  getStudentErrorMessage,
  useCreateStudent,
  useUpdateStudent,
  type Student,
  type StudentPayload,
} from '@/hooks/use-students'

type StudentFormValues = Pick<
  Student,
  'name' | 'email' | 'program' | 'department' | 'year' | 'status' | 'advisor' | 'phone' | 'address'
> & Partial<Pick<Student, 'departmentId' | 'programId' | 'academicYearId' | 'semesterId' | 'batch'>>

const emptyStudent: StudentFormValues = {
  name: '',
  email: '',
  program: '',
  department: '',
  year: '',
  departmentId: '',
  programId: '',
  academicYearId: '',
  semesterId: '',
  batch: '',
  status: 'Active',
  advisor: '',
  phone: '',
  address: '',
}

export function StudentForm({
  mode,
  student,
}: {
  mode: 'add' | 'edit'
  student?: Student
}) {
  const navigate = useNavigate()
  const createStudent = useCreateStudent()
  const updateStudent = useUpdateStudent(student?.id)
  const departments = useCatalog('departments', { status: 'Active' })
  const programs = useCatalog('programs', { status: 'Active' })
  const academicYears = useCatalog('academicYears', { status: 'Active' })
  const semesters = useCatalog('semesters', { status: 'Active' })
  const mutation = mode === 'add' ? createStudent : updateStudent
  const { register, handleSubmit, control } = useForm<StudentFormValues>({
    defaultValues: student ?? emptyStudent,
  })
  const departmentId = useWatch({ control, name: 'departmentId' })
  const academicYearId = useWatch({ control, name: 'academicYearId' })
  const filteredPrograms = (programs.data?.items ?? []).filter((program) => !departmentId || program.departmentId === departmentId)
  const filteredSemesters = (semesters.data?.items ?? []).filter((semester) => !academicYearId || semester.academicYearId === academicYearId)

  async function onSubmit(values: StudentFormValues) {
    const department = findById(departments.data?.items, values.departmentId)
    const program = findById(programs.data?.items, values.programId)
    const academicYear = findById(academicYears.data?.items, values.academicYearId)
    const semester = findById(semesters.data?.items, values.semesterId)
    const payload: StudentPayload = {
      ...values,
      department: department?.name ?? values.department,
      program: program?.name ?? values.program,
      year: academicYear?.name ?? values.year,
      batch: semester?.name ?? values.batch,
    }
    const savedStudent = await mutation.mutateAsync(payload)
    navigate(`/students/${savedStudent.id}`, { replace: true })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'add' ? 'Student Details' : 'Edit Student Details'}</CardTitle>
        <CardDescription>Admit students into a valid department, program, academic year, and semester.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5 lg:grid-cols-2" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
          <Field label="Full Name" registration={register('name')} />
          <Field label="Email" registration={register('email')} type="email" />
          <SelectField label="Department" registration={register('departmentId')} options={toOptions(departments.data?.items, 'Select department')} />
          <SelectField label="Program" registration={register('programId')} options={toOptions(filteredPrograms, 'Select program')} />
          <SelectField label="Academic Year" registration={register('academicYearId')} options={toOptions(academicYears.data?.items, 'Select academic year')} />
          <SelectField label="Semester / Batch" registration={register('semesterId')} options={toOptions(filteredSemesters, 'Select semester')} />
          <Field label="Advisor" registration={register('advisor')} />
          <Field label="Legacy Program Text" registration={register('program')} />
          <Field label="Legacy Department Text" registration={register('department')} />
          <Field label="Legacy Year Text" registration={register('year')} />
          <SelectField label="Status" registration={register('status')} options={['Active', 'Pending', 'Review', 'Inactive']} />
          <Field label="Phone" registration={register('phone')} />
          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-semibold text-foreground">Address</span>
            <textarea
              className="min-h-28 w-full resize-none rounded-[18px] border border-border bg-background/75 px-4 py-3 text-sm font-medium outline-none transition focus:ring-2 focus:ring-ring"
              {...register('address')}
            />
          </label>
          {mutation.isError && (
            <p className="rounded-2xl bg-rose-500/10 p-3 text-sm font-semibold text-rose-700 dark:text-rose-300 lg:col-span-2">
              {getStudentErrorMessage(mutation.error)}
            </p>
          )}
          {(departments.isError || programs.isError || academicYears.isError || semesters.isError) && (
            <p className="rounded-2xl bg-rose-500/10 p-3 text-sm font-semibold text-rose-700 dark:text-rose-300 lg:col-span-2">
              Unable to load institutional dropdowns.
            </p>
          )}
          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <Button disabled={mutation.isPending || departments.isLoading || programs.isLoading || academicYears.isLoading || semesters.isLoading} type="submit">
              {mutation.isPending ? 'Saving...' : mode === 'add' ? 'Create Student' : 'Save Changes'}
            </Button>
            <Button asChild type="button" variant="glass">
              <Link to="/students">Cancel</Link>
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
