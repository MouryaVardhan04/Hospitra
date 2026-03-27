import React, { useContext, useEffect, useState } from 'react'
import { PharmacyContext } from '../../context/PharmacyContext'
import { AppContext } from '../../context/AppContext'

const MedicineList = () => {

  const { pharmToken, medicines, getMedicines, toggleAvailability, deleteMedicine } = useContext(PharmacyContext)
  const { currency } = useContext(AppContext)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('All')

  useEffect(() => {
    if (pharmToken) getMedicines()
  }, [pharmToken])

  const categories = ['All', ...new Set(medicines.map(m => m.category))]

  const filtered = medicines.filter(m => {
    const matchCat = filterCat === 'All' || m.category === filterCat
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className='m-5 w-full'>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-4'>
        <p className='text-xl font-semibold text-gray-700'>All Medicines</p>
        <div className='flex gap-3 flex-wrap'>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            className='border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400'
            placeholder='Search medicine...'
          />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className='border rounded-lg px-3 py-2 text-sm outline-none'>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className='bg-white border rounded-xl overflow-hidden'>
        <div className='hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] py-3 px-6 bg-gray-50 border-b text-sm font-medium text-gray-500'>
          <p>Medicine</p>
          <p>Category</p>
          <p>Price</p>
          <p>Stock</p>
          <p>Status</p>
          <p>Action</p>
        </div>

        <div className='max-h-[65vh] overflow-y-auto'>
          {filtered.length === 0 && (
            <p className='text-center text-gray-400 py-12'>No medicines found</p>
          )}
          {filtered.map((item, index) => (
            <div key={index} className='flex flex-wrap justify-between sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] items-center py-3 px-6 border-b hover:bg-gray-50 gap-2'>
              
              <div className='flex items-center gap-3'>
                {item.image
                  ? <img src={item.image} className='w-9 h-9 rounded-lg object-cover' alt="" />
                  : <div className='w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs'>{item.name.charAt(0)}</div>
                }
                <div>
                  <p className='font-medium text-gray-800 text-sm'>{item.name}</p>
                  {item.requiresPrescription && <span className='text-xs text-blue-600 font-medium'>Rx</span>}
                </div>
              </div>

              <p className='text-sm text-gray-500'>{item.category}</p>
              <p className='text-sm font-medium text-gray-700'>{currency}{item.price}</p>
              
              <div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  item.stock === 0 ? 'bg-red-100 text-red-600' :
                  item.stock < 10 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {item.stock} units
                </span>
              </div>

              <div>
                <button
                  onClick={() => toggleAvailability(item._id, item.available)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    item.available
                      ? 'border-emerald-500 text-emerald-600 hover:bg-emerald-50'
                      : 'border-gray-400 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {item.available ? 'Active' : 'Inactive'}
                </button>
              </div>

              <button
                onClick={() => deleteMedicine(item._id)}
                className='text-xs text-red-500 hover:text-red-700 font-medium transition-colors'
              >
                Delete
              </button>

            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MedicineList
