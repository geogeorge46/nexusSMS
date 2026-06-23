import type { LucideIcon } from 'lucide-react'

import { PageHeader } from '@/components/molecules/page-header'
import { Card, CardContent } from '@/components/ui/card'

type SimplePageProps = {
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
}

export function SimplePage({ eyebrow, title, description, icon: Icon }: SimplePageProps) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <Card>
        <CardContent className="grid min-h-[360px] place-items-center p-8 text-center">
          <div>
            <div className="mx-auto grid size-16 place-items-center rounded-[20px] bg-primary/10 text-primary">
              <Icon className="size-7" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-foreground">{title}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
