import { BookOpenCheck, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { Navigate, useParams } from 'react-router-dom'

import { PageHeader } from '@/components/molecules/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getCatalogErrorMessage,
  useCatalog,
  useCreateCatalogItem,
  useDeleteCatalogItem,
  useUpdateCatalogItem,
  type CatalogItem,
  type CatalogPayload,
  type CatalogResource,
} from '@/hooks/use-catalog'
import { useCourses } from '@/hooks/use-courses'
import { useStudents } from '@/hooks/use-students'
import { useAuth } from '@/hooks/use-auth'
import { canManageInstitution, canViewInstitutionModule } from '@/lib/permissions'

type FieldConfig = {
  name: string
  label: string
  type?: 'text' | 'number' | 'date' | 'email' | 'select' | 'textarea'
  options?: Array<{ label: string; value: string }>
  required?: boolean
}

type ModuleConfig = {
  title: string
  eyebrow: string
  description: string
  empty: CatalogPayload
  columns: Array<{ key: string; label: string; render?: (item: CatalogItem, lookups: Lookups) => string }>
  fields: (lookups: Lookups) => FieldConfig[]
}

type Lookups = {
  departments: CatalogItem[]
  programs: CatalogItem[]
  academicYears: CatalogItem[]
  semesters: CatalogItem[]
  teachingStaff: CatalogItem[]
  students: Array<{ id: string; databaseId: string; name: string }>
  courses: Array<{ id: string; databaseId: string; title: string }>
}

const moduleConfigs: Record<CatalogResource, ModuleConfig> = {
  departments: {
    title: 'Departments',
    eyebrow: 'Institution Setup',
    description: 'Create and maintain academic departments used by programs, staff, courses, and admissions.',
    empty: { name: '', code: '', description: '', status: 'Active' },
    columns: [
      { key: 'name', label: 'Department' },
      { key: 'code', label: 'Code' },
      { key: 'status', label: 'Status' },
    ],
    fields: () => [
      { name: 'name', label: 'Department Name', required: true },
      { name: 'code', label: 'Code', required: true },
      { name: 'status', label: 'Status', type: 'select', options: statusOptions },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  programs: {
    title: 'Programs',
    eyebrow: 'Academic Structure',
    description: 'Attach programs to departments so students and courses follow the same academic scope.',
    empty: { name: '', code: '', departmentId: '', level: 'Undergraduate', durationSemesters: 8, status: 'Active' },
    columns: [
      { key: 'name', label: 'Program' },
      { key: 'code', label: 'Code' },
      { key: 'departmentId', label: 'Department', render: (item, lookups) => byId(lookups.departments, item.departmentId)?.name ?? '-' },
      { key: 'durationSemesters', label: 'Semesters' },
    ],
    fields: (lookups) => [
      { name: 'name', label: 'Program Name', required: true },
      { name: 'code', label: 'Code', required: true },
      { name: 'departmentId', label: 'Department', type: 'select', required: true, options: toOptions(lookups.departments, 'Select department') },
      { name: 'level', label: 'Level' },
      { name: 'durationSemesters', label: 'Duration Semesters', type: 'number', required: true },
      { name: 'status', label: 'Status', type: 'select', options: statusOptions },
    ],
  },
  academicYears: {
    title: 'Academic Years',
    eyebrow: 'Calendar',
    description: 'Define academic year windows used by semester, admission, enrollment, and assignment rules.',
    empty: { name: '', startDate: '', endDate: '', status: 'Active' },
    columns: [
      { key: 'name', label: 'Year' },
      { key: 'startDate', label: 'Starts', render: (item) => formatDate(item.startDate) },
      { key: 'endDate', label: 'Ends', render: (item) => formatDate(item.endDate) },
      { key: 'status', label: 'Status' },
    ],
    fields: () => [
      { name: 'name', label: 'Academic Year', required: true },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'endDate', label: 'End Date', type: 'date', required: true },
      { name: 'status', label: 'Status', type: 'select', options: statusOptions },
    ],
  },
  semesters: {
    title: 'Semesters',
    eyebrow: 'Calendar',
    description: 'Create semester or batch records under an academic year.',
    empty: { name: '', number: 1, academicYearId: '', startDate: '', endDate: '', status: 'Active' },
    columns: [
      { key: 'name', label: 'Semester' },
      { key: 'number', label: 'No.' },
      { key: 'academicYearId', label: 'Academic Year', render: (item, lookups) => byId(lookups.academicYears, item.academicYearId)?.name ?? '-' },
      { key: 'status', label: 'Status' },
    ],
    fields: (lookups) => [
      { name: 'name', label: 'Semester Name', required: true },
      { name: 'number', label: 'Number', type: 'number', required: true },
      { name: 'academicYearId', label: 'Academic Year', type: 'select', required: true, options: toOptions(lookups.academicYears, 'Select academic year') },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'endDate', label: 'End Date', type: 'date', required: true },
      { name: 'status', label: 'Status', type: 'select', options: statusOptions },
    ],
  },
  staff: {
    title: 'Staff',
    eyebrow: 'People',
    description: 'Manage teaching and non-teaching staff. Only teaching staff can be assigned to courses.',
    empty: { employeeNumber: '', name: '', email: '', phone: '', category: 'Teaching', departmentId: '', designation: '', status: 'Active' },
    columns: [
      { key: 'employeeNumber', label: 'Employee No.' },
      { key: 'name', label: 'Name' },
      { key: 'category', label: 'Category' },
      { key: 'departmentId', label: 'Department', render: (item, lookups) => byId(lookups.departments, item.departmentId)?.name ?? '-' },
    ],
    fields: (lookups) => [
      { name: 'employeeNumber', label: 'Employee Number', required: true },
      { name: 'name', label: 'Full Name', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone' },
      { name: 'category', label: 'Category', type: 'select', options: ['Teaching', 'Non-Teaching'].map((value) => ({ label: value, value })) },
      { name: 'departmentId', label: 'Department', type: 'select', required: true, options: toOptions(lookups.departments, 'Select department') },
      { name: 'designation', label: 'Designation' },
      { name: 'status', label: 'Status', type: 'select', options: statusOptions },
    ],
  },
  courseassignments: {
    title: 'Course Assignments',
    eyebrow: 'Faculty Mapping',
    description: 'Assign active teaching staff to courses for attendance and grade permissions.',
    empty: { courseId: '', staffId: '', academicYearId: '', semesterId: '', role: 'Primary', status: 'Active' },
    columns: [
      { key: 'courseId', label: 'Course', render: (item, lookups) => byId(lookups.courses, item.courseId)?.title ?? '-' },
      { key: 'staffId', label: 'Teaching Staff', render: (item, lookups) => byId(lookups.teachingStaff, item.staffId)?.name ?? '-' },
      { key: 'semesterId', label: 'Semester', render: (item, lookups) => byId(lookups.semesters, item.semesterId)?.name ?? '-' },
      { key: 'role', label: 'Role' },
    ],
    fields: (lookups) => [
      { name: 'courseId', label: 'Course', type: 'select', required: true, options: toOptions(lookups.courses, 'Select course', 'title') },
      { name: 'staffId', label: 'Teaching Staff', type: 'select', required: true, options: toOptions(lookups.teachingStaff, 'Select teaching staff') },
      { name: 'academicYearId', label: 'Academic Year', type: 'select', required: true, options: toOptions(lookups.academicYears, 'Select academic year') },
      { name: 'semesterId', label: 'Semester', type: 'select', required: true, options: toOptions(lookups.semesters, 'Select semester') },
      { name: 'role', label: 'Role', type: 'select', options: ['Primary', 'Assistant'].map((value) => ({ label: value, value })) },
      { name: 'status', label: 'Status', type: 'select', options: statusOptions },
    ],
  },
  studentcourses: {
    title: 'Student Course Enrollment',
    eyebrow: 'Enrollment',
    description: 'Enroll students only into valid courses for their department, program, and semester.',
    empty: { studentId: '', courseId: '', academicYearId: '', semesterId: '', status: 'Enrolled' },
    columns: [
      { key: 'studentId', label: 'Student', render: (item, lookups) => byId(lookups.students, item.studentId)?.name ?? '-' },
      { key: 'courseId', label: 'Course', render: (item, lookups) => byId(lookups.courses, item.courseId)?.title ?? '-' },
      { key: 'semesterId', label: 'Semester', render: (item, lookups) => byId(lookups.semesters, item.semesterId)?.name ?? '-' },
      { key: 'status', label: 'Status' },
    ],
    fields: (lookups) => [
      { name: 'studentId', label: 'Student', type: 'select', required: true, options: toOptions(lookups.students, 'Select student') },
      { name: 'courseId', label: 'Course', type: 'select', required: true, options: toOptions(lookups.courses, 'Select course', 'title') },
      { name: 'academicYearId', label: 'Academic Year', type: 'select', required: true, options: toOptions(lookups.academicYears, 'Select academic year') },
      { name: 'semesterId', label: 'Semester', type: 'select', required: true, options: toOptions(lookups.semesters, 'Select semester') },
      { name: 'status', label: 'Status', type: 'select', options: ['Enrolled', 'Dropped', 'Completed'].map((value) => ({ label: value, value })) },
    ],
  },
}

const resourceTitles: Record<string, CatalogResource> = {
  departments: 'departments',
  programs: 'programs',
  'academic-years': 'academicYears',
  semesters: 'semesters',
  staff: 'staff',
  'course-assignments': 'courseassignments',
  enrollments: 'studentcourses',
}

const statusOptions = ['Active', 'Inactive'].map((value) => ({ label: value, value }))

export function InstitutionalModulePage() {
  const params = useParams()
  const resource = resourceTitles[params.module ?? 'departments'] ?? 'departments'
  const config = moduleConfigs[resource]
  const { user } = useAuth()
  const routeModule = params.module ?? 'departments'
  const canView = canViewInstitutionModule(user, routeModule)
  const canManage = canManageInstitution(user)
  const [editing, setEditing] = useState<CatalogItem | undefined>()
  const [message, setMessage] = useState('')
  const catalog = useCatalog(resource)
  const departments = useCatalog('departments', { status: 'Active' })
  const programs = useCatalog('programs', { status: 'Active' })
  const academicYears = useCatalog('academicYears', { status: 'Active' })
  const semesters = useCatalog('semesters', { status: 'Active' })
  const staff = useCatalog('staff', { status: 'Active' })
  const students = useStudents({ search: '', status: 'Active', department: 'All', page: 1, limit: 200 })
  const courses = useCourses({ search: '', status: 'Active', department: 'All', page: 1, limit: 200 })
  const createItem = useCreateCatalogItem(resource)
  const updateItem = useUpdateCatalogItem(resource)
  const deleteItem = useDeleteCatalogItem(resource)

  const lookups = useMemo<Lookups>(() => ({
    departments: departments.data?.items ?? [],
    programs: programs.data?.items ?? [],
    academicYears: academicYears.data?.items ?? [],
    semesters: semesters.data?.items ?? [],
    teachingStaff: (staff.data?.items ?? []).filter((item) => item.category === 'Teaching'),
    students: students.data?.items ?? [],
    courses: courses.data?.items ?? [],
  }), [academicYears.data?.items, courses.data?.items, departments.data?.items, programs.data?.items, semesters.data?.items, staff.data?.items, students.data?.items])

  async function save(values: CatalogPayload) {
    setMessage('')
    if (editing) {
      await updateItem.mutateAsync({ id: editing.id, payload: values })
      setMessage(`${config.title} record updated.`)
    } else {
      await createItem.mutateAsync(values)
      setMessage(`${config.title} record created.`)
    }
    setEditing(undefined)
  }

  async function remove(item: CatalogItem) {
    if (!window.confirm(`Delete this ${config.title.toLowerCase()} record?`)) return
    await deleteItem.mutateAsync(item.id)
    setMessage(`${config.title} record deleted.`)
  }

  const isLoading = catalog.isLoading || departments.isLoading || programs.isLoading || academicYears.isLoading || semesters.isLoading || staff.isLoading
  const error = catalog.error ?? createItem.error ?? updateItem.error ?? deleteItem.error

  if (!canView) return <Navigate replace to="/" />

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={config.eyebrow} title={config.title} description={config.description} />

      {message && <p className="rounded-[18px] border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{message}</p>}
      {error && <p className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-semibold text-rose-700 dark:text-rose-300">{getCatalogErrorMessage(error)}</p>}

      <section className={canManage ? 'grid gap-6 xl:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]' : 'grid gap-6'}>
        {canManage && (
          <CatalogForm
            config={config}
            editing={editing}
            isPending={createItem.isPending || updateItem.isPending}
            lookups={lookups}
            onCancel={() => setEditing(undefined)}
            onSubmit={(values) => void save(values)}
          />
        )}
        <CatalogTable
          canManage={canManage}
          config={config}
          isDeleting={deleteItem.isPending}
          isLoading={isLoading}
          items={catalog.data?.items ?? []}
          lookups={lookups}
          onDelete={(item) => void remove(item)}
          onEdit={setEditing}
        />
      </section>
    </div>
  )
}

function CatalogForm({
  config,
  editing,
  isPending,
  lookups,
  onCancel,
  onSubmit,
}: {
  config: ModuleConfig
  editing?: CatalogItem
  isPending: boolean
  lookups: Lookups
  onCancel: () => void
  onSubmit: (values: CatalogPayload) => void
}) {
  const { register, handleSubmit, reset } = useForm<CatalogPayload>({
    values: editing ? normalizeFormValues(editing) : config.empty,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpenCheck className="size-5 text-primary" />
          {editing ? 'Edit Record' : 'Create Record'}
        </CardTitle>
        <CardDescription>Use valid institutional references so downstream student, course, attendance, and grade workflows stay consistent.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
          {config.fields(lookups).map((field) => (
            <FormField key={field.name} field={field} registration={register(field.name, { valueAsNumber: field.type === 'number', required: field.required })} />
          ))}
          <div className="flex flex-wrap gap-3">
            <Button disabled={isPending} type="submit">
              <Plus />
              {isPending ? 'Saving...' : editing ? 'Save Changes' : 'Create'}
            </Button>
            {editing && (
              <Button
                onClick={() => {
                  onCancel()
                  reset(config.empty)
                }}
                type="button"
                variant="glass"
              >
                Cancel Edit
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function CatalogTable({
  canManage,
  config,
  isDeleting,
  isLoading,
  items,
  lookups,
  onDelete,
  onEdit,
}: {
  canManage: boolean
  config: ModuleConfig
  isDeleting: boolean
  isLoading: boolean
  items: CatalogItem[]
  lookups: Lookups
  onDelete: (item: CatalogItem) => void
  onEdit: (item: CatalogItem) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Records</CardTitle>
        <CardDescription>{items.length} institutional records available.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-16" />)}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[20px] border border-border/70">
            {items.map((item) => (
              <div key={item.id} className="grid gap-3 border-b border-border/70 p-4 last:border-b-0 xl:grid-cols-[repeat(4,minmax(0,1fr))_96px]">
                {config.columns.map((column) => (
                  <div key={column.key} className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{column.label}</p>
                    <p className="mt-1 truncate text-sm font-bold text-foreground">{column.render ? column.render(item, lookups) : String(item[column.key as keyof CatalogItem] ?? '-')}</p>
                  </div>
                ))}
                {canManage ? (
                  <div className="flex items-center justify-end gap-1">
                    <Button aria-label="Edit record" onClick={() => onEdit(item)} size="icon" type="button" variant="ghost"><Pencil /></Button>
                    <Button aria-label="Delete record" disabled={isDeleting} onClick={() => onDelete(item)} size="icon" type="button" variant="ghost"><Trash2 /></Button>
                  </div>
                ) : (
                  <p className="self-center text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">View only</p>
                )}
              </div>
            ))}
            {items.length === 0 && <div className="p-8 text-center text-sm font-semibold text-muted-foreground">No records yet. Create the first one from the form.</div>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FormField({ field, registration }: { field: FieldConfig; registration: UseFormRegisterReturn }) {
  if (field.type === 'textarea') {
    return (
      <label className="space-y-2">
        <span className="text-sm font-semibold text-foreground">{field.label}</span>
        <textarea className="min-h-24 w-full resize-none rounded-[18px] border border-border bg-background/75 px-4 py-3 text-sm font-medium outline-none transition focus:ring-2 focus:ring-ring" {...registration} />
      </label>
    )
  }

  if (field.type === 'select') {
    return (
      <label className="space-y-2">
        <span className="text-sm font-semibold text-foreground">{field.label}</span>
        <select className="h-12 w-full rounded-[18px] border border-border bg-background/75 px-4 text-sm font-medium outline-none transition focus:ring-2 focus:ring-ring" {...registration}>
          {(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
    )
  }

  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-foreground">{field.label}</span>
      <input className="h-12 w-full rounded-[18px] border border-border bg-background/75 px-4 text-sm font-medium outline-none transition focus:ring-2 focus:ring-ring" type={field.type ?? 'text'} {...registration} />
    </label>
  )
}

function normalizeFormValues(item: CatalogItem): CatalogPayload {
  return Object.fromEntries(Object.entries(item).map(([key, value]) => [key, typeof value === 'string' && key.toLowerCase().includes('date') ? formatDate(value) : value as string | number | undefined]))
}

function toOptions(items: Array<CatalogItem | { databaseId: string; name?: string; title?: string; id: string }>, placeholder: string, labelKey: 'name' | 'title' = 'name') {
  return [
    { label: placeholder, value: '' },
    ...items.map((item) => {
      const label = labelKey === 'title' && 'title' in item ? item.title : item.name

      return {
        label: String(label ?? item.id),
        value: 'databaseId' in item ? item.databaseId : item.id,
      }
    }),
  ]
}

function byId<T extends { id?: string; databaseId?: string }>(items: T[], id?: string) {
  return items.find((item) => item.id === id || item.databaseId === id)
}

function formatDate(value?: string) {
  return value ? new Date(value).toISOString().slice(0, 10) : '-'
}
