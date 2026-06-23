import type { ReactNode } from 'react'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        )}
        <h1 className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
