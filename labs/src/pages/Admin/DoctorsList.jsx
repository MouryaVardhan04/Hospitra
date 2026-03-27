import React, { useContext, useEffect, useState } from 'react'
import { LabsContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const TestsList = () => {
  const { labsToken, tests, getTests, toggleAvailability, deleteTest } = useContext(LabsContext)
  const { currency } = useContext(AppContext)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('All')

  useEffect(() => {
    if (labsToken) getTests()
  }, [labsToken])

  const categories = ['All', ...new Set(tests.map(t => t.category))]

  const filtered = tests.filter(t => {
    const matchCat = filterCat === 'All' || t.category === filterCat
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className='m-5 w-full'>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-4'>
        <p className='text-xl font-semibold text-gray-700'>All Lab Tests</p>
        <div className='flex gap-3 flex-wrap'>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            className='border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400'
            placeholder='Search test...'
          />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className='border rounded-lg px-3 py-2 text-sm outline-none'>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className='bg-white border rounded-xl overflow-hidden'>
        <div className='hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] py-3 px-6 bg-gray-50 border-b text-sm font-medium text-gray-500'>
          <p>Test</p>
          <p>Category</p>
          <p>Price</p>
          <p>Sample</p>
          <p>Status</p>
          <p>Action</p>
        </div>

        <div className='max-h-[65vh] overflow-y-auto'>
          {filtered.length === 0 && (
            <p className='text-center text-gray-400 py-12'>No tests found</p>
          )}
          {filtered.map((item, index) => (
            <div key={index} className='flex flex-wrap justify-between sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] items-center py-3 px-6 border-b hover:bg-gray-50 gap-2'>

              <div className='flex items-center gap-3'>
                <div className='w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs'>{item.name.charAt(0)}</div>
                <div>
                  <p className='font-medium text-gray-800 text-sm'>{item.name}</p>
                  <p className='text-xs text-gray-400'>{item.turnaroundTime}</p>
                </div>
              </div>

              <p className='text-sm text-gray-500'>{item.category}</p>
              <p className='text-sm font-medium text-gray-700'>{currency}{item.price}</p>
              <p className='text-sm text-gray-500'>{item.sampleType}</p>

              <div className='flex items-center gap-2'>
                <button
                  onClick={() => toggleAvailability(item._id, item.available)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    item.available
                      ? 'border-violet-500 text-violet-600 hover:bg-violet-50'
                      : 'border-gray-400 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {item.available ? 'Active' : 'Inactive'}
                </button>
                {item.homeCollection && (
                  <span className='text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700'>Home</span>
                )}
              </div>

              <button
                onClick={() => deleteTest(item._id)}
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

export default TestsList