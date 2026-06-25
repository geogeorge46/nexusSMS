import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'

const brand = '#2563EB'
const dark = '#111827'
const muted = '#64748B'
const border = '#CBD5E1'

export async function reportToExcel(report, filters) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Nexus Student Management System'
  workbook.created = new Date()
  const sheet = workbook.addWorksheet(report.title.slice(0, 31), {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: false }],
  })
  const columnCount = report.columns.length

  sheet.mergeCells(1, 1, 1, columnCount)
  const title = sheet.getCell(1, 1)
  title.value = report.title
  title.font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } }
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
  title.alignment = { vertical: 'middle', horizontal: 'left' }
  sheet.getRow(1).height = 32

  sheet.mergeCells(2, 1, 2, columnCount)
  sheet.getCell(2, 1).value = `Generated ${new Date().toISOString()} | ${formatFilterSummary(filters)}`
  sheet.getCell(2, 1).font = { size: 10, color: { argb: 'FF475569' } }
  sheet.getRow(2).height = 22

  const metricText = report.metrics.map((metric) => `${metric.label}: ${metric.value}`).join('   |   ')
  sheet.mergeCells(3, 1, 3, columnCount)
  sheet.getCell(3, 1).value = metricText
  sheet.getCell(3, 1).font = { bold: true, color: { argb: 'FF1E3A8A' } }
  sheet.getCell(3, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }

  const header = sheet.getRow(4)
  header.values = report.columns.map((column) => column.label)
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
  header.alignment = { vertical: 'middle' }
  header.height = 24

  for (const row of report.rows) {
    sheet.addRow(report.columns.map((column) => excelValue(column.key, row[column.key])))
  }

  report.columns.forEach((column, index) => {
    const worksheetColumn = sheet.getColumn(index + 1)
    const contentWidth = Math.max(
      column.label.length,
      ...report.rows.slice(0, 250).map((row) => String(row[column.key] ?? '').length),
    )
    worksheetColumn.width = Math.min(Math.max(contentWidth + 2, 12), 32)
    if (isDateKey(column.key)) worksheetColumn.numFmt = 'yyyy-mm-dd'
    if (typeof report.rows[0]?.[column.key] === 'number') worksheetColumn.numFmt = '#,##0.00'
  })

  if (report.rows.length > 0) {
    sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + report.rows.length, column: columnCount } }
    for (let rowIndex = 5; rowIndex <= 4 + report.rows.length; rowIndex += 1) {
      const row = sheet.getRow(rowIndex)
      row.alignment = { vertical: 'top', wrapText: true }
      row.height = 21
      if (rowIndex % 2 === 0) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
    }
  }

  return workbook.xlsx.writeBuffer()
}

export function reportToCsv(report) {
  const header = report.columns.map((column) => csvCell(column.label)).join(',')
  const rows = report.rows.map((row) => report.columns.map((column) => csvCell(row[column.key])).join(','))
  return `\uFEFF${[header, ...rows].join('\n')}`
}

export function reportToPdf(report, filters) {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36, bufferPages: true })
    const chunks = []
    document.on('data', (chunk) => chunks.push(chunk))
    document.on('error', reject)
    document.on('end', () => resolve(Buffer.concat(chunks)))

    drawPdfHeader(document, report, filters)
    drawPdfTable(document, report)

    const pageRange = document.bufferedPageRange()
    for (let index = pageRange.start; index < pageRange.start + pageRange.count; index += 1) {
      document.switchToPage(index)
      document.fontSize(8).fillColor(muted)
        .text(`Nexus SMS | Page ${index + 1} of ${pageRange.count}`, 36, document.page.height - 48, {
          width: document.page.width - 72,
          align: 'center',
        })
    }
    document.end()
  })
}

function drawPdfHeader(document, report, filters) {
  document.fillColor(brand).rect(0, 0, document.page.width, 82).fill()
  document.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(22).text(report.title, 36, 26)
  document.font('Helvetica').fontSize(9).text(`Generated ${new Date().toISOString()}`, 36, 55)
  document.fillColor(dark).font('Helvetica-Bold').fontSize(10)
    .text(report.metrics.map((metric) => `${metric.label}: ${metric.value}`).join('   |   '), 36, 98)
  document.fillColor(muted).font('Helvetica').fontSize(8)
    .text(formatFilterSummary(filters), 36, 116, { width: document.page.width - 72 })
}

function drawPdfTable(document, report) {
  const x = 36
  const width = document.page.width - 72
  const columnWidth = width / report.columns.length
  const rowHeight = 25
  let y = 142

  const drawHeader = () => {
    document.fillColor(dark).rect(x, y, width, rowHeight).fill()
    report.columns.forEach((column, index) => {
      document.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7)
        .text(column.label, x + index * columnWidth + 4, y + 8, { width: columnWidth - 8, ellipsis: true })
    })
    y += rowHeight
  }

  drawHeader()
  if (report.rows.length === 0) {
    document.fillColor(muted).font('Helvetica').fontSize(10).text('No records match the selected filters.', x, y + 18)
    return
  }

  report.rows.forEach((row, rowIndex) => {
    if (y + rowHeight > document.page.height - 42) {
      document.addPage()
      y = 36
      drawHeader()
    }
    if (rowIndex % 2 === 0) document.fillColor('#F8FAFC').rect(x, y, width, rowHeight).fill()
    document.strokeColor(border).lineWidth(0.35).moveTo(x, y + rowHeight).lineTo(x + width, y + rowHeight).stroke()
    report.columns.forEach((column, index) => {
      document.fillColor(dark).font('Helvetica').fontSize(6.8)
        .text(String(row[column.key] ?? ''), x + index * columnWidth + 4, y + 7, {
          width: columnWidth - 8,
          height: rowHeight - 8,
          ellipsis: true,
        })
    })
    y += rowHeight
  })
}

function excelValue(key, value) {
  if (isDateKey(key) && value) return new Date(`${value}T00:00:00.000Z`)
  return value ?? ''
}

function isDateKey(key) {
  return ['date', 'createdAt', 'enrolledAt'].includes(key)
}

function csvCell(value) {
  const string = String(value ?? '')
  const safe = /^[=+\-@]/.test(string) ? `'${string}` : string
  return `"${safe.replaceAll('"', '""')}"`
}

function formatFilterSummary(filters) {
  const labels = [
    ['dateFrom', 'From'], ['dateTo', 'To'], ['department', 'Department'], ['course', 'Course'],
    ['semester', 'Semester'], ['student', 'Student'], ['status', 'Status'],
  ]
  const active = labels
    .filter(([key]) => filters[key] && filters[key] !== 'All')
    .map(([key, label]) => `${label}: ${filters[key]}`)
  return active.length ? active.join(' | ') : 'All records'
}
