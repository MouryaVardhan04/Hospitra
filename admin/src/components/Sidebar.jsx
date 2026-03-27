import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import { NavLink } from 'react-router-dom'
import { DoctorContext } from '../context/DoctorContext'
import { AdminContext } from '../context/AdminContext'

const Sidebar = () => {

  const { dToken } = useContext(DoctorContext)
  const { aToken } = useContext(AdminContext)

  return (
    <aside className='min-h-screen bg-white border-r w-20 md:w-72 transition-all duration-200'>
      <div className='px-4 md:px-6 py-5 border-b'>
        <p className='hidden md:block text-sm font-semibold text-gray-700'>{aToken ? 'Admin' : 'Doctor'}</p>
        <p className='hidden md:block text-xs text-gray-400 mt-1'>Control Center</p>
      </div>

      {aToken && (
        <ul className='mt-4 px-2 md:px-4 space-y-2 text-[#515151]'>
          <NavLink to={'/admin-dashboard'} className={({ isActive }) => `group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-600'}`}>
            <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-white border'>
              <img className='w-5' src={assets.home_icon} alt='' />
            </span>
            <p className='hidden md:block'>Dashboard</p>
          </NavLink>
          <NavLink to={'/all-appointments'} className={({ isActive }) => `group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-600'}`}>
            <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-white border'>
              <img className='w-5' src={assets.appointment_icon} alt='' />
            </span>
            <p className='hidden md:block'>Appointments</p>
          </NavLink>
          <NavLink to={'/add-doctor'} className={({ isActive }) => `group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-600'}`}>
            <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-white border'>
              <img className='w-5' src={assets.add_icon} alt='' />
            </span>
            <p className='hidden md:block'>Add Doctor</p>
          </NavLink>
          <NavLink to={'/doctor-list'} className={({ isActive }) => `group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-600'}`}>
            <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-white border'>
              <img className='w-5' src={assets.people_icon} alt='' />
            </span>
            <p className='hidden md:block'>Doctors List</p>
          </NavLink>
          <NavLink to={'/lab-catalog'} className={({ isActive }) => `group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-600'}`}>
            <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-white border'>
              <img className='w-5' src={assets.list_icon} alt='' />
            </span>
            <p className='hidden md:block'>Lab Catalog</p>
          </NavLink>
          <NavLink to={'/fees-catalog'} className={({ isActive }) => `group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-600'}`}>
            <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-white border'>
              <img className='w-5' src={assets.list_icon} alt='' />
            </span>
            <p className='hidden md:block'>Fees Catalog</p>
          </NavLink>
        </ul>
      )}

      {dToken && (
        <ul className='mt-4 px-2 md:px-4 space-y-2 text-[#515151]'>
          <NavLink to={'/doctor-dashboard'} className={({ isActive }) => `group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-600'}`}>
            <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-white border'>
              <img className='w-5' src={assets.home_icon} alt='' />
            </span>
            <p className='hidden md:block'>Dashboard</p>
          </NavLink>
          <NavLink to={'/doctor-appointments'} className={({ isActive }) => `group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-600'}`}>
            <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-white border'>
              <img className='w-5' src={assets.appointment_icon} alt='' />
            </span>
            <p className='hidden md:block'>Appointments</p>
          </NavLink>
          <NavLink to={'/doctor-profile'} className={({ isActive }) => `group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-600'}`}>
            <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-white border'>
              <img className='w-5' src={assets.people_icon} alt='' />
            </span>
            <p className='hidden md:block'>Profile</p>
          </NavLink>
        </ul>
      )}
    </aside>
  )
}

export default Sidebar