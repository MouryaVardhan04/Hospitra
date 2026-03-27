import React, { useContext } from 'react'
import { NavLink } from 'react-router-dom'
import { LabsContext } from '../context/LabsContext'

const Sidebar = () => {
  const { labsToken } = useContext(LabsContext)

  if (!labsToken) return null

  const navClass = ({ isActive }) =>
    `group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-600'}`

  return (
    <aside className='min-h-screen bg-white border-r w-20 md:w-72 transition-all duration-200'>
      <div className='px-4 md:px-6 py-5 border-b'>
        <p className='hidden md:block text-sm font-semibold text-gray-700'>Labs</p>
        <p className='hidden md:block text-xs text-gray-400 mt-1'>Diagnostics Center</p>
      </div>

      <ul className='mt-4 px-2 md:px-4 space-y-2'>
        <NavLink to='/labs-dashboard' className={navClass}>
          <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-white border'>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5' fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </span>
          <p className='hidden md:block'>Dashboard</p>
        </NavLink>

        <NavLink to='/bookings' className={navClass}>
          <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-white border'>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5' fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </span>
          <p className='hidden md:block'>Bookings</p>
        </NavLink>

        <NavLink to='/samples-collected' className={navClass}>
          <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-white border'>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5' fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <p className='hidden md:block'>In Process</p>
        </NavLink>

        <NavLink to='/reports' className={navClass}>
          <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-white border'>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5' fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6m4 0a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14z" />
            </svg>
          </span>
          <p className='hidden md:block'>Reports</p>
        </NavLink>

        <NavLink to='/all-reports' className={navClass}>
          <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-white border'>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5' fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6m4 0a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14z" />
            </svg>
          </span>
          <p className='hidden md:block'>All Reports</p>
        </NavLink>

        <NavLink to='/generate-report' className={navClass}>
          <span className='flex items-center justify-center w-9 h-9 rounded-lg bg-white border'>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5' fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </span>
          <p className='hidden md:block'>Generate Report</p>
        </NavLink>
      </ul>
    </aside>
  )
}

export default Sidebar