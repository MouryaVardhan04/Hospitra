import React, { useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { AppContext } from '../context/AppContext'
import { toast } from 'react-toastify'

const MyReports = () => {
  const { backendUrl, token } = useContext(AppContext)
  const [labReports, setLabReports] = useState([])
  const [pharmacyInvoices, setPharmacyInvoices] = useState([])
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    if (!token) return

    const fetchData = async () => {
      try {
        const [labsRes, invoicesRes, apptRes] = await Promise.all([
          axios.get(backendUrl + '/api/user/lab-reports', { headers: { token } }),
          axios.get(backendUrl + '/api/user/pharmacy-invoices', { headers: { token } }),
          axios.get(backendUrl + '/api/user/appointments', { headers: { token } })
        ])

        if (labsRes.data?.success) setLabReports(labsRes.data.reports || [])
        if (invoicesRes.data?.success) setPharmacyInvoices(invoicesRes.data.invoices || [])
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

  const downloadLabReport = (assignment) => {
    let reportData = null
    try {
      reportData = assignment.reportText ? JSON.parse(assignment.reportText) : null
    } catch (e) {
      reportData = null
    }

    const reports = reportData?.reports || (reportData ? [reportData] : [])

    const pagesHtml = reports.map((r) => {
      const resultsRows = Array.isArray(r.results)
        ? r.results.map(row => `
          <tr>
            <td>${row.parameter || '-'}</td>
            <td>${row.value || '-'}</td>
            <td>${row.unit || '-'}</td>
            <td>${row.normal_range || row.normal || '-'}</td>
            <td>${row.status || '-'}</td>
          </tr>
        `).join('')
        : ''

      return `
        <div class="page">
          <h1>Hospitra Lab Report</h1>
          <div class="muted">Patient: ${r?.patient_info?.name || assignment.patientName || assignment.patientId}</div>
          <div class="muted">Date: ${r?.test_info?.date || (assignment.reportGeneratedAt ? new Date(assignment.reportGeneratedAt).toLocaleDateString() : '-')}</div>
          <div class="section"><strong>Test:</strong> ${r?.test_info?.test_name || '-'}</div>
          <div class="section">
            <table>
              <tr><th>Patient ID</th><td>${r?.patient_info?.patient_id || '-'}</td><th>Contact</th><td>${r?.patient_info?.contact || '-'}</td></tr>
              <tr><th>Age</th><td>${r?.patient_info?.age || '-'}</td><th>Gender</th><td>${r?.patient_info?.gender || '-'}</td></tr>
              <tr><th>Height/Weight</th><td>${r?.patient_info?.height || '-'} / ${r?.patient_info?.weight || '-'}</td><th>Doctor</th><td>${r?.doctor_info?.doctor_name || '-'}</td></tr>
              <tr><th>Category</th><td>${r?.test_info?.category || '-'}</td><th>Technician</th><td>${r?.test_info?.lab_technician || '-'}</td></tr>
            </table>
          </div>
          ${resultsRows ? `
            <div class="section">
              <table>
                <thead><tr><th>Parameter</th><th>Value</th><th>Unit</th><th>Normal</th><th>Status</th></tr></thead>
                <tbody>${resultsRows}</tbody>
              </table>
            </div>
          ` : ''}
          ${r?.findings !== undefined ? `<div class="section"><strong>Findings:</strong> ${r.findings || '-'}</div>` : ''}
          ${r?.impression !== undefined ? `<div class="section"><strong>Impression:</strong> ${r.impression || '-'}</div>` : ''}
          ${r?.remarks !== undefined ? `<div class="section"><strong>Remarks:</strong> ${r.remarks || '-'}</div>` : ''}
        </div>
      `
    }).join('')

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Lab Report</title>
    <style>
      @page { size: A4; margin: 20mm; }
      body { font-family: Arial, sans-serif; color: #111827; }
      h1 { font-size: 18px; margin-bottom: 6px; }
      .muted { color: #6b7280; font-size: 12px; }
      .section { margin-top: 14px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #e5e7eb; padding: 6px; text-align: left; }
      .page { page-break-after: always; }
      .page:last-child { page-break-after: auto; }
    </style>
  </head>
  <body>
    ${pagesHtml || '<div class="page"><p>No report data</p></div>'}
  </body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lab_report_${assignment._id || Date.now()}.html`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const downloadInvoice = (invoice) => {
    const itemsHtml = (invoice.items || []).map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.dosage || '-'}</td>
        <td>${item.qty}</td>
        <td>₹${item.price}</td>
        <td>₹${item.lineTotal ?? (item.price * item.qty)}</td>
      </tr>
    `).join('')

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Pharmacy Invoice</title>
    <style>
      @page { size: A4; margin: 20mm; }
      body { font-family: Arial, sans-serif; color: #111827; }
      h1 { font-size: 20px; margin-bottom: 6px; }
      .muted { color: #6b7280; font-size: 12px; }
      .section { margin-top: 12px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; }
      th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
      th { background: #f9fafb; }
      .total { text-align: right; font-weight: 700; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
    </style>
  </head>
  <body>
    <h1>Hospitra Pharmacy Invoice</h1>
    <div class="muted">Invoice Date: ${new Date(invoice.createdAt || Date.now()).toLocaleString()}</div>

    <div class="section grid">
      <div class="card">
        <div class="muted">Patient Details</div>
        <div><strong>${invoice.patientName || '-'}</strong></div>
        <div>ID: ${invoice.userId || '-'}</div>
        <div>Phone: ${invoice.patientPhone || '-'}</div>
        <div>Email: ${invoice.patientEmail || '-'}</div>
      </div>
      <div class="card">
        <div class="muted">Doctor & Payment</div>
        <div>Doctor: ${invoice.doctorName || '-'}</div>
        <div>Doctor ID: ${invoice.doctorId || '-'}</div>
        <div>Payment: ${invoice.paymentMethod || '-'}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Medicine</th>
          <th>Dosage</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Line Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" class="total">Total</td>
          <td class="total">₹${invoice.total || 0}</td>
        </tr>
      </tfoot>
    </table>
  </body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pharmacy_invoice_${invoice._id || Date.now()}.html`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className='mt-12'>
      <p className='pb-3 text-lg font-medium text-gray-600 border-b'>My Reports & Invoices</p>

      <div className='mt-6 space-y-8'>
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
