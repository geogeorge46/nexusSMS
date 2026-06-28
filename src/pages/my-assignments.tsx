import { ClipboardList } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getLmsErrorMessage, lmsLabel, useStudentPortalAssignments, useSubmitAssignment, type Assignment } from '@/hooks/use-lms'

type SubmitForm = { submissionText: string; fileUrl: string; fileName: string }

export function MyAssignmentsPage() {
  const [selected, setSelected] = useState<Assignment>()
  const { data, error, isError, isLoading } = useStudentPortalAssignments()
  const submit = useSubmitAssignment()
  const form = useForm<SubmitForm>({ defaultValues: { submissionText: '', fileUrl: '', fileName: '' } })
  if (isError) return <Message title="Assignments unavailable" message={getLmsErrorMessage(error)} />
  return <div className="space-y-5"><GlassCard className="p-6"><Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">My Assignments</Badge><h1 className="text-3xl font-bold tracking-normal text-foreground">Assignments</h1><p className="mt-2 text-sm text-muted-foreground">Published coursework from your enrolled courses.</p></GlassCard>{submit.error && <p className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-semibold text-rose-700">{getLmsErrorMessage(submit.error)}</p>}{isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton className="h-36" key={i} />)}</div> : <section className="grid gap-6 xl:grid-cols-[1fr_420px]"><div className="grid gap-4 md:grid-cols-2">{data?.items.length ? data.items.map((item) => <GlassCard className="p-5" key={item.id}><Badge>{item.status}</Badge><p className="mt-3 font-bold">{item.title}</p><p className="text-sm text-muted-foreground">{lmsLabel(item.courseId, 'title')}</p><p className="text-sm text-muted-foreground">Due {new Date(item.dueDate).toLocaleString()}</p><Button className="mt-4" onClick={() => setSelected(item)} size="sm" type="button" variant="glass">Submit</Button></GlassCard>) : <Message title="No assignments" message="Assignments will appear here when teachers publish them." />}</div><GlassCard className="p-5"><h2 className="text-lg font-bold">Submit Assignment</h2>{selected ? <form className="mt-4 grid gap-3" onSubmit={(event) => void form.handleSubmit((values) => submit.mutateAsync({ id: selected.id, payload: values }))(event)}><p className="text-sm font-semibold">{selected.title}</p><textarea className="min-h-28 rounded-[16px] border border-border bg-background/75 p-3 text-sm" placeholder="Submission text" {...form.register('submissionText')} /><input className="h-11 rounded-[16px] border border-border bg-background/75 px-3 text-sm" placeholder="File URL" {...form.register('fileUrl')} /><input className="h-11 rounded-[16px] border border-border bg-background/75 px-3 text-sm" placeholder="File name" {...form.register('fileName')} /><Button disabled={submit.isPending} type="submit">Submit</Button></form> : <p className="mt-3 text-sm text-muted-foreground">Choose an assignment to submit.</p>}</GlassCard></section>}</div>
}

function Message({ title, message }: { title: string; message: string }) { return <GlassCard className="p-8 text-center"><ClipboardList className="mx-auto mb-3 size-8 text-primary" /><p className="text-lg font-bold">{title}</p><p className="mt-2 text-sm text-muted-foreground">{message}</p></GlassCard> }
