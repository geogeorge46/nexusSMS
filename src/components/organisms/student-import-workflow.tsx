import {
  AlertTriangle,
  CheckCircle2,
  FileDown,
  FileSpreadsheet,
  Upload,
} from 'lucide-react'
import { useRef, useState } from 'react'

import { StudentStatusBadge } from '@/components/molecules/student-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, GlassCard } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import type { Student } from '@/hooks/use-students'
import {
  downloadTextFile,
  exportImportErrors,
  getStudentImportTemplateRows,
  parseStudentImportFile,
  rowsToCsv,
  rowsToExcelHtml,
  type ImportResult,
} from '@/lib/student-import'
import {
  commitStudentImportWithApi,
  validateStudentImportWithApi,
} from '@/lib/student-import-api'

type ImportState = 'idle' | 'ready' | 'importing' | 'complete' | 'rolled-back'

export function StudentImportWorkflow({ existingStudents }: { existingStudents: Student[] }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [fileName, setFileName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [state, setState] = useState<ImportState>('idle')
  const [progress, setProgress] = useState(0)
  const [simulateFailure, setSimulateFailure] = useState(false)
  const [apiMode, setApiMode] = useState<'backend' | 'local' | null>(null)

  const validRows = result?.rows.filter((row) => row.errors.length === 0) ?? []
  const errors = result?.errors ?? []
  const canImport = validRows.length > 0 && errors.length === 0 && state !== 'importing'

  async function handleFile(file?: File) {
    if (!file) return
    setFileName(file.name)
    setSelectedFile(file)
    setState('idle')
    setProgress(0)

    let parsed: ImportResult

    try {
      parsed = await validateStudentImportWithApi(file)
      setApiMode('backend')
    } catch {
      if (file.name.toLowerCase().endsWith('.xlsx')) {
        setResult({
          rows: [],
          errors: [
            {
              row: 1,
              field: 'file',
              message:
                'Backend API is required for XLSX parsing. Start the Express API or upload CSV/TSV/.xls.',
            },
          ],
        })
        setApiMode('local')
        return
      }

      parsed = await parseStudentImportFile(file, existingStudents)
      setApiMode('local')
    }

    setResult(parsed)
    setState('ready')
  }

  function downloadCsvTemplate() {
    downloadTextFile(
      'student-import-template.csv',
      rowsToCsv(getStudentImportTemplateRows()),
      'text/csv;charset=utf-8',
    )
  }

  function downloadExcelTemplate() {
    downloadTextFile(
      'student-import-template.xls',
      rowsToExcelHtml(getStudentImportTemplateRows()),
      'application/vnd.ms-excel;charset=utf-8',
    )
  }

  async function runBulkInsert() {
    if (!selectedFile) return
    setState('importing')
    setProgress(0)

    if (apiMode === 'backend' && !simulateFailure) {
      try {
        setProgress(32)
        await commitStudentImportWithApi(selectedFile)
        setProgress(100)
        setState('complete')
      } catch {
        setProgress(0)
        setState('rolled-back')
      }
      return
    }

    let current = 0
    const timer = window.setInterval(() => {
      current += 12
      setProgress(Math.min(current, 100))

      if (simulateFailure && current >= 72) {
        window.clearInterval(timer)
        setProgress(0)
        setState('rolled-back')
        return
      }

      if (current >= 100) {
        window.clearInterval(timer)
        setState('complete')
      }
    }, 180)
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <GlassCard className="p-5">
          <div
            className="grid min-h-56 place-items-center rounded-[20px] border border-dashed border-border bg-background/55 p-6 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              void handleFile(event.dataTransfer.files[0])
            }}
          >
            <div>
              <div className="mx-auto grid size-14 place-items-center rounded-[20px] bg-primary/10 text-primary">
                <Upload className="size-6" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-foreground">Upload student file</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Supports CSV, TSV, and Excel-compatible .xls files. Validate and preview records
                before running the bulk insert.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Button onClick={() => inputRef.current?.click()} type="button">
                  <Upload />
                  Select File
                </Button>
                <Button onClick={downloadCsvTemplate} type="button" variant="glass">
                  <FileDown />
                  CSV Template
                </Button>
                <Button onClick={downloadExcelTemplate} type="button" variant="glass">
                  <FileSpreadsheet />
                  Excel Template
                </Button>
              </div>
              <input
                ref={inputRef}
                accept=".csv,.tsv,.txt,.xls,.xlsx"
                className="sr-only"
                onChange={(event) => void handleFile(event.target.files?.[0])}
                type="file"
              />
              {fileName && <p className="mt-4 text-sm font-semibold text-muted-foreground">{fileName}</p>}
            </div>
          </div>
        </GlassCard>

        <Card>
          <CardHeader>
            <CardTitle>Import Controls</CardTitle>
            <CardDescription>Transactional simulation with rollback on failure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SummaryRow label="Mode" value={apiMode === 'backend' ? 'API' : apiMode === 'local' ? 'Local' : '-'} />
            <SummaryRow label="Valid rows" value={String(validRows.length)} />
            <SummaryRow label="Errors" value={String(errors.length)} />
            <SummaryRow
              label="Duplicates"
              value={String(result?.rows.filter((row) => row.duplicate).length ?? 0)}
            />
            <div className="flex items-center justify-between gap-3 rounded-[18px] border border-border bg-muted/35 p-4">
              <div>
                <p className="text-sm font-bold text-foreground">Simulate failure</p>
                <p className="text-xs text-muted-foreground">Shows rollback behavior.</p>
              </div>
              <Switch
                aria-label="Simulate import failure"
                checked={simulateFailure}
                onCheckedChange={setSimulateFailure}
              />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-semibold text-muted-foreground">Progress</span>
                <span className="font-bold text-foreground">{progress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <Button disabled={!canImport} onClick={() => void runBulkInsert()} type="button">
              <CheckCircle2 />
              Bulk Insert
            </Button>
            {errors.length > 0 && (
              <Button onClick={() => exportImportErrors(errors)} type="button" variant="glass">
                <AlertTriangle />
                Error Report
              </Button>
            )}
            {state === 'complete' && (
              <p className="rounded-2xl bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Bulk insert completed. {validRows.length} records staged successfully.
              </p>
            )}
            {state === 'rolled-back' && (
              <p className="rounded-2xl bg-rose-500/10 p-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
                Import failed. Rollback completed; no uploaded records were committed.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <ImportPreview result={result} />
    </div>
  )
}

function ImportPreview({ result }: { result: ImportResult | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview Before Import</CardTitle>
        <CardDescription>Rows with validation errors are blocked from import.</CardDescription>
      </CardHeader>
      <CardContent>
        {!result ? (
          <div className="rounded-[20px] border border-border bg-muted/35 p-8 text-center text-sm font-semibold text-muted-foreground">
            Upload a file to preview student records.
          </div>
        ) : result.rows.length === 0 ? (
          <div className="rounded-[20px] border border-border bg-muted/35 p-8 text-center text-sm font-semibold text-muted-foreground">
            No valid table rows were found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[20px] border border-border/70">
            {result.rows.slice(0, 12).map((row) => (
              <div
                key={`${row.rowNumber}-${row.student.id}`}
                className="grid gap-3 border-b border-border/70 p-4 last:border-b-0 xl:grid-cols-[80px_1fr_160px_120px_1fr]"
              >
                <p className="text-sm font-bold text-muted-foreground">Row {row.rowNumber}</p>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{row.student.name || 'Missing name'}</p>
                  <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
                    {row.student.email || 'Missing email'}
                  </p>
                </div>
                <p className="self-center text-sm font-semibold text-muted-foreground">{row.student.program}</p>
                <div className="self-center">
                  <StudentStatusBadge status={row.student.status} />
                </div>
                <div className="self-center">
                  {row.errors.length === 0 ? (
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Ready</p>
                  ) : (
                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                      {row.errors.map((error) => error.message).join(' ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/35 px-4 py-3">
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      <span className="text-lg font-bold text-foreground">{value}</span>
    </div>
  )
}
