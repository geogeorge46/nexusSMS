import { GripVertical, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type DashboardWidgetProps = {
  title: string
  description: string
  icon: LucideIcon
  children: ReactNode
  className?: string
  isDragging?: boolean
  draggable?: boolean
  onDragStart?: () => void
  onDragEnter?: () => void
  onDragEnd?: () => void
}

export function DashboardWidget({
  title,
  description,
  icon: Icon,
  children,
  className,
  isDragging,
  draggable,
  onDragEnd,
  onDragEnter,
  onDragStart,
}: DashboardWidgetProps) {
  return (
    <Card
      className={cn(
        'min-h-72 overflow-hidden bg-white/70 backdrop-blur-2xl transition dark:bg-white/[0.07]',
        draggable && 'cursor-grab active:cursor-grabbing',
        isDragging && 'scale-[0.99] opacity-60 ring-2 ring-primary/30',
        className,
      )}
      draggable={draggable}
      onDragEnd={onDragEnd}
      onDragEnter={(event) => {
        event.preventDefault()
        onDragEnter?.()
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragStart={onDragStart}
    >
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <CardTitle className="truncate">{title}</CardTitle>
          </div>
          <CardDescription className="mt-2">{description}</CardDescription>
        </div>
        {draggable && (
          <span aria-hidden="true" className="mt-1 rounded-xl p-1 text-muted-foreground">
            <GripVertical className="size-4" />
          </span>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function WidgetSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton className="h-14" key={index} />
      ))}
    </div>
  )
}

export function WidgetEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="grid min-h-40 place-items-center rounded-[20px] border border-dashed border-border bg-muted/35 p-6 text-center">
      <div>
        <Icon className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
        <p className="mt-3 text-sm font-bold text-foreground">{title}</p>
        <p className="mt-1 max-w-xs text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
