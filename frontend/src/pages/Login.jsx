import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const Login = () => {

  const [state, setState] = useState('Sign Up')
  const [didAuth, setDidAuth] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [profileImage, setProfileImage] = useState(null)
  const [profilePreview, setProfilePreview] = useState('')

  const navigate = useNavigate()
  const { backendUrl, token, setToken } = useContext(AppContext)

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (state === 'Sign Up') {
      if (!name || !email || !password || !phone || !dob || !gender || !height || !weight || !addressLine1 || !addressLine2) {
        toast.error('Please fill all profile details')
        return
      }

      const { data } = await axios.post(backendUrl + '/api/user/register', { name, email, password })

      if (data.success) {
        localStorage.setItem('token', data.token)
        setToken(data.token)
        setDidAuth(true)

        const formData = new FormData()
        formData.append('name', name)
        formData.append('phone', phone)
        formData.append('address', JSON.stringify({ line1: addressLine1, line2: addressLine2 }))
        formData.append('gender', gender)
        formData.append('dob', dob)
        formData.append('height', height)
        formData.append('weight', weight)
        if (profileImage) formData.append('image', profileImage)

        await axios.post(backendUrl + '/api/user/update-profile', formData, { headers: { token: data.token } })
      } else {
        toast.error(data.message)
      }

    } else {

      if (!email || !password) {
        toast.error('Enter email and password')
        return
      }

      const { data } = await axios.post(backendUrl + '/api/user/login', { email, password })

      if (data.success) {
        localStorage.setItem('token', data.token)
        setToken(data.token)
        setDidAuth(true)
      } else {
        toast.error(data.message)
      }

    }

  }

  useEffect(() => {
    if (didAuth && token) {
      navigate('/')
    }
  }, [didAuth, token])

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0] || null
    if (profilePreview) URL.revokeObjectURL(profilePreview)
    setProfileImage(file)
    setProfilePreview(file ? URL.createObjectURL(file) : '')
  }

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center py-10'>
      <div className='w-full max-w-5xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden md:grid md:grid-cols-[1fr_1.2fr]'>
        <div className='hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-primary via-[#5b6bff] to-[#22c55e] text-white'>
          <div>
            <p className='text-sm uppercase tracking-[0.3em] text-white/70'>Welcome</p>
            <h2 className='text-3xl font-semibold mt-3'>Your care, connected.</h2>
            <p className='text-sm text-white/80 mt-3'>Manage appointments, lab reports, and billing in one secure place.</p>
          </div>
          <div className='text-xs text-white/80'>
            <p>Trusted by thousands of patients and providers.</p>
          </div>
        </div>
        <div className='flex flex-col gap-4 p-8 sm:p-10 text-slate-600 text-sm'>
          <div>
            <p className='text-2xl font-semibold text-slate-800'>{state === 'Sign Up' ? 'Create Account' : 'Login'}</p>
            <p className='mt-1'>{state === 'Sign Up' ? 'Create your profile to get started.' : 'Welcome back. Please log in.'}</p>
          </div>
        {state === 'Sign Up' && (
          <>
            <div className='w-full flex flex-col items-center gap-2'>
              <p className='text-sm text-slate-500'>Profile Image (optional)</p>
              <label htmlFor='profile-image-input' className='h-24 w-24 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer overflow-hidden bg-slate-50'>
                {profilePreview
                  ? <img src={profilePreview} alt='Profile preview' className='h-full w-full object-cover' />
                  : <span className='text-3xl text-slate-400'>+</span>
                }
              </label>
              <input id='profile-image-input' onChange={handleProfileImageChange} className='hidden' type='file' accept='image/*' />
            </div>
            <div className='w-full grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='w-full '>
              <p>Full Name</p>
              <input onChange={(e) => setName(e.target.value)} value={name} className='border border-slate-200 rounded-lg w-full p-2.5 mt-1 bg-slate-50' type="text" />
            </div>
            <div className='w-full '>
              <p>Phone</p>
              <input onChange={(e) => setPhone(e.target.value)} value={phone} className='border border-slate-200 rounded-lg w-full p-2.5 mt-1 bg-slate-50' type="text" />
            </div>
            <div className='w-full '>
              <p>Email</p>
              <input onChange={(e) => setEmail(e.target.value)} value={email} className='border border-slate-200 rounded-lg w-full p-2.5 mt-1 bg-slate-50' type="email" />
            </div>
            <div className='w-full '>
              <p>Password</p>
              <input onChange={(e) => setPassword(e.target.value)} value={password} className='border border-slate-200 rounded-lg w-full p-2.5 mt-1 bg-slate-50' type="password" />
            </div>
            <div className='w-full '>
              <p>Date of Birth</p>
              <input onChange={(e) => setDob(e.target.value)} value={dob} className='border border-slate-200 rounded-lg w-full p-2.5 mt-1 bg-slate-50' type="date" />
            </div>
            <div className='w-full '>
              <p>Gender</p>
              <select onChange={(e) => setGender(e.target.value)} value={gender} className='border border-slate-200 rounded-lg w-full p-2.5 mt-1 bg-slate-50'>
                <option value=''>Select</option>
                <option value='Male'>Male</option>
                <option value='Female'>Female</option>
                <option value='Other'>Other</option>
              </select>
            </div>
            <div className='w-full '>
              <p>Height (cm)</p>
              <input onChange={(e) => setHeight(e.target.value)} value={height} className='border border-slate-200 rounded-lg w-full p-2.5 mt-1 bg-slate-50' type="number" />
            </div>
            <div className='w-full '>
              <p>Weight (kg)</p>
              <input onChange={(e) => setWeight(e.target.value)} value={weight} className='border border-slate-200 rounded-lg w-full p-2.5 mt-1 bg-slate-50' type="number" />
            </div>
            <div className='w-full '>
              <p>Address Line 1</p>
              <input onChange={(e) => setAddressLine1(e.target.value)} value={addressLine1} className='border border-slate-200 rounded-lg w-full p-2.5 mt-1 bg-slate-50' type="text" />
            </div>
            <div className='w-full '>
              <p>Address Line 2</p>
              <input onChange={(e) => setAddressLine2(e.target.value)} value={addressLine2} className='border border-slate-200 rounded-lg w-full p-2.5 mt-1 bg-slate-50' type="text" />
            </div>
          </div>
          </>
        )}
        {state !== 'Sign Up' && (
          <>
            <div className='w-full '>
              <p>Email</p>
              <input onChange={(e) => setEmail(e.target.value)} value={email} className='border border-slate-200 rounded-lg w-full p-2.5 mt-1 bg-slate-50' type="email" />
            </div>
            <div className='w-full '>
              <p>Password</p>
              <input onChange={(e) => setPassword(e.target.value)} value={password} className='border border-slate-200 rounded-lg w-full p-2.5 mt-1 bg-slate-50' type="password" />
            </div>
          </>
        )}
          <button className='bg-primary text-white w-full py-2.5 mt-2 rounded-full text-base font-medium hover:opacity-95 transition'>
            {state === 'Sign Up' ? 'Create Account' : 'Login'}
          </button>
          {state === 'Sign Up'
            ? <p className='text-sm'>Already have an account? <span onClick={() => { setState('Login'); }} className='text-primary underline cursor-pointer'>Login here</span></p>
            : <p className='text-sm'>Create an new account? <span onClick={() => { setState('Sign Up'); }} className='text-primary underline cursor-pointer'>Click here</span></p>
          }
        </div>
      </div>
    </form>
  )
}

export default Login