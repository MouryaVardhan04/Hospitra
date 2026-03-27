import React, { useContext, useEffect, useMemo, useState } from 'react'
import logoPng from '../../assets/Logo.png'
import { toast } from 'react-toastify'
import axios from 'axios'
import html2pdf from 'html2pdf.js'
import { AppContext } from '../../context/AppContext'
import { AdminContext } from '../../context/AdminContext'

const LabAssignment = () => {
  const { backendUrl, currency } = useContext(AppContext)
  const { aToken, lookupPatient, getLabCatalog } = useContext(AdminContext)
  const [patientId, setPatientId] = useState('')
  const [patientName, setPatientName] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [catalog, setCatalog] = useState([])
  const [selectedCategoryKey, setSelectedCategoryKey] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState([])
  const [priority, setPriority] = useState('Routine')
  const [doctorId, setDoctorId] = useState('')
  const [doctorName, setDoctorName] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTimeSlot, setAppointmentTimeSlot] = useState('')
  const [notes, setNotes] = useState('')
  const [lastAssignment, setLastAssignment] = useState(null)

  useEffect(() => {
    const loadCatalog = async () => {
      const data = await getLabCatalog()
      if (data?.success) {
        const next = data.categories || []
        setCatalog(next)
        const testsCategory = next.find(c => (c.name || '').toLowerCase().includes('test'))
        setSelectedCategoryKey((testsCategory?.key || testsCategory?.name) || (next[0]?.key || next[0]?.name) || '')
      } else {
        try {
          const { data: res } = await axios.get(backendUrl + '/api/admin/lab-catalog', { headers: { aToken } })
          if (res.success) {
            const next = res.catalog?.categories || []
            setCatalog(next)
            const testsCategory = next.find(c => (c.name || '').toLowerCase().includes('test'))
            setSelectedCategoryKey((testsCategory?.key || testsCategory?.name) || (next[0]?.key || next[0]?.name) || '')
          }
        } catch (error) {
          toast.error(error.message)
        }
      }
    }
    loadCatalog()
  }, [])

  const total = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + Number(item.price || 0), 0)
  }, [selectedItems])

  const selectedCategoryIndex = useMemo(() => {
    if (!selectedCategoryKey) return -1
    return catalog.findIndex(c => (c.key || c.name) === selectedCategoryKey)
  }, [catalog, selectedCategoryKey])

  const selectedCategory = selectedCategoryIndex >= 0 ? catalog[selectedCategoryIndex] : null

  const filteredItems = useMemo(() => {
    const items = selectedCategory?.items || []
    if (!searchTerm.trim()) return items
    const q = searchTerm.trim().toLowerCase()
    return items.filter(it => (it.name || '').toLowerCase().includes(q))
  }, [selectedCategory, searchTerm])

  useEffect(() => {
    if (catalog.length > 0 && selectedCategoryIndex === -1) {
      setSelectedCategoryKey((catalog[0]?.key || catalog[0]?.name) || '')
    }
  }, [catalog, selectedCategoryIndex])

  const onSearch = async (e) => {
    e.preventDefault()
    if (!patientId && !patientName) {
      toast.error('Enter patient ID or name')
      return
    }
    setSearching(true)
    const data = await lookupPatient({ patientId: patientId.trim(), patientName: patientName.trim() })
    setSearching(false)
    if (data.success) {
      setResults(data.results || [])
    } else {
      setResults([])
      toast.error(data.message || 'No patient found')
    }
  }

  const selectPatient = (result) => {
    const patient = result?.patient || result || {}
    setPatientId(patient._id || '')
    setPatientName(patient.name || '')
    setPatientPhone(patient.phone || '')

    const latestAppointment = Array.isArray(result?.appointments) ? result.appointments[0] : null
    if (latestAppointment) {
      setDoctorId(latestAppointment.docId || '')
      setDoctorName(latestAppointment.docData?.name || '')
      setAppointmentDate(latestAppointment.slotDate || '')
      setAppointmentTimeSlot(latestAppointment.slotTime || '')
    } else {
      setDoctorId('')
      setDoctorName('')
      setAppointmentDate('')
      setAppointmentTimeSlot('')
    }
  }

  const toggleItem = (categoryName, item) => {
    const key = `${categoryName}::${item.name}`
    const exists = selectedItems.find(i => i.key === key)
    if (exists) {
      setSelectedItems(prev => prev.filter(i => i.key !== key))
    } else {
      setSelectedItems(prev => ([
        ...prev,
        { key, name: item.name, price: Number(item.price || 0), category: categoryName }
      ]))
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!patientId && !patientName) {
      toast.error('Enter patient ID or name')
      return
    }
    if (selectedItems.length === 0) {
      toast.error('Select at least one test')
      return
    }
    try {
      const payload = {
        patientId,
        patientName,
        tests: selectedItems.map(i => i.name),
        items: selectedItems.map(({ key, ...rest }) => rest),
        total,
        priority,
        notes
      }
      const { data } = await axios.post(backendUrl + '/api/admin/lab-assignment', payload, { headers: { aToken } })
      if (data.success) {
        const assignments = JSON.parse(localStorage.getItem('receptionLabAssignments') || '[]')
        const assignmentRecord = {
          patientId,
          patientName,
          patientPhone,
          doctorId,
          doctorName,
          appointmentDate,
          appointmentTimeSlot,
          tests: payload.tests,
          items: payload.items,
          total: payload.total,
          priority,
          notes,
          createdAt: Date.now()
        }
        assignments.unshift(assignmentRecord)
        localStorage.setItem('receptionLabAssignments', JSON.stringify(assignments))
        toast.success('Lab assignment created')
        setLastAssignment(assignmentRecord)
        downloadInvoice(assignmentRecord)
        setSelectedItems([])
        setNotes('')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const buildInvoiceHtml = (assignment) => {
    const createdAt = assignment?.createdAt ? new Date(assignment.createdAt) : new Date()
    const invoiceId = assignment?.createdAt ? `LAB-${assignment.createdAt}` : 'PENDING'
    const items = assignment?.items || []
    const totalAmount = assignment?.total ?? 0
    const patientLabel = assignment?.patientName || patientName || '-'
    const patientRef = assignment?.patientId || patientId || '-'
    const patientPhoneLabel = assignment?.patientPhone || patientPhone || '-'
    const doctorNameLabel = assignment?.doctorName || doctorName || '-'
    const appointmentDateLabel = assignment?.appointmentDate || appointmentDate || '-'
    const appointmentTimeLabel = assignment?.appointmentTimeSlot || appointmentTimeSlot || '-'
    const priorityVal = assignment?.priority || priority || 'Routine'
    const notesVal = assignment?.notes || notes || ''

    const itemsHtml = items.length
      ? items.map((it, idx) => `<tr class="${idx % 2 === 1 ? 'alt' : ''}">
              <td class="num">${idx + 1}</td>
              <td class="tname"><strong>${it.name || '-'}</strong></td>
              <td class="cat">${it.category || '-'}</td>
              <td class="amt">${currency}${Number(it.price || 0).toLocaleString()}</td>
            </tr>`).join('')
      : `<tr>
              <td class="num">1</td>
              <td class="tname"><strong>Lab Tests</strong></td>
              <td class="cat">Not specified</td>
              <td class="amt">${currency}0</td>
            </tr>`

    const priorityColor = priorityVal.toLowerCase() === 'stat' ? '#dc2626'
      : priorityVal.toLowerCase() === 'urgent' ? '#ea580c'
      : '#0369a1'
    const priorityBg = priorityVal.toLowerCase() === 'stat' ? '#fef2f2'
      : priorityVal.toLowerCase() === 'urgent' ? '#fff7ed'
      : '#f0f9ff'

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>Lab Invoice - ${patientLabel}</title>
    <style>
      @page { size: A4; margin: 0; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b; background: #fff; font-size: 12px; line-height: 1.35; }
      .page { width: 210mm; height: 296mm; display: flex; flex-direction: column; padding: 8mm 10mm; overflow: hidden; }
      .content { flex: 1; display: flex; flex-direction: column; gap: 6px; min-height: 0; }

      /* Header */
      .header { display: flex; justify-content: space-between; align-items: center; width: 100%; padding-bottom: 8px; border-bottom: 2px solid #1e3a5f; margin-bottom: 8px; }
      .header-logo img { height: 42px; object-fit: contain; }
      .header-right { text-align: right; }
      .inv-title { font-size: 18px; font-weight: 700; color: #1e3a5f; }
      .inv-id { font-size: 11px; color: #64748b; font-family: monospace; margin-top: 2px; }
      .inv-date { font-size: 11px; color: #64748b; margin-top: 2px; }
      .status-pill { display: inline-block; background: #dcfce7; color: #166534; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; }

      /* Info grid */
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
      .info-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; }
      .box-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px dashed #e2e8f0; }
      .irow { display: flex; gap: 6px; margin-bottom: 4px; }
      .ilabel { min-width: 100px; color: #64748b; font-size: 11px; flex-shrink: 0; }
      .ivalue { color: #0f172a; font-weight: 600; font-size: 11px; word-break: break-word; }

      /* Meta strip */
      .meta-strip { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; flex-wrap: wrap; margin-bottom: 8px; }
      .meta-item { font-size: 11px; color: #475569; display: flex; align-items: center; gap: 5px; }
      .meta-badge { display: inline-block; border-radius: 4px; padding: 2px 7px; font-size: 10px; font-weight: 700; background: ${priorityBg}; color: ${priorityColor}; }

      /* Table */
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

      /* Bottom section — sits naturally at page bottom via flexbox */
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
          <div class="inv-title">Laboratory Invoice</div>
          <div class="inv-id">${invoiceId}</div>
          <div class="inv-date">Date: ${createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} &nbsp;|&nbsp; ${createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
          <span class="status-pill">Issued</span>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-box">
          <div class="box-title">Patient Details</div>
          <div class="irow"><span class="ilabel">Name</span><span class="ivalue">${patientLabel}</span></div>
          <div class="irow"><span class="ilabel">Patient ID</span><span class="ivalue">${patientRef}</span></div>
          <div class="irow"><span class="ilabel">Phone</span><span class="ivalue">${patientPhoneLabel}</span></div>
        </div>
        <div class="info-box">
          <div class="box-title">Appointment Details</div>
          <div class="irow"><span class="ilabel">Referring Doctor</span><span class="ivalue">${doctorNameLabel}</span></div>
          <div class="irow"><span class="ilabel">Date &amp; Time</span><span class="ivalue">${appointmentDateLabel} &middot; ${appointmentTimeLabel}</span></div>
        </div>
      </div>

      <div class="meta-strip">
        <div class="meta-item">Priority: <span class="meta-badge">${priorityVal}</span></div>
        <div class="meta-item">Tests ordered: <strong>${items.length || 1}</strong></div>
        ${notesVal ? '<div class="meta-item">Notes: <strong>' + notesVal + '</strong></div>' : ''}
      </div>

      <div class="table-label">Test Details</div>
      <table>
        <thead>
          <tr>
            <th style="width:26px">#</th>
            <th style="width:45%">Test Name</th>
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
            <div class="trow"><span>Subtotal</span><span>${currency}${Number(totalAmount || 0).toLocaleString()}</span></div>
            <div class="trow grand"><span>Total Due</span><span>${currency}${Number(totalAmount || 0).toLocaleString()}</span></div>
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

  const downloadInvoice = (assignment = lastAssignment) => {
    if (!assignment) {
      toast.error('Create a lab assignment to download invoice')
      return
    }
    const html = buildInvoiceHtml(assignment)
    const container = document.createElement('div')
    container.innerHTML = html
    const target = container.querySelector('.page')
    if (!target) {
      toast.error('Unable to generate invoice')
      return
    }
    document.body.appendChild(container)
    const fileName = `lab_invoice_${assignment.createdAt || Date.now()}.pdf`
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
    <div className='m-5 w-full'>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-4'>
        <p className='text-xl font-semibold text-gray-700'>Lab Assignment</p>
      </div>
      <div className='bg-white border rounded-xl p-6 mb-6'>
        <form onSubmit={onSearch} className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600'>
          <div>
            <p className='font-medium'>Patient ID</p>
            <input className='border rounded-lg w-full p-2 mt-1' value={patientId} onChange={e => setPatientId(e.target.value)} />
          </div>
          <div>
            <p className='font-medium'>Patient Name</p>
            <input className='border rounded-lg w-full p-2 mt-1' value={patientName} onChange={e => setPatientName(e.target.value)} />
          </div>
          <div className='md:col-span-2 flex gap-2'>
            <button className='bg-violet-600 text-white px-6 py-2 rounded-lg text-sm'>
              {searching ? 'Searching...' : 'Search Patient'}
            </button>
          </div>
        </form>
        {results.length > 0 && (
          <div className='mt-4 space-y-3'>
            {results.map((item, idx) => (
              <div key={idx} className='border rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-sm'>
                <div>
                  <p className='font-medium text-gray-800'>{item.patient.name}</p>
                  <p className='text-xs text-gray-500'>{item.patient.email}</p>
                  <p className='text-xs text-gray-500'>Phone: {item.patient.phone}</p>
                </div>
                <button
                  type='button'
                  onClick={() => selectPatient(item)}
                  className='px-4 py-2 rounded-lg text-sm bg-primary text-white'
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className='bg-white border rounded-xl p-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600'>
          <div>
            <p className='font-medium'>Selected Patient</p>
            <p className='text-sm text-gray-500 mt-1'>
              {patientName ? `${patientName}${patientId ? ` • ${patientId}` : ''}` : 'No patient selected'}
            </p>
            <p className='text-xs text-gray-400 mt-1'>
              {patientPhone ? `Phone: ${patientPhone}` : 'Phone: -'}
            </p>
          </div>
          <div>
            <p className='font-medium'>Priority</p>
            <select className='border rounded-lg w-full p-2 mt-1' value={priority} onChange={e => setPriority(e.target.value)}>
              <option>Routine</option>
              <option>Urgent</option>
              <option>STAT</option>
            </select>
          </div>
          <div>
            <p className='font-medium'>Doctor ID</p>
            <input className='border rounded-lg w-full p-2 mt-1 bg-gray-50' value={doctorId} readOnly />
          </div>
          <div>
            <p className='font-medium'>Doctor Name</p>
            <input className='border rounded-lg w-full p-2 mt-1 bg-gray-50' value={doctorName} readOnly />
          </div>
          <div>
            <p className='font-medium'>Appointment Date</p>
            <input className='border rounded-lg w-full p-2 mt-1 bg-gray-50' value={appointmentDate} readOnly />
          </div>
          <div>
            <p className='font-medium'>Time Slot</p>
            <input className='border rounded-lg w-full p-2 mt-1 bg-gray-50' value={appointmentTimeSlot} readOnly />
          </div>
          <div className='md:col-span-2'>
            <p className='font-medium'>Notes</p>
            <textarea className='border rounded-lg w-full p-2 mt-1' rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <div className='mt-5'>
          <p className='font-medium text-gray-700 mb-2'>Select Tests</p>
          {catalog.length === 0 ? (
            <p className='text-sm text-gray-400'>No catalog available.</p>
          ) : (
            <div className='bg-white border rounded-lg p-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-3 items-end'>
                <div>
                  <p className='text-xs text-gray-500 mb-1'>Category</p>
                  <select
                    value={selectedCategoryKey}
                    onChange={(e) => setSelectedCategoryKey(e.target.value)}
                    className='w-full border rounded-lg px-3 py-2 text-sm'
                  >
                    {catalog.map((cat, idx) => (
                      <option key={cat.key || idx} value={cat.key || cat.name}>
                        {cat.name || 'Untitled'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className='text-xs text-gray-500 mb-1'>Search Tests</p>
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='w-full border rounded-lg px-3 py-2 text-sm'
                    placeholder='Search by test name'
                  />
                </div>
              </div>

              <div className='mt-4'>
                {selectedCategory ? (
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2'>
                    {filteredItems.length === 0 ? (
                      <p className='text-sm text-gray-400'>No items found.</p>
                    ) : (
                      filteredItems.map((item, i) => {
                        const key = `${selectedCategory.name}::${item.name}`
                        const checked = selectedItems.some(s => s.key === key)
                        return (
                          <label key={i} className='flex items-center gap-2 text-sm text-gray-600 border rounded-lg px-3 py-2 cursor-pointer'>
                            <input
                              type='checkbox'
                              checked={checked}
                              onChange={() => toggleItem(selectedCategory.name, item)}
                            />
                            <span className='flex-1'>{item.name}</span>
                            <span className='text-xs text-gray-500'>₹{item.price}</span>
                          </label>
                        )
                      })
                    )}
                  </div>
                ) : (
                  <p className='text-sm text-gray-400'>No category selected.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className='mt-5 flex items-center justify-between'>
          <p className='text-sm text-gray-600'>Total: <span className='font-semibold text-gray-800'>₹{total}</span></p>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => downloadInvoice()}
              className='px-4 py-2 rounded-full text-sm border border-violet-200 text-violet-700 bg-violet-50'
            >
              Download Invoice
            </button>
            <button className='bg-primary text-white px-8 py-2 rounded-full text-sm'>Assign Lab</button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default LabAssignment
