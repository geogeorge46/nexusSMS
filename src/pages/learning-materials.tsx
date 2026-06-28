import { LibraryBig } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getLmsErrorMessage, lmsLabel, useStudentPortalMaterials } from '@/hooks/use-lms'

export function LearningMaterialsPage() {
  const { data, error, isError, isLoading } = useStudentPortalMaterials()
  if (isError) return <Message title="Materials unavailable" message={getLmsErrorMessage(error)} />
  return <div className="space-y-5"><GlassCard className="p-6"><Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">Learning Materials</Badge><h1 className="text-3xl font-bold tracking-normal text-foreground">Course Resources</h1><p className="mt-2 text-sm text-muted-foreground">Published notes, links, PDFs, slides, videos, and code from enrolled courses.</p></GlassCard>{isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton className="h-32" key={i} />)}</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data?.items.length ? data.items.map((item) => <GlassCard className="p-5" key={item.id}><Badge>{item.materialType}</Badge><p className="mt-3 font-bold">{item.title}</p><p className="text-sm text-muted-foreground">{lmsLabel(item.courseId, 'title')}</p><p className="mt-2 text-sm text-muted-foreground">{item.description}</p>{(item.fileUrl || item.externalUrl) && <Button asChild className="mt-4" size="sm" variant="glass"><a href={item.fileUrl || item.externalUrl} rel="noreferrer" target="_blank">Open</a></Button>}</GlassCard>) : <Message title="No materials" message="Materials will appear when teachers publish them." />}</div>}</div>
}

function Message({ title, message }: { title: string; message: string }) { return <GlassCard className="p-8 text-center"><LibraryBig className="mx-auto mb-3 size-8 text-primary" /><p className="text-lg font-bold">{title}</p><p className="mt-2 text-sm text-muted-foreground">{message}</p></GlassCard> }
