import React, { useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import logoPng from '../assets/Logo.png'
import html2pdf from 'html2pdf.js'
import { AppContext } from '../context/AppContext'
import { toast } from 'react-toastify'

const MyReports = () => {
  const { backendUrl, token } = useContext(AppContext)
  const [labReports, setLabReports] = useState([])
  const [pharmacyInvoices, setPharmacyInvoices] = useState([])
  const [billingInvoices, setBillingInvoices] = useState([])
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    if (!token) return

    const fetchData = async () => {
      try {
        const [labsRes, invoicesRes, billingRes, apptRes] = await Promise.all([
          axios.get(backendUrl + '/api/user/lab-reports', { headers: { token } }),
          axios.get(backendUrl + '/api/user/pharmacy-invoices', { headers: { token } }),
          axios.get(backendUrl + '/api/user/billing-invoices', { headers: { token } }),
          axios.get(backendUrl + '/api/user/appointments', { headers: { token } })
        ])

        if (labsRes.data?.success) setLabReports(labsRes.data.reports || [])
        if (invoicesRes.data?.success) setPharmacyInvoices(invoicesRes.data.invoices || [])
        if (billingRes.data?.success) setBillingInvoices(billingRes.data.invoices || [])
        if (apptRes.data?.appointments) setAppointments(apptRes.data.appointments || [])
      } catch (error) {
        toast.error(error.message)
      }
    }

    fetchData()
  }, [token])

  const medicalReports = useMemo(
    () => (appointments || []).filter(a => a.isCompleted),
    [appointments]
  )

  const buildLabReportHtml = (assignment) => {
    let reportData = null
    try {
      reportData = assignment.reportText ? JSON.parse(assignment.reportText) : null
    } catch (e) {
      reportData = null
    }

    const reports = reportData?.reports || (reportData ? [reportData] : [])

    const createdAt = assignment?.reportGeneratedAt
      ? new Date(assignment.reportGeneratedAt)
      : new Date()
    const reportId = assignment?.sampleId
      ? `LAB-${assignment.sampleId}`
      : assignment?._id
        ? `LAB-${assignment._id.slice(-6).toUpperCase()}`
        : `LAB-${createdAt.getTime()}`

    const pagesHtml = reports.map((step, index) => {
      const patient = step?.patient_info || {}
      const doctor = step?.doctor_info || {}
      const test = step?.test_info || {}
      const results = Array.isArray(step?.results) ? step.results : []
      const dateLabel = test.date || createdAt.toISOString().slice(0, 10)
      const pageLabel = `${index + 1} / ${reports.length}`

      const resultsHtml = results.length
        ? results.map((r, idx) => `
            <tr class="${idx % 2 === 1 ? 'alt' : ''}">
              <td class="num">${idx + 1}</td>
              <td class="tname"><strong>${r.parameter || '-'}</strong></td>
              <td class="cat">${r.value || '-'}</td>
              <td class="cat">${r.unit || '-'}</td>
              <td class="cat">${r.normal_range || r.normal || '-'}</td>
              <td class="amt">${r.status || '-'}</td>
            </tr>`).join('')
        : `
            <tr>
              <td class="num">1</td>
              <td class="tname"><strong>Result</strong></td>
              <td class="cat">-</td>
              <td class="cat">-</td>
              <td class="cat">-</td>
              <td class="amt">-</td>
            </tr>`

      return `
      <section class="page">
        <div class="content">
          <div class="header">
            <div class="header-logo"><img src="${logoPng}" alt="Hospitra" /></div>
            <div class="header-right">
              <div class="inv-title">Laboratory Report</div>
              <div class="inv-id">${reportId}</div>
              <div class="inv-date">Date: ${new Date(dateLabel).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              <span class="status-pill">Issued</span>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-box">
              <div class="box-title">Patient Details</div>
              <div class="irow"><span class="ilabel">Name</span><span class="ivalue">${patient.name || assignment.patientName || '-'}</span></div>
              <div class="irow"><span class="ilabel">Patient ID</span><span class="ivalue">${patient.patient_id || assignment.patientId || '-'}</span></div>
              <div class="irow"><span class="ilabel">Age / Gender</span><span class="ivalue">${patient.age || '-'} / ${patient.gender || '-'}</span></div>
              <div class="irow"><span class="ilabel">Contact</span><span class="ivalue">${patient.contact || assignment.patientPhone || '-'}</span></div>
            </div>
            <div class="info-box">
              <div class="box-title">Doctor & Test</div>
              <div class="irow"><span class="ilabel">Doctor</span><span class="ivalue">${doctor.doctor_name || assignment.doctorName || '-'}</span></div>
              <div class="irow"><span class="ilabel">Doctor ID</span><span class="ivalue">${doctor.doctor_id || assignment.doctorId || '-'}</span></div>
              <div class="irow"><span class="ilabel">Test</span><span class="ivalue">${test.test_name || '-'}</span></div>
              <div class="irow"><span class="ilabel">Category</span><span class="ivalue">${test.category || '-'}</span></div>
            </div>
          </div>

          <div class="meta-strip">
            <div class="meta-item">Lab Technician: <strong>${test.lab_technician || '-'}</strong></div>
            <div class="meta-item">Report Date: <span class="meta-badge">${dateLabel}</span></div>
            <div class="meta-item">Page: <strong>${pageLabel}</strong></div>
          </div>

          <div class="table-label">Test Results</div>
          <table>
            <thead>
              <tr>
                <th style="width:26px">#</th>
                <th style="width:30%">Parameter</th>
                <th style="width:16%">Value</th>
                <th style="width:14%">Unit</th>
                <th style="width:20%">Normal</th>
                <th class="r" style="width:14%">Status</th>
              </tr>
            </thead>
            <tbody>
              ${resultsHtml}
            </tbody>
          </table>

          ${step?.findings !== undefined ? `<div class="note"><strong>Findings:</strong> ${step.findings || '-'}</div>` : ''}
          ${step?.impression !== undefined ? `<div class="note"><strong>Impression:</strong> ${step.impression || '-'}</div>` : ''}
          ${step?.remarks !== undefined ? `<div class="note"><strong>Remarks:</strong> ${step.remarks || '-'}</div>` : ''}
          ${step?.overall_summary !== undefined ? `<div class="note"><strong>Overall Summary:</strong> ${step.overall_summary || '-'}</div>` : ''}
          ${step?.doctor_remark !== undefined ? `<div class="note"><strong>Doctor Remark:</strong> ${step.doctor_remark || '-'}</div>` : ''}
          ${step?.suggestion !== undefined ? `<div class="note"><strong>Suggestion:</strong> ${step.suggestion || '-'}</div>` : ''}
          ${step?.technique !== undefined ? `<div class="note"><strong>Technique:</strong> ${step.technique || '-'}</div>` : ''}
          ${step?.radiologist !== undefined ? `<div class="note"><strong>Radiologist:</strong> ${step.radiologist || '-'}</div>` : ''}
          ${step?.image_url ? `<div class="note"><strong>Image URL:</strong> ${step.image_url}</div>` : ''}
        </div>

        <div class="footer">
          <div class="footer-left"><strong>Hospitra Digital Health Systems</strong> &nbsp;&middot;&nbsp; Laboratory Report</div>
          <div class="footer-right">Computer Generated Report<br/>No Physical Signature Required</div>
        </div>
      </section>`
    }).join('')

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>Lab Report</title>
    <style>
      @page { size: A4; margin: 0; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b; background: #fff; font-size: 12px; line-height: 1.35; }
      .report-pages { width: 210mm; }
      .page { width: 210mm; height: 296mm; display: flex; flex-direction: column; padding: 8mm 10mm; overflow: hidden; page-break-after: always; }
      .page:last-child { page-break-after: auto; }
      .content { flex: 1; display: flex; flex-direction: column; gap: 6px; min-height: 0; }

      .header { display: flex; justify-content: space-between; align-items: center; width: 100%; padding-bottom: 8px; border-bottom: 2px solid #1e3a5f; margin-bottom: 8px; }
      .header-logo img { height: 42px; object-fit: contain; }
      .header-right { text-align: right; }
      .inv-title { font-size: 18px; font-weight: 700; color: #1e3a5f; }
      .inv-id { font-size: 11px; color: #64748b; font-family: monospace; margin-top: 2px; }
      .inv-date { font-size: 11px; color: #64748b; margin-top: 2px; }
      .status-pill { display: inline-block; background: #dcfce7; color: #166534; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; }

      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
      .info-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; }
      .box-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px dashed #e2e8f0; }
      .irow { display: flex; gap: 6px; margin-bottom: 4px; }
      .ilabel { min-width: 100px; color: #64748b; font-size: 11px; flex-shrink: 0; }
      .ivalue { color: #0f172a; font-weight: 600; font-size: 11px; word-break: break-word; }

      .meta-strip { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; flex-wrap: wrap; margin-bottom: 8px; }
      .meta-item { font-size: 11px; color: #475569; display: flex; align-items: center; gap: 5px; }
      .meta-badge { display: inline-block; border-radius: 4px; padding: 2px 7px; font-size: 10px; font-weight: 700; background: #eff6ff; color: #1d4ed8; }

      .table-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; }
      thead tr { background: #1e3a5f; }
      th { padding: 8px 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #93c5fd; text-align: left; }
      th.r { text-align: right; }
      td { padding: 8px 10px; font-size: 11px; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
      tr.alt td { background: #f8fafc; }
      td.num { color: #cbd5e1; font-size: 11px; width: 26px; }
      td.tname strong { font-size: 12px; }
      td.cat { color: #64748b; font-size: 11px; }
      td.amt { font-weight: 700; color: #0f172a; text-align: right; }

      .note { margin-top: 6px; font-size: 11px; color: #334155; }
      .footer { border-top: 1px solid #e2e8f0; padding-top: 6px; display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
      .footer-left { font-size: 10px; color: #64748b; }
      .footer-left strong { color: #1e3a5f; }
      .footer-right { font-size: 10px; color: #94a3b8; text-align: right; }
    </style>
  </head>
  <body>
    <div class="report-pages">
      ${pagesHtml || '<section class="page"><div class="content"><p>No report data</p></div></section>'}
    </div>
  </body>
</html>`

  }

  const downloadLabReport = (assignment) => {
    const html = buildLabReportHtml(assignment)
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-10000px'
    container.style.top = '0'
    container.innerHTML = html
    const target = container.querySelector('.report-pages')
    if (!target) {
      toast.error('Unable to generate report')
      return
    }
    document.body.appendChild(container)
    const fileName = `lab_report_${assignment._id || Date.now()}.pdf`
    const options = {
      margin: [0, 0, 0, 0],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'avoid-all'] }
    }

    html2pdf()
      .set(options)
      .from(target)
      .save()
      .finally(() => {
        container.remove()
      })
  }

  const buildPharmacyInvoiceHtml = (invoice) => {
    const invoiceId = invoice?._id ? `PHARM-${invoice._id.slice(-6).toUpperCase()}` : `PHARM-${Date.now()}`
    const createdAt = invoice?.createdAt ? new Date(invoice.createdAt) : new Date()
    const itemsHtml = (invoice.items || []).map((item, idx) => `
      <tr class="${idx % 2 === 1 ? 'alt' : ''}">
        <td class="num">${idx + 1}</td>
        <td class="tname"><strong>${item.name || '-'}</strong></td>
        <td class="cat">${item.dosage || '-'}</td>
        <td class="cat">${item.qty}</td>
        <td class="cat">₹${item.price}</td>
        <td class="amt">₹${item.lineTotal ?? (item.price * item.qty)}</td>
      </tr>
    `).join('')

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>Pharmacy Invoice</title>
    <style>
      @page { size: A4; margin: 0; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #1f2937; background: #fff; font-size: 12px; line-height: 1.35; }
      .page { width: 210mm; height: 296mm; display: flex; flex-direction: column; padding: 8mm 10mm; overflow: hidden; }
      .content { flex: 1; display: flex; flex-direction: column; gap: 6px; min-height: 0; }

      .header { display: flex; justify-content: space-between; align-items: center; width: 100%; padding-bottom: 8px; border-bottom: 2px solid #065f46; margin-bottom: 8px; }
      .header-logo img { height: 42px; object-fit: contain; }
      .header-right { text-align: right; }
      .inv-title { font-size: 18px; font-weight: 700; color: #065f46; }
      .inv-id { font-size: 11px; color: #6b7280; font-family: monospace; margin-top: 2px; }
      .inv-date { font-size: 11px; color: #6b7280; margin-top: 2px; }
      .status-pill { display: inline-block; background: #d1fae5; color: #065f46; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; }

      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
      .info-box { border: 1px solid #d1fae5; border-radius: 6px; padding: 8px 10px; }
      .box-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px dashed #d1fae5; }
      .irow { display: flex; gap: 6px; margin-bottom: 4px; }
      .ilabel { min-width: 100px; color: #6b7280; font-size: 11px; flex-shrink: 0; }
      .ivalue { color: #111827; font-weight: 600; font-size: 11px; word-break: break-word; }

      .meta-strip { display: flex; align-items: center; gap: 10px; background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 6px; padding: 6px 10px; flex-wrap: wrap; margin-bottom: 8px; }
      .meta-item { font-size: 11px; color: #374151; display: flex; align-items: center; gap: 5px; }
      .meta-badge { display: inline-block; border-radius: 4px; padding: 2px 7px; font-size: 10px; font-weight: 700; background: #bbf7d0; color: #166534; }

      .table-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; }
      thead tr { background: #065f46; }
      th { padding: 8px 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #a7f3d0; text-align: left; }
      th.r { text-align: right; }
      td { padding: 8px 10px; font-size: 11px; color: #374151; border-bottom: 1px solid #ecfdf5; vertical-align: middle; }
      tr.alt td { background: #f0fdf4; }
      td.num { color: #a7f3d0; font-size: 11px; width: 26px; }
      td.tname strong { font-size: 12px; }
      td.cat { color: #6b7280; font-size: 11px; }
      td.amt { font-weight: 700; color: #111827; text-align: right; }

      .bottom { margin-top: auto; padding-top: 10px; }
      .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 8px; }
      .totals-box { width: 200px; }
      .trow { display: flex; justify-content: space-between; font-size: 11px; color: #4b5563; padding: 3px 0; border-bottom: 1px solid #ecfdf5; }
      .trow.grand { padding-top: 6px; border-top: 2px solid #065f46; border-bottom: none; font-size: 13px; font-weight: 700; color: #065f46; }
      .footer { border-top: 1px solid #d1fae5; padding-top: 6px; display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
      .footer-left { font-size: 10px; color: #6b7280; }
      .footer-left strong { color: #065f46; }
      .footer-right { font-size: 10px; color: #9ca3af; text-align: right; }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="content">

      <div class="header">
        <div class="header-logo"><img src="${logoPng}" alt="Hospitra" /></div>
        <div class="header-right">
          <div class="inv-title">Pharmacy Invoice</div>
          <div class="inv-id">${invoiceId}</div>
          <div class="inv-date">Date: ${createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} &nbsp;|&nbsp; ${createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
          <span class="status-pill">Issued</span>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-box">
          <div class="box-title">Patient Details</div>
          <div class="irow"><span class="ilabel">Name</span><span class="ivalue">${invoice.patientName || '-'}</span></div>
          <div class="irow"><span class="ilabel">Patient ID</span><span class="ivalue">${invoice.userId || '-'}</span></div>
          <div class="irow"><span class="ilabel">Phone</span><span class="ivalue">${invoice.patientPhone || '-'}</span></div>
          <div class="irow"><span class="ilabel">Email</span><span class="ivalue">${invoice.patientEmail || '-'}</span></div>
        </div>
        <div class="info-box">
          <div class="box-title">Doctor & Payment</div>
          <div class="irow"><span class="ilabel">Doctor</span><span class="ivalue">${invoice.doctorName || '-'}</span></div>
          <div class="irow"><span class="ilabel">Doctor ID</span><span class="ivalue">${invoice.doctorId || '-'}</span></div>
          <div class="irow"><span class="ilabel">Payment</span><span class="ivalue">${invoice.paymentMethod || '-'}</span></div>
        </div>
      </div>

      <div class="meta-strip">
        <div class="meta-item">Items: <strong>${(invoice.items || []).length}</strong></div>
        <div class="meta-item">Payment: <span class="meta-badge">${invoice.paymentMethod || '-'}</span></div>
      </div>

      <div class="table-label">Medicine Details</div>
      <table>
        <thead>
          <tr>
            <th style="width:26px">#</th>
            <th style="width:30%">Medicine</th>
            <th style="width:16%">Dosage</th>
            <th style="width:10%">Qty</th>
            <th style="width:16%">Price</th>
            <th class="r" style="width:16%">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      </div>

      <div class="bottom">
        <div class="totals-wrap">
          <div class="totals-box">
            <div class="trow"><span>Subtotal</span><span>₹${Number(invoice.total || 0).toLocaleString()}</span></div>
            <div class="trow grand"><span>Total Due</span><span>₹${Number(invoice.total || 0).toLocaleString()}</span></div>
          </div>
        </div>
        <div class="footer">
          <div class="footer-left"><strong>Hospitra Digital Health Systems</strong> &nbsp;&middot;&nbsp; Thank you for choosing Hospitra.</div>
          <div class="footer-right">Computer Generated Invoice<br/>No Physical Signature Required</div>
        </div>
      </div>

    </div>
  </body>
</html>`
  }

  const downloadInvoice = (invoice) => {
    const html = buildPharmacyInvoiceHtml(invoice)
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-10000px'
    container.style.top = '0'
    container.innerHTML = html
    const target = container.querySelector('.page')
    if (!target) {
      toast.error('Unable to generate invoice')
      return
    }
    document.body.appendChild(container)
    const fileName = `pharmacy_invoice_${invoice._id || Date.now()}.pdf`
    const options = {
      margin: [0, 0, 0, 0],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all' }
    }

    html2pdf()
      .set(options)
      .from(target)
      .save()
      .finally(() => {
        container.remove()
      })
  }

  const buildBillingInvoiceHtml = (invoice) => {
    const invoiceId = invoice?.createdAt ? `BILL-${invoice.createdAt}` : `BILL-${Date.now()}`
    const createdAt = invoice?.createdAt ? new Date(invoice.createdAt) : new Date()
    const items = invoice?.items || []
    const itemsHtml = items.length
      ? items.map((it, idx) => `
            <tr class="${idx % 2 === 1 ? 'alt' : ''}">
              <td class="num">${idx + 1}</td>
              <td class="tname"><strong>${it.name || '-'}</strong></td>
              <td class="cat">${it.category || '-'}</td>
              <td class="amt">₹${Number(it.price || 0).toLocaleString()}</td>
            </tr>`).join('')
      : `
            <tr>
              <td class="num">1</td>
              <td class="tname"><strong>Billing</strong></td>
              <td class="cat">Not specified</td>
              <td class="amt">₹0</td>
            </tr>`

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>Billing Invoice</title>
    <style>
      @page { size: A4; margin: 0; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b; background: #fff; font-size: 12px; line-height: 1.35; }
      .page { width: 210mm; height: 296mm; display: flex; flex-direction: column; padding: 8mm 10mm; overflow: hidden; }
      .content { flex: 1; display: flex; flex-direction: column; gap: 6px; min-height: 0; }

      .header { display: flex; justify-content: space-between; align-items: center; width: 100%; padding-bottom: 8px; border-bottom: 2px solid #1e3a5f; margin-bottom: 8px; }
      .header-logo img { height: 42px; object-fit: contain; }
      .header-right { text-align: right; }
      .inv-title { font-size: 18px; font-weight: 700; color: #1e3a5f; }
      .inv-id { font-size: 11px; color: #64748b; font-family: monospace; margin-top: 2px; }
      .inv-date { font-size: 11px; color: #64748b; margin-top: 2px; }
      .status-pill { display: inline-block; background: #dcfce7; color: #166534; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; }

      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
      .info-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; }
      .box-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px dashed #e2e8f0; }
      .irow { display: flex; gap: 6px; margin-bottom: 4px; }
      .ilabel { min-width: 100px; color: #64748b; font-size: 11px; flex-shrink: 0; }
      .ivalue { color: #0f172a; font-weight: 600; font-size: 11px; word-break: break-word; }

      .meta-strip { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; flex-wrap: wrap; margin-bottom: 8px; }
      .meta-item { font-size: 11px; color: #475569; display: flex; align-items: center; gap: 5px; }
      .meta-badge { display: inline-block; border-radius: 4px; padding: 2px 7px; font-size: 10px; font-weight: 700; background: #eff6ff; color: #1d4ed8; }

      .table-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; }
      thead tr { background: #1e3a5f; }
      th { padding: 8px 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #93c5fd; text-align: left; }
      th.r { text-align: right; }
      td { padding: 8px 10px; font-size: 11px; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
      tr.alt td { background: #f8fafc; }
      td.num { color: #cbd5e1; font-size: 11px; width: 26px; }
      td.tname strong { font-size: 12px; }
      td.cat { color: #64748b; font-size: 11px; }
      td.amt { font-weight: 700; color: #0f172a; text-align: right; }

      .bottom { margin-top: auto; padding-top: 10px; }
      .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 8px; }
      .totals-box { width: 180px; }
      .trow { display: flex; justify-content: space-between; font-size: 11px; color: #475569; padding: 3px 0; border-bottom: 1px solid #f1f5f9; }
      .trow.grand { padding-top: 6px; border-top: 2px solid #1e3a5f; border-bottom: none; font-size: 13px; font-weight: 700; color: #0f172a; }
      .footer { border-top: 1px solid #e2e8f0; padding-top: 6px; display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
      .footer-left { font-size: 10px; color: #64748b; }
      .footer-left strong { color: #1e3a5f; }
      .footer-right { font-size: 10px; color: #94a3b8; text-align: right; }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="content">

      <div class="header">
        <div class="header-logo"><img src="${logoPng}" alt="Hospitra" /></div>
        <div class="header-right">
          <div class="inv-title">Billing Invoice</div>
          <div class="inv-id">${invoiceId}</div>
          <div class="inv-date">Date: ${createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} &nbsp;|&nbsp; ${createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
          <span class="status-pill">Issued</span>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-box">
          <div class="box-title">Patient Details</div>
          <div class="irow"><span class="ilabel">Name</span><span class="ivalue">${invoice.patientName || '-'}</span></div>
          <div class="irow"><span class="ilabel">Patient ID</span><span class="ivalue">${invoice.patientId || '-'}</span></div>
          <div class="irow"><span class="ilabel">Phone</span><span class="ivalue">${invoice.patientPhone || '-'}</span></div>
          <div class="irow"><span class="ilabel">Email</span><span class="ivalue">${invoice.patientEmail || '-'}</span></div>
        </div>
        <div class="info-box">
          <div class="box-title">Billing Details</div>
          <div class="irow"><span class="ilabel">Department</span><span class="ivalue">${invoice.department || '-'}</span></div>
          <div class="irow"><span class="ilabel">Notes</span><span class="ivalue">${invoice.notes || '-'}</span></div>
        </div>
      </div>

      <div class="meta-strip">
        <div class="meta-item">Items: <strong>${items.length || 1}</strong></div>
        <div class="meta-item">Department: <span class="meta-badge">${invoice.department || '-'}</span></div>
      </div>

      <div class="table-label">Billing Details</div>
      <table>
        <thead>
          <tr>
            <th style="width:26px">#</th>
            <th style="width:45%">Item</th>
            <th style="width:30%">Category</th>
            <th class="r" style="width:20%">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      </div>

      <div class="bottom">
        <div class="totals-wrap">
          <div class="totals-box">
            <div class="trow"><span>Subtotal</span><span>₹${Number(invoice.total || 0).toLocaleString()}</span></div>
            <div class="trow grand"><span>Total Due</span><span>₹${Number(invoice.total || 0).toLocaleString()}</span></div>
          </div>
        </div>
        <div class="footer">
          <div class="footer-left"><strong>Hospitra Digital Health Systems</strong> &nbsp;&middot;&nbsp; Thank you for choosing Hospitra.</div>
          <div class="footer-right">Computer Generated Invoice<br/>No Physical Signature Required</div>
        </div>
      </div>

    </div>
  </body>
</html>`
  }

  const downloadBillingInvoice = (invoice) => {
    const html = buildBillingInvoiceHtml(invoice)
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-10000px'
    container.style.top = '0'
    container.innerHTML = html
    const target = container.querySelector('.page')
    if (!target) {
      toast.error('Unable to generate invoice')
      return
    }
    document.body.appendChild(container)
    const fileName = `billing_invoice_${invoice._id || Date.now()}.pdf`
    const options = {
      margin: [0, 0, 0, 0],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all' }
    }

    html2pdf()
      .set(options)
      .from(target)
      .save()
      .finally(() => {
        container.remove()
      })
  }

  return (
    <div className='mt-12'>
      <p className='pb-3 text-lg font-medium text-gray-600 border-b'>My Reports & Invoices</p>

      <div className='mt-6 space-y-8'>
        <div className='bg-white border rounded-xl p-4'>
          <p className='text-sm font-semibold text-gray-700 mb-3'>Billing Invoices</p>
          {billingInvoices.length === 0 ? (
            <p className='text-sm text-gray-400'>No billing invoices yet.</p>
          ) : (
            <div className='space-y-3'>
              {billingInvoices.map((inv) => (
                <div key={inv._id} className='border rounded-lg p-3 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2'>
                  <div>
                    <p className='font-medium text-gray-700'>Invoice #{inv._id?.slice(-6)}</p>
                    <p className='text-xs text-gray-500'>Date: {new Date(inv.createdAt || Date.now()).toLocaleString()}</p>
                    <p className='text-xs text-gray-500'>Total: ₹{inv.total || 0}</p>
                  </div>
                  <button onClick={() => downloadBillingInvoice(inv)} className='px-3 py-1 rounded-lg text-xs bg-blue-50 text-blue-700'>Download</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className='bg-white border rounded-xl p-4'>
          <p className='text-sm font-semibold text-gray-700 mb-3'>Pharmacy Invoices</p>
          {pharmacyInvoices.length === 0 ? (
            <p className='text-sm text-gray-400'>No pharmacy invoices yet.</p>
          ) : (
            <div className='space-y-3'>
              {pharmacyInvoices.map((inv) => (
                <div key={inv._id} className='border rounded-lg p-3 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2'>
                  <div>
                    <p className='font-medium text-gray-700'>Invoice #{inv._id?.slice(-6)}</p>
                    <p className='text-xs text-gray-500'>Date: {new Date(inv.createdAt).toLocaleString()}</p>
                    <p className='text-xs text-gray-500'>Total: ₹{inv.total}</p>
                  </div>
                  <button onClick={() => downloadInvoice(inv)} className='px-3 py-1 rounded-lg text-xs bg-emerald-50 text-emerald-700'>Download</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className='bg-white border rounded-xl p-4'>
          <p className='text-sm font-semibold text-gray-700 mb-3'>Lab Reports</p>
          {labReports.length === 0 ? (
            <p className='text-sm text-gray-400'>No lab reports yet.</p>
          ) : (
            <div className='space-y-3'>
              {labReports.map((r) => (
                <div key={r._id} className='border rounded-lg p-3 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2'>
                  <div>
                    <p className='font-medium text-gray-700'>{r.patientName || r.patientId}</p>
                    <p className='text-xs text-gray-500'>Report Date: {r.reportGeneratedAt ? new Date(r.reportGeneratedAt).toLocaleDateString() : '-'}</p>
                  </div>
                  <button onClick={() => downloadLabReport(r)} className='px-3 py-1 rounded-lg text-xs bg-blue-50 text-blue-700'>Download</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className='bg-white border rounded-xl p-4'>
          <p className='text-sm font-semibold text-gray-700 mb-3'>Medical Reports</p>
          {medicalReports.length === 0 ? (
            <p className='text-sm text-gray-400'>No medical reports yet.</p>
          ) : (
            <div className='space-y-3'>
              {medicalReports.map((a) => (
                <div key={a._id} className='border rounded-lg p-3 text-sm'>
                  <p className='font-medium text-gray-700'>{a.docData?.name || 'Doctor'}</p>
                  <p className='text-xs text-gray-500'>Date: {a.slotDate?.replaceAll('_', '/')} • {a.slotTime}</p>
                  <p className='text-xs text-gray-500'>Speciality: {a.docData?.speciality || '-'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyReports
