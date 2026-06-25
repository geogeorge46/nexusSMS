import { ChevronLeft, ChevronRight, Edit3, KeyRound, Search, ShieldCheck, Trash2, UserCheck, UserPlus, UserX, X } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getAdminErrorMessage,
  useAdmins,
  useCreateAdmin,
  useDeleteAdmin,
  useResetAdminPassword,
  useUpdateAdmin,
  type AdminAccount,
  type AdminFilters,
  type AdminRole,
} from '@/hooks/use-admins'
import { useAuth } from '@/hooks/use-auth'

const initialFilters: AdminFilters = { search: '', role: 'All', status: 'All', page: 1 }

export function AdminManagementWorkspace() {
  const { user } = useAuth()
  const [filters, setFilters] = useState(initialFilters)
  const [editor, setEditor] = useState<'create' | AdminAccount | null>(null)
  const [resetId, setResetId] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const adminsQuery = useAdmins(filters)
  const createMutation = useCreateAdmin()
  const updateMutation = useUpdateAdmin()
  const resetMutation = useResetAdminPassword()
  const deleteMutation = useDeleteAdmin()
  const data = adminsQuery.data
  const actionError = createMutation.error ?? updateMutation.error ?? resetMutation.error ?? deleteMutation.error

  function updateFilters(next: Partial<AdminFilters>) {
    setFilters((current) => ({ ...current, ...next, page: next.page ?? 1 }))
  }

  function clearMutationErrors() {
    createMutation.reset()
    updateMutation.reset()
    resetMutation.reset()
    deleteMutation.reset()
  }

  async function saveAdmin(values: { name: string; email: string; role: AdminRole; password?: string; status?: AdminAccount['status'] }) {
    try {
      if (editor === 'create') {
        await createMutation.mutateAsync({ ...values, password: values.password ?? '' })
      } else if (editor) {
        await updateMutation.mutateAsync({ id: editor.id, name: values.name, email: values.email, role: values.role, status: values.status })
      }
      setEditor(null)
    } catch {
      // Mutation state renders the server validation message.
    }
  }

  async function resetPassword() {
    if (!resetId || !password) return
    try {
      await resetMutation.mutateAsync({ id: resetId, password })
      setResetId(null)
      setPassword('')
    } catch {
      // Mutation state renders the server validation message.
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {adminsQuery.isLoading || !data ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton className="h-28" key={index} />)
        ) : (
          <>
            <AdminMetric label="Administrators" value={data.summary.total} />
            <AdminMetric label="Active" value={data.summary.active} />
            <AdminMetric label="Suspended" value={data.summary.suspended} />
            <AdminMetric label="Super Admins" value={data.summary.superAdmins} />
          </>
        )}
      </section>

      {editor && (
        <AdminEditor
          admin={editor === 'create' ? undefined : editor}
          error={actionError ? getAdminErrorMessage(actionError) : ''}
          isSelf={editor !== 'create' && editor.id === user?.id}
          key={editor === 'create' ? 'create' : editor.id}
          onCancel={() => setEditor(null)}
          onSubmit={saveAdmin}
          pending={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <GlassCard className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Administrative Accounts</h2>
            <p className="mt-1 text-sm text-muted-foreground">Provision access, assign roles, and control account status.</p>
          </div>
          <Button onClick={() => { clearMutationErrors(); setEditor('create') }} type="button">
            <UserPlus /> Create Admin
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(240px,1fr)_180px_180px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input className="h-10 w-full rounded-2xl border border-border bg-background/75 pl-9 pr-3 text-sm font-medium outline-none ring-ring focus:ring-2" onChange={(event) => updateFilters({ search: event.target.value })} placeholder="Search name or email" value={filters.search} />
          </label>
          <FilterSelect onChange={(role) => updateFilters({ role })} options={['All', 'Admin', 'Super Admin']} value={filters.role} />
          <FilterSelect onChange={(status) => updateFilters({ status })} options={['All', 'Active', 'Suspended']} value={filters.status} />
        </div>

        {actionError && !editor && (
          <p className="mt-4 rounded-[18px] bg-rose-500/10 p-3 text-sm font-semibold text-rose-700 dark:text-rose-300">{getAdminErrorMessage(actionError)}</p>
        )}

        <div className="mt-5 overflow-hidden rounded-[20px] border border-border/70">
          {adminsQuery.isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, index) => <Skeleton className="h-20" key={index} />)}</div>
          ) : adminsQuery.isError ? (
            <div className="p-8 text-center text-sm font-semibold text-rose-700 dark:text-rose-300">{getAdminErrorMessage(adminsQuery.error)}</div>
          ) : !data?.items.length ? (
            <div className="p-8 text-center text-sm font-semibold text-muted-foreground">No admin accounts match the selected filters.</div>
          ) : (
            data.items.map((admin) => {
              const isSelf = admin.id === user?.id
              const pending = updateMutation.isPending || deleteMutation.isPending
              return (
                <article className="border-b border-border/70 bg-background/60 p-4 last:border-b-0" key={admin.id}>
                  <div className="grid gap-4 xl:grid-cols-[minmax(220px,1fr)_160px_140px_180px_240px] xl:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2"><p className="truncate text-sm font-bold text-foreground">{admin.name}</p>{isSelf && <Badge>You</Badge>}</div>
                      <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">{admin.email}</p>
                    </div>
                    <Badge className={admin.role === 'Super Admin' ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300' : ''}>{admin.role}</Badge>
                    <Badge className={admin.status === 'Active' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'}>{admin.status}</Badge>
                    <div className="text-xs font-semibold text-muted-foreground"><p>Created {new Date(admin.createdAt).toLocaleDateString()}</p><p className="mt-1">{admin.lastLoginAt ? `Login ${new Date(admin.lastLoginAt).toLocaleDateString()}` : 'Never signed in'}</p></div>
                    <div className="flex flex-wrap gap-1 xl:justify-end">
                      <Button aria-label={`Edit ${admin.name}`} onClick={() => { clearMutationErrors(); setEditor(admin) }} size="icon" type="button" variant="ghost"><Edit3 /></Button>
                      <Button aria-label={`Reset password for ${admin.name}`} onClick={() => { clearMutationErrors(); setResetId(admin.id); setPassword('') }} size="icon" type="button" variant="ghost"><KeyRound /></Button>
                      <Button aria-label={`${admin.status === 'Active' ? 'Suspend' : 'Activate'} ${admin.name}`} disabled={pending || (isSelf && admin.status === 'Active')} onClick={() => updateMutation.mutate({ id: admin.id, status: admin.status === 'Active' ? 'Suspended' : 'Active' })} size="icon" type="button" variant="ghost">{admin.status === 'Active' ? <UserX /> : <UserCheck />}</Button>
                      <Button aria-label={`Delete ${admin.name}`} disabled={pending || isSelf} onClick={() => { if (window.confirm(`Delete ${admin.name}? This cannot be undone.`)) deleteMutation.mutate(admin.id) }} size="icon" type="button" variant="ghost"><Trash2 /></Button>
                    </div>
                  </div>
                  {resetId === admin.id && (
                    <div className="mt-4 flex flex-col gap-2 rounded-[18px] border border-border bg-muted/35 p-3 sm:flex-row">
                      <input className="h-10 flex-1 rounded-2xl border border-border bg-background px-3 text-sm outline-none ring-ring focus:ring-2" onChange={(event) => setPassword(event.target.value)} placeholder="New secure password" type="password" value={password} />
                      <Button disabled={!password || resetMutation.isPending} onClick={() => void resetPassword()} type="button"><KeyRound /> Reset</Button>
                      <Button onClick={() => setResetId(null)} size="icon" type="button" variant="ghost"><X /></Button>
                    </div>
                  )}
                </article>
              )
            })
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <Button disabled={filters.page <= 1} onClick={() => updateFilters({ page: filters.page - 1 })} type="button" variant="glass"><ChevronLeft /> Previous</Button>
          <p className="text-sm font-semibold text-muted-foreground">Page {data?.pagination.page ?? 1} of {data?.pagination.pages ?? 1}</p>
          <Button disabled={filters.page >= (data?.pagination.pages ?? 1)} onClick={() => updateFilters({ page: filters.page + 1 })} type="button" variant="glass">Next <ChevronRight /></Button>
        </div>
      </GlassCard>
    </div>
  )
}

function AdminEditor({ admin, error, isSelf, onCancel, onSubmit, pending }: { admin?: AdminAccount; error: string; isSelf: boolean; onCancel: () => void; onSubmit: (values: { name: string; email: string; role: AdminRole; password?: string; status?: AdminAccount['status'] }) => Promise<void>; pending: boolean }) {
  const [values, setValues] = useState({ name: admin?.name ?? '', email: admin?.email ?? '', role: admin?.role ?? 'Admin' as AdminRole, status: admin?.status ?? 'Active' as AdminAccount['status'], password: '' })
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-foreground">{admin ? 'Edit Administrator' : 'Create Administrator'}</h2><p className="mt-1 text-sm text-muted-foreground">{admin ? 'Update identity, role, and account access.' : 'Issue a secure administrative account.'}</p></div><Button onClick={onCancel} size="icon" type="button" variant="ghost"><X /></Button></div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AdminField label="Name" onChange={(name) => setValues({ ...values, name })} value={values.name} />
        <AdminField label="Email" onChange={(email) => setValues({ ...values, email })} type="email" value={values.email} />
        <label className="space-y-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Role</span><select className="h-11 w-full rounded-2xl border border-border bg-background/75 px-3 text-sm font-semibold outline-none ring-ring focus:ring-2" onChange={(event) => setValues({ ...values, role: event.target.value as AdminRole })} value={values.role}><option>Admin</option><option>Super Admin</option></select></label>
        {admin ? (
          <label className="space-y-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Status</span><select className="h-11 w-full rounded-2xl border border-border bg-background/75 px-3 text-sm font-semibold outline-none ring-ring focus:ring-2" disabled={isSelf} onChange={(event) => setValues({ ...values, status: event.target.value as AdminAccount['status'] })} value={values.status}><option>Active</option><option>Suspended</option></select></label>
        ) : <AdminField label="Temporary Password" onChange={(password) => setValues({ ...values, password })} type="password" value={values.password} />}
      </div>
      {!admin && <p className="mt-3 text-xs font-semibold text-muted-foreground">Use 10+ characters with uppercase, lowercase, number, and special character.</p>}
      {error && <p className="mt-4 rounded-[18px] bg-rose-500/10 p-3 text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>}
      <Button className="mt-5" disabled={pending || !values.name || !values.email || (!admin && !values.password)} onClick={() => void onSubmit(values)} type="button"><ShieldCheck />{pending ? 'Saving...' : admin ? 'Save Changes' : 'Create Admin'}</Button>
    </GlassCard>
  )
}

function AdminMetric({ label, value }: { label: string; value: number }) {
  return <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>{label}</CardTitle><p className="mt-2 text-3xl font-bold text-foreground">{value}</p></div><div className="grid size-12 place-items-center rounded-[18px] bg-primary/10 text-primary"><ShieldCheck className="size-5" /></div></CardHeader><CardContent><p className="text-sm text-muted-foreground">Protected administrative access.</p></CardContent></Card>
}

function AdminField({ label, onChange, type = 'text', value }: { label: string; onChange: (value: string) => void; type?: string; value: string }) {
  return <label className="space-y-2"><span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span><input className="h-11 w-full rounded-2xl border border-border bg-background/75 px-3 text-sm font-semibold outline-none ring-ring focus:ring-2" onChange={(event) => onChange(event.target.value)} type={type} value={value} /></label>
}

function FilterSelect({ onChange, options, value }: { onChange: (value: string) => void; options: string[]; value: string }) {
  return <select className="h-10 rounded-2xl border border-border bg-background/75 px-3 text-sm font-semibold outline-none ring-ring focus:ring-2" onChange={(event) => onChange(event.target.value)} value={value}>{options.map((option) => <option key={option}>{option}</option>)}</select>
}
