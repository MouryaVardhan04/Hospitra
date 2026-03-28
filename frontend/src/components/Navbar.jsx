import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const Navbar = () => {

  const navigate = useNavigate()

  const [showMenu, setShowMenu] = useState(false)
  const { token, setToken, userData } = useContext(AppContext)

  const logout = () => {
    localStorage.removeItem('token')
    setToken(false)
    navigate('/login')
  }

  return (
    <div className='sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200'>
      <div className='max-w-6xl mx-auto flex items-center justify-between px-4 py-4'>
        {/* Logo */}
        <img onClick={() => navigate('/')} className='w-40 cursor-pointer' src={assets.logo} alt='Logo' />

        {/* Desktop Nav */}
        <ul className='md:flex items-center gap-6 font-medium hidden text-sm'>
          <NavLink to='/' className={({ isActive }) => `py-1 transition-colors ${isActive ? 'text-primary' : 'text-slate-600'}`}>
            HOME
          </NavLink>
          <NavLink to='/doctors' className={({ isActive }) => `py-1 transition-colors ${isActive ? 'text-primary' : 'text-slate-600'}`}>
            ALL DOCTORS
          </NavLink>
          <NavLink to='/about' className={({ isActive }) => `py-1 transition-colors ${isActive ? 'text-primary' : 'text-slate-600'}`}>
            ABOUT
          </NavLink>
          <NavLink to='/contact' className={({ isActive }) => `py-1 transition-colors ${isActive ? 'text-primary' : 'text-slate-600'}`}>
            CONTACT
          </NavLink>
        </ul>

        {/* Actions */}
        <div className='flex items-center gap-4'>
          {token && userData ? (
            <div className='flex items-center gap-2 cursor-pointer group relative'>
              <img className='w-10 h-10 rounded-full object-cover border border-gray-200' src={userData.image} alt='Avatar' />
              <img className='w-2.5' src={assets.dropdown_icon} alt='Menu' />
              <div className='absolute top-0 right-0 pt-12 text-base font-medium text-gray-700 z-20 hidden group-hover:block'>
                <div className='min-w-48 bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col gap-3 p-4'>
                  <p onClick={() => navigate('/my-profile')} className='hover:text-black cursor-pointer'>My Profile</p>
                  <p onClick={() => navigate('/my-appointments')} className='hover:text-black cursor-pointer'>My Appointments</p>
                  <p onClick={() => navigate('/my-reports')} className='hover:text-black cursor-pointer'>My Reports</p>
                  <p onClick={logout} className='hover:text-black cursor-pointer'>Logout</p>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className='bg-primary text-white px-6 py-2 rounded-full font-medium shadow-sm hidden md:block hover:opacity-90'>Create account</button>
          )}

          {/* Mobile trigger */}
          <img onClick={() => setShowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt='Open menu' />
        </div>
      </div>

      {/* Mobile overlay + drawer */}
      {/* Overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-black/30 transition-opacity ${showMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setShowMenu(false)}
      />

      {/* Drawer */}
      <div
        className={`md:hidden fixed right-0 top-0 h-full w-72 bg-white shadow-xl transition-transform z-30 ${showMenu ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className='flex items-center justify-between px-5 py-6 border-b border-gray-200'>
          <img src={assets.logo} className='w-32' alt='Logo' />
          <img onClick={() => setShowMenu(false)} src={assets.cross_icon} className='w-7' alt='Close' />
        </div>
        <ul className='flex flex-col gap-3 mt-5 px-5 text-base font-medium'>
          <NavLink onClick={() => setShowMenu(false)} to='/' className='px-4 py-2 rounded-full hover:bg-gray-100'>HOME</NavLink>
          <NavLink onClick={() => setShowMenu(false)} to='/doctors' className='px-4 py-2 rounded-full hover:bg-gray-100'>ALL DOCTORS</NavLink>
          <NavLink onClick={() => setShowMenu(false)} to='/about' className='px-4 py-2 rounded-full hover:bg-gray-100'>ABOUT</NavLink>
          <NavLink onClick={() => setShowMenu(false)} to='/contact' className='px-4 py-2 rounded-full hover:bg-gray-100'>CONTACT</NavLink>
        </ul>

        <div className='px-5 mt-6'>
          {token && userData ? (
            <div className='flex flex-col gap-2'>
              <button onClick={() => { setShowMenu(false); navigate('/my-profile'); }} className='px-4 py-2 rounded-full border hover:bg-gray-100'>My Profile</button>
              <button onClick={() => { setShowMenu(false); navigate('/my-appointments'); }} className='px-4 py-2 rounded-full border hover:bg-gray-100'>My Appointments</button>
              <button onClick={() => { setShowMenu(false); navigate('/my-reports'); }} className='px-4 py-2 rounded-full border hover:bg-gray-100'>My Reports</button>
              <button onClick={() => { setShowMenu(false); logout(); }} className='px-4 py-2 rounded-full border hover:bg-gray-100'>Logout</button>
            </div>
          ) : (
            <button onClick={() => { setShowMenu(false); navigate('/login'); }} className='bg-primary text-white px-4 py-2 rounded-full w-full'>Create account</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Navbar