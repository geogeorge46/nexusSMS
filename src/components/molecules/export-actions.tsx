import { Download, FileSpreadsheet, Printer } from 'lucide-react'

import { Button } from '@/components/ui/button'

type ExportActionsProps = {
  filename: string
  rows: Array<Record<string, string | number>>
}

export function ExportActions({ filename, rows }: ExportActionsProps) {
  function exportExcel() {
    const headers = Object.keys(rows[0] ?? {})
    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((header) => `"${String(row[header] ?? '').replaceAll('"', '""')}"`)
          .join(','),
      ),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${filename}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function exportPdf() {
    window.print()
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={exportPdf} type="button" variant="glass">
        <Printer />
        PDF Export
      </Button>
      <Button onClick={exportExcel} type="button">
        <FileSpreadsheet />
        Excel Export
      </Button>
      <Button type="button" variant="glass">
        <Download />
        Schedule
      </Button>
    </div>
  )
}
