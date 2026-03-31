import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'

// ── Row helper ────────────────────────────────────────────────────────────────
const Row = ({ label, value, highlight }) => (
  <div className='flex flex-col py-0.5'>
    <span className='text-xs text-gray-400'>{label}</span>
    <span className={`font-medium text-sm ${highlight ? 'text-blue-700' : 'text-gray-800'}`}>{value || '-'}</span>
  </div>
)

// ── Appointment Detail Modal ──────────────────────────────────────────────────
const AppointmentDetailModal = ({ appt, onClose, formatMoney, formatTime, cancelAppointment, completeAppointment }) => {
  if (!appt) return null
  const patient = appt.userData || {}
  const statusBadge = appt.cancelled
    ? { label: 'Cancelled', cls: 'bg-red-50 text-red-600' }
    : appt.isCompleted
    ? { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700' }
    : appt.isAccepted
    ? { label: 'Accepted', cls: 'bg-blue-50 text-blue-700' }
    : { label: 'Pending', cls: 'bg-yellow-50 text-yellow-700' }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4' onClick={onClose}>
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b bg-slate-50 rounded-t-2xl'>
          <div>
            <p className='text-base font-semibold text-gray-800'>Appointment Details</p>
            <p className='text-xs text-gray-400 mt-0.5'>{formatTime(appt.date)}</p>
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
            {patient.image && (
              <img src={patient.image} className='w-12 h-12 rounded-full object-cover mb-3' alt='' />
            )}
            <div className='grid grid-cols-2 gap-x-6 gap-y-2'>
              <Row label='Name'   value={patient.name} />
              <Row label='Phone'  value={patient.phone} />
              <Row label='Email'  value={patient.email} />
              <Row label='Age'    value={patient.age} />
              <Row label='Gender' value={patient.gender} />
              <Row label='Blood Group' value={patient.bloodGroup} />
            </div>
          </section>

          {/* Slot */}
          <section>
            <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-2'>Appointment</p>
            <div className='grid grid-cols-2 gap-x-6 gap-y-2'>
              <Row label='Date'    value={appt.slotDate?.replace(/_/g, '/')} />
              <Row label='Time'    value={appt.slotTime} />
              <Row label='Fees'    value={formatMoney(appt.amount)} highlight />
              <Row label='Payment' value={appt.payment ? 'Paid' : 'Unpaid'} />
            </div>
          </section>

          {/* Actions — only if not yet concluded */}
          {!appt.cancelled && !appt.isCompleted && (
            <section className='flex gap-3 pt-1'>
              <button
                onClick={async () => { await cancelAppointment(appt._id); onClose() }}
                className='flex-1 border border-red-200 text-red-500 rounded-lg py-2 text-sm hover:bg-red-50 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={async () => { await completeAppointment(appt._id); onClose() }}
                className='flex-1 bg-emerald-500 text-white rounded-lg py-2 text-sm hover:bg-emerald-600 transition-colors'
              >
                Mark Complete
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Doctor Dashboard ──────────────────────────────────────────────────────────
const DoctorDashboard = () => {
  const { dToken, dashData, getDashData, cancelAppointment, completeAppointment } = useContext(DoctorContext)
  const { slotDateFormat, currency } = useContext(AppContext)

  const [selectedAppt, setSelectedAppt] = useState(null)

  useEffect(() => {
    if (dToken) getDashData()
  }, [dToken])

  const formatMoney = (v) => `${currency}${Number(v || 0).toLocaleString()}`
  const formatTime  = (v) => {
    if (!v) return '-'
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString()
  }

  if (!dashData) return <div className='m-5 text-gray-400 text-sm'>Loading…</div>

  const appointments = dashData.latestAppointments || []
  const completed  = appointments.filter(a => a.isCompleted).length
  const cancelled  = appointments.filter(a => a.cancelled).length
  const pending    = appointments.filter(a => !a.isCompleted && !a.cancelled).length

  return (
    <div className='m-5 w-full'>

      {/* Modal */}
      {selectedAppt && (
        <AppointmentDetailModal
          appt={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          formatMoney={formatMoney}
          formatTime={formatTime}
          cancelAppointment={cancelAppointment}
          completeAppointment={completeAppointment}
        />
      )}

      {/* Heading */}
      <div className='flex items-center justify-between gap-3 mb-6'>
        <div>
          <p className='text-2xl font-semibold text-gray-700'>Doctor Dashboard</p>
          <p className='text-sm text-gray-400'>Your appointment & earnings overview</p>
        </div>
        <span className='text-xs text-gray-500'>Updated just now</span>
      </div>

      {/* Metric cards */}
      <div className='grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6'>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-4'>
          <div className='w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0'>
            <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6 text-emerald-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' /></svg>
          </div>
          <div><p className='text-2xl font-bold text-emerald-600'>{formatMoney(dashData.earnings)}</p><p className='text-gray-400 text-sm'>Total Earnings</p></div>
        </div>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-4'>
          <div className='w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0'>
            <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6 text-blue-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' /></svg>
          </div>
          <div><p className='text-2xl font-bold text-gray-700'>{dashData.appointments}</p><p className='text-gray-400 text-sm'>Appointments</p></div>
        </div>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-4'>
          <div className='w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0'>
            <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6 text-violet-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' /></svg>
          </div>
          <div><p className='text-2xl font-bold text-gray-700'>{dashData.patients}</p><p className='text-gray-400 text-sm'>Unique Patients</p></div>
        </div>
      </div>

      {/* Status summary row */}
      <div className='grid grid-cols-3 gap-4 mb-8'>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-4'>
          <div className='w-11 h-11 bg-yellow-50 rounded-xl flex items-center justify-center flex-shrink-0'>
            <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6 text-yellow-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' /></svg>
          </div>
          <div><p className='text-2xl font-bold text-yellow-500'>{pending}</p><p className='text-gray-400 text-sm'>Pending</p></div>
        </div>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-4'>
          <div className='w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0'>
            <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6 text-emerald-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' /></svg>
          </div>
          <div><p className='text-2xl font-bold text-emerald-600'>{completed}</p><p className='text-gray-400 text-sm'>Completed</p></div>
        </div>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-4'>
          <div className='w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0'>
            <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6 text-red-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' /></svg>
          </div>
          <div><p className='text-2xl font-bold text-red-400'>{cancelled}</p><p className='text-gray-400 text-sm'>Cancelled</p></div>
        </div>
      </div>

      {/* Latest Appointments — clickable detail popup */}
      <div className='bg-white border rounded-xl'>
        <div className='flex items-center gap-3 px-5 py-4 border-b'>
          <p className='font-semibold text-gray-700'>Latest Appointments</p>
        </div>
        <div className='p-4'>
          {appointments.length === 0 ? (
            <p className='text-gray-400 text-sm'>No appointments yet.</p>
          ) : (
            <div className='space-y-3'>
              {appointments.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedAppt(item)}
                  className='flex items-center justify-between text-sm text-gray-600 border rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-colors'
                >
                  <div className='flex items-center gap-3'>
                    {item.userData?.image
                      ? <img className='w-9 h-9 rounded-full object-cover' src={item.userData.image} alt='' />
                      : <div className='w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-gray-500 font-semibold text-sm'>
                          {(item.userData?.name || 'P').charAt(0)}
                        </div>
                    }
                    <div>
                      <p className='font-medium text-gray-800'>{item.userData?.name || 'Patient'}</p>
                      <p className='text-xs text-gray-400'>{slotDateFormat(item.slotDate)} • {item.slotTime}</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      item.cancelled ? 'bg-red-50 text-red-500'
                      : item.isCompleted ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-yellow-50 text-yellow-600'
                    }`}>
                      {item.cancelled ? 'Cancelled' : item.isCompleted ? 'Completed' : 'Pending'}
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
  )
}

export default DoctorDashboard