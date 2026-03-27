import React, { useEffect, useState } from 'react'
import { assets } from '../../assets/assets'

const getList = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

const Dashboard = () => {
  const [now, setNow] = useState(Date.now())
  const [metrics, setMetrics] = useState({
    registrations: 0,
    appointments: 0,
    labAssignments: 0,
    billings: 0,
    queue: 0
  })
  const [queue, setQueue] = useState([])

  const refresh = () => {
    const registrations = getList('receptionRegistrations')
    const appointments = getList('receptionAppointments')
    const labAssignments = getList('receptionLabAssignments')
    const billings = getList('receptionBillings')
    const queueList = getList('receptionQueue')

    setMetrics({
      registrations: registrations.length,
      appointments: appointments.length,
      labAssignments: labAssignments.length,
      billings: billings.length,
      queue: queueList.length
    })
    setQueue(queueList)
  }

  useEffect(() => {
    refresh()
    const interval = setInterval(() => {
      setNow(Date.now())
      refresh()
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const formatWait = (createdAt) => {
    const mins = Math.max(0, Math.floor((now - createdAt) / 60000))
    return `${mins} min`
  }

  return (
    <div className='m-5 w-full'>
      <div className='flex items-center justify-between gap-3 mb-6'>
        <div>
          <p className='text-2xl font-semibold text-gray-700'>Reception Dashboard</p>
          <p className='text-sm text-gray-400'>Real-time patient flow tracking</p>
        </div>
        <span className='text-xs text-gray-500'>Updated just now</span>
      </div>

      {/* Metrics */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-3'>
          <img src={assets.patients_icon} className='w-10' alt='' />
          <div>
            <p className='text-2xl font-bold text-gray-700'>{metrics.registrations}</p>
            <p className='text-gray-400 text-sm'>Registrations</p>
          </div>
        </div>
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
        <div className='bg-white border rounded-xl p-5 flex items-center gap-3'>
          <img src={assets.people_icon} className='w-10' alt='' />
          <div>
            <p className='text-2xl font-bold text-gray-700'>{metrics.queue}</p>
            <p className='text-gray-400 text-sm'>Queue Size</p>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Live Queue */}
        <div className='bg-white border rounded-xl'>
          <div className='flex items-center gap-3 px-5 py-4 border-b'>
            <img src={assets.people_icon} className='w-5' alt='' />
            <p className='font-semibold text-gray-700'>Live Queue</p>
          </div>
          <div className='p-4'>
            {queue.length === 0 ? (
              <p className='text-gray-400 text-sm'>No patients in queue.</p>
            ) : (
              <div className='space-y-3'>
                {queue.slice(0, 6).map((q, i) => (
                  <div key={i} className='flex items-center justify-between text-sm text-gray-600 border rounded-lg px-3 py-2'>
                    <div>
                      <p className='font-medium text-gray-800'>{q.patientName || q.patientId || 'Unknown'}</p>
                      <p className='text-xs text-gray-400'>{q.service} • {q.priority}</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-xs text-gray-500'>Waiting</p>
                      <p className='font-semibold text-gray-700'>{formatWait(q.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Patient Flow */}
        <div className='bg-white border rounded-xl'>
          <div className='flex items-center gap-3 px-5 py-4 border-b'>
            <img src={assets.home_icon} className='w-5' alt='' />
            <p className='font-semibold text-gray-700'>Patient Flow Tracker</p>
          </div>
          <div className='p-4'>
            <div className='space-y-3 text-sm text-gray-600'>
              <div className='flex items-center justify-between border rounded-lg px-3 py-2'>
                <span>Registered</span>
                <span className='font-semibold text-gray-700'>{metrics.registrations}</span>
              </div>
              <div className='flex items-center justify-between border rounded-lg px-3 py-2'>
                <span>Booked Appointments</span>
                <span className='font-semibold text-gray-700'>{metrics.appointments}</span>
              </div>
              <div className='flex items-center justify-between border rounded-lg px-3 py-2'>
                <span>Lab Assigned</span>
                <span className='font-semibold text-gray-700'>{metrics.labAssignments}</span>
              </div>
              <div className='flex items-center justify-between border rounded-lg px-3 py-2'>
                <span>Billing Initiated</span>
                <span className='font-semibold text-gray-700'>{metrics.billings}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
