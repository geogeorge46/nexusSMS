import { FileArchive, ShieldCheck, UploadCloud } from 'lucide-react'

import { PageHeader } from '@/components/molecules/page-header'
import { StudentDocumentWorkspace } from '@/components/organisms/student-document-workspace'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { canWriteDocuments } from '@/lib/permissions'

export function StudentDocumentsPage() {
  const { user } = useAuth()
  const canManageDocuments = canWriteDocuments(user)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Secure Records"
        title="Student Documents"
        description="Upload, validate, preview, download, and organize student documents with Cloudinary storage and MongoDB metadata."
        actions={
          <>
            <Button asChild type="button" variant="glass">
              <a href="#document-library">
                <FileArchive />
                Library
              </a>
            </Button>
            {canManageDocuments && (
              <Button asChild type="button">
                <a href="#document-upload">
                  <UploadCloud />
                  Upload
                </a>
              </Button>
            )}
          </>
        }
      />

      <section
        className="overflow-hidden rounded-[20px] border border-white/45 bg-white/70 p-5 shadow-glass backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.07]"
        id="document-upload"
      >
        <div className="mb-5 flex flex-col gap-4 rounded-[18px] border border-border/70 bg-background/55 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-primary">Cloud secure workflow</p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">Validated document vault</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Multer validates file count, type, and size before server-side scan hooks upload to
              Cloudinary. MongoDB stores only the searchable metadata and storage references.
            </p>
          </div>
          <div className="grid size-14 place-items-center rounded-[18px] bg-primary/10 text-primary">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </div>
        </div>

        <div id="document-library">
          <StudentDocumentWorkspace canManageDocuments={canManageDocuments} />
        </div>
      </section>
    </div>
  )
}
