import React, { useContext, useState } from 'react'
import { PharmacyContext } from '../../context/PharmacyContext'
import { toast } from 'react-toastify'

const Orders = () => {
  const { lookupPatient } = useContext(PharmacyContext)
  const [patientId, setPatientId] = useState('')
  const [patientName, setPatientName] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])

  const onSearch = async (e) => {
    e.preventDefault()
    if (!patientId && !patientName) {
      toast.error('Enter patient ID or name')
      return
    }
    setLoading(true)
    const data = await lookupPatient({ patientId: patientId.trim(), patientName: patientName.trim() })
    setLoading(false)
    if (data.success) {
      setResults(data.results || [])
    } else {
      setResults([])
      toast.error(data.message || 'No patient found')
    }
  }
  return (
    <div className='m-5 w-full'>
      <p className='text-xl font-semibold text-gray-700 mb-4'>Prescription Orders</p>

      <form onSubmit={onSearch} className='bg-white border rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-3 md:items-end'>
        <div className='flex-1'>
          <label className='text-sm font-medium text-gray-600'>Patient ID</label>
          <input
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className='w-full mt-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400'
            placeholder='e.g. 65c2...'
          />
        </div>
        <div className='flex-1'>
          <label className='text-sm font-medium text-gray-600'>Patient Name</label>
          <input
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className='w-full mt-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400'
            placeholder='e.g. John Doe'
          />
        </div>
        <button
          type='submit'
          className='bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors'
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className='bg-white border rounded-xl'>
        <div className='flex items-center gap-3 px-5 py-4 border-b'>
          <svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5 text-emerald-600' fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className='font-semibold text-gray-700'>Recent Orders</p>
        </div>

        {results.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <div className='w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4'>
              <svg xmlns="http://www.w3.org/2000/svg" className='w-8 h-8 text-emerald-500' fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className='text-gray-500 font-medium'>No patient selected</p>
            <p className='text-gray-400 text-sm mt-1'>Search by patient ID or name to see details.</p>
          </div>
        ) : (
          <div className='p-4 space-y-4'>
            {results.map((item, index) => {
              const appointments = item.appointments || []
              const doctorNames = [...new Set(appointments.map(a => a.docData?.name).filter(Boolean))]
              return (
                <div key={index} className='border rounded-xl p-4'>
                  <div className='flex flex-wrap justify-between gap-4'>
                    <div>
                      <p className='text-lg font-semibold text-gray-800'>{item.patient.name}</p>
                      <p className='text-sm text-gray-500'>{item.patient.email}</p>
                      <p className='text-sm text-gray-500'>Phone: {item.patient.phone}</p>
                      <p className='text-sm text-gray-500'>Gender: {item.patient.gender} • DOB: {item.patient.dob}</p>
                    </div>
                    <div className='text-sm text-gray-600'>
                      <p className='font-medium text-gray-700'>Consulted Doctors</p>
                      {doctorNames.length ? doctorNames.map((name, i) => <p key={i}>{name}</p>) : <p>No consultations found</p>}
                    </div>
                  </div>

                  <div className='mt-4'>
                    <p className='text-sm font-medium text-gray-700 mb-2'>Recent Appointments</p>
                    {appointments.length === 0 ? (
                      <p className='text-sm text-gray-400'>No appointments found</p>
                    ) : (
                      <div className='space-y-2'>
                        {appointments.slice(0, 5).map((appt, idx) => (
                          <div key={idx} className='flex flex-wrap justify-between text-sm text-gray-600 border-b pb-2'>
                            <span>{appt.docData?.name || 'Doctor'}</span>
                            <span>{appt.slotDate} • {appt.slotTime}</span>
                            <span>{appt.isCompleted ? 'Completed' : appt.cancelled ? 'Cancelled' : 'Scheduled'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Orders
