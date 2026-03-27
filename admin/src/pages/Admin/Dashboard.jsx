import React, { useContext, useEffect } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const Dashboard = () => {

  const { aToken, getDashData, cancelAppointment, dashData } = useContext(AdminContext)
  const { slotDateFormat } = useContext(AppContext)

  useEffect(() => {
    if (aToken) {
      getDashData()
    }
  }, [aToken])

  return dashData && (
    <div className='m-5'>

      <div className='bg-white border rounded-xl p-5 mb-6'>
        <div className='mb-4'>
          <p className='text-lg font-semibold text-gray-700'>Dashboard Summary</p>
          <p className='text-sm text-gray-400'>Hospital modules overview (status only)</p>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div className='border rounded-xl p-4 bg-[#F8F9FD]'>
            <p className='font-semibold text-gray-700'>Reception</p>
            <p className='text-sm text-gray-400 mt-1'>Front desk operations</p>
            <span className='inline-block mt-3 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700'>Active</span>
          </div>
          <div className='border rounded-xl p-4 bg-[#F8F9FD]'>
            <p className='font-semibold text-gray-700'>Doctor Panel</p>
            <p className='text-sm text-gray-400 mt-1'>Appointments & profile</p>
            <span className='inline-block mt-3 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700'>Active</span>
          </div>
          <div className='border rounded-xl p-4 bg-[#F8F9FD]'>
            <p className='font-semibold text-gray-700'>Labs</p>
            <p className='text-sm text-gray-400 mt-1'>Diagnostics & tests</p>
            <span className='inline-block mt-3 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700'>Active</span>
          </div>
          <div className='border rounded-xl p-4 bg-[#F8F9FD]'>
            <p className='font-semibold text-gray-700'>Pharmacy</p>
            <p className='text-sm text-gray-400 mt-1'>Medicines & orders</p>
            <span className='inline-block mt-3 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700'>Active</span>
          </div>
        </div>
      </div>

      <div className='flex flex-wrap gap-3'>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.doctor_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.doctors}</p>
            <p className='text-gray-400'>Doctors</p>
          </div>
        </div>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.appointments_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.appointments}</p>
            <p className='text-gray-400'>Appointments</p>
          </div>
        </div>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.patients_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.patients}</p>
            <p className='text-gray-400'>Patients</p></div>
        </div>
      </div>

      <div className='bg-white'>
        <div className='flex items-center gap-2.5 px-4 py-4 mt-10 rounded-t border'>
          <img src={assets.list_icon} alt="" />
          <p className='font-semibold'>Latest Bookings</p>
        </div>

        <div className='pt-4 border border-t-0'>
          {dashData.latestAppointments.slice(0, 5).map((item, index) => (
            <div className='flex items-center px-6 py-3 gap-3 hover:bg-gray-100' key={index}>
              <img className='rounded-full w-10' src={item.docData.image} alt="" />
              <div className='flex-1 text-sm'>
                <p className='text-gray-800 font-medium'>{item.docData.name}</p>
                <p className='text-gray-600 '>Booking on {slotDateFormat(item.slotDate)}</p>
              </div>
              {item.cancelled ? <p className='text-red-400 text-xs font-medium'>Cancelled</p> : item.isCompleted ? <p className='text-green-500 text-xs font-medium'>Completed</p> : <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer' src={assets.cancel_icon} alt="" />}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default Dashboard