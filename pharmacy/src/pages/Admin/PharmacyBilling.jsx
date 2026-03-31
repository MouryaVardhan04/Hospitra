import React, { useContext, useEffect, useMemo, useState } from 'react'
import logoPng from '../../assets/Logo.png'
import html2pdf from 'html2pdf.js'
import { PharmacyContext } from '../../context/PharmacyContext'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'
import { useLocation, useNavigate } from 'react-router-dom'

const PharmacyBilling = () => {
  const { pharmToken, medicines, getMedicines, lookupPatient, updateMedicine, backendUrl } = useContext(PharmacyContext)
  const { currency } = useContext(AppContext)
  const location = useLocation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [patientResults, setPatientResults] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [medSearch, setMedSearch] = useState('')
  const [medCategory, setMedCategory] = useState('All')
  const [cart, setCart] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [consultationId, setConsultationId] = useState('')

  const latestAppointment = selectedPatient?.appointments?.[0]
  const doctorName = latestAppointment?.docData?.name || selectedPatient?.patient?.assignedDoctorName || '-'
  const doctorId = latestAppointment?.docId || selectedPatient?.patient?.assignedDoctorId || '-'
  const invoiceDateTime = new Date()
  const appointmentDate = invoiceDateTime.toLocaleDateString()
  const appointmentTime = invoiceDateTime.toLocaleTimeString()

  useEffect(() => {
    if (pharmToken) getMedicines()
  }, [pharmToken])

  useEffect(() => {
    const consultation = location.state?.consultation
    const invoice = location.state?.invoice
    if (!consultation && !invoice) return

    if (consultation) {
      setConsultationId(consultation._id || '')
    } else {
      setConsultationId('')
    }

    const patient = {
      _id: (consultation?.patientId || invoice?.userId) || '',
      name: (consultation?.patientName || invoice?.patientName) || '',
      email: (consultation?.patientEmail || invoice?.patientEmail) || '',
      phone: (consultation?.patientPhone || invoice?.patientPhone) || '',
      gender: consultation?.patientGender || '',
      dob: consultation?.patientAge || ''
    }
    const appointment = {
      docData: { name: (consultation?.doctorName || invoice?.doctorName) || '-' },
      docId: (consultation?.doctorId || invoice?.doctorId) || ''
    }
    const prefillPatient = { patient, appointments: [appointment] }
    setSelectedPatient(prefillPatient)
    setPatientResults([prefillPatient])
    setSearchQuery(patient._id || patient.name || '')

    const sourceItems = consultation?.pharmacyItems || invoice?.items || []
    const items = sourceItems.map((it, idx) => {
      const name = it.name || it.medicineName
      const match = medicines.find(m => (m.name || '').toLowerCase() === (name || '').toLowerCase())
      if (match) {
        return { ...match, qty: Number(it.qty || 1), price: Number(it.price ?? match.price ?? 0) }
      }
      return {
        _id: `consult-${idx}`,
        name: name || 'Medicine',
        dosage: it.dosage || '-',
        category: it.category || 'Prescription',
        price: Number(it.price || 0),
        qty: Number(it.qty || 1),
        stock: 0,
        isConsultationItem: true
      }
    })
    setCart(items)
  }, [location.state, medicines])

  const medCategories = useMemo(() => {
    const set = new Set()
    medicines.forEach(m => {
      const cat = (m.category || '').trim()
      if (cat) set.add(cat)
    })
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [medicines])

  const filteredMeds = useMemo(() => {
    const q = medSearch.trim().toLowerCase()
    return medicines.filter(m => {
      const nameMatch = (m.name || '').toLowerCase().includes(q)
      const categoryMatch = medCategory === 'All' ? true : (m.category || '') === medCategory
      return nameMatch && categoryMatch
    })
  }, [medicines, medSearch, medCategory])

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  const onSearchPatient = async (query) => {
    if (!query.trim()) {
      setPatientResults([])
      return
    }
    setSearching(true)
    const q = query.trim()
    const isId = q.length >= 20
    const data = await lookupPatient({ patientId: isId ? q : '', patientName: isId ? '' : q })
    setSearching(false)
    if (data.success) {
      setPatientResults(data.results || [])
    } else {
      setPatientResults([])
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchPatient(searchQuery)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const addToCart = (med) => {
    setCart(prev => {
      const existing = prev.find(p => p._id === med._id)
      if (existing) {
        return prev.map(p => p._id === med._id ? { ...p, qty: p.qty + 1 } : p)
      }
      return [...prev, { ...med, qty: 1 }]
    })
  }

  const updateQty = (id, qty) => {
    const q = Math.max(1, Number(qty) || 1)
    setCart(prev => prev.map(p => p._id === id ? { ...p, qty: q } : p))
  }

  const removeItem = (id) => {
    setCart(prev => prev.filter(p => p._id !== id))
  }

  const buildInvoiceHtml = () => {
    const invoiceId = `PHARM-${Date.now()}`
    const createdAt = new Date()
    const patient = selectedPatient?.patient || {}
    const itemsHtml = cart.length
      ? cart.map((item, idx) => `
            <tr class="${idx % 2 === 1 ? 'alt' : ''}">
              <td class="num">${idx + 1}</td>
              <td class="tname"><strong>${item.name || '-'}</strong></td>
              <td class="cat">${item.dosage || '-'}</td>
              <td class="cat">${item.qty}</td>
              <td class="cat">${currency}${Number(item.price || 0).toLocaleString()}</td>
              <td class="amt">${currency}${Number(item.price || 0) * Number(item.qty || 0)}</td>
            </tr>`).join('')
      : `
            <tr>
              <td class="num">1</td>
              <td class="tname"><strong>Medicines</strong></td>
              <td class="cat">-</td>
              <td class="cat">-</td>
              <td class="cat">-</td>
              <td class="amt">${currency}0</td>
            </tr>`

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
          <div class="irow"><span class="ilabel">Name</span><span class="ivalue">${patient?.name || '-'}</span></div>
          <div class="irow"><span class="ilabel">Patient ID</span><span class="ivalue">${patient?._id || '-'}</span></div>
          <div class="irow"><span class="ilabel">Phone</span><span class="ivalue">${patient?.phone || '-'}</span></div>
          <div class="irow"><span class="ilabel">Email</span><span class="ivalue">${patient?.email || '-'}</span></div>
        </div>
        <div class="info-box">
          <div class="box-title">Doctor & Visit</div>
          <div class="irow"><span class="ilabel">Doctor</span><span class="ivalue">${doctorName}</span></div>
          <div class="irow"><span class="ilabel">Doctor ID</span><span class="ivalue">${doctorId}</span></div>
          <div class="irow"><span class="ilabel">Appointment</span><span class="ivalue">${appointmentDate} · ${appointmentTime}</span></div>
          <div class="irow"><span class="ilabel">Payment</span><span class="ivalue">${paymentMethod || '-'}</span></div>
        </div>
      </div>

      <div class="meta-strip">
        <div class="meta-item">Items: <strong>${cart.length}</strong></div>
        <div class="meta-item">Payment: <span class="meta-badge">${paymentMethod || '-'}</span></div>
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
            <div class="trow"><span>Subtotal</span><span>${currency}${Number(total || 0).toLocaleString()}</span></div>
            <div class="trow grand"><span>Total Due</span><span>${currency}${Number(total || 0).toLocaleString()}</span></div>
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

  const downloadInvoice = async () => {
    if (!selectedPatient) {
      toast.error('Select a patient')
      return
    }
    if (cart.length === 0) {
      toast.error('Add medicines to cart')
      return
    }
    if (!paymentMethod) {
      toast.error('Select payment method')
      return
    }

    const html = buildInvoiceHtml()
    const container = document.createElement('div')
    container.innerHTML = html
    const target = container.querySelector('.page')
    if (!target) {
      toast.error('Unable to generate invoice')
      return
    }
    document.body.appendChild(container)
    const fileName = `pharmacy_invoice_${Date.now()}.pdf`
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

    // Save invoice and reduce stock after download
    try {
      const res = await fetch(backendUrl + '/api/pharmacy/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          pharmtoken: pharmToken || ''
        },
        body: JSON.stringify({
          userId: selectedPatient.patient?._id,
          patientName: selectedPatient.patient?.name,
          patientEmail: selectedPatient.patient?.email,
          patientPhone: selectedPatient.patient?.phone,
          doctorId,
          doctorName,
          items: cart.map(item => ({
            medicineId: item.isConsultationItem ? undefined : item._id,
            name: item.name,
            dosage: item.dosage,
            qty: item.qty,
            price: item.price,
            lineTotal: item.price * item.qty
          })),
          total,
          paymentMethod
        })
      })
      const data = await res.json().catch(() => null)
      if (!data?.success) {
        toast.error(data?.message || 'Failed to save invoice')
      } else {
        if (consultationId) {
          await fetch(backendUrl + '/api/pharmacy/consultations/pharmacy-invoiced', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              pharmtoken: pharmToken || ''
            },
            body: JSON.stringify({ consultationId })
          })
        }
        navigate('/orders', { state: { patientId: selectedPatient?.patient?._id || '', patientName: selectedPatient?.patient?.name || '' } })
      }
    } catch (e) {
      // ignore save failure
    }

    cart.forEach((item) => {
      if (item.isConsultationItem || !item._id || String(item._id).startsWith('consult-')) return
      const newStock = Math.max(0, Number(item.stock || 0) - Number(item.qty || 0))
      updateMedicine({ medicineId: item._id, stock: newStock })
    })
  }

  return (
    <div className='m-5 w-full'>
      <p className='text-xl font-semibold text-gray-700 mb-4'>Pharmacy Billing</p>

      <div className='bg-white border rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-3 md:items-end'>
        <div className='flex-1'>
          <label className='text-sm font-medium text-gray-600'>Patient Search</label>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full mt-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400'
            placeholder='Enter patient ID or name'
          />
        </div>
        {searching && (
          <p className='text-xs text-gray-400'>Searching...</p>
        )}
      </div>

      {patientResults.length > 0 && (
        <div className='bg-white border rounded-xl p-4 mb-6'>
          <p className='text-sm font-medium text-gray-600 mb-3'>Select Patient</p>
          <div className='space-y-2'>
            {patientResults.map((item, idx) => (
              <button
                type='button'
                key={idx}
                onClick={() => setSelectedPatient(item)}
                className={`w-full text-left border rounded-lg px-4 py-3 text-sm ${selectedPatient?.patient?._id === item.patient?._id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}
              >
                <p className='font-medium text-gray-700'>{item.patient?.name}</p>
                <p className='text-xs text-gray-500'>{item.patient?.email} • {item.patient?.phone}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6'>
        <div className='space-y-6'>
          <div className='bg-white border rounded-xl p-4'>
            <p className='text-sm font-semibold text-gray-700 mb-3'>Patient & Doctor</p>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
              <div className='border rounded-lg p-3'>
                <p className='text-xs text-gray-500'>Patient</p>
                <p className='font-medium text-gray-700'>{selectedPatient?.patient?.name || '-'}</p>
                <p className='text-xs text-gray-500'>ID: {selectedPatient?.patient?._id || '-'}</p>
                <p className='text-xs text-gray-500'>Phone: {selectedPatient?.patient?.phone || '-'}</p>
                <p className='text-xs text-gray-500'>Email: {selectedPatient?.patient?.email || '-'}</p>
              </div>
              <div className='border rounded-lg p-3'>
                <p className='text-xs text-gray-500'>Doctor & Visit</p>
                <p className='font-medium text-gray-700'>{doctorName}</p>
                <p className='text-xs text-gray-500'>Doctor ID: {doctorId}</p>
                <p className='text-xs text-gray-500'>Date: {appointmentDate}</p>
                <p className='text-xs text-gray-500'>Time: {appointmentTime}</p>
              </div>
            </div>
          </div>

          <div className='bg-white border rounded-xl p-4'>
            <div className='flex flex-col gap-3 mb-3 md:flex-row md:items-center md:justify-between'>
              <p className='text-sm font-semibold text-gray-700'>Medicines</p>
              <div className='flex flex-col gap-2 md:flex-row md:items-center'>
                <select
                  value={medCategory}
                  onChange={(e) => setMedCategory(e.target.value)}
                  className='border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400'
                >
                  {medCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  value={medSearch}
                  onChange={(e) => setMedSearch(e.target.value)}
                  className='border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400'
                  placeholder='Search medicine...'
                />
              </div>
            </div>
            <div className='max-h-[60vh] overflow-y-auto space-y-2'>
              {filteredMeds.map((m) => (
                <div key={m._id} className='flex items-center justify-between border rounded-lg px-3 py-2 text-sm'>
                  <div>
                    <p className='font-medium text-gray-700'>{m.name}</p>
                    <p className='text-xs text-gray-500'>{m.dosage} • {m.category}</p>
                  </div>
                  <button
                    type='button'
                    onClick={() => addToCart(m)}
                    className='px-3 py-1 text-xs rounded-lg bg-emerald-50 text-emerald-700'
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='bg-white border rounded-xl p-4'>
          <div className='flex items-center justify-between mb-3'>
            <p className='text-sm font-semibold text-gray-700'>Invoice</p>
            <p className='text-xs text-gray-500'>{invoiceDateTime.toLocaleString()}</p>
          </div>
          <div className='mb-3'>
            <label className='text-xs text-gray-500'>Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className='w-full mt-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400'
            >
              <option>Cash</option>
              <option>Card</option>
              <option>UPI</option>
              <option>Insurance</option>
              <option>Other</option>
            </select>
          </div>
          {cart.length === 0 ? (
            <p className='text-sm text-gray-400'>No items added.</p>
          ) : (
            <div className='space-y-3'>
              {cart.map((item) => (
                <div key={item._id} className='border rounded-lg p-3 text-sm'>
                  <div className='flex items-center justify-between'>
                    <p className='font-medium text-gray-700'>{item.name}</p>
                    <button onClick={() => removeItem(item._id)} className='text-xs text-red-500'>Remove</button>
                  </div>
                  <div className='mt-2 flex items-center gap-3'>
                    <input
                      type='number'
                      value={item.qty}
                      min={1}
                      onChange={(e) => updateQty(item._id, e.target.value)}
                      className='w-20 border rounded-lg px-2 py-1 text-xs'
                    />
                    <p className='text-xs text-gray-500'>Price: {currency}{item.price}</p>
                    <p className='text-xs text-gray-700 font-medium'>Line: {currency}{item.price * item.qty}</p>
                  </div>
                </div>
              ))}
              <div className='flex justify-between text-sm font-semibold text-gray-700 pt-2 border-t'>
                <span>Total</span>
                <span>{currency}{total}</span>
              </div>
            </div>
          )}
          <button
            type='button'
            onClick={downloadInvoice}
            className='mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm'
          >
            Download Invoice
          </button>
        </div>
      </div>
    </div>
  )
}

export default PharmacyBilling
