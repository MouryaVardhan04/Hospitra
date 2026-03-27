import React, { useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'
import { AdminContext } from '../../context/AdminContext'

const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const PatientRegistration = () => {
  const { backendUrl, currency, slotDateFormat, calculateAge } = useContext(AppContext)
  const { doctors, getAllDoctors, bookAppointmentReception } = useContext(AdminContext)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [gender, setGender] = useState('Not Selected')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [createdId, setCreatedId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [docSlots, setDocSlots] = useState([])
  const [slotIndex, setSlotIndex] = useState(0)
  const [slotTime, setSlotTime] = useState('')
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    getAllDoctors()
  }, [])

  useEffect(() => {
    if (!dob) {
      setAge('')
      return
    }
    const computed = calculateAge(dob)
    setAge(Number.isFinite(computed) ? String(computed) : '')
  }, [dob])

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

  const generatePassword = () => {
    const temp = Math.random().toString(36).slice(-10) + 'A1'
    setPassword(temp)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      if (doctorId && !slotTime) {
        toast.error('Please select an appointment slot')
        return
      }

      const { data } = await axios.post(backendUrl + '/api/user/register', { name, email, password })
      if (data.success) {
        setCreatedId(data.userId)
        toast.success('Patient registered')

        // Update profile with additional details
        const formData = new FormData()
        formData.append('name', name)
        formData.append('phone', phone)
        formData.append('dob', dob)
        formData.append('age', age)
        formData.append('height', height)
        formData.append('weight', weight)
        formData.append('gender', gender)
        formData.append('address', JSON.stringify({ line1: address1, line2: address2 }))
        if (selectedDoctor) {
          formData.append('assignedDoctorId', selectedDoctor._id)
          formData.append('assignedDoctorName', selectedDoctor.name)
        }

        await axios.post(backendUrl + '/api/user/update-profile', formData, {
          headers: { token: data.token }
        })

        if (doctorId && slotTime) {
          const selected = docSlots[slotIndex]?.find(s => s.time === slotTime)
          if (selected) {
            const date = selected.datetime
            const day = date.getDate()
            const month = date.getMonth() + 1
            const year = date.getFullYear()
            const slotDate = day + '_' + month + '_' + year
            setBooking(true)
            const bookingData = await bookAppointmentReception({ patientId: data.userId, docId: doctorId, slotDate, slotTime })
            setBooking(false)
            if (bookingData.success) {
              toast.success('Appointment booked')
            } else {
              toast.error(bookingData.message || 'Booking failed')
            }
          }
        }

        const registrations = JSON.parse(localStorage.getItem('receptionRegistrations') || '[]')
        registrations.unshift({ id: data.userId, name, email, phone, dob, age, height, weight, gender, address1, address2, doctorId, createdAt: Date.now() })
        localStorage.setItem('receptionRegistrations', JSON.stringify(registrations))
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const buildInvoiceHtml = () => {
    const appointmentLabel = doctorId && slotTime 
      ? `${slotTime} (${docSlots[slotIndex]?.[0] ? slotDateFormat(`${docSlots[slotIndex][0].datetime.getDate()}_${docSlots[slotIndex][0].datetime.getMonth() + 1}_${docSlots[slotIndex][0].datetime.getFullYear()}`) : ''})` 
      : 'Not booked'
    
    const feeAmount = selectedDoctor ? selectedDoctor.fees : 0
    const fee = `${currency}${feeAmount}`
    const currentDate = new Date().toLocaleDateString()

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Medical Invoice - ${name || 'Patient'}</title>
    <style>
      body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1f2937; background: #f3f4f6; line-height: 1.5; }
      .invoice-card { background: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 900px; margin: 0 auto; overflow: hidden; border: 1px solid #e5e7eb; }
      
      /* Header Section */
      .header-main { padding: 32px; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #f3f4f6; }
      .brand-section h1 { margin: 0; font-size: 24px; color: #111827; font-weight: 700; }
      .brand-section p { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
      .meta-section { text-align: right; }
      .meta-section p { margin: 2px 0; font-size: 13px; color: #4b5563; }
      .invoice-id { font-family: monospace; color: #111827; font-weight: 600; }

      /* Info Grid */
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px 32px; background: #fafafa; }
      .info-box { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; }
      .info-box h3 { margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; }
      .info-row { display: flex; margin-bottom: 8px; font-size: 14px; }
      .info-row .label { width: 100px; color: #6b7280; flex-shrink: 0; }
      .info-row .value { color: #111827; font-weight: 600; }

      /* Table Section */
      .table-section { padding: 32px; }
      table { width: 100%; border-collapse: collapse; }
      th { text-align: left; padding: 12px 16px; border-bottom: 2px solid #f3f4f6; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
      td { padding: 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151; }
      .text-right { text-align: right; }
      
      /* Totals */
      .total-wrapper { margin-top: 20px; border-top: 2px solid #111827; padding-top: 16px; }
      .total-row { display: flex; justify-content: flex-end; font-size: 16px; font-weight: 700; color: #111827; }
      .total-label { margin-right: 40px; }

      /* Footer */
      .footer { padding: 24px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #9ca3af; }
    </style>
  </head>
  <body>
    <div class="invoice-card">
      <div class="header-main">
        <div class="brand-section">
          <h1>Hospitra Medical Invoice</h1>
          <p>Invoice for patient registration</p>
        </div>
        <div class="meta-section">
          <p>Invoice ID: <span class="invoice-id">${createdId || 'PENDING'}</span></p>
          <p>Date: <strong>${currentDate}</strong></p>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-box">
          <h3>Patient</h3>
          <div class="info-row"><span class="label">Name</span><span class="value">${name || '-'}</span></div>
          <div class="info-row"><span class="label">Email</span><span class="value">${email || '-'}</span></div>
          <div class="info-row"><span class="label">Phone</span><span class="value">${phone || '-'}</span></div>
          <div class="info-row"><span class="label">DOB</span><span class="value">${dob || '-'}</span></div>
          <div class="info-row"><span class="label">Age</span><span class="value">${age || '0'}</span></div>
          <div class="info-row"><span class="label">Gender</span><span class="value">${gender || '-'}</span></div>
        </div>
        
        <div class="info-box">
          <h3>Appointment</h3>
          <div class="info-row"><span class="label">Doctor</span><span class="value">${selectedDoctor?.name || 'Not assigned'}</span></div>
          <div class="info-row"><span class="label">Speciality</span><span class="value">${selectedDoctor?.speciality || '-'}</span></div>
          <div class="info-row"><span class="label">Slot</span><span class="value">${appointmentLabel}</span></div>
          <div class="info-row"><span class="label">Fee</span><span class="value">${fee}</span></div>
        </div>
      </div>

      <div class="table-section">
        <table>
          <thead>
            <tr>
              <th style="width: 25%">Item</th>
              <th style="width: 50%">Details</th>
              <th style="width: 25%" class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Registration</strong></td>
              <td>Patient registration</td>
              <td class="text-right">${currency}0</td>
            </tr>
            <tr>
              <td><strong>Consultation</strong></td>
              <td>${selectedDoctor?.name || 'N/A'}</td>
              <td class="text-right">${fee}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="total-wrapper">
          <div class="total-row">
            <span class="total-label">Total</span>
            <span class="total-value">${fee}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <div>Hospitra Digital Health Systems</div>
        <div>Computer Generated Invoice - No Signature Required</div>
      </div>
    </div>
  </body>
</html>`
  }

  const downloadInvoice = () => {
    if (!createdId) {
      toast.error('Register patient to download invoice')
      return
    }
    const html = buildInvoiceHtml()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice_${createdId}.html`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className='m-5 w-full'>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-4'>
        <p className='text-xl font-semibold text-gray-700'>Patient Registration</p>
        <div className='flex items-center gap-2'>
          {createdId && (
            <button
              type='button'
              onClick={downloadInvoice}
              className='px-4 py-2 rounded-lg text-sm border border-violet-200 text-violet-700 bg-violet-50'
            >
              Download Invoice
            </button>
          )}
          <button
            form='patient-registration-form'
            className='bg-primary text-white px-6 py-2 rounded-lg text-sm'
          >
            {booking ? 'Booking...' : 'Register Patient'}
          </button>
        </div>
      </div>

      <form id='patient-registration-form' onSubmit={onSubmit} className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 space-y-6'>
          <div className='bg-white border rounded-xl p-6'>
            <p className='text-sm font-semibold text-gray-700 mb-4'>Personal Details</p>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600'>
              <div>
                <p className='font-medium'>Full Name *</p>
                <input className='border rounded-lg w-full p-2 mt-1' value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <p className='font-medium'>Email *</p>
                <input type='email' className='border rounded-lg w-full p-2 mt-1' value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <p className='font-medium'>Phone</p>
                <input className='border rounded-lg w-full p-2 mt-1' value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <p className='font-medium'>DOB</p>
                <input type='date' className='border rounded-lg w-full p-2 mt-1' value={dob} onChange={e => setDob(e.target.value)} />
              </div>
              <div>
                <p className='font-medium'>Age</p>
                <input className='border rounded-lg w-full p-2 mt-1 bg-gray-50' value={age} readOnly />
              </div>
              <div>
                <p className='font-medium'>Gender</p>
                <select className='border rounded-lg w-full p-2 mt-1' value={gender} onChange={e => setGender(e.target.value)}>
                  <option>Not Selected</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <p className='font-medium'>Height (cm)</p>
                <input type='number' className='border rounded-lg w-full p-2 mt-1' value={height} onChange={e => setHeight(e.target.value)} />
              </div>
              <div>
                <p className='font-medium'>Weight (kg)</p>
                <input type='number' className='border rounded-lg w-full p-2 mt-1' value={weight} onChange={e => setWeight(e.target.value)} />
              </div>
              <div className='md:col-span-2'>
                <p className='font-medium'>Temporary Password *</p>
                <div className='flex gap-2 mt-1'>
                  <input className='border rounded-lg w-full p-2' value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type='button' onClick={generatePassword} className='px-3 py-2 border rounded-lg text-xs'>Generate</button>
                </div>
              </div>
              <div>
                <p className='font-medium'>Address Line 1</p>
                <input className='border rounded-lg w-full p-2 mt-1' value={address1} onChange={e => setAddress1(e.target.value)} />
              </div>
              <div>
                <p className='font-medium'>Address Line 2</p>
                <input className='border rounded-lg w-full p-2 mt-1' value={address2} onChange={e => setAddress2(e.target.value)} />
              </div>
            </div>
          </div>

          <div className='bg-white border rounded-xl p-6'>
            <p className='text-sm font-semibold text-gray-700 mb-4'>Appointment Details</p>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600'>
              <div>
                <p className='font-medium'>Doctor</p>
                <select className='border rounded-lg w-full p-2 mt-1' value={doctorId} onChange={e => setDoctorId(e.target.value)}>
                  <option value=''>Select Doctor</option>
                  {doctors.map(doc => (
                    <option key={doc._id} value={doc._id}>{doc.name} — {doc.speciality}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className='font-medium'>Consultant Fee</p>
                <input
                  className='border rounded-lg w-full p-2 mt-1 bg-gray-50'
                  value={selectedDoctor ? `${currency}${selectedDoctor.fees}` : ''}
                  readOnly
                />
              </div>
            </div>

            {doctorId && (
              <div className='mt-4'>
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
              </div>
            )}
          </div>
        </div>

        <div className='space-y-6'>
          <div className='bg-white border rounded-xl p-6'>
            <p className='text-sm font-semibold text-gray-700 mb-3'>Registration Summary</p>
            <div className='text-sm text-gray-600 space-y-2'>
              <div className='flex justify-between'><span>Name</span><span className='font-medium'>{name || '-'}</span></div>
              <div className='flex justify-between'><span>Phone</span><span className='font-medium'>{phone || '-'}</span></div>
              <div className='flex justify-between'><span>Age</span><span className='font-medium'>{age || '-'}</span></div>
              <div className='flex justify-between'><span>Doctor</span><span className='font-medium'>{selectedDoctor?.name || '-'}</span></div>
              <div className='flex justify-between'><span>Fee</span><span className='font-medium'>{selectedDoctor ? `${currency}${selectedDoctor.fees}` : `${currency}0`}</span></div>
              <div className='flex justify-between'><span>Slot</span><span className='font-medium'>{slotTime || '-'}</span></div>
            </div>
          </div>

          <div className='bg-white border rounded-xl p-6'>
            <p className='text-sm font-semibold text-gray-700 mb-3'>Patient ID</p>
            {createdId ? (
              <div className='text-sm text-green-600'>
                <span className='font-semibold'>{createdId}</span>
              </div>
            ) : (
              <p className='text-sm text-gray-400'>Not generated yet.</p>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

export default PatientRegistration
