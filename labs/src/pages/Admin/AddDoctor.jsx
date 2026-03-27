import React, { useContext, useState } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'
import { LabsContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const CATEGORIES = ['Blood', 'Urine', 'Stool', 'Imaging', 'Cardiac', 'Hormonal', 'Allergy', 'Other']
const SAMPLE_TYPES = ['Blood', 'Urine', 'Stool', 'Saliva', 'Swab', 'Imaging']

const AddTest = () => {

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('Blood')
    const [price, setPrice] = useState('')
    const [turnaroundTime, setTurnaroundTime] = useState('')
    const [sampleType, setSampleType] = useState('Blood')
    const [homeCollection, setHomeCollection] = useState(false)

    const { backendUrl } = useContext(AppContext)
    const { labsToken, getDashData } = useContext(LabsContext)

    const onSubmitHandler = async (event) => {
        event.preventDefault()

        try {
            const payload = {
                name,
                description,
                category,
                price: Number(price),
                turnaroundTime,
                sampleType,
                homeCollection
            }

            const { data } = await axios.post(backendUrl + '/api/labs/add-test', payload, { headers: { labstoken: labsToken } })
            if (data.success) {
                toast.success(data.message)
                getDashData()
                setName('')
                setDescription('')
                setCategory('Blood')
                setPrice('')
                setTurnaroundTime('')
                setSampleType('Blood')
                setHomeCollection(false)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }

    }

    return (
        <form onSubmit={onSubmitHandler} className='m-5 w-full max-w-4xl'>

            <p className='mb-4 text-xl font-semibold text-gray-700'>Add New Lab Test</p>

            <div className='bg-white px-8 py-8 border rounded-xl max-h-[80vh] overflow-y-scroll'>

                <div className='flex flex-col lg:flex-row gap-8 text-gray-600'>

                    <div className='w-full lg:flex-1 flex flex-col gap-4'>

                        <div className='flex flex-col gap-1'>
                            <p className='text-sm font-medium'>Test Name *</p>
                            <input onChange={e => setName(e.target.value)} value={name} className='border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-400 outline-none' type="text" placeholder='e.g. CBC, HbA1c' required />
                        </div>

                        <div className='flex flex-col gap-1'>
                            <p className='text-sm font-medium'>Category *</p>
                            <select onChange={e => setCategory(e.target.value)} value={category} className='border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-400 outline-none'>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className='flex flex-col gap-1'>
                            <p className='text-sm font-medium'>Price (₹) *</p>
                            <input onChange={e => setPrice(e.target.value)} value={price} className='border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-400 outline-none' type="number" placeholder='e.g. 800' min={0} required />
                        </div>

                        <div className='flex flex-col gap-1'>
                            <p className='text-sm font-medium'>Turnaround Time *</p>
                            <input onChange={e => setTurnaroundTime(e.target.value)} value={turnaroundTime} className='border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-400 outline-none' type="text" placeholder='e.g. 24 hours' required />
                        </div>

                    </div>

                    <div className='w-full lg:flex-1 flex flex-col gap-4'>

                        <div className='flex flex-col gap-1'>
                            <p className='text-sm font-medium'>Sample Type</p>
                            <select onChange={e => setSampleType(e.target.value)} value={sampleType} className='border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-400 outline-none'>
                                {SAMPLE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div className='flex items-center gap-3 mt-2'>
                            <button
                                type='button'
                                onClick={() => setHomeCollection(!homeCollection)}
                                className={`w-10 h-6 rounded-full transition-colors ${homeCollection ? 'bg-violet-600' : 'bg-gray-300'} relative`}
                            >
                                <span className={`block w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${homeCollection ? 'translate-x-5' : 'translate-x-1'}`}></span>
                            </button>
                            <div>
                                <p className='text-sm font-medium text-gray-700'>Home Collection</p>
                                <p className='text-xs text-gray-400'>Sample can be collected at patient location</p>
                            </div>
                        </div>

                    </div>
                </div>

                <div className='mt-5'>
                    <p className='text-sm font-medium text-gray-600 mb-1'>Description *</p>
                    <textarea onChange={e => setDescription(e.target.value)} value={description} className='w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-violet-400 outline-none' rows={4} placeholder='Brief description of the test, preparation, and notes...' required></textarea>
                </div>

                <button type='submit' className='mt-4 bg-violet-600 hover:bg-violet-700 text-white px-10 py-3 rounded-full text-sm font-medium transition-colors'>
                    Add Test
                </button>
            </div>
        </form>
    )
}

export default AddTest