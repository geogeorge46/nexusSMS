import { ExternalLink } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getStudentPortalErrorMessage, useStudentPortalDocuments } from '@/hooks/use-student-portal'
import { formatFileSize } from '@/lib/student-documents'

export function MyDocumentsPage() {
  const { data, error, isError, isLoading } = useStudentPortalDocuments()

  if (isError) return <Message title="Documents unavailable" message={getStudentPortalErrorMessage(error)} />

  return (
    <div className="space-y-5">
      <GlassCard className="p-6">
        <Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">My Documents</Badge>
        <h1 className="text-3xl font-bold tracking-normal text-foreground">{data?.total ?? 0} documents</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Admission and academic documents stored on your profile.</p>
      </GlassCard>

      <GlassCard className="overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton className="h-16" key={index} />)}
          </div>
        ) : data?.documents.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Document</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Size</th>
                  <th className="px-5 py-3">Uploaded</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {data.documents.map((document) => (
                  <tr key={document._id}>
                    <td className="px-5 py-4">
                      <p className="font-bold text-foreground">{document.title}</p>
                      <p className="text-xs text-muted-foreground">{document.fileName}</p>
                    </td>
                    <td className="px-5 py-4"><Badge>{document.documentType}</Badge></td>
                    <td className="px-5 py-4">{formatFileSize(document.fileSize)}</td>
                    <td className="px-5 py-4">{new Date(document.uploadedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <Button asChild size="sm" variant="glass">
                        <a href={document.downloadUrl || document.fileUrl} rel="noreferrer" target="_blank">
                          <ExternalLink className="size-4" />
                          Open
                        </a>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Message title="No documents uploaded" message="Verified documents will appear here after office processing." compact />
        )}
      </GlassCard>
    </div>
  )
}

function Message({ title, message, compact = false }: { title: string; message: string; compact?: boolean }) {
  const className = compact ? 'p-8 text-center' : 'rounded-[18px] border border-border/70 bg-background/70 p-8 text-center'
  return (
    <div className={className}>
      <p className="text-lg font-bold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
