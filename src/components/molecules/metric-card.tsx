import type { LucideIcon } from 'lucide-react'

import { GlassCard } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type MetricCardProps = {
  label: string
  value: string
  helper: string
  icon: LucideIcon
  tone?: 'blue' | 'green' | 'violet' | 'amber'
}

const toneClass = {
  blue: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
  green: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
  violet: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
  amber: 'bg-amber-500/14 text-amber-800 dark:text-amber-300',
}

export function MetricCard({ label, value, helper, icon: Icon, tone = 'blue' }: MetricCardProps) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-normal text-foreground">{value}</p>
        </div>
        <div className={cn('grid size-11 place-items-center rounded-2xl', toneClass[tone])}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">{helper}</p>
    </GlassCard>
  )
}
