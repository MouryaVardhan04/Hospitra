import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
  primary:   '#1a56db',   // Hospitra blue
  navy:      '#1e3a8a',   // Dark navy
  white:     '#ffffff',
  text:      '#1e293b',   // Near-black text
  muted:     '#64748b',   // Grey labels
  light:     '#f8fafc',   // Very light page bg area
  rowAlt:    '#eef4ff',   // Alternating table row
  border:    '#cbd5e1',   // Neutral grey border
  paid:      '#15803d',   // Green for PAID status
  pending:   '#b45309',   // Amber for pending
  urgent:    '#dc2626',   // Red for urgent
}

const PAGE_W  = 595.28   // A4 points
const PAGE_H  = 841.89
const ML      = 45       // margin left/right
const USABLE  = PAGE_W - ML * 2

// ─── Utility ──────────────────────────────────────────────────────────────────
const safe = (v) => (v === null || v === undefined || v === '') ? '—' : String(v)

const fmtDate = (v) => {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (isNaN(d)) return String(v)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      + '  ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  } catch { return String(v) }
}

const fmtMoney = (v) => {
  const n = Number(v)
  return isNaN(n) ? '₹0.00' : `₹${n.toFixed(2)}`
}

async function toBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = []
    doc.on('data', c => chunks.push(c))
    doc.on('end',  () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    doc.end()
  })
}

// ─── Logo path ────────────────────────────────────────────────────────────────
function getLogoPath() {
  const tries = [
    path.join(__dirname, '..', 'logo.png'),
    path.join(__dirname, '..', '..', 'frontend', 'src', 'assets', 'Logo.png'),
    path.join(__dirname, '..', '..', 'frontend', 'public', 'Logo.png'),
  ]
  return tries.find(p => fs.existsSync(p)) || null
}

// ─── Header ───────────────────────────────────────────────────────────────────
// Clean two-line header: navy bar with logo on left, document title on right.
function drawHeader(doc, title) {
  const logoPath = getLogoPath()
  const barH = 64

  // Navy top bar
  doc.rect(0, 0, PAGE_W, barH).fill(C.navy)

  // Logo (left)
  if (logoPath) {
    try {
      doc.image(logoPath, ML, 10, { height: 44, fit: [130, 44] })
    } catch {
      doc.fillColor(C.white).fontSize(17).font('Helvetica-Bold')
         .text('HOSPITRA', ML, 22)
    }
  } else {
    doc.fillColor(C.white).fontSize(17).font('Helvetica-Bold')
       .text('HOSPITRA', ML, 22)
  }

  // Document title (right, centred vertically in bar)
  doc.fillColor(C.white).fontSize(14).font('Helvetica-Bold')
     .text(title, ML, 24, { width: USABLE, align: 'right' })

  // Thin accent stripe below bar
  doc.rect(0, barH, PAGE_W, 3).fill(C.primary)

  doc.y = barH + 12
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function drawFooter(doc, pageNum, totalPages) {
  const fy = PAGE_H - 34
  doc.rect(0, fy, PAGE_W, 34).fill(C.navy)

  // Left: hospital tagline
  doc.fillColor(C.white).fontSize(7.5).font('Helvetica')
     .text('Hospitra Healthcare  •  Quality Care, Every Time  •  Confidential Document',
           ML, fy + 6, { width: USABLE - 80, align: 'left' })

  // Right: page number
  const pgText = totalPages ? `Page ${pageNum} of ${totalPages}` : `Page ${pageNum}`
  doc.fillColor(C.white).fontSize(7.5).font('Helvetica')
     .text(pgText, ML, fy + 6, { width: USABLE, align: 'right' })

  // Generated timestamp centred on second line
  const genText = `Generated: ${new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
  doc.fillColor('#93c5fd').fontSize(7).font('Helvetica')
     .text(genText, ML, fy + 18, { width: USABLE, align: 'center' })
}

// ─── Section Title ────────────────────────────────────────────────────────────
// Left-border accent style — clean, no emoji, no full-width fill
function sectionTitle(doc, text) {
  doc.moveDown(0.7)
  const y = doc.y
  // Left blue accent bar
  doc.rect(ML, y, 4, 18).fill(C.primary)
  // Section label text
  doc.fillColor(C.navy).fontSize(9.5).font('Helvetica-Bold')
     .text(text.toUpperCase(), ML + 12, y + 3, { width: USABLE - 12 })
  // Underline rule
  doc.moveTo(ML, y + 20).lineTo(ML + USABLE, y + 20)
     .strokeColor(C.border).lineWidth(0.5).stroke()
  doc.y = y + 26
}

// ─── Info Grid ────────────────────────────────────────────────────────────────
// Compact two-column key/value layout with alternating row backgrounds.
function drawInfoGrid(doc, pairs) {
  if (!pairs || pairs.length === 0) return
  const colW  = USABLE / 2
  const rowH  = 20

  for (let i = 0; i < pairs.length; i += 2) {
    const y  = doc.y
    const bg = (Math.floor(i / 2) % 2 === 0) ? C.rowAlt : C.white

    // Row background
    doc.rect(ML, y, USABLE, rowH).fill(bg)

    // Left cell
    const [lk, lv] = pairs[i]
    doc.fillColor(C.muted).fontSize(7.5).font('Helvetica')
       .text(lk + ':', ML + 8, y + 5, { width: 90 })
    doc.fillColor(C.text).fontSize(8.5).font('Helvetica-Bold')
       .text(safe(lv), ML + 100, y + 5, { width: colW - 108 })

    // Right cell (if exists)
    if (pairs[i + 1]) {
      const [rk, rv] = pairs[i + 1]
      doc.fillColor(C.muted).fontSize(7.5).font('Helvetica')
         .text(rk + ':', ML + colW + 8, y + 5, { width: 90 })
      doc.fillColor(C.text).fontSize(8.5).font('Helvetica-Bold')
         .text(safe(rv), ML + colW + 100, y + 5, { width: colW - 108 })
    }

    // Row border
    doc.rect(ML, y, USABLE, rowH).strokeColor(C.border).lineWidth(0.4).stroke()
    doc.y = y + rowH
  }
  doc.moveDown(0.5)
}

// ─── Table ────────────────────────────────────────────────────────────────────
function drawTable(doc, columns, rows) {
  if (!rows || rows.length === 0) return
  const colWidths = columns.map(c => c.width * USABLE)
  const headerH   = 22
  const rowH      = 20

  // Draw outer border rectangle first (will be overdrawn by cells but completes at end)
  const tableStartY = doc.y
  let totalH = headerH + rows.length * rowH
  // We'll draw outer border after content — skip for now, use per-row borders

  // Header row
  let x = ML
  const hy = doc.y
  doc.rect(ML, hy, USABLE, headerH).fill(C.navy)
  columns.forEach((col, i) => {
    doc.fillColor(C.white).fontSize(8).font('Helvetica-Bold')
       .text(col.label, x + 5, hy + 7, { width: colWidths[i] - 8, align: col.align || 'left' })
    x += colWidths[i]
  })
  doc.y = hy + headerH

  // Data rows
  rows.forEach((row, ri) => {
    // Page-break check (leave room for footer)
    if (doc.y + rowH > PAGE_H - 50) {
      doc.addPage()
      doc.y = ML

      // Re-draw header on new page
      const nhy = doc.y
      let nx = ML
      doc.rect(ML, nhy, USABLE, headerH).fill(C.navy)
      columns.forEach((col, i) => {
        doc.fillColor(C.white).fontSize(8).font('Helvetica-Bold')
           .text(col.label, nx + 5, nhy + 7, { width: colWidths[i] - 8, align: col.align || 'left' })
        nx += colWidths[i]
      })
      doc.y = nhy + headerH
    }

    const ry = doc.y
    const bg = ri % 2 === 0 ? C.rowAlt : C.white
    doc.rect(ML, ry, USABLE, rowH).fill(bg)

    let rx = ML
    row.forEach((cell, ci) => {
      doc.fillColor(C.text).fontSize(8.5).font('Helvetica')
         .text(safe(cell), rx + 5, ry + 5, { width: colWidths[ci] - 8, align: columns[ci].align || 'left' })
      rx += colWidths[ci]
    })

    // Row border
    doc.rect(ML, ry, USABLE, rowH).strokeColor(C.border).lineWidth(0.4).stroke()
    doc.y = ry + rowH
  })

  // Outer table border
  doc.rect(ML, tableStartY, USABLE, headerH + rows.length * rowH)
     .strokeColor(C.navy).lineWidth(0.8).stroke()

  doc.moveDown(0.6)
}

// ─── Total Box ────────────────────────────────────────────────────────────────
function drawTotalBox(doc, label, value) {
  doc.moveDown(0.3)
  const bw = 230
  const bh = 34
  const bx = ML + USABLE - bw
  const by = doc.y
  doc.rect(bx, by, bw, bh).fill(C.navy)
  doc.fillColor(C.white).fontSize(12).font('Helvetica-Bold')
     .text(`${label}: ${value}`, bx + 10, by + 10, { width: bw - 20, align: 'right' })
  doc.y = by + bh + 8
}

// ─── Status Chip ─────────────────────────────────────────────────────────────
function drawStatusChip(doc, text, color) {
  const cw = 90
  const ch = 16
  const cx = ML + USABLE - cw
  const cy = doc.y
  doc.rect(cx, cy, cw, ch).fill(color)
  doc.fillColor(C.white).fontSize(7.5).font('Helvetica-Bold')
     .text(text.toUpperCase(), cx, cy + 4, { width: cw, align: 'center' })
  doc.y = cy + ch + 5
}

// ─── Meta Strip ──────────────────────────────────────────────────────────────
// Light blue strip showing: key1 / value1  |  key2 / value2  |  key3 / value3
function drawMetaStrip(doc, items) {
  const stripH = 26
  const y = doc.y
  doc.rect(ML, y, USABLE, stripH).fill('#eff6ff').strokeColor(C.border).lineWidth(0.5).stroke()

  const cellW = USABLE / items.length
  items.forEach((item, i) => {
    const cx = ML + i * cellW
    doc.fillColor(C.muted).fontSize(7.5).font('Helvetica')
       .text(item.label + ':', cx + 10, y + 5)
    doc.fillColor(item.color || C.text).fontSize(8.5).font('Helvetica-Bold')
       .text(item.value, cx + 10, y + 14, { width: cellW - 20 })
  })

  doc.y = y + stripH + 8
}

// ─── Note Block ──────────────────────────────────────────────────────────────
function drawNotes(doc, text) {
  if (!text) return
  doc.moveDown(0.3)
  const y = doc.y
  doc.rect(ML, y, USABLE, 14).fill(C.rowAlt)
  doc.fillColor(C.navy).fontSize(8).font('Helvetica-Bold')
     .text('NOTES', ML + 8, y + 3)
  doc.y = y + 14
  const textY = doc.y
  const lineCount = Math.ceil(text.length / 90)
  const blockH = Math.max(30, lineCount * 14 + 10)
  doc.rect(ML, textY, USABLE, blockH).fill(C.white).strokeColor(C.border).lineWidth(0.4).stroke()
  doc.fillColor(C.text).fontSize(8.5).font('Helvetica')
     .text(text, ML + 10, textY + 8, { width: USABLE - 20 })
  doc.y = textY + blockH + 8
}

// ═══════════════════════════════════════════════════════════════════════════════
//  1. PHARMACY INVOICE
// ═══════════════════════════════════════════════════════════════════════════════
export async function generatePharmacyInvoicePdf({ invoice, appointment }) {
  const doc = new PDFDocument({ size: 'A4', margin: ML, autoFirstPage: true })

  drawHeader(doc, 'PHARMACY INVOICE')

  // Meta strip: Invoice No | Date | Status
  const invoiceDate = fmtDate(invoice.createdAt || Date.now())
  const statusTxt   = invoice.status || 'PAID'
  const statusColor = statusTxt.toUpperCase() === 'PAID' ? C.paid : C.pending
  drawMetaStrip(doc, [
    { label: 'Invoice No', value: `#${safe(invoice._id || invoice.invoiceId)}` },
    { label: 'Date',       value: invoiceDate },
    { label: 'Status',     value: statusTxt, color: statusColor },
  ])

  // Patient Details
  sectionTitle(doc, 'Patient Details')
  drawInfoGrid(doc, [
    ['Patient Name', invoice.patientName],
    ['Email',        invoice.patientEmail],
    ['Phone',        invoice.patientPhone],
    ['Patient ID',   invoice.patientId],
  ])

  // Doctor & Appointment Details
  sectionTitle(doc, 'Doctor & Appointment Details')
  drawInfoGrid(doc, [
    ['Doctor Name',     invoice.doctorName],
    ['Doctor ID',       invoice.doctorId],
    ['Appointment ID',  appointment?._id || invoice.appointmentId],
    ['Speciality',      appointment?.speciality || invoice.speciality],
    ['Visit Date',      fmtDate(appointment?.slotDate || invoice.visitDate)],
    ['Visit Time',      appointment?.slotTime || invoice.visitTime],
    ['Consult. Fee',    fmtMoney(appointment?.amount)],
    ['Payment Method',  invoice.paymentMethod],
  ])

  // Prescribed Medicines
  const items = Array.isArray(invoice.items) ? invoice.items : []
  sectionTitle(doc, 'Prescribed Medicines')
  if (items.length > 0) {
    drawTable(doc,
      [
        { label: '#',             width: 0.05, align: 'center' },
        { label: 'Medicine / Item', width: 0.38 },
        { label: 'Batch / SKU',   width: 0.17 },
        { label: 'Qty',           width: 0.10, align: 'center' },
        { label: 'Unit Price',    width: 0.15, align: 'right'  },
        { label: 'Amount',        width: 0.15, align: 'right'  },
      ],
      items.map((item, i) => [
        i + 1,
        item.name || 'Item',
        item.batch || item.sku || '—',
        item.qty ?? 1,
        fmtMoney(item.price),
        fmtMoney((item.price || 0) * (item.qty || 1)),
      ])
    )
  } else {
    doc.fillColor(C.muted).fontSize(8.5).font('Helvetica').text('No medicines listed.', ML + 8)
    doc.moveDown(0.5)
  }

  drawTotalBox(doc, 'Grand Total', fmtMoney(invoice.total))

  if (invoice.notes) drawNotes(doc, invoice.notes)

  drawFooter(doc, 1)
  return await toBuffer(doc)
}

// ═══════════════════════════════════════════════════════════════════════════════
//  2. BILLING INVOICE
// ═══════════════════════════════════════════════════════════════════════════════
export async function generateBillingInvoicePdf({ invoice }) {
  const doc = new PDFDocument({ size: 'A4', margin: ML, autoFirstPage: true })

  drawHeader(doc, 'BILLING INVOICE')

  // Meta strip
  drawMetaStrip(doc, [
    { label: 'Invoice No',  value: `#${safe(invoice._id || invoice.invoiceId)}` },
    { label: 'Date',        value: fmtDate(invoice.createdAt || Date.now()) },
    { label: 'Department',  value: safe(invoice.department), color: C.primary },
  ])

  // Patient Details
  sectionTitle(doc, 'Patient Details')
  drawInfoGrid(doc, [
    ['Patient Name', invoice.patientName],
    ['Email',        invoice.patientEmail],
    ['Phone',        invoice.patientPhone],
    ['Patient ID',   invoice.patientId],
  ])

  // Doctor & Appointment Details
  sectionTitle(doc, 'Doctor & Appointment Details')
  drawInfoGrid(doc, [
    ['Doctor Name',    invoice.doctorName],
    ['Doctor ID',      invoice.doctorId],
    ['Appointment ID', invoice.appointmentId],
    ['Department',     invoice.department],
    ['Visit Date',     fmtDate(invoice.visitDate)],
    ['Visit Time',     invoice.visitTime],
  ])

  // Billing Items
  const items = Array.isArray(invoice.items) ? invoice.items : []
  sectionTitle(doc, 'Billing Items')
  if (items.length > 0) {
    drawTable(doc,
      [
        { label: '#',             width: 0.05, align: 'center' },
        { label: 'Service / Item', width: 0.38 },
        { label: 'Category',      width: 0.22 },
        { label: 'Qty',           width: 0.10, align: 'center' },
        { label: 'Unit Price',    width: 0.13, align: 'right'  },
        { label: 'Total',         width: 0.12, align: 'right'  },
      ],
      items.map((item, i) => [
        i + 1,
        item.name || 'Service',
        item.category || 'General',
        item.qty ?? 1,
        fmtMoney(item.price),
        fmtMoney((item.price || 0) * (item.qty || 1)),
      ])
    )
  } else {
    doc.fillColor(C.muted).fontSize(8.5).font('Helvetica').text('No billing items listed.', ML + 8)
    doc.moveDown(0.5)
  }

  drawTotalBox(doc, 'Grand Total', fmtMoney(invoice.total))

  if (invoice.notes) drawNotes(doc, invoice.notes)

  drawFooter(doc, 1)
  return await toBuffer(doc)
}

// ═══════════════════════════════════════════════════════════════════════════════
//  3. LAB INVOICE  (separate from the lab report)
// ═══════════════════════════════════════════════════════════════════════════════
export async function generateLabInvoicePdf({ assignment, appointment }) {
  const doc   = new PDFDocument({ size: 'A4', margin: ML, autoFirstPage: true })
  const tests = Array.isArray(assignment.items) ? assignment.items
              : Array.isArray(assignment.tests) ? assignment.tests
              : []

  drawHeader(doc, 'LAB INVOICE')

  // Priority colour
  const priColor = (assignment.priority || '').toLowerCase() === 'urgent' ? C.urgent : C.paid

  // Meta strip
  drawMetaStrip(doc, [
    { label: 'Assignment ID', value: `#${safe(assignment._id || assignment.assignmentId)}` },
    { label: 'Date',          value: fmtDate(assignment.createdAt || Date.now()) },
    { label: 'Priority',      value: safe(assignment.priority || 'Routine'), color: priColor },
  ])

  // Patient Details
  sectionTitle(doc, 'Patient Details')
  drawInfoGrid(doc, [
    ['Patient Name', assignment.patientName],
    ['Email',        assignment.patientEmail],
    ['Phone',        assignment.patientPhone],
    ['Patient ID',   assignment.patientId],
    ['Age',          assignment.patientAge],
    ['Gender',       assignment.patientGender],
  ])

  // Referring Doctor & Appointment
  sectionTitle(doc, 'Referring Doctor & Appointment')
  drawInfoGrid(doc, [
    ['Doctor Name',    assignment.doctorName],
    ['Doctor ID',      assignment.doctorId],
    ['Appointment ID', assignment.appointmentId || appointment?._id],
    ['Speciality',     appointment?.speciality || '—'],
    ['Visit Date',     fmtDate(appointment?.slotDate || assignment.visitDate)],
    ['Visit Time',     appointment?.slotTime || '—'],
  ])

  // Tests Ordered
  sectionTitle(doc, 'Tests Ordered')
  if (tests.length > 0) {
    drawTable(doc,
      [
        { label: '#',          width: 0.05, align: 'center' },
        { label: 'Test Name',  width: 0.42 },
        { label: 'Category',   width: 0.20 },
        { label: 'Price',      width: 0.18, align: 'right'  },
        { label: 'Status',     width: 0.15, align: 'center' },
      ],
      tests.map((t, i) => {
        const isObj = typeof t === 'object' && t !== null
        return [
          i + 1,
          isObj ? (t.name || 'Test') : String(t),
          isObj ? (t.category || '—') : '—',
          isObj ? fmtMoney(t.price) : '—',
          isObj ? (t.status || assignment.status || 'Ordered') : (assignment.status || 'Ordered'),
        ]
      })
    )
  } else {
    doc.fillColor(C.muted).fontSize(8.5).font('Helvetica').text('No tests listed.', ML + 8)
    doc.moveDown(0.5)
  }

  drawTotalBox(doc, 'Invoice Total', fmtMoney(assignment.total))

  if (assignment.notes) drawNotes(doc, assignment.notes)

  drawFooter(doc, 1)
  return await toBuffer(doc)
}

// ═══════════════════════════════════════════════════════════════════════════════
//  4. LAB REPORT  (clinical results only — no invoice data)
// ═══════════════════════════════════════════════════════════════════════════════
export async function generateLabReportPdf({ assignment, appointment }) {
  const tests      = Array.isArray(assignment.items) ? assignment.items
                   : Array.isArray(assignment.tests) ? assignment.tests
                   : []
  const hasTests   = tests.length > 0

  // Calculate total pages: 1 cover + 1 per test
  const testPageCount = hasTests ? tests.length : 0
  const totalPages    = 1 + testPageCount

  const doc = new PDFDocument({ size: 'A4', margin: ML, autoFirstPage: true })

  // ────────────────────────────────────────────────
  // PAGE 1 — Report Cover / Summary
  // ────────────────────────────────────────────────
  drawHeader(doc, 'LAB TEST REPORT')

  // Report meta strip
  const priColor = (assignment.priority || '').toLowerCase() === 'urgent' ? C.urgent : C.paid
  drawMetaStrip(doc, [
    { label: 'Report ID',    value: `#${safe(assignment._id || assignment.assignmentId)}` },
    { label: 'Sample ID',    value: safe(assignment.sampleId) },
    { label: 'Priority',     value: safe(assignment.priority || 'Routine'), color: priColor },
  ])

  // Patient Details
  sectionTitle(doc, 'Patient Details')
  drawInfoGrid(doc, [
    ['Patient Name', assignment.patientName],
    ['Email',        assignment.patientEmail],
    ['Phone',        assignment.patientPhone],
    ['Patient ID',   assignment.patientId],
    ['Age',          assignment.patientAge],
    ['Gender',       assignment.patientGender],
    ['Height',       assignment.patientHeight ? `${assignment.patientHeight} cm` : null],
    ['Weight',       assignment.patientWeight ? `${assignment.patientWeight} kg` : null],
  ].filter(([, v]) => v !== null && v !== undefined))

  // Referring Doctor & Appointment
  sectionTitle(doc, 'Referring Doctor & Appointment')
  drawInfoGrid(doc, [
    ['Doctor Name',      assignment.doctorName],
    ['Doctor ID',        assignment.doctorId],
    ['Appointment ID',   assignment.appointmentId || appointment?._id],
    ['Speciality',       appointment?.speciality || '—'],
    ['Visit Date',       fmtDate(appointment?.slotDate || assignment.visitDate)],
    ['Visit Time',       appointment?.slotTime || '—'],
  ])

  // Collection & Processing Details
  sectionTitle(doc, 'Sample & Processing Details')
  drawInfoGrid(doc, [
    ['Sample Collected',    assignment.sampleCollected ? 'Yes' : 'No'],
    ['Collected At',        fmtDate(assignment.sampleCollectedAt)],
    ['Report Generated At', fmtDate(assignment.reportGeneratedAt)],
    ['Overall Status',      assignment.status],
  ])

  // Tests Summary table on cover page
  if (hasTests) {
    sectionTitle(doc, 'Tests Summary')
    drawTable(doc,
      [
        { label: '#',          width: 0.05, align: 'center' },
        { label: 'Test Name',  width: 0.50 },
        { label: 'Status',     width: 0.25, align: 'center' },
        { label: 'Result',     width: 0.20, align: 'center' },
      ],
      tests.map((t, i) => {
        const isObj = typeof t === 'object' && t !== null
        return [
          i + 1,
          isObj ? (t.name || 'Test') : String(t),
          isObj ? (t.status || assignment.status || 'Pending') : (assignment.status || 'Pending'),
          isObj && t.results && t.results.length > 0 ? 'Available' : 'Pending',
        ]
      })
    )
  }

  // General report notes (only if set)
  if (assignment.reportText) {
    sectionTitle(doc, 'Report Notes')
    doc.fillColor(C.text).fontSize(8.5).font('Helvetica')
       .text(assignment.reportText, ML + 8, doc.y, { width: USABLE - 16 })
    doc.moveDown(0.5)
  }

  drawFooter(doc, 1, totalPages)

  // ────────────────────────────────────────────────
  // Additional pages — one per test
  // ────────────────────────────────────────────────
  if (hasTests) {
    tests.forEach((test, idx) => {
      doc.addPage()

      const testName = typeof test === 'object' && test !== null
        ? (test.name || `Test ${idx + 1}`)
        : String(test)

      drawHeader(doc, 'LAB TEST REPORT')

      // Test title banner
      const tiy = doc.y
      doc.rect(ML, tiy, USABLE, 32).fill('#dbeafe')
      doc.fillColor(C.navy).fontSize(12).font('Helvetica-Bold')
         .text(testName, ML + 12, tiy + 9, { width: USABLE - 120 })
      doc.fillColor(C.muted).fontSize(8).font('Helvetica')
         .text(`Test ${idx + 1} of ${testPageCount}`, ML, tiy + 11,
               { width: USABLE - 10, align: 'right' })
      doc.y = tiy + 40

      // Patient quick-reference bar
      const pby = doc.y
      doc.rect(ML, pby, USABLE, 20).fill(C.rowAlt).strokeColor(C.border).lineWidth(0.4).stroke()
      doc.fillColor(C.muted).fontSize(7.5).font('Helvetica').text('Patient:', ML + 8, pby + 5)
      doc.fillColor(C.text).fontSize(8).font('Helvetica-Bold')
         .text(safe(assignment.patientName), ML + 52, pby + 5)
      doc.fillColor(C.muted).fontSize(7.5).font('Helvetica').text('DOB/Gender:', ML + 200, pby + 5)
      doc.fillColor(C.text).fontSize(8).font('Helvetica-Bold')
         .text(`${safe(assignment.patientAge)} yrs / ${safe(assignment.patientGender)}`, ML + 270, pby + 5)
      doc.fillColor(C.muted).fontSize(7.5).font('Helvetica').text('Date:', ML + 370, pby + 5)
      doc.fillColor(C.text).fontSize(8).font('Helvetica-Bold')
         .text(fmtDate(assignment.sampleCollectedAt), ML + 398, pby + 5, { width: 110 })
      doc.y = pby + 28

      if (typeof test === 'object' && test !== null) {
        // Test information grid (skip rows with null/undefined)
        const testInfo = [
          ['Test Name',   test.name],
          ['Category',    test.category],
          ['Sample Type', test.sampleType],
          ['Method',      test.method],
          ['Status',      test.status || assignment.status],
          ['Price',       fmtMoney(test.price)],
        ].filter(([, v]) => v !== null && v !== undefined)

        if (testInfo.length > 0) {
          sectionTitle(doc, 'Test Information')
          drawInfoGrid(doc, testInfo)
        }

        // Results — table style
        if (Array.isArray(test.results) && test.results.length > 0) {
          sectionTitle(doc, 'Test Results')
          drawTable(doc,
            [
              { label: 'Parameter',     width: 0.28 },
              { label: 'Result',        width: 0.17, align: 'center' },
              { label: 'Unit',          width: 0.13, align: 'center' },
              { label: 'Normal Range',  width: 0.24, align: 'center' },
              { label: 'Flag',          width: 0.18, align: 'center' },
            ],
            test.results.map(r => [
              r.parameter || r.name || '—',
              r.value ?? '—',
              r.unit || '—',
              r.normalRange || r.range || '—',
              r.flag || r.status || 'Normal',
            ])
          )
        } else if (test.resultText || test.result) {
          sectionTitle(doc, 'Result')
          doc.fillColor(C.text).fontSize(9).font('Helvetica')
             .text(test.resultText || test.result, ML + 8, doc.y, { width: USABLE - 16 })
          doc.moveDown(0.5)
        } else {
          doc.moveDown(0.4)
          doc.fillColor(C.pending).fontSize(9).font('Helvetica-Bold')
             .text('Results pending — not yet available.', ML, doc.y, { align: 'center', width: USABLE })
          doc.moveDown(0.5)
        }

        // Observations / notes for this specific test
        if (test.observations || test.notes) {
          sectionTitle(doc, 'Observations & Notes')
          doc.fillColor(C.text).fontSize(8.5).font('Helvetica')
             .text(test.observations || test.notes, ML + 8, doc.y, { width: USABLE - 16 })
          doc.moveDown(0.5)
        }

      } else {
        // Simple string test name — pending state
        sectionTitle(doc, 'Test Information')
        drawInfoGrid(doc, [
          ['Test Name', String(test)],
          ['Status',    assignment.status || 'Ordered'],
        ])
        doc.moveDown(0.4)
        doc.fillColor(C.pending).fontSize(9).font('Helvetica-Bold')
           .text('Results pending — not yet available.', ML, doc.y, { align: 'center', width: USABLE })
        doc.moveDown(0.5)
      }

      // Doctor's signature block (only on last test page)
      if (idx === tests.length - 1) {
        doc.moveDown(1.0)
        const sigY = doc.y
        doc.rect(ML, sigY, USABLE, 52).fill(C.light).strokeColor(C.border).lineWidth(0.5).stroke()

        // Left: Authorised doctor
        doc.fillColor(C.muted).fontSize(7.5).font('Helvetica')
           .text('Authorised by / Doctor\'s Signature', ML + 12, sigY + 8)
        doc.fillColor(C.text).fontSize(9).font('Helvetica-Bold')
           .text(safe(assignment.doctorName), ML + 12, sigY + 21)
        doc.moveTo(ML + 12, sigY + 44).lineTo(ML + 180, sigY + 44)
           .strokeColor(C.border).lineWidth(0.6).stroke()

        // Right: Lab technician
        doc.fillColor(C.muted).fontSize(7.5).font('Helvetica')
           .text('Lab Technician Signature', ML + USABLE / 2 + 20, sigY + 8)
        doc.moveTo(ML + USABLE / 2 + 20, sigY + 44).lineTo(ML + USABLE - 12, sigY + 44)
           .strokeColor(C.border).lineWidth(0.6).stroke()

        doc.y = sigY + 60
      }

      drawFooter(doc, idx + 2, totalPages)
    })
  }

  return await toBuffer(doc)
}
