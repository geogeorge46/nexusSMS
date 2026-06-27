import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getStudentPortalErrorMessage, useStudentPortalProfile, useUpdateStudentPortalProfile } from '@/hooks/use-student-portal'

const fields = [
  ['Register Number', 'id'],
  ['Email', 'email'],
  ['Program', 'program'],
  ['Department', 'department'],
  ['Academic Year', 'year'],
  ['Batch/Semester', 'batch'],
  ['Advisor', 'advisor'],
  ['Phone', 'phone'],
  ['Address', 'address'],
  ['Guardian', 'guardianName'],
  ['Guardian Phone', 'guardianPhone'],
  ['Emergency Contact', 'emergencyContact'],
  ['Blood Group', 'bloodGroup'],
] as const

export function MyProfilePage() {
  const { data, error, isError, isLoading } = useStudentPortalProfile()
  const updateProfile = useUpdateStudentPortalProfile()
  const [form, setForm] = useState({ phone: undefined, address: undefined, emergencyContact: undefined, profilePhotoUrl: undefined } as {
    phone?: string
    address?: string
    emergencyContact?: string
    profilePhotoUrl?: string
  })

  if (isError) return <Message title="Profile unavailable" message={getStudentPortalErrorMessage(error)} />

  return (
    <div className="space-y-5">
      <GlassCard className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid size-20 place-items-center rounded-[20px] bg-primary/10 text-xl font-bold text-primary">
            {data?.student.profilePhotoUrl ? <img alt="" className="size-20 rounded-[20px] object-cover" src={data.student.profilePhotoUrl} /> : initials(data?.student.name ?? 'Student')}
          </div>
          <div>
            <Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">My Profile</Badge>
            <h1 className="text-3xl font-bold tracking-normal text-foreground">{data?.student.name ?? 'Student Profile'}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Your official admission and academic profile.</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => <Skeleton className="h-20" key={index} />)}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {fields.map(([label, key]) => (
              <div className="rounded-[18px] border border-border/70 bg-muted/35 p-4" key={key}>
                <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{label}</p>
                <p className="mt-2 text-sm font-bold text-foreground">{data?.student[key] || '-'}</p>
              </div>
            ))}
            <div className="rounded-[18px] border border-border/70 bg-muted/35 p-4">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">Status</p>
              <Badge className="mt-2">{data?.student.status}</Badge>
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-5">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-foreground">Editable Contact Details</h2>
          <p className="mt-1 text-sm text-muted-foreground">Academic details are locked and require office verification.</p>
        </div>
        {updateProfile.isSuccess && (
          <div className="mb-4 rounded-[14px] border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-700">
            Profile contact details updated.
          </div>
        )}
        {updateProfile.isError && (
          <div className="mb-4 rounded-[14px] border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {getStudentPortalErrorMessage(updateProfile.error)}
          </div>
        )}
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault()
            updateProfile.mutate({
              phone: form.phone ?? data?.student.phone ?? '',
              address: form.address ?? data?.student.address ?? '',
              emergencyContact: form.emergencyContact ?? data?.student.emergencyContact ?? '',
              profilePhotoUrl: form.profilePhotoUrl ?? data?.student.profilePhotoUrl ?? '',
            })
          }}
        >
          <EditableField label="Phone" onChange={(phone) => setForm((current) => ({ ...current, phone }))} value={form.phone ?? data?.student.phone ?? ''} />
          <EditableField label="Emergency Contact" onChange={(emergencyContact) => setForm((current) => ({ ...current, emergencyContact }))} value={form.emergencyContact ?? data?.student.emergencyContact ?? ''} />
          <EditableField label="Profile Photo URL" onChange={(profilePhotoUrl) => setForm((current) => ({ ...current, profilePhotoUrl }))} value={form.profilePhotoUrl ?? data?.student.profilePhotoUrl ?? ''} />
          <label className="sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">Address</span>
            <textarea
              className="mt-2 min-h-24 w-full rounded-[14px] border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              value={form.address ?? data?.student.address ?? ''}
            />
          </label>
          <div className="sm:col-span-2">
            <Button disabled={updateProfile.isPending || data?.student.status !== 'Active'} type="submit">
              {updateProfile.isPending ? 'Saving...' : 'Save Contact Details'}
            </Button>
            {data?.student.status !== 'Active' && <p className="mt-2 text-xs text-muted-foreground">Only active students can update contact details.</p>}
          </div>
        </form>
      </GlassCard>
    </div>
  )
}

function EditableField({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label>
      <span className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{label}</span>
      <input
        className="mt-2 h-11 w-full rounded-[14px] border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  )
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}

function Message({ title, message }: { title: string; message: string }) {
  return (
    <GlassCard className="p-8 text-center">
      <p className="text-lg font-bold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </GlassCard>
  )
}
