import { cn } from '@/lib/utils'

export function CapacityIndicator({
  enrolled,
  capacity,
  compact = false,
}: {
  enrolled: number
  capacity: number
  compact?: boolean
}) {
  const percent = Math.min(100, Math.round((enrolled / capacity) * 100))
  const tone =
    percent >= 95
      ? 'bg-rose-500'
      : percent >= 80
        ? 'bg-amber-500'
        : 'bg-emerald-500'

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-muted-foreground">Capacity</span>
        <span className="font-bold text-foreground">
          {enrolled}/{capacity}
        </span>
      </div>
      <div className={cn('overflow-hidden rounded-full bg-muted', compact ? 'h-2' : 'h-3')}>
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
