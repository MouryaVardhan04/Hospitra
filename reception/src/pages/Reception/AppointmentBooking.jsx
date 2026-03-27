import React, { useContext, useEffect, useMemo, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'

const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const AppointmentBooking = () => {
  const { doctors, getAllDoctors, lookupPatient, bookAppointmentReception } = useContext(AdminContext)
  const { currency, slotDateFormat } = useContext(AppContext)

  const [patientId, setPatientId] = useState('')
  const [patientName, setPatientName] = useState('')
  const [patient, setPatient] = useState(null)
  const [doctorId, setDoctorId] = useState('')
  const [docSlots, setDocSlots] = useState([])
  const [slotIndex, setSlotIndex] = useState(0)
  const [slotTime, setSlotTime] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getAllDoctors()
  }, [])

  const selectedDoctor = useMemo(() => doctors.find(d => d._id === doctorId), [doctors, doctorId])

  const loadSlots = () => {
    if (!selectedDoctor) return

    const docInfo = selectedDoctor
    const slots = []
    let today = new Date()

    for (let i = 0; i < 7; i++) {
      let currentDate = new Date(today)
      currentDate.setDate(today.getDate() + i)
      let endTime = new Date()
      endTime.setDate(today.getDate() + i)
      endTime.setHours(21, 0, 0, 0)

      if (today.getDate() === currentDate.getDate()) {
        currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10)
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0)
      } else {
        currentDate.setHours(10)
        currentDate.setMinutes(0)
      }

      const timeSlots = []
      while (currentDate < endTime) {
        const formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
        const day = currentDate.getDate()
        const month = currentDate.getMonth() + 1
        const year = currentDate.getFullYear()
        const slotDate = day + '_' + month + '_' + year
        const isAvailable = docInfo.slots_booked?.[slotDate] ? !docInfo.slots_booked[slotDate].includes(formattedTime) : true

        if (isAvailable) {
          timeSlots.push({ datetime: new Date(currentDate), time: formattedTime })
        }
        currentDate.setMinutes(currentDate.getMinutes() + 30)
      }
      slots.push(timeSlots)
    }

    setDocSlots(slots)
    setSlotIndex(0)
    setSlotTime('')
  }

  useEffect(() => {
    loadSlots()
  }, [doctorId])

  const searchPatient = async () => {
    if (!patientId && !patientName) {
      toast.error('Enter patient ID or name')
      return
    }
    const data = await lookupPatient({ patientId: patientId.trim(), patientName: patientName.trim() })
    if (data.success && data.results?.length) {
      setPatient(data.results[0].patient)
      setPatientId(data.results[0].patient._id)
    } else {
      setPatient(null)
      toast.error(data.message || 'Patient not found')
    }
  }

  const bookAppointment = async () => {
    if (!patientId || !doctorId || !slotTime) {
      toast.error('Select patient, doctor, and time slot')
      return
    }

    const selected = docSlots[slotIndex]?.find(s => s.time === slotTime)
    if (!selected) {
      toast.error('Please select a valid time slot')
      return
    }

    const date = selected.datetime
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    const slotDate = day + '_' + month + '_' + year

    setLoading(true)
    const data = await bookAppointmentReception({ patientId, docId: doctorId, slotDate, slotTime })
    setLoading(false)

    if (data.success) {
      toast.success('Appointment booked')
      const appointments = JSON.parse(localStorage.getItem('receptionAppointments') || '[]')
      appointments.unshift({ patientId, doctorId, slotDate, slotTime, createdAt: Date.now() })
      localStorage.setItem('receptionAppointments', JSON.stringify(appointments))
      loadSlots()
    } else {
      toast.error(data.message || 'Booking failed')
    }
  }

  return (
    <div className='m-5 w-full'>
      <p className='text-xl font-semibold text-gray-700 mb-4'>Appointment Booking</p>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Patient */}
        <div className='bg-white border rounded-xl p-4'>
          <p className='font-medium text-gray-700 mb-3'>Patient Details</p>
          <div className='space-y-3'>
            <input className='border rounded-lg w-full p-2 text-sm' placeholder='Patient ID' value={patientId} onChange={e => setPatientId(e.target.value)} />
            <input className='border rounded-lg w-full p-2 text-sm' placeholder='Patient Name' value={patientName} onChange={e => setPatientName(e.target.value)} />
            <button type='button' onClick={searchPatient} className='bg-primary text-white px-4 py-2 rounded-lg text-sm'>Search Patient</button>
          </div>

          {patient && (
            <div className='mt-4 text-sm text-gray-600 border rounded-lg p-3'>
              <p className='font-semibold text-gray-800'>{patient.name}</p>
              <p>{patient.email}</p>
              <p>Phone: {patient.phone}</p>
              <p>Gender: {patient.gender} • DOB: {patient.dob}</p>
            </div>
          )}
        </div>

        {/* Doctor & Slots */}
        <div className='lg:col-span-2 bg-white border rounded-xl p-4'>
          <div className='flex flex-wrap gap-3 items-center mb-4'>
            <select className='border rounded-lg px-3 py-2 text-sm' value={doctorId} onChange={e => setDoctorId(e.target.value)}>
              <option value=''>Select Doctor</option>
              {doctors.map(doc => (
                <option key={doc._id} value={doc._id}>{doc.name} — {doc.speciality} ({currency}{doc.fees})</option>
              ))}
            </select>
            {selectedDoctor && !selectedDoctor.available && (
              <span className='text-xs text-red-500'>Doctor not available</span>
            )}
          </div>

          {doctorId && (
            <>
              <p className='text-sm font-medium text-gray-700'>Select Date</p>
              <div className='flex gap-3 items-center w-full overflow-x-auto mt-3 pb-1'>
                {docSlots.map((item, index) => (
                  <button
                    type='button'
                    onClick={() => setSlotIndex(index)}
                    key={index}
                    className={`text-center py-3 px-4 min-w-24 rounded-full whitespace-nowrap transition ${slotIndex === index ? 'bg-primary text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    <p className='text-xs'>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                    <p className='text-sm font-medium'>{item[0] && slotDateFormat(`${item[0].datetime.getDate()}_${item[0].datetime.getMonth() + 1}_${item[0].datetime.getFullYear()}`)}</p>
                  </button>
                ))}
              </div>

              <p className='text-sm font-medium text-gray-700 mt-4'>Select Time</p>
              <div className='flex flex-wrap gap-2 mt-3'>
                {docSlots[slotIndex]?.length === 0 && (
                  <p className='text-sm text-gray-400'>No available slots</p>
                )}
                {docSlots[slotIndex]?.map((item, i) => (
                  <button
                    type='button'
                    key={i}
                    onClick={() => setSlotTime(item.time)}
                    className={`px-4 py-2 rounded-full text-sm border ${slotTime === item.time ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {item.time}
                  </button>
                ))}
              </div>

              <button
                onClick={bookAppointment}
                className='mt-5 bg-primary text-white px-6 py-2 rounded-lg text-sm'
              >
                {loading ? 'Booking...' : 'Book Appointment'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AppointmentBooking
