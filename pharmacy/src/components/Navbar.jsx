import React, { useContext } from 'react'
import { PharmacyContext } from '../context/PharmacyContext'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'

const Navbar = () => {

  const { pharmToken, setPharmToken } = useContext(PharmacyContext)
  const navigate = useNavigate()

  const logout = () => {
    navigate('/')
    setPharmToken('')
    localStorage.removeItem('pharmToken')
  }

  return (
    <div className='flex justify-between items-center px-4 sm:px-10 py-3 border-b bg-white shadow-sm'>
      <div className='flex items-center gap-3'>
        <div className='flex items-center gap-2'>
          <img src={assets.admin_logo} alt='Hospitra Logo' className='w-36 sm:w-40 cursor-pointer' />
        </div>
        <span className='border border-emerald-600 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-medium'>Pharmacy Admin</span>
      </div>
      {pharmToken && (
        <button onClick={logout} className='bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-8 py-2 rounded-full transition-colors'>
          Logout
        </button>
      )}
    </div>
  )
}

export default Navbar