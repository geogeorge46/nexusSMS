import { Badge } from '@/components/ui/badge'
import type { GradeStatus } from '@/hooks/use-grades'
import { cn } from '@/lib/utils'

const statusClass: Record<GradeStatus, string> = {
  Published: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Review: 'border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  Draft: 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
}

export function GradeStatusChip({ status }: { status: GradeStatus }) {
  return <Badge className={cn('w-fit', statusClass[status])}>{status}</Badge>
}
