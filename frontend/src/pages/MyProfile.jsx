import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const MyProfile = () => {

    const [isEdit, setIsEdit] = useState(false)
    const [image, setImage] = useState(false)
    const { token, backendUrl, userData, setUserData, loadUserProfileData } = useContext(AppContext)

    const handleCancel = async () => {
        setIsEdit(false)
        setImage(false)
        await loadUserProfileData()
    }

    // Function to update user profile data using API
    const updateUserProfileData = async () => {

        try {

            const formData = new FormData();

            formData.append('name', userData.name)
            formData.append('phone', userData.phone)
            formData.append('address', JSON.stringify(userData.address))
            formData.append('gender', userData.gender)
            formData.append('dob', userData.dob)

            image && formData.append('image', image)

            const { data } = await axios.post(
                backendUrl + '/api/user/update-profile',
                formData,
                { headers: { token } }
            )

            if (data.success) {
                toast.success(data.message)
                await loadUserProfileData()
                setIsEdit(false)
                setImage(false)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    return userData ? (
        <div className='max-w-5xl mx-auto px-4 py-6'>
            <div className='grid md:grid-cols-3 gap-6'>
                <div className='md:col-span-1'>
                    <div className='bg-white rounded-xl shadow-sm p-6 flex flex-col items-center gap-4'>
                        {isEdit ? (
                            <label htmlFor='image' className='cursor-pointer w-36'>
                                <div className='relative'>
                                    <img className='w-36 h-36 object-cover rounded-full opacity-80' src={image ? URL.createObjectURL(image) : userData.image} alt='Profile avatar' />
                                    {!image && (
                                        <img className='w-10 absolute bottom-2 right-2 bg-white/80 rounded-full p-1' src={assets.upload_icon} alt='Upload' />
                                    )}
                                </div>
                                <input onChange={(e) => setImage(e.target.files[0])} type='file' id='image' hidden />
                            </label>
                        ) : (
                            <img className='w-36 h-36 object-cover rounded-full' src={userData.image} alt='Profile avatar' />
                        )}

                        {isEdit ? (
                            <input
                                className='bg-gray-50 text-2xl font-semibold text-center rounded-md px-3 py-2'
                                type='text'
                                onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                                value={userData.name}
                            />
                        ) : (
                            <p className='font-semibold text-2xl text-[#262626]'>{userData.name}</p>
                        )}

                        <p className='text-blue-600 text-sm break-all'>{userData.email}</p>

                        {!isEdit ? (
                            <button onClick={() => setIsEdit(true)} className='border border-primary px-6 py-2 rounded-full hover:bg-primary hover:text-white transition-all'>Edit Profile</button>
                        ) : null}
                    </div>
                </div>

                <div className='md:col-span-2'>
                    <div className='bg-white rounded-xl shadow-sm p-6 mb-6'>
                        <p className='text-gray-700 font-medium mb-4'>Contact Information</p>
                        <div className='grid sm:grid-cols-2 gap-4 text-sm'>
                            <div className='flex flex-col gap-1'>
                                <label className='text-gray-500'>Phone</label>
                                {isEdit ? (
                                    <input
                                        className='bg-gray-50 rounded-md px-3 py-2'
                                        type='text'
                                        onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                                        value={userData.phone}
                                    />
                                ) : (
                                    <p className='text-blue-600'>{userData.phone || 'Not provided'}</p>
                                )}
                            </div>

                            <div className='flex flex-col gap-1'>
                                <label className='text-gray-500'>Address Line 1</label>
                                {isEdit ? (
                                    <input
                                        className='bg-gray-50 rounded-md px-3 py-2'
                                        type='text'
                                        onChange={(e) => setUserData(prev => ({ ...prev, address: { ...prev.address, line1: e.target.value } }))}
                                        value={userData.address?.line1 || ''}
                                    />
                                ) : (
                                    <p className='text-gray-600'>{userData.address?.line1 || '—'}</p>
                                )}
                            </div>

                            <div className='flex flex-col gap-1 sm:col-span-2'>
                                <label className='text-gray-500'>Address Line 2</label>
                                {isEdit ? (
                                    <input
                                        className='bg-gray-50 rounded-md px-3 py-2'
                                        type='text'
                                        onChange={(e) => setUserData(prev => ({ ...prev, address: { ...prev.address, line2: e.target.value } }))}
                                        value={userData.address?.line2 || ''}
                                    />
                                ) : (
                                    <p className='text-gray-600'>{userData.address?.line2 || '—'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className='bg-white rounded-xl shadow-sm p-6'>
                        <p className='text-gray-700 font-medium mb-4'>Basic Information</p>
                        <div className='grid sm:grid-cols-2 gap-4 text-sm'>
                            <div className='flex flex-col gap-1'>
                                <label className='text-gray-500'>Gender</label>
                                {isEdit ? (
                                    <select
                                        className='bg-gray-50 rounded-md px-3 py-2 max-w-40'
                                        onChange={(e) => setUserData(prev => ({ ...prev, gender: e.target.value }))}
                                        value={userData.gender}
                                    >
                                        <option value='Not Selected'>Not Selected</option>
                                        <option value='Male'>Male</option>
                                        <option value='Female'>Female</option>
                                    </select>
                                ) : (
                                    <p className='text-gray-600'>{userData.gender || 'Not Selected'}</p>
                                )}
                            </div>

                            <div className='flex flex-col gap-1'>
                                <label className='text-gray-500'>Birthday</label>
                                {isEdit ? (
                                    <input
                                        className='bg-gray-50 rounded-md px-3 py-2 max-w-44'
                                        type='date'
                                        onChange={(e) => setUserData(prev => ({ ...prev, dob: e.target.value }))}
                                        value={userData.dob}
                                    />
                                ) : (
                                    <p className='text-gray-600'>{userData.dob || '—'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className='flex items-center justify-end gap-3 mt-6'>
                        {isEdit ? (
                            <>
                                <button onClick={handleCancel} className='px-6 py-2 rounded-full border border-gray-300 hover:bg-gray-100 transition'>Cancel</button>
                                <button onClick={updateUserProfileData} className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all'>Save</button>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    ) : null
}

export default MyProfile