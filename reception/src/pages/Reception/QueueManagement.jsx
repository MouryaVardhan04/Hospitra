import React, { useContext, useEffect, useMemo, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'

const QueueManagement = () => {
  const { doctors, getAllDoctors } = useContext(AdminContext)
  const [queue, setQueue] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [tick, setTick] = useState(Date.now())

  const load = () => {
    try {
      const appointments = JSON.parse(localStorage.getItem('receptionAppointments') || '[]')
      const registrations = JSON.parse(localStorage.getItem('receptionRegistrations') || '[]')

      const patientMap = registrations.reduce((acc, item) => {
        acc[item.id] = item
        return acc
      }, {})

      const parsed = appointments.map((appt) => {
        const [day, month, year] = (appt.slotDate || '').split('_').map(Number)
        const parsedDate = new Date(year, (month || 1) - 1, day || 1)

        const time = appt.slotTime || ''
        let hour = 0
        let minute = 0
        const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i)
        if (match) {
          hour = Number(match[1])
          minute = Number(match[2])
          const mer = match[3].toUpperCase()
          if (mer === 'PM' && hour !== 12) hour += 12
          if (mer === 'AM' && hour === 12) hour = 0
        }
        parsedDate.setHours(hour, minute, 0, 0)

        const patient = patientMap[appt.patientId]
        return {
          ...appt,
          patientName: patient?.name || appt.patientId || 'Unknown',
          patientId: appt.patientId,
          datetime: parsedDate,
          dateKey: appt.slotDate
        }
      })

      parsed.sort((a, b) => a.datetime - b.datetime)
      setQueue(parsed)
    } catch {
      setQueue([])
    }
  }

  useEffect(() => {
    getAllDoctors()
    load()
    const interval = setInterval(() => setTick(Date.now()), 3000)
    return () => clearInterval(interval)
  }, [])

  const waitMins = (datetime) => Math.max(0, Math.floor((tick - datetime) / 60000))

  const doctorMap = useMemo(() => {
    return doctors.reduce((acc, doc) => {
      acc[doc._id] = doc
      return acc
    }, {})
  }, [doctors])

  const dateOptions = useMemo(() => {
    const unique = [...new Set(queue.map(q => q.dateKey).filter(Boolean))]
    return unique
  }, [queue])

  const filteredQueue = useMemo(() => {
    if (!selectedDate) return queue
    return queue.filter(q => q.dateKey === selectedDate)
  }, [queue, selectedDate])

  return (
    <div className='m-5 w-full'>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-4'>
        <p className='text-xl font-semibold text-gray-700'>Queue Management</p>
        <div className='flex items-center gap-2'>
          <select
            className='border rounded-lg px-3 py-2 text-sm'
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          >
            <option value=''>All Dates</option>
            {dateOptions.map((date) => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        </div>
      </div>

      <div className='bg-white border rounded-xl p-4'>
        {filteredQueue.length === 0 ? (
          <p className='text-sm text-gray-400'>No bookings found for the selected date.</p>
        ) : (
          <div className='space-y-3'>
            {filteredQueue.map((q, i) => {
              const doctor = doctorMap[q.doctorId]
              const status = tick >= q.datetime.getTime() ? 'Ready' : 'Upcoming'
              return (
              <div key={i} className='border rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm'>
                <div>
                  <p className='font-medium text-gray-800'>{q.patientName || q.patientId || 'Unknown'}</p>
                  <p className='text-gray-500'>Doctor: {doctor?.name || 'Doctor'} • {doctor?.speciality || 'Speciality'}</p>
                  <p className='text-xs text-gray-400'>Slot: {q.slotDate} • {q.slotTime}</p>
                </div>
                <div className='flex flex-col items-end gap-1 text-xs text-gray-500'>
                  <span className='px-2 py-1 rounded-full bg-gray-100 text-gray-700'>{status}</span>
                  <span>Waiting: {waitMins(q.datetime)} min</span>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  )
}

export default QueueManagement
