import { Pencil, Plus, ReceiptText, Trash2, WalletCards } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import { PageHeader } from '@/components/molecules/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCatalog } from '@/hooks/use-catalog'
import { useCourses } from '@/hooks/use-courses'
import {
  displayRef,
  getFeeErrorMessage,
  refId,
  useAssignStudentFees,
  useCreateFeeCategory,
  useCreateFeeStructure,
  useDeleteFeeCategory,
  useDeleteFeeStructure,
  useFeeCategories,
  useFeeReceipts,
  useFeeReports,
  useFeeStructures,
  useRecordFeePayment,
  useStudentFees,
  useUpdateFeeCategory,
  useUpdateFeeStructure,
  type FeeCategory,
  type FeeStructure,
  type FeeStructurePayload,
} from '@/hooks/use-fees'
import { useStudents } from '@/hooks/use-students'
import { useAuth } from '@/hooks/use-auth'
import { canManageFees, canRecordFeePayments } from '@/lib/permissions'

type CategoryForm = { name: string; description: string; status: 'Active' | 'Inactive' }
type StructureForm = Omit<FeeStructurePayload, 'items'> & {
  feeCategoryId: string
  amount: number
}
type AssignForm = { feeStructureId: string; studentId: string }
type PaymentForm = { studentFeeId: string; amount: number; method: string; transactionId: string; paidAt: string; remarks: string }

export function FeeManagementPage() {
  const { user } = useAuth()
  const canManage = canManageFees(user)
  const canPay = canRecordFeePayments(user)
  const [message, setMessage] = useState('')
  const [editingCategory, setEditingCategory] = useState<FeeCategory>()
  const [editingStructure, setEditingStructure] = useState<FeeStructure>()

  const categories = useFeeCategories()
  const structures = useFeeStructures()
  const studentFees = useStudentFees()
  const receipts = useFeeReceipts()
  const reports = useFeeReports()
  const departments = useCatalog('departments', { status: 'Active' })
  const programs = useCatalog('programs', { status: 'Active' })
  const academicYears = useCatalog('academicYears', { status: 'Active' })
  const semesters = useCatalog('semesters', { status: 'Active' })
  const students = useStudents({ search: '', status: 'Active', department: 'All', page: 1, limit: 300 })
  const courses = useCourses({ search: '', status: 'Active', department: 'All', page: 1, limit: 300 })

  const createCategory = useCreateFeeCategory()
  const updateCategory = useUpdateFeeCategory()
  const deleteCategory = useDeleteFeeCategory()
  const createStructure = useCreateFeeStructure()
  const updateStructure = useUpdateFeeStructure()
  const deleteStructure = useDeleteFeeStructure()
  const assignFees = useAssignStudentFees()
  const recordPayment = useRecordFeePayment()

  const loading = [
    categories,
    structures,
    studentFees,
    receipts,
    reports,
    departments,
    programs,
    academicYears,
    semesters,
    students,
    courses,
  ].some((query) => query.isLoading)
  const error = [
    categories.error,
    structures.error,
    studentFees.error,
    receipts.error,
    reports.error,
    createCategory.error,
    updateCategory.error,
    deleteCategory.error,
    createStructure.error,
    updateStructure.error,
    deleteStructure.error,
    assignFees.error,
    recordPayment.error,
  ].find(Boolean)

  const unpaidFees = useMemo(
    () => (studentFees.data?.items ?? []).filter((item) => item.dueAmount > 0 && !['Cancelled', 'Waived'].includes(item.status)),
    [studentFees.data?.items],
  )

  async function saveCategory(values: CategoryForm) {
    setMessage('')
    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, payload: values })
      setEditingCategory(undefined)
      setMessage('Fee category updated.')
      return
    }
    await createCategory.mutateAsync(values)
    setMessage('Fee category created.')
  }

  async function saveStructure(values: StructureForm) {
    setMessage('')
    const payload = { ...values, amount: Number(values.amount), items: [{ feeCategoryId: values.feeCategoryId, amount: Number(values.amount) }] }
    if (editingStructure) {
      await updateStructure.mutateAsync({ id: editingStructure.id, payload })
      setEditingStructure(undefined)
      setMessage('Fee structure updated.')
      return
    }
    await createStructure.mutateAsync(payload)
    setMessage('Fee structure created.')
  }

  async function assign(values: AssignForm) {
    setMessage('')
    await assignFees.mutateAsync({
      feeStructureId: values.feeStructureId,
      studentIds: values.studentId ? [values.studentId] : undefined,
    })
    setMessage(values.studentId ? 'Fee assigned to selected student.' : 'Fee assigned to all matching students.')
  }

  async function pay(values: PaymentForm) {
    setMessage('')
    await recordPayment.mutateAsync({
      ...values,
      amount: Number(values.amount),
      paidAt: values.paidAt || undefined,
      transactionId: values.transactionId || undefined,
    })
    setMessage('Payment recorded and receipt generated.')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Fee Management"
        description="Create fee rules, assign student fees, record payments, generate receipts, and monitor collection reports."
      />

      {message && <p className="rounded-[18px] border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{message}</p>}
      {error && <p className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-semibold text-rose-700 dark:text-rose-300">{getFeeErrorMessage(error)}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Summary label="Assigned" value={currency(reports.data?.summary.totalAssigned ?? 0)} />
        <Summary label="Collected" value={currency(reports.data?.summary.totalPaid ?? 0)} />
        <Summary label="Due" value={currency(reports.data?.summary.totalDue ?? 0)} />
        <Summary label="Overdue" value={String(reports.data?.summary.overdueRecords ?? 0)} />
      </section>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-24" />)}
        </div>
      ) : (
        <>
          {canManage && (
            <section className="grid gap-6 xl:grid-cols-2">
              <CategoryPanel
                editing={editingCategory}
                isPending={createCategory.isPending || updateCategory.isPending}
                items={categories.data?.items ?? []}
                onDelete={(item) => void deleteCategory.mutateAsync(item.id).then(() => setMessage('Fee category deactivated.'))}
                onEdit={setEditingCategory}
                onSubmit={(values) => void saveCategory(values)}
              />
              <StructurePanel
                categories={categories.data?.items ?? []}
                departments={departments.data?.items ?? []}
                editing={editingStructure}
                isPending={createStructure.isPending || updateStructure.isPending}
                programs={programs.data?.items ?? []}
                academicYears={academicYears.data?.items ?? []}
                semesters={semesters.data?.items ?? []}
                structures={structures.data?.items ?? []}
                onDelete={(item) => void deleteStructure.mutateAsync(item.id).then(() => setMessage('Fee structure deactivated.'))}
                onEdit={setEditingStructure}
                onSubmit={(values) => void saveStructure(values)}
              />
            </section>
          )}

          <section className="grid gap-6 xl:grid-cols-2">
            {canManage && (
              <AssignPanel
                isPending={assignFees.isPending}
                structures={structures.data?.items ?? []}
                students={students.data?.items ?? []}
                onSubmit={(values) => void assign(values)}
              />
            )}
            {canPay && (
              <PaymentPanel
                isPending={recordPayment.isPending}
                studentFees={unpaidFees}
                onSubmit={(values) => void pay(values)}
              />
            )}
          </section>

          <RecordsPanel studentFees={studentFees.data?.items ?? []} receipts={receipts.data?.items ?? []} />
        </>
      )}
    </div>
  )
}

function CategoryPanel({ editing, isPending, items, onDelete, onEdit, onSubmit }: {
  editing?: FeeCategory
  isPending: boolean
  items: FeeCategory[]
  onDelete: (item: FeeCategory) => void
  onEdit: (item: FeeCategory) => void
  onSubmit: (values: CategoryForm) => void
}) {
  const form = useForm<CategoryForm>({
    values: editing
      ? { name: editing.name, description: editing.description ?? '', status: editing.status }
      : { name: '', description: '', status: 'Active' },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Categories</CardTitle>
        <CardDescription>Admission, tuition, lab, library, transport, hostel, exam, and other fee heads.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form className="grid gap-3" onSubmit={(event) => void form.handleSubmit((values) => onSubmit(values))(event)}>
          <Input label="Category Name" {...form.register('name', { required: true })} />
          <Textarea label="Description" {...form.register('description')} />
          <Select label="Status" {...form.register('status')}>
            <option>Active</option>
            <option>Inactive</option>
          </Select>
          <Button disabled={isPending} type="submit"><Plus />{editing ? 'Save Category' : 'Create Category'}</Button>
        </form>
        <MiniList items={items} onDelete={onDelete} onEdit={onEdit} primary={(item) => item.name} secondary={(item) => item.status} />
      </CardContent>
    </Card>
  )
}

function StructurePanel({ academicYears, categories, departments, editing, isPending, programs, semesters, structures, onDelete, onEdit, onSubmit }: {
  academicYears: Array<{ id: string; name?: string }>
  categories: FeeCategory[]
  departments: Array<{ id: string; name?: string }>
  editing?: FeeStructure
  isPending: boolean
  programs: Array<{ id: string; name?: string }>
  semesters: Array<{ id: string; name?: string }>
  structures: FeeStructure[]
  onDelete: (item: FeeStructure) => void
  onEdit: (item: FeeStructure) => void
  onSubmit: (values: StructureForm) => void
}) {
  const firstItem = editing?.items?.[0]
  const form = useForm<StructureForm>({
    values: editing
      ? {
          name: editing.name,
          departmentId: refId(editing.departmentId),
          programId: refId(editing.programId),
          academicYearId: refId(editing.academicYearId),
          semesterId: refId(editing.semesterId),
          dueDate: editing.dueDate.slice(0, 10),
          status: editing.status,
          feeCategoryId: refId(firstItem?.feeCategoryId),
          amount: Number(firstItem?.amount ?? editing.totalAmount),
        }
      : {
          name: '',
          departmentId: '',
          programId: '',
          academicYearId: '',
          semesterId: '',
          dueDate: '',
          status: 'Active',
          feeCategoryId: '',
          amount: 0,
        },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Structures</CardTitle>
        <CardDescription>Build a structure for one program, academic year, and semester.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}>
          <Input label="Structure Name" {...form.register('name', { required: true })} />
          <Select label="Department" {...form.register('departmentId', { required: true })}>{options(departments)}</Select>
          <Select label="Program" {...form.register('programId', { required: true })}>{options(programs)}</Select>
          <Select label="Academic Year" {...form.register('academicYearId', { required: true })}>{options(academicYears)}</Select>
          <Select label="Semester" {...form.register('semesterId', { required: true })}>{options(semesters)}</Select>
          <Select label="Fee Category" {...form.register('feeCategoryId', { required: true })}>{options(categories)}</Select>
          <Input label="Amount" type="number" {...form.register('amount', { required: true, valueAsNumber: true })} />
          <Input label="Due Date" type="date" {...form.register('dueDate', { required: true })} />
          <Select label="Status" {...form.register('status')}><option>Active</option><option>Inactive</option></Select>
          <div className="flex items-end">
            <Button className="w-full" disabled={isPending} type="submit"><Plus />{editing ? 'Save Structure' : 'Create Structure'}</Button>
          </div>
        </form>
        <MiniList items={structures} onDelete={onDelete} onEdit={onEdit} primary={(item) => item.name} secondary={(item) => `${displayRef(item.programId)} - ${currency(item.totalAmount)}`} />
      </CardContent>
    </Card>
  )
}

function AssignPanel({ isPending, structures, students, onSubmit }: {
  isPending: boolean
  structures: FeeStructure[]
  students: Array<{ databaseId: string; name: string; registerNumber?: string }>
  onSubmit: (values: AssignForm) => void
}) {
  const form = useForm<AssignForm>({ defaultValues: { feeStructureId: '', studentId: '' } })
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Student Fees</CardTitle>
        <CardDescription>Choose a student or leave student blank to assign to all matching students.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}>
          <Select label="Fee Structure" {...form.register('feeStructureId', { required: true })}>{options(structures)}</Select>
          <Select label="Student" {...form.register('studentId')}>
            <option value="">All matching students</option>
            {students.map((student) => <option key={student.databaseId} value={student.databaseId}>{student.name} {student.registerNumber ? `(${student.registerNumber})` : ''}</option>)}
          </Select>
          <Button disabled={isPending} type="submit"><WalletCards />Assign Fees</Button>
        </form>
      </CardContent>
    </Card>
  )
}

function PaymentPanel({ isPending, studentFees, onSubmit }: {
  isPending: boolean
  studentFees: Array<{ id: string; studentId: unknown; dueAmount: number; status: string }>
  onSubmit: (values: PaymentForm) => void
}) {
  const form = useForm<PaymentForm>({ defaultValues: { studentFeeId: '', amount: 0, method: 'Cash', transactionId: '', paidAt: '', remarks: '' } })
  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Payment</CardTitle>
        <CardDescription>Accountants can collect only against existing student fee assignments.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}>
          <Select className="sm:col-span-2" label="Student Fee" {...form.register('studentFeeId', { required: true })}>
            <option value="">Select student fee</option>
            {studentFees.map((fee) => <option key={fee.id} value={fee.id}>{displayRef(fee.studentId)} - Due {currency(fee.dueAmount)}</option>)}
          </Select>
          <Input label="Amount" type="number" {...form.register('amount', { required: true, valueAsNumber: true })} />
          <Select label="Method" {...form.register('method')}><option>Cash</option><option>Card</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option><option>Online</option></Select>
          <Input label="Transaction ID" {...form.register('transactionId')} />
          <Input label="Paid At" type="date" {...form.register('paidAt')} />
          <Textarea className="sm:col-span-2" label="Remarks" {...form.register('remarks')} />
          <Button className="sm:col-span-2" disabled={isPending} type="submit"><ReceiptText />Record Payment</Button>
        </form>
      </CardContent>
    </Card>
  )
}

function RecordsPanel({ receipts, studentFees }: {
  receipts: Array<{ id: string; receiptNumber: string; studentId: unknown; amount: number; issuedAt: string }>
  studentFees: Array<{ id: string; studentId: unknown; feeStructureId: unknown; totalAmount: number; paidAmount: number; dueAmount: number; status: string }>
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Student Fee Records</CardTitle><CardDescription>{studentFees.length} assignments</CardDescription></CardHeader>
        <CardContent><DataList items={studentFees} render={(item) => (
          <>
            <p className="font-bold">{displayRef(item.studentId)}</p>
            <p className="text-xs text-muted-foreground">{displayRef(item.feeStructureId)} - {item.status}</p>
            <p className="text-sm font-semibold">Paid {currency(item.paidAmount)} / Due {currency(item.dueAmount)}</p>
          </>
        )} /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Fee Receipts</CardTitle><CardDescription>{receipts.length} generated receipts</CardDescription></CardHeader>
        <CardContent><DataList items={receipts} render={(item) => (
          <>
            <p className="font-bold">{item.receiptNumber}</p>
            <p className="text-xs text-muted-foreground">{displayRef(item.studentId)} - {new Date(item.issuedAt).toLocaleDateString()}</p>
            <p className="text-sm font-semibold">{currency(item.amount)}</p>
          </>
        )} /></CardContent>
      </Card>
    </section>
  )
}

function MiniList<T extends { id: string }>({ items, primary, secondary, onDelete, onEdit }: {
  items: T[]
  primary: (item: T) => string
  secondary: (item: T) => string
  onDelete: (item: T) => void
  onEdit: (item: T) => void
}) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-border/70">
      {items.map((item) => (
        <div className="flex items-center justify-between gap-3 border-b border-border/70 p-3 last:border-b-0" key={item.id}>
          <div className="min-w-0"><p className="truncate text-sm font-bold">{primary(item)}</p><p className="truncate text-xs text-muted-foreground">{secondary(item)}</p></div>
          <div className="flex gap-1">
            <Button aria-label="Edit" onClick={() => onEdit(item)} size="icon" type="button" variant="ghost"><Pencil /></Button>
            <Button aria-label="Deactivate" onClick={() => onDelete(item)} size="icon" type="button" variant="ghost"><Trash2 /></Button>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="p-5 text-center text-sm font-semibold text-muted-foreground">No records yet.</p>}
    </div>
  )
}

function DataList<T extends { id: string }>({ items, render }: { items: T[]; render: (item: T) => React.ReactNode }) {
  return (
    <div className="divide-y divide-border/70 overflow-hidden rounded-[18px] border border-border/70">
      {items.map((item) => <div className="space-y-1 p-4" key={item.id}>{render(item)}</div>)}
      {items.length === 0 && <p className="p-6 text-center text-sm font-semibold text-muted-foreground">No records available.</p>}
    </div>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div><p className="text-sm font-semibold text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>
        <Badge className="border-primary/20 bg-primary/10 text-primary">Fees</Badge>
      </CardContent>
    </Card>
  )
}

function Input({ label, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className={`space-y-2 ${className}`}><span className="text-sm font-semibold">{label}</span><input className="h-11 w-full rounded-[16px] border border-border bg-background/75 px-3 text-sm outline-none focus:ring-2 focus:ring-ring" {...props} /></label>
}

function Textarea({ label, className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <label className={`space-y-2 ${className}`}><span className="text-sm font-semibold">{label}</span><textarea className="min-h-20 w-full resize-none rounded-[16px] border border-border bg-background/75 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" {...props} /></label>
}

function Select({ label, className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return <label className={`space-y-2 ${className}`}><span className="text-sm font-semibold">{label}</span><select className="h-11 w-full rounded-[16px] border border-border bg-background/75 px-3 text-sm outline-none focus:ring-2 focus:ring-ring" {...props}>{children}</select></label>
}

function options(items: Array<{ id: string; name?: string }>) {
  return <><option value="">Select</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name ?? item.id}</option>)}</>
}

function currency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}
