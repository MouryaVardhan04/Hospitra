import React from 'react'
import { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

const DoctorAppointments = () => {

  const { dToken, appointments, getAppointments, cancelAppointment, acceptAppointment, completeAppointment } = useContext(DoctorContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  const [search, setSearch] = useState('')
  const [dayFilter, setDayFilter] = useState('all')

  useEffect(() => {
    if (dToken) {
      getAppointments()
    }
  }, [dToken])

  useEffect(() => {
    const pendingCount = appointments.filter(a => !a.cancelled && !a.isCompleted && !a.isAccepted).length
    localStorage.setItem('doctorPendingAppointments', String(pendingCount))
  }, [appointments])

  const matchesDayFilter = (item) => {
    if (dayFilter === 'all') return true
    if (!item?.slotDate) return false
    const [day, month, year] = item.slotDate.split('_').map(Number)
    const apptDate = new Date(year, month - 1, day)
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const target = new Date(start)
    if (dayFilter === 'today') target.setDate(start.getDate())
    if (dayFilter === 'tomorrow') target.setDate(start.getDate() + 1)
    if (dayFilter === 'dayAfter') target.setDate(start.getDate() + 2)
    return apptDate.getTime() === target.getTime()
  }

  const filteredAppointments = appointments.filter((item) => {
    if (!matchesDayFilter(item)) return false
    const term = search.trim().toLowerCase()
    if (!term) return true
    const name = item?.userData?.name?.toLowerCase() || ''
    const email = item?.userData?.email?.toLowerCase() || ''
    const phone = item?.userData?.phone?.toLowerCase() || ''
    return name.includes(term) || email.includes(term) || phone.includes(term)
  })

  return (
    <div className='w-full max-w-6xl m-5 '>

      <div className='flex flex-wrap items-center justify-between gap-3 mb-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <p className='text-lg font-medium'>All Appointments</p>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setDayFilter('today')}
              className={`px-3 py-1.5 rounded-full text-xs border transition ${dayFilter === 'today' ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Today
            </button>
            <button
              onClick={() => setDayFilter('tomorrow')}
              className={`px-3 py-1.5 rounded-full text-xs border transition ${dayFilter === 'tomorrow' ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Tomorrow
            </button>
            <button
              onClick={() => setDayFilter('dayAfter')}
              className={`px-3 py-1.5 rounded-full text-xs border transition ${dayFilter === 'dayAfter' ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Day After
            </button>
            <button
              onClick={() => setDayFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs border transition ${dayFilter === 'all' ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              All
            </button>
          </div>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search patient name, email, phone'
          className='text-sm px-3 py-2 border rounded-lg w-72 max-w-full focus:outline-primary'
        />
      </div>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 py-3 px-6 border-b'>
          <p>#</p>
          <p>Patient</p>
          <p>Payment</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Fees</p>
          <p>Action</p>
        </div>
        {filteredAppointments.map((item, index) => (
          <div className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
            <p className='max-sm:hidden'>{index}</p>
            <div className='flex items-center gap-2'>
              <img src={item.userData.image} className='w-8 rounded-full' alt="" /> <p>{item.userData.name}</p>
            </div>
            <div>
              <p className='text-xs inline border border-primary px-2 rounded-full'>
                {item.payment?'Online':'CASH'}
              </p>
            </div>
            <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>
            <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
            <p>{currency}{item.amount}</p>
            {item.cancelled
              ? <p className='text-red-400 text-xs font-medium'>Cancelled</p>
              : item.isCompleted
                ? <p className='text-green-500 text-xs font-medium'>Completed</p>
                : item.isAccepted
                  ? <div className='flex'>
                    <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer' src={assets.cancel_icon} alt="" />
                    <img onClick={() => completeAppointment(item._id)} className='w-10 cursor-pointer' src={assets.tick_icon} alt="" />
                  </div>
                  : <div className='flex items-center gap-2'>
                    <button onClick={() => acceptAppointment(item._id)} className='px-3 py-1.5 text-xs rounded border border-primary text-primary hover:bg-primary hover:text-white transition'>Accept</button>
                    <button onClick={() => cancelAppointment(item._id)} className='px-3 py-1.5 text-xs rounded border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition'>Reject</button>
                  </div>
            }
          </div>
        ))}
      </div>

    </div>
  )
}

export default DoctorAppointments