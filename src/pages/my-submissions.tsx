import { ClipboardCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getLmsErrorMessage, lmsLabel, useStudentPortalSubmissions } from '@/hooks/use-lms'

export function MySubmissionsPage() {
  const { data, error, isError, isLoading } = useStudentPortalSubmissions()
  if (isError) return <Message title="Submissions unavailable" message={getLmsErrorMessage(error)} />
  return <div className="space-y-5"><GlassCard className="p-6"><Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">My Submissions</Badge><h1 className="text-3xl font-bold tracking-normal text-foreground">Submission History</h1><p className="mt-2 text-sm text-muted-foreground">Your submitted assignments, marks, and teacher feedback.</p></GlassCard>{isLoading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton className="h-24" key={i} />)}</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data?.items.length ? data.items.map((item) => <GlassCard className="p-5" key={item.id}><Badge>{item.status}</Badge><p className="mt-3 font-bold">{lmsLabel(item.assignmentId)}</p><p className="text-sm text-muted-foreground">{lmsLabel(item.courseId, 'title')}</p><p className="text-sm text-muted-foreground">Submitted {new Date(item.submittedAt).toLocaleString()}</p>{item.marksObtained !== undefined && <p className="mt-2 font-bold">Marks: {item.marksObtained}</p>}{item.feedback && <p className="mt-2 rounded-[14px] bg-muted/60 p-2 text-sm">{item.feedback}</p>}</GlassCard>) : <Message title="No submissions" message="Submitted assignments will appear here." />}</div>}</div>
}

function Message({ title, message }: { title: string; message: string }) { return <GlassCard className="p-8 text-center"><ClipboardCheck className="mx-auto mb-3 size-8 text-primary" /><p className="text-lg font-bold">{title}</p><p className="mt-2 text-sm text-muted-foreground">{message}</p></GlassCard> }
