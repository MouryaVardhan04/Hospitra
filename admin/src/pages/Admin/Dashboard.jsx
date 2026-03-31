import React, { useContext, useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

// ── Shared Row Helper ────────────────────────────────────────────────────────
const Row = ({ label, value, highlight }) => (
  <div className='flex flex-col py-1'>
    <span className='text-xs text-gray-400 capitalize'>{label}</span>
    <span className={`font-medium text-sm ${highlight ? 'text-blue-700' : 'text-gray-800'}`}>{value || '-'}</span>
  </div>
)

// ── Appointment Detail Modal ──────────────────────────────────────────────────
const AppointmentDetailModal = ({ appt, onClose, currency, slotDateFormat }) => {
  if (!appt) return null
  const statusCls = appt.cancelled ? 'bg-red-50 text-red-600' : appt.isCompleted ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4' onClick={onClose}>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto' onClick={e => e.stopPropagation()}>
        <div className='flex items-center justify-between px-6 py-4 border-b bg-gray-50 rounded-t-2xl'>
          <div>
            <p className='text-base font-semibold text-gray-800'>Appointment Details</p>
            <p className='text-xs text-gray-400 mt-0.5'>ID: {appt._id}</p>
          </div>
          <div className='flex items-center gap-3'>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusCls}`}>
              {appt.cancelled ? 'Cancelled' : appt.isCompleted ? 'Completed' : 'Upcoming'}
            </span>
            <button onClick={onClose} className='text-gray-400 hover:text-gray-600 text-xl'>✕</button>
          </div>
        </div>
        <div className='p-6 space-y-6'>
          <section>
            <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-2'>Patient & Doctor</p>
            <div className='grid grid-cols-2 gap-4'>
              <Row label='Patient' value={appt.userData?.name} />
              <Row label='Doctor' value={appt.docData?.name} />
            </div>
          </section>
          <section>
            <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-2'>Schedule & Payment</p>
            <div className='grid grid-cols-2 gap-4'>
              <Row label='Date' value={slotDateFormat(appt.slotDate)} />
              <Row label='Time' value={appt.slotTime} />
              <Row label='Fees' value={`${currency}${appt.amount}`} highlight />
              <Row label='Payment' value={appt.payment ? 'Paid' : 'Unpaid'} />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

// ── Lab Detail Modal ──────────────────────────────────────────────────────────
const LabDetailModal = ({ lab, onClose, currency }) => {
  if (!lab) return null
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4' onClick={onClose}>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto' onClick={e => e.stopPropagation()}>
        <div className='flex items-center justify-between px-6 py-4 border-b bg-gray-50 rounded-t-2xl'>
          <div>
            <p className='text-base font-semibold text-gray-800'>Lab Assignment</p>
            <p className='text-xs text-gray-400 mt-0.5'>{lab.status} • {new Date(lab.createdAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 text-xl'>✕</button>
        </div>
        <div className='p-6 space-y-6'>
          <div className='grid grid-cols-2 gap-4'>
            <Row label='Patient' value={lab.patientName} />
            <Row label='Doctor' value={lab.doctorName} />
            <Row label='Priority' value={lab.priority} highlight />
            <Row label='Total Fee' value={`${currency}${lab.total}`} highlight />
          </div>
          <section>
            <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-2'>Tests Ordered</p>
            <div className='flex flex-wrap gap-2'>
              {lab.tests?.map((t, i) => (
                <span key={i} className='bg-blue-50 text-blue-600 text-xs px-3 py-1 rounded-full border border-blue-100'>{t}</span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

// ── Pharmacy Modal ────────────────────────────────────────────────────────────
const PharmacyModal = ({ inv, onClose, currency }) => {
  if (!inv) return null
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4' onClick={onClose}>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto' onClick={e => e.stopPropagation()}>
        <div className='flex items-center justify-between px-6 py-4 border-b bg-gray-50 rounded-t-2xl'>
          <div>
            <p className='text-base font-semibold text-gray-800'>Pharmacy Invoice</p>
            <p className='text-xs text-gray-400 mt-0.5'>{new Date(inv.createdAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 text-xl'>✕</button>
        </div>
        <div className='p-6 space-y-6'>
          <div className='grid grid-cols-2 gap-4'>
            <Row label='Patient' value={inv.patientName} />
            <Row label='Amount' value={`${currency}${inv.total}`} highlight />
            <Row label='Method' value={inv.paymentMethod} />
          </div>
          <table className='w-full text-sm border rounded-lg overflow-hidden'>
            <thead className='bg-gray-50 text-gray-500'>
              <tr><th className='px-4 py-2 text-left font-medium'>Medicine</th><th className='px-4 py-2 text-right font-medium'>Qty</th></tr>
            </thead>
            <tbody className='divide-y'>
              {inv.items?.map((it, i) => (
                <tr key={i}><td className='px-4 py-2'>{it.name}</td><td className='px-4 py-2 text-right'>{it.quantity}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const Dashboard = () => {

  const { aToken, getDashData, cancelAppointment, dashData } = useContext(AdminContext)
  const { slotDateFormat, currency } = useContext(AppContext)

  const [selectedAppt, setSelectedAppt] = useState(null)
  const [selectedLab, setSelectedLab] = useState(null)
  const [selectedPharma, setSelectedPharma] = useState(null)

  useEffect(() => {
    if (aToken) {
      getDashData()
    }
  }, [aToken])

  if (!dashData) return null

  return (
    <div className='m-5'>

      {/* Modals */}
      <AppointmentDetailModal appt={selectedAppt} onClose={() => setSelectedAppt(null)} currency={currency} slotDateFormat={slotDateFormat} />
      <LabDetailModal lab={selectedLab} onClose={() => setSelectedLab(null)} currency={currency} />
      <PharmacyModal inv={selectedPharma} onClose={() => setSelectedPharma(null)} currency={currency} />

      {/* Quick Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-4'>
          <img className='w-12 h-12 bg-blue-50 p-2 rounded-lg' src={assets.doctor_icon} alt="" />
          <div><p className='text-2xl font-bold text-gray-700'>{dashData.doctors}</p><p className='text-gray-400 text-sm'>Doctors</p></div>
        </div>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-4'>
          <img className='w-12 h-12 bg-orange-50 p-2 rounded-lg' src={assets.appointments_icon} alt="" />
          <div><p className='text-2xl font-bold text-gray-700'>{dashData.appointments}</p><p className='text-gray-400 text-sm'>Appointments</p></div>
        </div>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-4'>
          <img className='w-12 h-12 bg-green-50 p-2 rounded-lg' src={assets.patients_icon} alt="" />
          <div><p className='text-2xl font-bold text-gray-700'>{dashData.patients}</p><p className='text-gray-400 text-sm'>Patients</p></div>
        </div>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-4'>
          <img className='w-12 h-12 bg-purple-50 p-2 rounded-lg' src={assets.earning_icon} alt="" />
          <div><p className='text-2xl font-bold text-gray-700'>{currency}{dashData.totalRevenue.toLocaleString()}</p><p className='text-gray-400 text-sm'>Total Revenue</p></div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
        <div className='lg:col-span-2 bg-white border rounded-xl p-6'>
          <p className='text-lg font-semibold text-gray-700 mb-6'>Revenue Breakdown</p>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
            <div className='p-4 border rounded-xl bg-gray-50'>
              <p className='text-xs text-gray-400 uppercase'>Pharmacy</p>
              <p className='text-lg font-bold text-emerald-600 mt-1'>{currency}{dashData.pharmacyRevenue.toLocaleString()}</p>
            </div>
            <div className='p-4 border rounded-xl bg-gray-50'>
              <p className='text-xs text-gray-400 uppercase'>Labs</p>
              <p className='text-lg font-bold text-blue-600 mt-1'>{currency}{dashData.labsRevenue.toLocaleString()}</p>
            </div>
            <div className='p-4 border rounded-xl bg-gray-50'>
              <p className='text-xs text-gray-400 uppercase'>Billing</p>
              <p className='text-lg font-bold text-purple-600 mt-1'>{currency}{dashData.billingRevenue.toLocaleString()}</p>
            </div>
            <div className='p-4 border rounded-xl bg-gray-50'>
              <p className='text-xs text-gray-400 uppercase'>Fees</p>
              <p className='text-lg font-bold text-orange-600 mt-1'>{currency}{dashData.appointmentRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className='bg-white border rounded-xl p-6'>
          <p className='text-lg font-semibold text-gray-700 mb-6'>Module Status</p>
          <div className='space-y-4'>
            <div className='flex justify-between items-center text-sm'>
              <span className='text-gray-600'>Pharmacy Stock</span>
              <span className={`px-2 py-0.5 rounded-full ${dashData.medicineSummary.lowStock > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {dashData.medicineSummary.lowStock} Low Stock
              </span>
            </div>
            <div className='flex justify-between items-center text-sm'>
              <span className='text-gray-600'>Lab Workload</span>
              <span className='bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full'>
                {dashData.labSummary.pending} Pending
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-[6.5fr_3.5fr] gap-6'>
        {/* Latest Appointments */}
        <div className='bg-white border rounded-xl overflow-hidden'>
          <div className='flex items-center gap-2.5 px-6 py-4 border-b bg-gray-50'>
            <img className='w-5' src={assets.list_icon} alt="" />
            <p className='font-semibold text-gray-700'>Latest Bookings</p>
          </div>
          <div className='divide-y'>
            {dashData.latestAppointments.slice(0, 5).map((item, index) => (
              <div onClick={() => setSelectedAppt(item)} className='flex items-center px-6 py-4 gap-3 hover:bg-gray-50 cursor-pointer' key={index}>
                <img className='rounded-full w-10 h-10 object-cover' src={item.docData.image} alt="" />
                <div className='flex-1 text-sm'>
                  <p className='text-gray-800 font-medium'>{item.docData.name}</p>
                  <p className='text-gray-400'>{item.userData?.name} • {slotDateFormat(item.slotDate)}</p>
                </div>
                {item.cancelled ? <p className='text-red-400 text-xs font-medium'>Cancelled</p> : item.isCompleted ? <p className='text-green-500 text-xs font-medium'>Completed</p> : <img onClick={(e) => { e.stopPropagation(); cancelAppointment(item._id) }} className='w-8 h-8 p-1.5 hover:bg-red-50 rounded-full cursor-pointer' src={assets.cancel_icon} alt="" />}
              </div>
            ))}
          </div>
        </div>

        {/* Latest Module Activities */}
        <div className='space-y-6'>
          {/* Pharmacy */}
          <div className='bg-white border rounded-xl overflow-hidden'>
            <div className='px-6 py-4 border-b bg-gray-50'><p className='font-semibold text-gray-700'>Latest Pharmacy Sales</p></div>
            <div className='divide-y'>
              {dashData.latestPharmacyInvoices.map((inv, i) => (
                <div key={i} onClick={() => setSelectedPharma(inv)} className='flex items-center justify-between px-6 py-3 hover:bg-gray-50 cursor-pointer text-sm'>
                  <div><p className='font-medium text-gray-800'>{inv.patientName}</p><p className='text-xs text-gray-400'>{inv.items?.length} items</p></div>
                   <p className='font-semibold text-emerald-600'>{currency}{inv.total}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Labs */}
          <div className='bg-white border rounded-xl overflow-hidden'>
            <div className='px-6 py-4 border-b bg-gray-50'><p className='font-semibold text-gray-700'>Latest Lab Assignments</p></div>
            <div className='divide-y'>
              {dashData.latestLabAssignments.map((lab, i) => (
                <div key={i} onClick={() => setSelectedLab(lab)} className='flex items-center justify-between px-6 py-3 hover:bg-gray-50 cursor-pointer text-sm'>
                  <div><p className='font-medium text-gray-800'>{lab.patientName}</p><p className='text-xs text-gray-400'>{lab.status}</p></div>
                  <p className='font-semibold text-blue-600'>{currency}{lab.total}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Dashboard