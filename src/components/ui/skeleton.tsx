import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-2xl bg-muted/70 shadow-inner dark:bg-white/10',
        className,
      )}
      {...props}
    />
  )
}
