import React, { useContext, useEffect } from 'react'
import { PharmacyContext } from '../../context/PharmacyContext'
import { AppContext } from '../../context/AppContext'

const Dashboard = () => {

  const { pharmToken, getDashData, dashData } = useContext(PharmacyContext)
  const { currency } = useContext(AppContext)

  useEffect(() => {
    if (pharmToken) getDashData()
  }, [pharmToken])

  return dashData && (
    <div className='m-5 w-full'>

      {/* Stats Cards */}
      <div className='flex flex-wrap gap-4 mb-8'>
        <div className='flex items-center gap-3 bg-white p-5 min-w-52 rounded-xl border-2 border-gray-100 cursor-pointer hover:shadow-md transition-shadow'>
          <div className='w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center'>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-6 h-6 text-emerald-600' fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <p className='text-2xl font-bold text-gray-700'>{dashData.totalMedicines}</p>
            <p className='text-gray-400 text-sm'>Total Medicines</p>
          </div>
        </div>

        <div className='flex items-center gap-3 bg-white p-5 min-w-52 rounded-xl border-2 border-gray-100 cursor-pointer hover:shadow-md transition-shadow'>
          <div className='w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center'>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-6 h-6 text-green-600' fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className='text-2xl font-bold text-gray-700'>{dashData.availableMedicines}</p>
            <p className='text-gray-400 text-sm'>Available</p>
          </div>
        </div>

        <div className='flex items-center gap-3 bg-white p-5 min-w-52 rounded-xl border-2 border-gray-100 cursor-pointer hover:shadow-md transition-shadow'>
          <div className='w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center'>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-6 h-6 text-red-500' fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className='text-2xl font-bold text-gray-700'>{dashData.lowStockMedicines}</p>
            <p className='text-gray-400 text-sm'>Low Stock (&lt;10)</p>
          </div>
        </div>

        <div className='flex items-center gap-3 bg-white p-5 min-w-52 rounded-xl border-2 border-gray-100 cursor-pointer hover:shadow-md transition-shadow'>
          <div className='w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center'>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-6 h-6 text-blue-600' fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className='text-2xl font-bold text-gray-700'>{dashData.prescriptionOnly}</p>
            <p className='text-gray-400 text-sm'>Prescription Only</p>
          </div>
        </div>
      </div>

      {/* Recent Medicines */}
      <div className='bg-white rounded-xl border'>
        <div className='flex items-center gap-3 px-5 py-4 border-b'>
          <svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5 text-emerald-600' fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className='font-semibold text-gray-700'>Recently Added Medicines</p>
        </div>
        <div>
          {dashData.recentMedicines.length === 0 && (
            <p className='text-center text-gray-400 py-8'>No medicines added yet</p>
          )}
          {dashData.recentMedicines.map((item, index) => (
            <div key={index} className='flex items-center px-5 py-4 gap-4 hover:bg-gray-50 border-b last:border-0'>
              {item.image
                ? <img className='w-10 h-10 rounded-lg object-cover' src={item.image} alt="" />
                : <div className='w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm'>{item.name.charAt(0)}</div>
              }
              <div className='flex-1'>
                <p className='font-medium text-gray-800'>{item.name}</p>
                <p className='text-sm text-gray-400'>{item.category}</p>
              </div>
              <div className='text-right'>
                <p className='font-semibold text-gray-700'>{currency}{item.price}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.available ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                  {item.available ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default Dashboard