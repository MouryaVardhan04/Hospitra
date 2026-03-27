import React, { useContext } from 'react'
import { LabsContext } from '../context/LabsContext'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'

const Navbar = () => {

  const { labsToken, setLabsToken } = useContext(LabsContext)
  const navigate = useNavigate()

  const logout = () => {
    navigate('/')
    setLabsToken('')
    localStorage.removeItem('labsToken')
  }

  return (
    <div className='flex justify-between items-center px-4 sm:px-10 py-3 border-b bg-white shadow-sm'>
      <div className='flex items-center gap-3'>
        <div className='flex items-center gap-2'>
          <img src={assets.admin_logo} alt='Hospitra Logo' className='w-36 sm:w-40 cursor-pointer' />
        </div>
        <span className='border border-violet-600 text-violet-700 text-xs px-2.5 py-0.5 rounded-full font-medium'>Labs Admin</span>
      </div>
      {labsToken && (
        <button onClick={logout} className='bg-violet-600 hover:bg-violet-700 text-white text-sm px-8 py-2 rounded-full transition-colors'>
          Logout
        </button>
      )}
    </div>
  )
}

export default Navbar