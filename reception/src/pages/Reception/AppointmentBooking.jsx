import React, { useContext, useEffect, useMemo, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'

const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const AppointmentBooking = () => {
  const { doctors, getAllDoctors, lookupPatient, bookAppointmentReception } = useContext(AdminContext)
  const { currency, slotDateFormat } = useContext(AppContext)

  // Patient selection
  const [searchQuery, setSearchQuery]   = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching]       = useState(false)
  const [patient, setPatient]           = useState(null)   // explicitly selected patient
  const [patientId, setPatientId]       = useState('')

  // Doctor / slot
  const [doctorId, setDoctorId]   = useState('')
  const [docSlots, setDocSlots]   = useState([])
  const [slotIndex, setSlotIndex] = useState(0)
  const [slotTime, setSlotTime]   = useState('')
  const [loading, setLoading]     = useState(false)

  useEffect(() => { getAllDoctors() }, [])

  const selectedDoctor = useMemo(() => doctors.find(d => d._id === doctorId), [doctors, doctorId])

  // ── Slot generation ─────────────────────────────────────────────────────────
  const loadSlots = () => {
    if (!selectedDoctor) return
    const docInfo = selectedDoctor
    const slots = []
    const today = new Date()

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today)
      currentDate.setDate(today.getDate() + i)
      const endTime = new Date()
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
        const day   = currentDate.getDate()
        const month = currentDate.getMonth() + 1
        const year  = currentDate.getFullYear()
        const slotDate = `${day}_${month}_${year}`
        const isAvailable = docInfo.slots_booked?.[slotDate]
          ? !docInfo.slots_booked[slotDate].includes(formattedTime)
          : true
        if (isAvailable) timeSlots.push({ datetime: new Date(currentDate), time: formattedTime })
        currentDate.setMinutes(currentDate.getMinutes() + 30)
      }
      slots.push(timeSlots)
    }

    setDocSlots(slots)
    setSlotIndex(0)
    setSlotTime('')
  }

  useEffect(() => { loadSlots() }, [doctorId])

  // ── Patient search ──────────────────────────────────────────────────────────
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) { setSearchResults([]); return }

    const timer = setTimeout(async () => {
      setSearching(true)
      const isId = q.length >= 20
      const data = await lookupPatient({ patientId: isId ? q : '', patientName: isId ? '' : q })
      setSearching(false)
      if (data.success && data.results?.length) {
        setSearchResults(data.results)
      } else {
        setSearchResults([])
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const selectPatient = (result) => {
    setPatient(result.patient)
    setPatientId(result.patient._id)
    setSearchQuery(result.patient.name)   // fill input with selected name
    setSearchResults([])                  // close dropdown
  }

  const clearPatient = () => {
    setPatient(null)
    setPatientId('')
    setSearchQuery('')
    setSearchResults([])
  }

  // ── Booking ─────────────────────────────────────────────────────────────────
  const bookAppointment = async () => {
    if (!patientId || !doctorId || !slotTime) {
      toast.error('Select patient, doctor, and time slot')
      return
    }
    const selected = docSlots[slotIndex]?.find(s => s.time === slotTime)
    if (!selected) { toast.error('Please select a valid time slot'); return }

    const date     = selected.datetime
    const slotDate = `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`

    setLoading(true)
    const data = await bookAppointmentReception({ patientId, docId: doctorId, slotDate, slotTime })
    setLoading(false)

    if (data.success) {
      toast.success('Appointment booked')
      const appointments = JSON.parse(localStorage.getItem('receptionAppointments') || '[]')
      appointments.unshift({
        patientId,
        patientName: patient?.name || '',
        doctorId,
        slotDate,
        slotTime,
        createdAt: Date.now(),
        userData: patient,
        docData: selectedDoctor
      })
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

        {/* ── Patient Panel ─────────────────────────────────────────────── */}
        <div className='bg-white border rounded-xl p-4'>
          <p className='font-medium text-gray-700 mb-3'>Patient</p>

          {/* Search input */}
          <div className='relative'>
            <input
              className='border rounded-lg w-full p-2 text-sm pr-8'
              placeholder='Search by name or patient ID'
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPatient(null); setPatientId('') }}
            />
            {searching && (
              <span className='absolute right-2 top-2.5 text-xs text-gray-400'>…</span>
            )}
            {patient && (
              <button
                onClick={clearPatient}
                className='absolute right-2 top-2 text-gray-400 hover:text-gray-600 text-base leading-none'
                title='Clear selection'
              >
                ✕
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          {searchResults.length > 0 && !patient && (
            <div className='mt-2 border rounded-xl overflow-hidden shadow-sm'>
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  type='button'
                  onClick={() => selectPatient(res)}
                  className='w-full text-left px-4 py-3 text-sm hover:bg-slate-50 border-b last:border-b-0 transition-colors'
                >
                  <p className='font-semibold text-gray-800'>{res.patient.name}</p>
                  <p className='text-xs text-gray-400 mt-0.5'>{res.patient.email} • {res.patient.phone}</p>
                </button>
              ))}
            </div>
          )}

          {searchQuery.trim() && !searching && searchResults.length === 0 && !patient && (
            <p className='text-xs text-gray-400 mt-2'>No patients found.</p>
          )}

          {/* Selected patient card */}
          {patient && (
            <div className='mt-3 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm'>
              <div className='flex items-start justify-between gap-2'>
                <div>
                  <p className='font-semibold text-gray-800 text-base'>{patient.name}</p>
                  <p className='text-xs text-gray-400 mt-0.5'>{patient.email}</p>
                </div>
                <span className='text-xs bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full border border-emerald-100 whitespace-nowrap'>
                  Selected
                </span>
              </div>
              <div className='grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs text-gray-500'>
                <span>Phone: {patient.phone || '-'}</span>
                <span>Gender: {patient.gender || '-'}</span>
                <span>DOB: {patient.dob || '-'}</span>
                <span>Blood: {patient.bloodGroup || '-'}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Doctor & Slots Panel ───────────────────────────────────────── */}
        <div className='lg:col-span-2 bg-white border rounded-xl p-4'>
          <div className='flex flex-wrap gap-3 items-center mb-4'>
            <select
              className='border rounded-lg px-3 py-2 text-sm flex-1 min-w-0'
              value={doctorId}
              onChange={e => setDoctorId(e.target.value)}
            >
              <option value=''>Select Doctor</option>
              {doctors.map(doc => (
                <option key={doc._id} value={doc._id}>
                  Dr. {doc.name} — {doc.speciality} ({currency}{doc.fees})
                </option>
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
                    className={`text-center py-3 px-4 min-w-24 rounded-full whitespace-nowrap transition ${
                      slotIndex === index ? 'bg-primary text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <p className='text-xs'>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                    <p className='text-sm font-medium'>
                      {item[0] && slotDateFormat(`${item[0].datetime.getDate()}_${item[0].datetime.getMonth() + 1}_${item[0].datetime.getFullYear()}`)}
                    </p>
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
                    className={`px-4 py-2 rounded-full text-sm border ${
                      slotTime === item.time
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.time}
                  </button>
                ))}
              </div>

              <button
                onClick={bookAppointment}
                disabled={!patient || !slotTime || loading}
                className={`mt-5 px-6 py-2 rounded-lg text-sm font-medium transition ${
                  patient && slotTime && !loading
                    ? 'bg-primary text-white hover:opacity-90'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? 'Booking…' : 'Book Appointment'}
              </button>

              {!patient && (
                <p className='text-xs text-amber-500 mt-2'>⚠ Search and select a patient first</p>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  )
}

export default AppointmentBooking
