import React, { useContext, useState } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'
import { PharmacyContext } from '../../context/PharmacyContext'
import { AppContext } from '../../context/AppContext'

const CATEGORIES = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Supplement', 'Other']

const AddMedicine = () => {

    const [mode, setMode] = useState('add')
    const [medImg, setMedImg] = useState(false)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('Tablet')
    const [price, setPrice] = useState('')
    const [stock, setStock] = useState('')
    const [requiresPrescription, setRequiresPrescription] = useState(false)
    const [manufacturer, setManufacturer] = useState('')
    const [dosage, setDosage] = useState('')
    const [selectedId, setSelectedId] = useState('')

    const { backendUrl } = useContext(AppContext)
    const { pharmToken, getDashData, medicines, getMedicines, updateMedicine } = useContext(PharmacyContext)

    React.useEffect(() => {
        if (pharmToken) getMedicines()
    }, [pharmToken])

    const onSubmitHandler = async (event) => {
        event.preventDefault()
        try {
            if (mode === 'edit') {
                if (!selectedId) {
                    toast.error('Select a medicine to edit')
                    return
                }
                const payload = {
                    medicineId: selectedId,
                    name,
                    description,
                    category,
                    price: Number(price),
                    stock: Number(stock),
                    requiresPrescription,
                    manufacturer,
                    dosage
                }
                const data = await updateMedicine(payload)
                if (data?.success) {
                    setSelectedId('')
                }
                return
            }

            const formData = new FormData()
            if (medImg) formData.append('image', medImg)
            formData.append('name', name)
            formData.append('description', description)
            formData.append('category', category)
            formData.append('price', Number(price))
            formData.append('stock', Number(stock))
            formData.append('requiresPrescription', requiresPrescription)
            formData.append('manufacturer', manufacturer)
            formData.append('dosage', dosage)

            const { data } = await axios.post(backendUrl + '/api/pharmacy/add-medicine', formData, { headers: { pharmtoken: pharmToken } })
            if (data.success) {
                toast.success(data.message)
                getDashData()
                // Reset form
                setMedImg(false)
                setName('')
                setDescription('')
                setCategory('Tablet')
                setPrice('')
                setStock('')
                setRequiresPrescription(false)
                setManufacturer('')
                setDosage('')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const onSelectMedicine = (id) => {
        setSelectedId(id)
        const med = medicines.find(m => m._id === id)
        if (!med) return
        setMedImg(false)
        setName(med.name || '')
        setDescription(med.description || '')
        setCategory(med.category || 'Tablet')
        setPrice(med.price ?? '')
        setStock(med.stock ?? '')
        setRequiresPrescription(!!med.requiresPrescription)
        setManufacturer(med.manufacturer || '')
        setDosage(med.dosage || '')
    }

    return (
        <form onSubmit={onSubmitHandler} className='m-5 w-full max-w-4xl'>

            <div className='flex items-center gap-3 mb-4'>
                <p className='text-xl font-semibold text-gray-700'>Medicine</p>
                <div className='flex gap-2'>
                    <button type='button' onClick={() => setMode('add')} className={`px-3 py-1 rounded-full text-xs ${mode === 'add' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        Add
                    </button>
                    <button type='button' onClick={() => setMode('edit')} className={`px-3 py-1 rounded-full text-xs ${mode === 'edit' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        Edit
                    </button>
                </div>
            </div>

            <div className='bg-white px-8 py-8 border rounded-xl max-h-[80vh] overflow-y-scroll'>

                {mode === 'edit' && (
                    <div className='mb-6'>
                        <p className='text-sm font-medium text-gray-600 mb-2'>Select Medicine to Edit</p>
                        <select value={selectedId} onChange={(e) => onSelectMedicine(e.target.value)} className='border rounded-lg px-3 py-2 text-sm w-full'>
                            <option value=''>Select medicine</option>
                            {medicines.map(m => (
                                <option key={m._id} value={m._id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {mode === 'add' && (
                    <div className='flex items-center gap-4 mb-8'>
                        <label htmlFor="med-img" className='cursor-pointer'>
                            {medImg
                                ? <img className='w-20 h-20 object-cover rounded-xl border-2 border-emerald-400' src={URL.createObjectURL(medImg)} alt="" />
                                : <div className='w-20 h-20 rounded-xl bg-emerald-50 border-2 border-dashed border-emerald-300 flex flex-col items-center justify-center text-emerald-500'>
                                    <svg xmlns="http://www.w3.org/2000/svg" className='w-6 h-6' fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className='text-xs mt-1'>Upload</span>
                                  </div>
                            }
                        </label>
                        <input onChange={(e) => setMedImg(e.target.files[0])} type="file" id="med-img" hidden accept="image/*" />
                        <div>
                            <p className='font-medium text-gray-700'>Medicine Image</p>
                            <p className='text-sm text-gray-400'>Optional — upload a product image</p>
                        </div>
                    </div>
                )}

                <div className='flex flex-col lg:flex-row gap-8 text-gray-600'>

                    {/* Left column */}
                    <div className='w-full lg:flex-1 flex flex-col gap-4'>

                        <div className='flex flex-col gap-1'>
                            <p className='text-sm font-medium'>Medicine Name *</p>
                            <input onChange={e => setName(e.target.value)} value={name} className='border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 outline-none' type="text" placeholder='e.g. Paracetamol 500mg' required />
                        </div>

                        <div className='flex flex-col gap-1'>
                            <p className='text-sm font-medium'>Category *</p>
                            <select onChange={e => setCategory(e.target.value)} value={category} className='border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 outline-none'>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className='flex flex-col gap-1'>
                            <p className='text-sm font-medium'>Price (₹) *</p>
                            <input onChange={e => setPrice(e.target.value)} value={price} className='border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 outline-none' type="number" placeholder='e.g. 50' min={0} required />
                        </div>

                        <div className='flex flex-col gap-1'>
                            <p className='text-sm font-medium'>Stock Quantity *</p>
                            <input onChange={e => setStock(e.target.value)} value={stock} className='border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 outline-none' type="number" placeholder='e.g. 100' min={0} required />
                        </div>

                    </div>

                    {/* Right column */}
                    <div className='w-full lg:flex-1 flex flex-col gap-4'>

                        <div className='flex flex-col gap-1'>
                            <p className='text-sm font-medium'>Manufacturer</p>
                            <input onChange={e => setManufacturer(e.target.value)} value={manufacturer} className='border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 outline-none' type="text" placeholder='e.g. Sun Pharma' />
                        </div>

                        <div className='flex flex-col gap-1'>
                            <p className='text-sm font-medium'>Dosage / Strength</p>
                            <input onChange={e => setDosage(e.target.value)} value={dosage} className='border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 outline-none' type="text" placeholder='e.g. 500mg, 10ml' />
                        </div>

                        <div className='flex items-center gap-3 mt-2'>
                            <button
                                type='button'
                                onClick={() => setRequiresPrescription(!requiresPrescription)}
                                className={`w-10 h-6 rounded-full transition-colors ${requiresPrescription ? 'bg-emerald-600' : 'bg-gray-300'} relative`}
                            >
                                <span className={`block w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${requiresPrescription ? 'translate-x-5' : 'translate-x-1'}`}></span>
                            </button>
                            <div>
                                <p className='text-sm font-medium text-gray-700'>Requires Prescription</p>
                                <p className='text-xs text-gray-400'>Patient needs a valid prescription</p>
                            </div>
                        </div>

                    </div>
                </div>

                <div className='mt-5'>
                    <p className='text-sm font-medium text-gray-600 mb-1'>Description *</p>
                    <textarea onChange={e => setDescription(e.target.value)} value={description} className='w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 outline-none' rows={4} placeholder='Brief description of the medicine, usage, and side effects...' required></textarea>
                </div>

                <button type='submit' className='mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-3 rounded-full text-sm font-medium transition-colors'>
                    {mode === 'edit' ? 'Update Medicine' : 'Add Medicine'}
                </button>
            </div>
        </form>
    )
}

export default AddMedicine
