import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'
import axios from 'axios'
import { toast } from 'react-toastify'

const Appointment = () => {

    const { docId } = useParams()
    const { doctors, currencySymbol, backendUrl, token, getDoctosData } = useContext(AppContext)
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

    // Format helpers for live date/month/year/time display
    const formatDayChip = (d) => {
        if (!d) return ''
        const day = d.getDate().toString().padStart(2, '0')
        const month = new Intl.DateTimeFormat(undefined, { month: 'short' }).format(d)
        return `${day} ${month}`
    }

    const formatFullDate = (d) => {
        if (!d) return ''
        return new Intl.DateTimeFormat(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        }).format(d)
    }

    const [docInfo, setDocInfo] = useState(false)
    const [docSlots, setDocSlots] = useState([])
    const [slotIndex, setSlotIndex] = useState(0)
    const [slotTime, setSlotTime] = useState('')

    const navigate = useNavigate()

    const fetchDocInfo = async () => {
        const docInfo = doctors.find((doc) => doc._id === docId)
        setDocInfo(docInfo)
    }

    const getAvailableSolts = async () => {

        setDocSlots([])

        // getting current date
        let today = new Date()

        for (let i = 0; i < 7; i++) {

            // getting date with index 
            let currentDate = new Date(today)
            currentDate.setDate(today.getDate() + i)

            // setting end time of the date with index
            let endTime = new Date()
            endTime.setDate(today.getDate() + i)
            endTime.setHours(21, 0, 0, 0)

            // setting hours 
            if (today.getDate() === currentDate.getDate()) {
                currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10)
                currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0)
            } else {
                currentDate.setHours(10)
                currentDate.setMinutes(0)
            }

            let timeSlots = [];


            while (currentDate < endTime) {
                let formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

                let day = currentDate.getDate()
                let month = currentDate.getMonth() + 1
                let year = currentDate.getFullYear()

                const slotDate = day + "_" + month + "_" + year
                const slotTime = formattedTime

                const isSlotAvailable = docInfo.slots_booked[slotDate] && docInfo.slots_booked[slotDate].includes(slotTime) ? false : true

                if (isSlotAvailable) {

                    // Add slot to array
                    timeSlots.push({
                        datetime: new Date(currentDate),
                        time: formattedTime
                    })
                }

                // Increment current time by 30 minutes
                currentDate.setMinutes(currentDate.getMinutes() + 30);
            }

            setDocSlots(prev => ([...prev, timeSlots]))

        }

    }

    const bookAppointment = async () => {

        if (!token) {
            toast.warning('Login to book appointment')
            return navigate('/login')
        }

        // Ensure a specific slot is chosen and use its exact datetime
        const selected = docSlots[slotIndex]?.find(s => s.time === slotTime)
        if (!selected) {
            toast.warning('Please select a time slot')
            return
        }
        const date = selected.datetime

        let day = date.getDate()
        let month = date.getMonth() + 1
        let year = date.getFullYear()

        const slotDate = day + "_" + month + "_" + year

        try {

            const { data } = await axios.post(backendUrl + '/api/user/book-appointment', { docId, slotDate, slotTime }, { headers: { token } })
            if (data.success) {
                toast.success(data.message)
                getDoctosData()
                navigate('/my-appointments')
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    useEffect(() => {
        if (doctors.length > 0) {
            fetchDocInfo()
        }
    }, [doctors, docId])

    useEffect(() => {
        if (docInfo) {
            getAvailableSolts()
        }
    }, [docInfo])

    return docInfo ? (
        <div className='max-w-5xl mx-auto px-4 py-6'>
            <div className='grid md:grid-cols-3 gap-6'>
                {/* Left: Doctor Card (sticky) */}
                <aside className='md:col-span-1'>
                    <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:sticky md:top-24'>
                        <img className='w-full rounded-lg object-cover bg-primary' src={docInfo.image} alt={docInfo.name} />
                        <p className='flex items-center gap-2 text-2xl font-semibold text-gray-800 mt-4'>
                            {docInfo.name}
                            <img className='w-5' src={assets.verified_icon} alt='Verified' />
                        </p>
                        <div className='flex items-center gap-2 mt-1 text-gray-600'>
                            <p>{docInfo.degree} - {docInfo.speciality}</p>
                            <span className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</span>
                        </div>
                        <div className='mt-3'>
                            <p className='flex items-center gap-1 text-sm font-medium text-[#262626]'>About <img className='w-3' src={assets.info_icon} alt='Info' /></p>
                            <p className='text-sm text-gray-600 mt-1'>{docInfo.about}</p>
                        </div>
                        <p className='text-gray-600 font-medium mt-4'>
                            Appointment fee: <span className='text-gray-900'>{currencySymbol}{docInfo.fees}</span>
                        </p>
                    </div>
                </aside>

                {/* Right: Booking */}
                <main className='md:col-span-2'>
                    <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-6'>
                        <p className='font-medium text-gray-700'>Select a date</p>
                        <div className='flex gap-3 items-center w-full overflow-x-auto mt-4 pb-1'>
                            {docSlots.length > 0 && docSlots.map((item, index) => (
                                <button
                                    type='button'
                                    onClick={() => setSlotIndex(index)}
                                    key={index}
                                    className={`text-center py-3 px-4 min-w-24 rounded-full whitespace-nowrap transition ${slotIndex === index ? 'bg-primary text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <p className='text-xs'>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                                    <p className='text-sm font-medium'>{item[0] && formatDayChip(item[0].datetime)}</p>
                                </button>
                            ))}
                        </div>

                        <p className='font-medium text-gray-700 mt-6'>Select a time</p>
                        <div className='flex flex-wrap gap-2 w-full mt-3'>
                            {docSlots.length > 0 && docSlots[slotIndex]?.map((item, index) => (
                                <button
                                    type='button'
                                    onClick={() => setSlotTime(item.time)}
                                    key={index}
                                    className={`text-sm px-4 py-2 rounded-full transition ${item.time === slotTime ? 'bg-primary text-white' : 'text-[#555] border border-[#B4B4B4] hover:bg-gray-50'}`}
                                >
                                    {item.time}
                                </button>
                            ))}
                        </div>

                        {/* Live selection summary */}
                        {slotTime && docSlots[slotIndex] && (() => {
                            const sel = docSlots[slotIndex].find(s => s.time === slotTime)
                            if (!sel) return null
                            return (
                                <p className='mt-4 text-sm text-gray-700'>
                                    Selected: <span className='font-medium'>{formatFullDate(sel.datetime)}</span> at <span className='font-medium'>{sel.time}</span>
                                </p>
                            )
                        })()}

                        <button
                            onClick={bookAppointment}
                            disabled={!slotTime}
                            className={`mt-6 w-full sm:w-auto bg-primary text-white text-sm font-medium px-6 py-3 rounded-full ${!slotTime ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'}`}
                        >
                            Book an appointment
                        </button>
                    </div>

                    {/* Related Doctors */}
                    <div className='mt-8'>
                        <RelatedDoctors speciality={docInfo.speciality} docId={docId} />
                    </div>
                </main>
            </div>
        </div>
    ) : null
}

export default Appointment