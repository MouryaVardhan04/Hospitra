import React, { useContext, useEffect, useState } from 'react'
import { LabsContext } from '../../context/LabsContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

// ── Shared row helper ─────────────────────────────────────────────────────────
const Row = ({ label, value, highlight }) => (
  <div className='flex flex-col py-0.5'>
    <span className='text-xs text-gray-400'>{label}</span>
    <span className={`font-medium text-sm ${highlight ? 'text-blue-700' : 'text-gray-800'}`}>{value || '-'}</span>
  </div>
)

// ── Lab Assignment Detail Modal ───────────────────────────────────────────────
const AssignmentDetailModal = ({ assignment: lab, onClose, currency }) => {
  if (!lab) return null
  const items = Array.isArray(lab.items) ? lab.items : []
  const tests = Array.isArray(lab.tests) ? lab.tests : []

  const formatMoney = (v) => `${currency}${Number(v || 0).toLocaleString()}`
  const formatTime  = (v) => {
    if (!v) return '-'
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString()
  }

  const statusCls = {
    Assigned:    'bg-yellow-50 text-yellow-700',
    Processing:  'bg-blue-50 text-blue-700',
    Completed:   'bg-emerald-50 text-emerald-700',
    Collected:   'bg-violet-50 text-violet-700',
  }[lab.status] || 'bg-gray-100 text-gray-600'

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4' onClick={onClose}>
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
          <div className='flex items-center gap-3'>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusCls}`}>
              {lab.status || 'Assigned'}
            </span>
            <button onClick={onClose} className='text-gray-400 hover:text-gray-600 text-xl leading-none'>✕</button>
          </div>
        </div>

        <div className='px-6 py-5 space-y-5'>
          {/* Patient */}
          <section>
            <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-2'>Patient</p>
            <div className='grid grid-cols-2 gap-x-6 gap-y-2'>
              <Row label='Name'   value={lab.patientName} />
              <Row label='ID'     value={lab.patientId} />
              <Row label='Phone'  value={lab.patientPhone} />
              <Row label='Email'  value={lab.patientEmail} />
              <Row label='Age'    value={lab.patientAge} />
              <Row label='Gender' value={lab.patientGender} />
              {lab.patientHeight ? <Row label='Height' value={`${lab.patientHeight} cm`} /> : null}
              {lab.patientWeight ? <Row label='Weight' value={`${lab.patientWeight} kg`} /> : null}
            </div>
          </section>

          {/* Visit */}
          <section>
            <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-2'>Visit</p>
            <div className='grid grid-cols-2 gap-x-6 gap-y-2'>
              <Row label='Doctor'     value={lab.doctorName} />
              <Row label='Visit Date' value={lab.visitDate} />
              <Row label='Priority'   value={lab.priority || 'Routine'} highlight />
              <Row label='Sample ID'  value={lab.sampleId} />
            </div>
          </section>

          {/* Sample / Report timeline */}
          <section>
            <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-2'>Timeline</p>
            <div className='grid grid-cols-2 gap-x-6 gap-y-2'>
              <Row label='Sample Collected' value={lab.sampleCollected ? 'Yes' : 'No'} />
              <Row label='Collected At'     value={formatTime(lab.sampleCollectedAt)} />
              <Row label='Report Generated' value={formatTime(lab.reportGeneratedAt)} />
              <Row label='Report Emailed'   value={formatTime(lab.reportEmailSentAt)} />
            </div>
          </section>

          {/* Tests + fees table */}
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

          {/* Named tests (no price) */}
          {tests.length > 0 && items.length === 0 && (
            <section>
              <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-2'>Tests</p>
              <div className='flex flex-wrap gap-2'>
                {tests.map((t, i) => (
                  <span key={i} className='bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full border border-blue-100'>
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

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { labsToken, getDashData, dashData, getLabAssignments } = useContext(LabsContext)
  const { currency } = useContext(AppContext)

  const [assignments, setAssignments]         = useState([])
  const [selectedAssignment, setSelectedAssignment] = useState(null)

  useEffect(() => {
    if (!labsToken) return
    getDashData()

    const loadAssignments = async () => {
      const data = await getLabAssignments()
      if (data?.success) setAssignments(data.assignments || [])
    }
    loadAssignments()

    const interval = setInterval(loadAssignments, 30000)
    return () => clearInterval(interval)
  }, [labsToken])

  const formatMoney = (v) => `${currency}${Number(v || 0).toLocaleString()}`
  const formatTime  = (v) => {
    if (!v) return '-'
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString()
  }

  const totalRevenue    = assignments.reduce((s, a) => s + Number(a.total || 0), 0)
  const recentAssignments = [...assignments]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 5)

  const statusBadgeCls = (status) => ({
    Assigned:   'bg-yellow-50 text-yellow-700',
    Processing: 'bg-blue-50 text-blue-700',
    Completed:  'bg-emerald-50 text-emerald-700',
    Collected:  'bg-violet-50 text-violet-700',
  }[status] || 'bg-gray-100 text-gray-600')

  if (!dashData) return <div className='m-5 text-gray-400 text-sm'>Loading…</div>

  return (
    <div className='m-5 w-full'>

      {/* Assignment Detail Modal */}
      {selectedAssignment && (
        <AssignmentDetailModal
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          currency={currency}
        />
      )}

      {/* Page heading */}
      <div className='flex items-center justify-between gap-3 mb-6'>
        <div>
          <p className='text-2xl font-semibold text-gray-700'>Labs Dashboard</p>
          <p className='text-sm text-gray-400'>Sample & report tracking</p>
        </div>
        <span className='text-xs text-gray-500'>Updated just now</span>
      </div>

      {/* Metric Cards with Icons */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6'>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-3'>
          <img src={assets.list_icon} className='w-10' alt='' />
          <div>
            <p className='text-2xl font-bold text-yellow-500'>{dashData.pendingSamples}</p>
            <p className='text-gray-400 text-sm mt-1'>Pending Samples</p>
          </div>
        </div>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-3'>
          <img src={assets.tick_icon} className='w-10' alt='' />
          <div>
            <p className='text-2xl font-bold text-blue-600'>{dashData.inProcessSamples}</p>
            <p className='text-gray-400 text-sm mt-1'>In Process</p>
          </div>
        </div>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-3'>
          <img src={assets.earning_icon} className='w-10' alt='' />
          <div>
            <p className='text-2xl font-bold text-emerald-600'>{dashData.completedReports}</p>
            <p className='text-gray-400 text-sm mt-1'>Completed</p>
          </div>
        </div>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-3'>
          <img src={assets.appointments_icon} className='w-10' alt='' />
          <div>
            <p className='text-2xl font-bold text-violet-600'>{dashData.collectedReports}</p>
            <p className='text-gray-400 text-sm mt-1'>Collected</p>
          </div>
        </div>
      </div>

      {/* Revenue / summary row */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8'>
        <div className='bg-white border rounded-xl p-5'>
          <p className='text-xs text-gray-400 uppercase tracking-wide'>Total Revenue</p>
          <p className='text-2xl font-bold text-emerald-600 mt-2'>{formatMoney(totalRevenue)}</p>
          <p className='text-xs text-gray-400 mt-1'>All lab assignments</p>
        </div>
        <div className='bg-white border rounded-xl p-5'>
          <p className='text-xs text-gray-400 uppercase tracking-wide'>Total Assignments</p>
          <p className='text-2xl font-bold text-gray-700 mt-2'>{assignments.length}</p>
          <p className='text-xs text-gray-400 mt-1'>All time</p>
        </div>
        <div className='bg-white border rounded-xl p-5'>
          <p className='text-xs text-gray-400 uppercase tracking-wide'>Pending + Processing</p>
          <p className='text-2xl font-bold text-blue-600 mt-2'>
            {(dashData.pendingSamples || 0) + (dashData.inProcessSamples || 0)}
          </p>
          <p className='text-xs text-gray-400 mt-1'>Awaiting completion</p>
        </div>
      </div>

      {/* Recent Lab Assignments — clickable */}
      <div className='bg-white border rounded-xl'>
        <div className='flex items-center gap-3 px-5 py-4 border-b'>
          <p className='font-semibold text-gray-700'>Recent Lab Assignments</p>
        </div>
        <div className='p-4'>
          {recentAssignments.length === 0 ? (
            <p className='text-gray-400 text-sm'>No assignments yet.</p>
          ) : (
            <div className='space-y-3'>
              {recentAssignments.map((a, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedAssignment(a)}
                  className='flex items-center justify-between text-sm text-gray-600 border rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-colors'
                >
                  <div>
                    <p className='font-medium text-gray-800'>{a.patientName || 'Patient'}</p>
                    <p className='text-xs text-gray-400'>
                      {a.visitDate || '-'} &bull; {Array.isArray(a.items) ? a.items.length : 0} test(s) &bull; {a.priority || 'Routine'}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadgeCls(a.status)}`}>
                      {a.status || 'Assigned'}
                    </span>
                    <span className='text-xs font-semibold text-emerald-600'>{formatMoney(a.total)}</span>
                    <span className='text-gray-300'>›</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

export default Dashboard