import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Course } from '@/hooks/use-courses'

type CourseFormValues = Pick<
  Course,
  | 'title'
  | 'code'
  | 'department'
  | 'faculty'
  | 'credits'
  | 'status'
  | 'capacity'
  | 'schedule'
  | 'room'
  | 'term'
  | 'description'
>

const emptyCourse: CourseFormValues = {
  title: '',
  code: '',
  department: 'Engineering',
  faculty: '',
  credits: 3,
  status: 'Draft',
  capacity: 30,
  schedule: '',
  room: '',
  term: 'Spring 2026',
  description: '',
}

export function CourseForm({ mode, course }: { mode: 'add' | 'edit'; course?: Course }) {
  const { register, handleSubmit } = useForm<CourseFormValues>({
    defaultValues: course ?? emptyCourse,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'add' ? 'Course Details' : 'Edit Course Details'}</CardTitle>
        <CardDescription>Reusable course form scaffold with dummy submit behavior.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5 lg:grid-cols-2" onSubmit={handleSubmit(() => undefined)}>
          <Field label="Course Title" registration={register('title')} />
          <Field label="Course Code" registration={register('code')} />
          <SelectField label="Department" registration={register('department')} options={['Engineering', 'Science', 'Business', 'Arts', 'Humanities']} />
          <Field label="Faculty" registration={register('faculty')} />
          <Field label="Credits" registration={register('credits', { valueAsNumber: true })} type="number" />
          <SelectField label="Status" registration={register('status')} options={['Active', 'Draft', 'Review', 'Archived']} />
          <Field label="Capacity" registration={register('capacity', { valueAsNumber: true })} type="number" />
          <Field label="Term" registration={register('term')} />
          <Field label="Schedule" registration={register('schedule')} />
          <Field label="Room" registration={register('room')} />
          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-semibold text-foreground">Description</span>
            <textarea
              className="min-h-28 w-full resize-none rounded-[18px] border border-border bg-background/75 px-4 py-3 text-sm font-medium outline-none transition focus:ring-2 focus:ring-ring"
              {...register('description')}
            />
          </label>
          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <Button type="submit">{mode === 'add' ? 'Create Course' : 'Save Changes'}</Button>
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
