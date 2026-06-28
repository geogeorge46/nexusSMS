import { Award } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { examLabel, getExamErrorMessage, useStudentPortalExamResults } from '@/hooks/use-exams'

export function MyResultsPage() {
  const { data, error, isError, isLoading } = useStudentPortalExamResults()
  if (isError) return <Message title="Results unavailable" message={getExamErrorMessage(error)} />
  return <div className="space-y-5"><GlassCard className="p-6"><Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">My Results</Badge><h1 className="text-3xl font-bold tracking-normal text-foreground">Published Results</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Only published exam results are visible here.</p></GlassCard>{isLoading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton className="h-20" key={index} />)}</div> : <GlassCard className="overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-muted/60 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Exam</th><th className="px-5 py-3">Course</th><th className="px-5 py-3">Marks</th><th className="px-5 py-3">Grade</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-border/70">{data?.items.length ? data.items.map((result) => <tr key={result.id}><td className="px-5 py-4">{examLabel(result.examId)}</td><td className="px-5 py-4">{examLabel(result.courseId, 'title')}</td><td className="px-5 py-4">{result.marksObtained}/{result.maxMarks}</td><td className="px-5 py-4 font-bold">{result.gradeLetter}</td><td className="px-5 py-4"><Badge>{result.resultStatus}</Badge></td></tr>) : <tr><td className="px-5 py-8 text-center text-muted-foreground" colSpan={5}>No published results yet.</td></tr>}</tbody></table></div></GlassCard>}</div>
}

function Message({ title, message }: { title: string; message: string }) {
  return <GlassCard className="p-8 text-center"><Award className="mx-auto mb-3 size-8 text-primary" /><p className="text-lg font-bold text-foreground">{title}</p><p className="mt-2 text-sm text-muted-foreground">{message}</p></GlassCard>
}
