import { Badge } from '@/components/ui/badge'
import type { StudentStatus } from '@/hooks/use-students'
import { cn } from '@/lib/utils'

const statusClass: Record<StudentStatus, string> = {
  Active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  Pending: 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  Review: 'border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  Inactive: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

export function StudentStatusBadge({ status }: { status: StudentStatus }) {
  return <Badge className={cn('w-fit', statusClass[status])}>{status}</Badge>
}
