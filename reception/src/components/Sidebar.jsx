import React from 'react'
import { assets } from '../assets/assets'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {

  return (
    <aside className='min-h-screen bg-white border-r w-20 md:w-72 transition-all duration-200'>
      <div className='px-4 md:px-6 py-5 border-b'>
        <p className='hidden md:block text-sm font-semibold text-gray-700'>Reception</p>
        <p className='hidden md:block text-xs text-gray-400 mt-1'>Operations Hub</p>
      </div>

      <ul className='mt-4 px-2 md:px-4 space-y-2 text-[#515151]'>
        <NavLink
          to={'/reception-dashboard'}
          className={({ isActive }) => `group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-600'}`}
        >
          <span className={`flex items-center justify-center w-9 h-9 rounded-lg ${'bg-white border'}`}>
            <img className='w-5' src={assets.home_icon} alt='' />
          </span>
          <p className='hidden md:block'>Dashboard</p>
        </NavLink>

        <NavLink
          to={'/patient-registration'}
          className={({ isActive }) => `group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-600'}`}
        >
          <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-white border'>
            <img className='w-5' src={assets.add_icon} alt='' />
          </span>
          <p className='hidden md:block'>Patient Registration</p>
        </NavLink>

        <NavLink
          to={'/appointment-booking'}
          className={({ isActive }) => `group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-600'}`}
        >
          <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-white border'>
            <img className='w-5' src={assets.appointment_icon} alt='' />
          </span>
          <p className='hidden md:block'>Appointment Booking</p>
        </NavLink>

        <NavLink
          to={'/lab-assignment'}
          className={({ isActive }) => `group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-600'}`}
        >
          <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-white border'>
            <img className='w-5' src={assets.list_icon} alt='' />
          </span>
          <p className='hidden md:block'>Lab Assignment</p>
        </NavLink>

        <NavLink
          to={'/billing-initiation'}
          className={({ isActive }) => `group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-600'}`}
        >
          <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-white border'>
            <img className='w-5' src={assets.earning_icon} alt='' />
          </span>
          <p className='hidden md:block'>Billing & Surgery</p>
        </NavLink>

        <NavLink
          to={'/consultation-orders'}
          className={({ isActive }) => `group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-600'}`}
        >
          <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-white border'>
            <img className='w-5' src={assets.list_icon} alt='' />
          </span>
          <p className='hidden md:block'>Consultation Orders</p>
        </NavLink>

        <NavLink
          to={'/queue-management'}
          className={({ isActive }) => `group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-600'}`}
        >
          <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-white border'>
            <img className='w-5' src={assets.people_icon} alt='' />
          </span>
          <p className='hidden md:block'>Queue Management</p>
        </NavLink>
      </ul>
    </aside>
  )
}

export default Sidebar