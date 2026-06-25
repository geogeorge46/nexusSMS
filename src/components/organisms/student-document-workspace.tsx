import {
  Download,
  Eye,
  FileArchive,
  FileCheck2,
  FileText,
  Image,
  Loader2,
  Search,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'

import { OptimizedImage } from '@/components/atoms/optimized-image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  acceptedDocumentExtensions,
  deleteStudentDocument,
  documentCategories,
  fetchStudentDocuments,
  formatFileSize,
  getStudentDocumentErrorMessage,
  getStudentDocumentDownloadUrl,
  uploadStudentDocuments,
  validateDocumentFiles,
  type DocumentCategory,
  type StudentDocument,
} from '@/lib/student-documents'
import { cn } from '@/lib/utils'
import { useStudents } from '@/hooks/use-students'

export function StudentDocumentWorkspace() {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [category, setCategory] = useState<DocumentCategory>('All')
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('Academic')
  const [search, setSearch] = useState('')
  const [studentId, setStudentId] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedDocument, setSelectedDocument] = useState<StudentDocument | null>(null)
  const [metadata, setMetadata] = useState({
    title: '',
    studentId: '',
  })
  const studentsQuery = useStudents({ search: '', status: 'All', department: 'All', page: 1, limit: 100 })

  const documentsQuery = useQuery({
    queryKey: ['student-documents', category, search, studentId],
    queryFn: () => fetchStudentDocuments({ category, search, studentId: studentId || undefined }),
    retry: 1,
  })

  const data = documentsQuery.data ?? { documents: [], grouped: [], total: 0 }
  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase()

    return data.documents.filter((document) => {
      const matchesCategory = category === 'All' || document.category === category
      const matchesSearch =
        !query ||
        [document.title, document.originalName, document.studentName, document.registerNumber]
          .join(' ')
          .toLowerCase()
          .includes(query)

      return matchesCategory && matchesSearch
    })
  }, [category, data.documents, search])

  const uploadMutation = useMutation({
    mutationFn: () =>
      uploadStudentDocuments(
        {
          files,
          category: uploadCategory,
          title: metadata.title,
          studentId: metadata.studentId,
        },
        setUploadProgress,
      ),
    onSuccess() {
      setFiles([])
      setMetadata({ title: '', studentId: '' })
      setUploadProgress(100)
      void queryClient.invalidateQueries({ queryKey: ['student-documents'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteStudentDocument,
    onSuccess() {
      setSelectedDocument(null)
      void queryClient.invalidateQueries({ queryKey: ['student-documents'] })
    },
  })

  function queueFiles(nextFiles: File[]) {
    const errors = validateDocumentFiles(nextFiles)
    setValidationErrors(errors)

    if (errors.length === 0) {
      setFiles(nextFiles)
      setUploadProgress(0)
    }
  }

  function removeQueuedFile(fileName: string) {
    setFiles((current) => current.filter((file) => file.name !== fileName))
  }

  function runUpload() {
    if (files.length === 0) return
    setUploadProgress(8)
    uploadMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <UploadPanel
          files={files}
          inputRef={inputRef}
          metadata={metadata}
          students={studentsQuery.data?.items ?? []}
          onMetadataChange={setMetadata}
          onQueueFiles={queueFiles}
          onRemoveFile={removeQueuedFile}
          onUpload={runUpload}
          progress={uploadProgress}
          uploadCategory={uploadCategory}
          uploadError={uploadMutation.error ? getStudentDocumentErrorMessage(uploadMutation.error) : ''}
          uploadPending={uploadMutation.isPending}
          validationErrors={validationErrors}
          onUploadCategoryChange={setUploadCategory}
        />
        <DocumentPreview
          document={selectedDocument}
          deleting={deleteMutation.isPending}
          deleteError={deleteMutation.error ? getStudentDocumentErrorMessage(deleteMutation.error) : ''}
          onDelete={(documentId) => deleteMutation.mutate(documentId)}
          onClose={() => {
            deleteMutation.reset()
            setSelectedDocument(null)
          }}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={FileArchive} label="Documents" value={String(data.total)} />
        <MetricCard icon={ShieldCheck} label="Validated" value={String(data.documents.length)} />
        <MetricCard
          icon={Image}
          label="Previewable"
          value={String(data.documents.filter((document) => isPreviewable(document)).length)}
        />
        <MetricCard
          icon={FileCheck2}
          label="Categories"
          value={String(data.grouped.filter((group) => group.count > 0).length)}
        />
      </section>

      <GlassCard className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Document Library</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Organized by category with secure download, preview, and deletion controls.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-10 w-full rounded-2xl border border-border bg-background/75 pl-9 pr-3 text-sm font-medium outline-none ring-ring transition placeholder:text-muted-foreground focus:ring-2 sm:w-72"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search documents"
                value={search}
              />
            </label>
            <select
              className="h-10 rounded-2xl border border-border bg-background/75 px-3 text-sm font-semibold text-foreground outline-none ring-ring focus:ring-2"
              disabled={studentsQuery.isLoading || studentsQuery.isError}
              onChange={(event) => setCategory(event.target.value as DocumentCategory)}
              value={category}
            >
              {documentCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-2xl border border-border bg-background/75 px-3 text-sm font-semibold text-foreground outline-none ring-ring focus:ring-2"
              onChange={(event) => setStudentId(event.target.value)}
              value={studentId}
            >
              <option value="">
                {studentsQuery.isLoading ? 'Loading students...' : studentsQuery.isError ? 'Students unavailable' : 'All students'}
              </option>
              {(studentsQuery.data?.items ?? []).map((student) => <option key={student.databaseId} value={student.databaseId}>{student.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {documentsQuery.isLoading ? (
            Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-44" />)
          ) : documentsQuery.isError ? (
            <div className="col-span-full rounded-[20px] border border-rose-500/30 bg-rose-500/10 p-8 text-center text-sm font-semibold text-rose-700">
              {getStudentDocumentErrorMessage(documentsQuery.error)}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="col-span-full rounded-[20px] border border-dashed border-border bg-muted/35 p-8 text-center text-sm font-semibold text-muted-foreground">
              No documents match the selected filters.
            </div>
          ) : (
            filteredDocuments.map((document, index) => (
              <DocumentCard
                document={document}
                index={index}
                key={document._id}
                onPreview={() => {
                  deleteMutation.reset()
                  setSelectedDocument(document)
                }}
              />
            ))
          )}
        </div>
      </GlassCard>
    </div>
  )
}

type UploadPanelProps = {
  files: File[]
  inputRef: RefObject<HTMLInputElement | null>
  metadata: { title: string; studentId: string }
  students: Array<{ databaseId: string; name: string; id: string }>
  onMetadataChange: (value: { title: string; studentId: string }) => void
  onQueueFiles: (files: File[]) => void
  onRemoveFile: (fileName: string) => void
  onUpload: () => void
  progress: number
  uploadCategory: DocumentCategory
  uploadError: string
  uploadPending: boolean
  validationErrors: string[]
  onUploadCategoryChange: (value: DocumentCategory) => void
}

function UploadPanel({
  files,
  inputRef,
  metadata,
  students,
  onMetadataChange,
  onQueueFiles,
  onRemoveFile,
  onUpload,
  progress,
  uploadCategory,
  uploadError,
  uploadPending,
  validationErrors,
  onUploadCategoryChange,
}: UploadPanelProps) {
  const canUpload = files.length > 0 && Boolean(metadata.studentId) && validationErrors.length === 0 && !uploadPending

  return (
    <GlassCard className="p-5">
      <div
        className={cn(
          'grid min-h-64 place-items-center rounded-[20px] border border-dashed border-border bg-background/55 p-6 text-center transition',
          uploadPending && 'opacity-75',
        )}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          onQueueFiles(Array.from(event.dataTransfer.files))
        }}
      >
        <div>
          <div className="mx-auto grid size-14 place-items-center rounded-[18px] bg-primary/10 text-primary">
            <UploadCloud className="size-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">Upload student documents</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Drop multiple PDFs, images, and Word documents. Files are validated before Cloudinary
            storage and saved with searchable student metadata.
          </p>
          <Button className="mt-5" onClick={() => inputRef.current?.click()} type="button">
            <UploadCloud />
            Select Documents
          </Button>
          <input
            ref={inputRef}
            accept={acceptedDocumentExtensions}
            className="sr-only"
            multiple
            onChange={(event) => onQueueFiles(Array.from(event.target.files ?? []))}
            type="file"
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Student</span>
          <select className="h-11 w-full rounded-2xl border border-border bg-background/75 px-3 text-sm font-semibold text-foreground outline-none ring-ring focus:ring-2" disabled={students.length === 0} onChange={(event) => onMetadataChange({ ...metadata, studentId: event.target.value })} value={metadata.studentId}>
            <option value="">{students.length === 0 ? 'No students available' : 'Select student'}</option>
            {students.map((student) => <option key={student.databaseId} value={student.databaseId}>{student.name} ({student.id})</option>)}
          </select>
        </label>
        <Field
          label="Document title"
          onChange={(value) => onMetadataChange({ ...metadata, title: value })}
          placeholder="Semester transcript"
          value={metadata.title}
        />
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Category
          </span>
          <select
            className="h-11 w-full rounded-2xl border border-border bg-background/75 px-3 text-sm font-semibold text-foreground outline-none ring-ring focus:ring-2"
            onChange={(event) => onUploadCategoryChange(event.target.value as DocumentCategory)}
            value={uploadCategory}
          >
            {documentCategories
              .filter((item) => item !== 'All')
              .map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
          </select>
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-5 space-y-2">
          {files.map((file) => (
            <div
              className="flex items-center justify-between gap-3 rounded-[18px] border border-border bg-muted/35 px-4 py-3"
              key={file.name}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{file.name}</p>
                <p className="text-xs font-semibold text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              <Button onClick={() => onRemoveFile(file.name)} size="icon" type="button" variant="ghost">
                <X />
              </Button>
            </div>
          ))}
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="mt-4 rounded-[18px] border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-semibold text-rose-700 dark:text-rose-300">
          {validationErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-semibold text-muted-foreground">Upload progress</span>
          <span className="font-bold text-foreground">{progress}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {uploadError && (
        <p className="mt-4 rounded-[18px] bg-amber-500/10 p-3 text-sm font-semibold text-amber-700 dark:text-amber-300">
          {uploadError}
        </p>
      )}

      <Button className="mt-5" disabled={!canUpload} onClick={onUpload} type="button">
        {uploadPending ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
        Upload Securely
      </Button>
    </GlassCard>
  )
}

function DocumentPreview({
  document,
  deleting,
  deleteError,
  onClose,
  onDelete,
}: {
  document: StudentDocument | null
  deleting: boolean
  deleteError: string
  onClose: () => void
  onDelete: (documentId: string) => void
}) {
  return (
    <Card className="min-h-96 overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Preview</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Images and PDFs render inline.</p>
        </div>
        {document && (
          <Button onClick={onClose} size="icon" type="button" variant="ghost">
            <X />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!document ? (
          <div className="grid h-72 place-items-center rounded-[20px] border border-dashed border-border bg-muted/35 text-center">
            <div>
              <Eye className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-muted-foreground">
                Select a document to preview it here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[20px] border border-border bg-background">
              {document.mimeType.startsWith('image/') && document.secureUrl ? (
                <OptimizedImage
                  alt={document.title}
                  cloudinaryWidth={900}
                  className="h-72 w-full object-cover"
                  src={document.secureUrl}
                />
              ) : document.mimeType === 'application/pdf' && document.secureUrl ? (
                <iframe className="h-72 w-full" src={document.secureUrl} title={document.title} />
              ) : (
                <div className="grid h-72 place-items-center bg-muted/35 p-6 text-center">
                  <div>
                    <FileText className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
                    <p className="mt-3 text-sm font-semibold text-muted-foreground">
                      Preview is available for images and PDFs.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{document.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{document.originalName}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{document.category}</Badge>
                <Badge>{formatFileSize(document.size)}</Badge>
                <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  {document.scanStatus}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild type="button" variant="glass">
                <a download={document.fileName} href={getStudentDocumentDownloadUrl(document)}>
                  <Download />
                  Download
                </a>
              </Button>
              <Button
                disabled={deleting}
                onClick={() => onDelete(document._id)}
                type="button"
                variant="destructive"
              >
                {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                Delete
              </Button>
            </div>
            {deleteError && (
              <p className="rounded-[18px] bg-rose-500/10 p-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
                {deleteError}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DocumentCard({
  document,
  index,
  onPreview,
}: {
  document: StudentDocument
  index: number
  onPreview: () => void
}) {
  const Icon = document.mimeType.startsWith('image/') ? Image : FileText

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[20px] border border-border/70 bg-background/60 p-4 shadow-soft backdrop-blur-xl"
      initial={{ opacity: 0, y: 10 }}
      transition={{ delay: index * 0.03 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <Badge>{document.category}</Badge>
      </div>
      <h3 className="mt-4 line-clamp-1 text-base font-bold text-foreground">{document.title}</h3>
      <p className="mt-1 line-clamp-1 text-sm font-medium text-muted-foreground">
        {document.studentName || 'Unassigned student'}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-muted-foreground">
        <span>{document.registerNumber || 'No register'}</span>
        <span className="text-right">{formatFileSize(document.size)}</span>
      </div>
      <div className="mt-4 flex gap-2">
        <Button className="flex-1" onClick={onPreview} size="sm" type="button" variant="glass">
          <Eye />
          Preview
        </Button>
        <Button asChild size="icon" type="button" variant="ghost">
          <a aria-label={`Download ${document.title}`} download={document.fileName} href={getStudentDocumentDownloadUrl(document)}>
            <Download />
          </a>
        </Button>
      </div>
    </motion.article>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileArchive
  label: string
  value: string
}) {
  return (
    <GlassCard className="flex items-center justify-between gap-4 p-5">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      </div>
      <div className="grid size-12 place-items-center rounded-[18px] bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
    </GlassCard>
  )
}

function Field({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string
  onChange: (value: string) => void
  placeholder: string
  value: string
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <input
        className="h-11 w-full rounded-2xl border border-border bg-background/75 px-3 text-sm font-semibold text-foreground outline-none ring-ring transition placeholder:text-muted-foreground focus:ring-2"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  )
}

function isPreviewable(document: StudentDocument) {
  return document.mimeType.startsWith('image/') || document.mimeType === 'application/pdf'
}
