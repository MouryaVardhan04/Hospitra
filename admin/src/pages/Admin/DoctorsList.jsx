import React, { useContext, useEffect, useMemo, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'

const DoctorsList = () => {

  const { doctors, changeAvailability, aToken, getAllDoctors, updateDoctor } = useContext(AdminContext)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    docId: '',
    name: '',
    email: '',
    speciality: '',
    degree: '',
    experience: '',
    fees: '',
    about: '',
    address1: '',
    address2: ''
  })

  useEffect(() => {
    if (aToken) {
        getAllDoctors()
    }
}, [aToken])

  const selected = useMemo(() => doctors.find(d => d._id === editing), [doctors, editing])

  const openEdit = (doc) => {
    setEditing(doc._id)
    setForm({
      docId: doc._id,
      name: doc.name || '',
      email: doc.email || '',
      speciality: doc.speciality || '',
      degree: doc.degree || '',
      experience: doc.experience || '',
      fees: doc.fees ?? '',
      about: doc.about || '',
      address1: doc.address?.line1 || '',
      address2: doc.address?.line2 || ''
    })
  }

  const closeEdit = () => {
    setEditing(null)
  }

  const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const onSave = async (e) => {
    e.preventDefault()
    await updateDoctor({
      docId: form.docId,
      name: form.name,
      email: form.email,
      speciality: form.speciality,
      degree: form.degree,
      experience: form.experience,
      fees: form.fees,
      about: form.about,
      address: { line1: form.address1, line2: form.address2 }
    })
    closeEdit()
  }

  return (
    <div className='m-5 max-h-[90vh] overflow-y-scroll'>
      <h1 className='text-lg font-medium'>All Doctors</h1>
      <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6'>
        {doctors.map((item, index) => (
          <div className='border border-[#C9D8FF] rounded-xl max-w-56 overflow-hidden cursor-pointer group relative' key={index}>
            <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'>
              <button
                onClick={(e) => { e.preventDefault(); openEdit(item) }}
                className='bg-white border text-xs px-2 py-1 rounded-full shadow-sm hover:bg-gray-50'
              >
                Edit
              </button>
            </div>
            <img className='bg-[#EAEFFF] group-hover:bg-primary transition-all duration-500' src={item.image} alt="" />
            <div className='p-4'>
              <p className='text-[#262626] text-lg font-medium'>{item.name}</p>
              <p className='text-[#5C5C5C] text-sm'>{item.speciality}</p>
              <div className='mt-2 flex items-center gap-1 text-sm'>
                <input onChange={()=>changeAvailability(item._id)} type="checkbox" checked={item.available} />
                <p>Available</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && selected && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
          <form onSubmit={onSave} className='bg-white rounded-xl w-full max-w-3xl p-6'>
            <div className='flex items-center justify-between mb-4'>
              <p className='text-lg font-semibold text-gray-700'>Edit Doctor</p>
              <button type='button' onClick={closeEdit} className='text-gray-400 hover:text-gray-600'>✕</button>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600'>
              <div>
                <p className='font-medium'>Name</p>
                <input name='name' className='border rounded-lg w-full p-2 mt-1' value={form.name} onChange={onChange} required />
              </div>
              <div>
                <p className='font-medium'>Email</p>
                <input type='email' name='email' className='border rounded-lg w-full p-2 mt-1' value={form.email} onChange={onChange} required />
              </div>
              <div>
                <p className='font-medium'>Speciality</p>
                <input name='speciality' className='border rounded-lg w-full p-2 mt-1' value={form.speciality} onChange={onChange} required />
              </div>
              <div>
                <p className='font-medium'>Degree</p>
                <input name='degree' className='border rounded-lg w-full p-2 mt-1' value={form.degree} onChange={onChange} required />
              </div>
              <div>
                <p className='font-medium'>Experience</p>
                <input name='experience' className='border rounded-lg w-full p-2 mt-1' value={form.experience} onChange={onChange} required />
              </div>
              <div>
                <p className='font-medium'>Fees</p>
                <input type='number' name='fees' className='border rounded-lg w-full p-2 mt-1' value={form.fees} onChange={onChange} required />
              </div>
              <div className='md:col-span-2'>
                <p className='font-medium'>About</p>
                <textarea name='about' className='border rounded-lg w-full p-2 mt-1' rows={3} value={form.about} onChange={onChange} required />
              </div>
              <div>
                <p className='font-medium'>Address Line 1</p>
                <input name='address1' className='border rounded-lg w-full p-2 mt-1' value={form.address1} onChange={onChange} />
              </div>
              <div>
                <p className='font-medium'>Address Line 2</p>
                <input name='address2' className='border rounded-lg w-full p-2 mt-1' value={form.address2} onChange={onChange} />
              </div>
            </div>
            <div className='flex justify-end gap-3 mt-5'>
              <button type='button' onClick={closeEdit} className='px-4 py-2 border rounded-lg text-sm'>Cancel</button>
              <button type='submit' className='px-6 py-2 bg-primary text-white rounded-lg text-sm'>Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default DoctorsList