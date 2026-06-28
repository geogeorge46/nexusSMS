import { ClipboardList } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { examLabel, getExamErrorMessage, useStudentPortalExams } from '@/hooks/use-exams'

export function MyExamsPage() {
  const { data, error, isError, isLoading } = useStudentPortalExams()
  if (isError) return <Message title="Exams unavailable" message={getExamErrorMessage(error)} />
  return <PortalList title="My Exams" subtitle="Exams for your current program and semester." loading={isLoading} items={data?.items ?? []} render={(exam) => <><Badge>{exam.status}</Badge><p className="mt-2 font-bold">{exam.title}</p><p className="text-sm text-muted-foreground">{exam.examType} - {examLabel(exam.programId)}</p></>} />
}

function PortalList<T extends { id: string }>({ title, subtitle, loading, items, render }: { title: string; subtitle: string; loading: boolean; items: T[]; render: (item: T) => React.ReactNode }) {
  return <div className="space-y-5"><GlassCard className="p-6"><Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">{title}</Badge><h1 className="text-3xl font-bold tracking-normal text-foreground">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p></GlassCard>{loading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton className="h-32" key={index} />)}</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.length ? items.map((item) => <GlassCard className="p-5" key={item.id}>{render(item)}</GlassCard>) : <Message title="No records yet" message="Exam records will appear here when published by the academic office." />}</div>}</div>
}

function Message({ title, message }: { title: string; message: string }) {
  return <GlassCard className="p-8 text-center"><ClipboardList className="mx-auto mb-3 size-8 text-primary" /><p className="text-lg font-bold text-foreground">{title}</p><p className="mt-2 text-sm text-muted-foreground">{message}</p></GlassCard>
}
