import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
>

const emptyStudent: StudentFormValues = {
  name: '',
  email: '',
  program: '',
  department: 'Engineering',
  year: 'Grade 9',
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
  const mutation = mode === 'add' ? createStudent : updateStudent
  const { register, handleSubmit } = useForm<StudentFormValues>({
    defaultValues: student ?? emptyStudent,
  })

  async function onSubmit(values: StudentFormValues) {
    const savedStudent = await mutation.mutateAsync(values as StudentPayload)
    navigate(`/students/${savedStudent.id}`, { replace: true })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'add' ? 'Student Details' : 'Edit Student Details'}</CardTitle>
        <CardDescription>Dummy form scaffold for the future student workflow.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5 lg:grid-cols-2" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
          <Field label="Full Name" registration={register('name')} />
          <Field label="Email" registration={register('email')} type="email" />
          <Field label="Program" registration={register('program')} />
          <Field label="Advisor" registration={register('advisor')} />
          <SelectField label="Department" registration={register('department')} options={['Engineering', 'Science', 'Business', 'Arts', 'Humanities']} />
          <SelectField label="Year" registration={register('year')} options={['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']} />
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
          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <Button disabled={mutation.isPending} type="submit">
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
  options: string[]
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <select
        className="h-12 w-full rounded-[18px] border border-border bg-background/75 px-4 text-sm font-medium outline-none transition focus:ring-2 focus:ring-ring"
        {...registration}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}
