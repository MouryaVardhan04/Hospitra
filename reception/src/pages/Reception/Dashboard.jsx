import React, { useContext, useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { AppContext } from '../../context/AppContext'
import { AdminContext } from '../../context/AdminContext'

const getList = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

// Key-value row used inside modals
const Row = ({ label, value, highlight }) => (
  <div className='flex flex-col py-0.5'>
    <span className='text-xs text-gray-400'>{label}</span>
    <span className={`font-medium text-sm ${highlight ? 'text-blue-700' : 'text-gray-800'}`}>{value || '-'}</span>
  </div>
)

// ── Appointment Detail Modal ─────────────────────────────────────────────────
const AppointmentDetailModal = ({ appt, onClose, formatMoney, formatTime }) => {
  if (!appt) return null
  const patient = appt.userData || {}
  const doctor  = appt.docData  || {}
  const statusBadge = appt.cancelled
    ? { label: 'Cancelled', cls: 'bg-red-50 text-red-600' }
    : appt.isCompleted
    ? { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700' }
    : appt.isAccepted
    ? { label: 'Accepted',  cls: 'bg-blue-50 text-blue-700' }
    : { label: 'Pending',   cls: 'bg-yellow-50 text-yellow-700' }
  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b bg-slate-50 rounded-t-2xl'>
          <div>
            <p className='text-base font-semibold text-gray-800'>Appointment Details</p>
            <p className='text-xs text-gray-400 mt-0.5'>{formatTime(appt.date || appt.createdAt)}</p>
          </div>
          <div className='flex items-center gap-3'>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusBadge.cls}`}>
              {statusBadge.label}
            </span>
            <button onClick={onClose} className='text-gray-400 hover:text-gray-600 text-xl leading-none'>✕</button>
          </div>
        </div>

        <div className='px-6 py-5 space-y-5'>
          {/* Patient */}
          <section>
            <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-2'>Patient</p>
            <div className='grid grid-cols-2 gap-x-6 gap-y-2'>
              <Row label='Name'   value={patient.name  || appt.patientName} />
              <Row label='Patient ID' value={appt.userId || patient._id} />
              <Row label='Phone'  value={patient.phone} />
              <Row label='Email'  value={patient.email} />
              <Row label='Age'    value={patient.age} />
              <Row label='Gender' value={patient.gender} />
              <Row label='Blood Group' value={patient.bloodGroup} />
            </div>
          </section>

          {/* Doctor */}
          <section>
            <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-2'>Doctor</p>
            <div className='grid grid-cols-2 gap-x-6 gap-y-2'>
              <Row label='Name'       value={doctor.name} />
              <Row label='Speciality' value={doctor.speciality} highlight />
              <Row label='Degree'     value={doctor.degree} />
              <Row label='Experience' value={doctor.experience} />
            </div>
          </section>

          {/* Slot */}
          <section>
            <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-2'>Slot</p>
            <div className='grid grid-cols-2 gap-x-6 gap-y-2'>
              <Row label='Date'    value={appt.slotDate} />
              <Row label='Time'    value={appt.slotTime} />
              <Row label='Fees'    value={formatMoney(appt.amount)} highlight />
              <Row label='Payment' value={appt.payment ? 'Paid' : 'Unpaid'} />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

// ── Lab Assignment Detail Modal ───────────────────────────────────────────────
const LabDetailModal = ({ lab, onClose, formatMoney, formatTime }) => {
  if (!lab) return null
  const items = Array.isArray(lab.items) ? lab.items : []
  const tests = Array.isArray(lab.tests) ? lab.tests : []
  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b bg-slate-50 rounded-t-2xl'>
          <div>
            <p className='text-base font-semibold text-gray-800'>Lab Assignment Details</p>
            <p className='text-xs text-gray-400 mt-0.5'>{formatTime(lab.createdAt)}</p>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 text-xl leading-none'
          >
            ✕
          </button>
        </div>

        <div className='px-6 py-5 space-y-5'>
          {/* Patient */}
          <section>
            <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-2'>Patient</p>
            <div className='grid grid-cols-2 gap-x-6 gap-y-2'>
              <Row label='Name' value={lab.patientName} />
              <Row label='Patient ID' value={lab.patientId} />
              <Row label='Phone' value={lab.patientPhone} />
              <Row label='Email' value={lab.patientEmail} />
              <Row label='Age' value={lab.patientAge} />
              <Row label='Gender' value={lab.patientGender} />
              {lab.patientHeight ? <Row label='Height' value={`${lab.patientHeight} cm`} /> : null}
              {lab.patientWeight ? <Row label='Weight' value={`${lab.patientWeight} kg`} /> : null}
            </div>
          </section>

          {/* Visit */}
          <section>
            <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-2'>Visit</p>
            <div className='grid grid-cols-2 gap-x-6 gap-y-2'>
              <Row label='Doctor' value={lab.doctorName} />
              <Row label='Visit Date' value={lab.visitDate} />
              <Row label='Priority' value={lab.priority || 'Routine'} highlight />
              <Row label='Status' value={lab.status} highlight />
            </div>
          </section>

          {/* Items table */}
          {items.length > 0 && (
            <section>
              <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-2'>Tests & Fees</p>
              <div className='border rounded-xl overflow-hidden'>
                <table className='w-full text-sm'>
                  <thead className='bg-slate-50 text-gray-500 text-xs uppercase'>
                    <tr>
                      <th className='text-left px-4 py-2'>Test</th>
                      <th className='text-right px-4 py-2'>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr key={i} className={i % 2 === 1 ? 'bg-slate-50' : ''}>
                        <td className='px-4 py-2 text-gray-700'>{it.name || '-'}</td>
                        <td className='px-4 py-2 text-right text-gray-700'>{formatMoney(it.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className='border-t font-semibold'>
                      <td className='px-4 py-2 text-gray-800'>Total</td>
                      <td className='px-4 py-2 text-right text-emerald-600'>{formatMoney(lab.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          )}

          {/* Legacy named tests (no price) */}
          {tests.length > 0 && items.length === 0 && (
            <section>
              <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-2'>Tests</p>
              <div className='flex flex-wrap gap-2'>
                {tests.map((t, i) => (
                  <span
                    key={i}
                    className='bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full border border-blue-100'
                  >
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Notes */}
          {lab.notes ? (
            <section>
              <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-1'>Notes</p>
              <p className='text-sm text-gray-600 bg-slate-50 rounded-lg px-3 py-2'>{lab.notes}</p>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ── Billing / Surgery Detail Modal ────────────────────────────────────────────
const BillingDetailModal = ({ billing, onClose, formatMoney, formatTime }) => {
  if (!billing) return null
  const items = Array.isArray(billing.items) ? billing.items : []
  const isSurgery = (billing.department || '').toLowerCase() === 'surgery'
  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b bg-slate-50 rounded-t-2xl'>
          <div>
            <p className='text-base font-semibold text-gray-800'>
              {isSurgery ? 'Surgery Invoice' : 'Billing Invoice'}
            </p>
            <p className='text-xs text-gray-400 mt-0.5'>{formatTime(billing.createdAt)}</p>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 text-xl leading-none'
          >
            ✕
          </button>
        </div>

        <div className='px-6 py-5 space-y-5'>
          {/* Patient */}
          <section>
            <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-2'>Patient</p>
            <div className='grid grid-cols-2 gap-x-6 gap-y-2'>
              <Row label='Name' value={billing.patientName} />
              <Row label='Patient ID' value={billing.patientId} />
              <Row label='Phone' value={billing.patientPhone} />
              <Row label='Email' value={billing.patientEmail} />
            </div>
          </section>

          {/* Visit */}
          <section>
            <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-2'>Visit</p>
            <div className='grid grid-cols-2 gap-x-6 gap-y-2'>
              <Row label='Doctor' value={billing.doctorName} />
              <Row label='Department' value={billing.department} highlight />
              <Row label='Visit Date' value={billing.visitDate} />
              <Row label='Visit Time' value={billing.visitTime} />
            </div>
          </section>

          {/* Items */}
          {items.length > 0 && (
            <section>
              <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-2'>
                {isSurgery ? 'Surgery Items' : 'Billing Items'}
              </p>
              <div className='border rounded-xl overflow-hidden'>
                <table className='w-full text-sm'>
                  <thead className='bg-slate-50 text-gray-500 text-xs uppercase'>
                    <tr>
                      <th className='text-left px-4 py-2'>Item</th>
                      <th className='text-left px-4 py-2 hidden sm:table-cell'>Category</th>
                      <th className='text-right px-4 py-2'>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr key={i} className={i % 2 === 1 ? 'bg-slate-50' : ''}>
                        <td className='px-4 py-2 text-gray-700'>{it.name || '-'}</td>
                        <td className='px-4 py-2 text-gray-400 hidden sm:table-cell'>{it.category || '-'}</td>
                        <td className='px-4 py-2 text-right text-gray-700'>{formatMoney(it.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className='border-t font-semibold'>
                      <td colSpan={2} className='px-4 py-2 text-gray-800'>Total</td>
                      <td className='px-4 py-2 text-right text-emerald-600 text-base'>{formatMoney(billing.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          )}

          {/* Notes */}
          {billing.notes ? (
            <section>
              <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-1'>Notes</p>
              <p className='text-sm text-gray-600 bg-slate-50 rounded-lg px-3 py-2'>{billing.notes}</p>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { backendUrl } = useContext(AppContext)
  const { aToken } = useContext(AdminContext)

  const [metrics, setMetrics] = useState({
    appointments: 0,
    labAssignments: 0,
    billings: 0,
    revenueTotal: 0,
    revenueAppointments: 0,
    revenueLabs: 0,
    revenueSurgeries: 0,
    revenueBilling: 0
  })
  const [recentAppointments, setRecentAppointments] = useState([])
  const [recentLabs, setRecentLabs] = useState([])
  const [recentBillings, setRecentBillings] = useState([])
  const [billingInvoices, setBillingInvoices] = useState([])

  // Modal selection state
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [selectedLab, setSelectedLab] = useState(null)
  const [selectedBilling, setSelectedBilling] = useState(null)

  // Recompute metrics whenever billingInvoices state is updated (fixes stale-closure bug)
  useEffect(() => {
    const appointments = getList('receptionAppointments')
    const labAssignments = getList('receptionLabAssignments')
    const billings = billingInvoices.length > 0 ? billingInvoices : getList('receptionBillings')

    const revenueLabs = labAssignments.reduce((sum, item) => sum + Number(item.total || 0), 0)
    const revenueBilling = billings.reduce((sum, item) => sum + Number(item.total || 0), 0)
    const revenueSurgeries = billings
      .filter(item => (item.department || '').toLowerCase() === 'surgery')
      .reduce((sum, item) => sum + Number(item.total || 0), 0)
    const revenueAppointments = appointments.reduce(
      (sum, item) => sum + Number(item.fees || item.fee || item.amount || item.total || 0),
      0
    )
    const revenueTotal = revenueLabs + revenueBilling + revenueAppointments

    setMetrics({
      appointments: appointments.length,
      labAssignments: labAssignments.length,
      billings: billings.length,
      revenueTotal,
      revenueAppointments,
      revenueLabs,
      revenueSurgeries,
      revenueBilling
    })
    setRecentAppointments([...appointments].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5))
    setRecentLabs([...labAssignments].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5))
    setRecentBillings([...billings].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5))
  }, [billingInvoices])

  // Fetch billing invoices from API; re-runs when aToken/backendUrl change
  useEffect(() => {
    const loadBillings = async () => {
      if (!aToken) return
      try {
        const { data } = await axios.get(backendUrl + '/api/admin/billing-invoices', { headers: { aToken } })
        if (data?.success) setBillingInvoices(data.invoices || [])
      } catch (error) {
        // ignore fetch errors
      }
    }
    loadBillings()

    // Poll every 30 seconds to pick up new invoices without stale closures
    const interval = setInterval(loadBillings, 30000)
    return () => clearInterval(interval)
  }, [backendUrl, aToken])

  const formatTime = (value) => {
    if (!value) return '-'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleString()
  }

  const formatMoney = (value) => `₹${Number(value || 0).toLocaleString()}`

  return (
    <div className='m-5 w-full'>

      {/* Modals */}
      {selectedAppointment && (
        <AppointmentDetailModal
          appt={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          formatMoney={formatMoney}
          formatTime={formatTime}
        />
      )}
      {selectedLab && (
        <LabDetailModal
          lab={selectedLab}
          onClose={() => setSelectedLab(null)}
          formatMoney={formatMoney}
          formatTime={formatTime}
        />
      )}
      {selectedBilling && (
        <BillingDetailModal
          billing={selectedBilling}
          onClose={() => setSelectedBilling(null)}
          formatMoney={formatMoney}
          formatTime={formatTime}
        />
      )}

      {/* Page heading */}
      <div className='flex items-center justify-between gap-3 mb-6'>
        <div>
          <p className='text-2xl font-semibold text-gray-700'>Reception Dashboard</p>
          <p className='text-sm text-gray-400'>Real-time patient flow tracking</p>
        </div>
        <span className='text-xs text-gray-500'>Updated just now</span>
      </div>

      {/* Count metrics */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-3'>
          <img src={assets.appointments_icon} className='w-10' alt='' />
          <div>
            <p className='text-2xl font-bold text-gray-700'>{metrics.appointments}</p>
            <p className='text-gray-400 text-sm'>Appointments Booked</p>
          </div>
        </div>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-3'>
          <img src={assets.list_icon} className='w-10' alt='' />
          <div>
            <p className='text-2xl font-bold text-gray-700'>{metrics.labAssignments}</p>
            <p className='text-gray-400 text-sm'>Lab Assignments</p>
          </div>
        </div>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-3'>
          <img src={assets.earning_icon} className='w-10' alt='' />
          <div>
            <p className='text-2xl font-bold text-gray-700'>{metrics.billings}</p>
            <p className='text-gray-400 text-sm'>Billing Initiated</p>
          </div>
        </div>
      </div>

      {/* Revenue cards */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8'>
        <div className='bg-white border rounded-xl p-5'>
          <p className='text-xs text-gray-400 uppercase tracking-wide'>Total Revenue</p>
          <p className='text-2xl font-bold text-emerald-600 mt-2'>{formatMoney(metrics.revenueTotal)}</p>
          <p className='text-xs text-gray-400 mt-1'>All services</p>
        </div>
        <div className='bg-white border rounded-xl p-5'>
          <p className='text-xs text-gray-400 uppercase tracking-wide'>Lab Revenue</p>
          <p className='text-xl font-bold text-gray-700 mt-2'>{formatMoney(metrics.revenueLabs)}</p>
          <p className='text-xs text-gray-400 mt-1'>Lab assignments</p>
        </div>
        <div className='bg-white border rounded-xl p-5'>
          <p className='text-xs text-gray-400 uppercase tracking-wide'>Billing Revenue</p>
          <p className='text-xl font-bold text-gray-700 mt-2'>{formatMoney(metrics.revenueBilling)}</p>
          <p className='text-xs text-gray-400 mt-1'>All billing</p>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
        <div className='bg-white border rounded-xl'>
          <div className='flex items-center gap-3 px-5 py-4 border-b'>
            <img src={assets.appointments_icon} className='w-5' alt='' />
            <p className='font-semibold text-gray-700'>Recent Appointments</p>
          </div>
          <div className='p-4'>
            {recentAppointments.length === 0 ? (
              <p className='text-gray-400 text-sm'>No recent appointments.</p>
            ) : (
              <div className='space-y-3'>
                {recentAppointments.map((a, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedAppointment(a)}
                    className='flex items-center justify-between text-sm text-gray-600 border rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-colors'
                  >
                    <div>
                      <p className='font-medium text-gray-800'>
                        {(a.userData?.name) || a.patientName || a.patientId || 'Patient'}
                      </p>
                      <p className='text-xs text-gray-400'>
                        {a.slotDate} • {a.slotTime} {a.docData?.name ? `— Dr. ${a.docData.name}` : ''}
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        a.cancelled ? 'bg-red-50 text-red-500'
                        : a.isCompleted ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-blue-50 text-blue-600'
                      }`}>
                        {a.cancelled ? 'Cancelled' : a.isCompleted ? 'Completed' : 'Booked'}
                      </span>
                      <span className='text-gray-300'>›</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Lab Assignments + Recent Billings (clickable rows) */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6'>

        {/* Lab Assignments */}
        <div className='bg-white border rounded-xl'>
          <div className='flex items-center gap-3 px-5 py-4 border-b'>
            <img src={assets.list_icon} className='w-5' alt='' />
            <p className='font-semibold text-gray-700'>Recent Lab Assignments</p>
          </div>
          <div className='p-4'>
            {recentLabs.length === 0 ? (
              <p className='text-gray-400 text-sm'>No lab assignments.</p>
            ) : (
              <div className='space-y-3'>
                {recentLabs.map((l, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedLab(l)}
                    className='flex items-center justify-between text-sm text-gray-600 border rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-colors'
                  >
                    <div>
                      <p className='font-medium text-gray-800'>{l.patientName || l.patientId || 'Patient'}</p>
                      <p className='text-xs text-gray-400'>
                        {l.visitDate || l.appointmentDate || '-'} &bull; {Array.isArray(l.items) ? l.items.length : 0} test(s)
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-xs text-slate-500'>{l.priority || 'Routine'}</span>
                      <span className='text-gray-300'>›</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Billings */}
        <div className='bg-white border rounded-xl'>
          <div className='flex items-center gap-3 px-5 py-4 border-b'>
            <img src={assets.earning_icon} className='w-5' alt='' />
            <p className='font-semibold text-gray-700'>Recent Billings</p>
          </div>
          <div className='p-4'>
            {recentBillings.length === 0 ? (
              <p className='text-gray-400 text-sm'>No recent billings.</p>
            ) : (
              <div className='space-y-3'>
                {recentBillings.map((b, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedBilling(b)}
                    className='flex items-center justify-between text-sm text-gray-600 border rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-colors'
                  >
                    <div>
                      <p className='font-medium text-gray-800'>{b.patientName || b.patientId || 'Patient'}</p>
                      <p className='text-xs text-gray-400'>{b.department || 'Billing'} • {formatTime(b.createdAt)}</p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-xs font-semibold text-emerald-600'>{formatMoney(b.total)}</span>
                      <span className='text-gray-300'>›</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard
