import { Badge } from '@/components/ui/badge'
import type { CourseStatus } from '@/hooks/use-courses'
import { cn } from '@/lib/utils'

const statusClass: Record<CourseStatus, string> = {
  Active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Draft: 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  Review: 'border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  Archived: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

export function CourseStatusChip({ status }: { status: CourseStatus }) {
  return <Badge className={cn('w-fit', statusClass[status])}>{status}</Badge>
}
