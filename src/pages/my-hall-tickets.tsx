import { TicketCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { examLabel, getExamErrorMessage, useStudentPortalHallTickets } from '@/hooks/use-exams'

export function MyHallTicketsPage() {
  const { data, error, isError, isLoading } = useStudentPortalHallTickets()
  if (isError) return <Message title="Hall tickets unavailable" message={getExamErrorMessage(error)} />
  return <div className="space-y-5"><GlassCard className="p-6"><Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">My Hall Tickets</Badge><h1 className="text-3xl font-bold tracking-normal text-foreground">Hall Tickets</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Eligibility-checked hall tickets and blocked reasons.</p></GlassCard>{isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton className="h-36" key={index} />)}</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data?.items.length ? data.items.map((ticket) => <GlassCard className="p-5" key={ticket.id}><Badge>{ticket.status}</Badge><p className="mt-3 font-bold">{ticket.hallTicketNumber}</p><p className="text-sm text-muted-foreground">{examLabel(ticket.examId)}</p>{ticket.reason && <p className="mt-2 rounded-[14px] bg-rose-500/10 p-2 text-xs font-semibold text-rose-700">{ticket.reason}</p>}</GlassCard>) : <Message title="No hall tickets yet" message="Hall tickets will appear after generation by admin." />}</div>}</div>
}

function Message({ title, message }: { title: string; message: string }) {
  return <GlassCard className="p-8 text-center"><TicketCheck className="mx-auto mb-3 size-8 text-primary" /><p className="text-lg font-bold text-foreground">{title}</p><p className="mt-2 text-sm text-muted-foreground">{message}</p></GlassCard>
}
