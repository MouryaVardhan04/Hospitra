import axios from 'axios'
import React, { useContext, useState } from 'react'
import { PharmacyContext } from '../context/PharmacyContext'
import { toast } from 'react-toastify'

const Login = () => {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const backendUrl = import.meta.env.VITE_BACKEND_URL
  const { setPharmToken } = useContext(PharmacyContext)

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    try {
      const { data } = await axios.post(backendUrl + '/api/pharmacy/login', { email, password })
      if (data.success) {
        setPharmToken(data.token)
        localStorage.setItem('pharmToken', data.token)
        toast.success('Welcome, Pharmacy Admin!')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className='min-h-[100vh] flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100'>
      <form onSubmit={onSubmitHandler} className='bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm'>
        <div className='flex flex-col items-center mb-6'>
          <div className='w-14 h-14 bg-emerald-600 rounded-xl flex items-center justify-center mb-3'>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-8 h-8 text-white' fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className='text-2xl font-bold text-gray-800'>Pharmacy Admin</h2>
          <p className='text-gray-500 text-sm mt-1'>HOSPITRA Pharmacy Portal</p>
        </div>

        <div className='flex flex-col gap-4'>
          <div>
            <label className='text-sm font-medium text-gray-700 block mb-1'>Email</label>
            <input
              onChange={(e) => setEmail(e.target.value)} value={email}
              className='border border-gray-300 rounded-lg w-full p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm'
              type="email" placeholder='pharmacy@hospital.com' required
            />
          </div>
          <div>
            <label className='text-sm font-medium text-gray-700 block mb-1'>Password</label>
            <input
              onChange={(e) => setPassword(e.target.value)} value={password}
              className='border border-gray-300 rounded-lg w-full p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm'
              type="password" placeholder='••••••••' required
            />
          </div>
          <button className='bg-emerald-600 hover:bg-emerald-700 text-white w-full py-2.5 rounded-lg text-sm font-medium transition-colors mt-2'>
            Sign In
          </button>
        </div>
      </form>
    </div>
  )
}

export default Login