import { product } from '@/config/navigation'
import { cn } from '@/lib/utils'

type BrandMarkProps = {
  compact?: boolean
  className?: string
}

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  const Icon = product.icon

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="grid size-11 place-items-center rounded-[18px] bg-primary text-primary-foreground shadow-soft">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-base font-bold leading-5 text-foreground">{product.name}</p>
          <p className="truncate text-xs font-medium text-muted-foreground">{product.descriptor}</p>
        </div>
      )}
    </div>
  )
}
