import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'
import axios from 'axios'

const DoctorProfile = () => {

    const { dToken, profileData, setProfileData, getProfileData } = useContext(DoctorContext)
    const { currency, backendUrl } = useContext(AppContext)
    const [isEdit, setIsEdit] = useState(false)

    const handleCancel = async () => {
        setIsEdit(false)
        await getProfileData()
    }

    const updateProfile = async () => {

        try {

            const updateData = {
                address: profileData.address,
                fees: profileData.fees,
                about: profileData.about,
                available: profileData.available
            }

            const { data } = await axios.post(backendUrl + '/api/doctor/update-profile', updateData, { headers: { dToken } })

            if (data.success) {
                toast.success(data.message)
                setIsEdit(false)
                getProfileData()
            } else {
                toast.error(data.message)
            }

            setIsEdit(false)

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    useEffect(() => {
        if (dToken) {
            getProfileData()
        }
    }, [dToken])

    return profileData && (
        <div className='max-w-6xl mx-auto px-4 py-6'>
            <div className='grid md:grid-cols-3 gap-6'>
                {/* Left: Doctor card */}
                <aside className='md:col-span-1'>
                    <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:sticky md:top-24'>
                        <img className='w-full rounded-lg object-cover bg-primary/80' src={profileData.image} alt={profileData.name} />
                        <p className='mt-4 text-2xl font-semibold text-gray-800'>{profileData.name}</p>
                        <div className='flex items-center gap-2 mt-1 text-gray-600'>
                            <p>{profileData.degree} - {profileData.speciality}</p>
                            <span className='py-0.5 px-2 border text-xs rounded-full'>{profileData.experience}</span>
                        </div>
                    </div>
                </aside>

                {/* Right: Editable details */}
                <main className='md:col-span-2'>
                    <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-6'>
                        {/* About */}
                        <div className='mb-6'>
                            <p className='text-gray-700 font-medium mb-2'>About</p>
                            {isEdit ? (
                                <textarea
                                    onChange={(e) => setProfileData(prev => ({ ...prev, about: e.target.value }))}
                                    className='w-full bg-gray-50 rounded-md px-3 py-2 outline-primary'
                                    rows={6}
                                    value={profileData.about || ''}
                                />
                            ) : (
                                <p className='text-sm text-gray-600'>{profileData.about}</p>
                            )}
                        </div>

                        {/* Fees */}
                        <div className='mb-6'>
                            <p className='text-gray-700 font-medium mb-2'>Appointment Fee</p>
                            {isEdit ? (
                                <div className='flex items-center gap-2'>
                                    <span className='text-gray-600'>{currency}</span>
                                    <input
                                        type='number'
                                        min='0'
                                        className='bg-gray-50 rounded-md px-3 py-2 w-32'
                                        onChange={(e) => setProfileData(prev => ({ ...prev, fees: e.target.value }))}
                                        value={profileData.fees}
                                    />
                                </div>
                            ) : (
                                <p className='text-gray-600'><span className='text-gray-800'>{currency}</span> {profileData.fees}</p>
                            )}
                        </div>

                        {/* Address */}
                        <div className='mb-6'>
                            <p className='text-gray-700 font-medium mb-2'>Address</p>
                            <div className='grid sm:grid-cols-2 gap-3'>
                                {isEdit ? (
                                    <>
                                        <input
                                            type='text'
                                            className='bg-gray-50 rounded-md px-3 py-2'
                                            placeholder='Line 1'
                                            onChange={(e) => setProfileData(prev => ({ ...prev, address: { ...(prev.address || {}), line1: e.target.value } }))}
                                            value={profileData.address?.line1 || ''}
                                        />
                                        <input
                                            type='text'
                                            className='bg-gray-50 rounded-md px-3 py-2'
                                            placeholder='Line 2'
                                            onChange={(e) => setProfileData(prev => ({ ...prev, address: { ...(prev.address || {}), line2: e.target.value } }))}
                                            value={profileData.address?.line2 || ''}
                                        />
                                    </>
                                ) : (
                                    <div className='sm:col-span-2 text-sm text-gray-600'>
                                        <p>{profileData.address?.line1}</p>
                                        <p>{profileData.address?.line2}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Availability */}
                        <div className='mb-6'>
                            <p className='text-gray-700 font-medium mb-2'>Availability</p>
                            <div className='flex items-center gap-3'>
                                <button
                                    type='button'
                                    onClick={() => isEdit && setProfileData(prev => ({ ...prev, available: !prev.available }))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${profileData.available ? 'bg-primary' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${profileData.available ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                                <span className='text-sm text-gray-600'>{profileData.available ? 'Available' : 'Unavailable'}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className='flex justify-end gap-3'>
                            {isEdit ? (
                                <>
                                    <button onClick={handleCancel} className='px-5 py-2 rounded-full border border-gray-300 hover:bg-gray-100'>Cancel</button>
                                    <button onClick={updateProfile} className='px-5 py-2 rounded-full border border-primary hover:bg-primary hover:text-white'>Save Changes</button>
                                </>
                            ) : (
                                <button onClick={() => setIsEdit(true)} className='px-5 py-2 rounded-full border border-primary hover:bg-primary hover:text-white'>Edit Profile</button>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default DoctorProfile