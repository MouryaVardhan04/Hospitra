import React from 'react'

const Bookings = () => {
  return (
    <div className='m-5 w-full'>
      <p className='text-xl font-semibold text-gray-700 mb-4'>Lab Bookings</p>

      <div className='bg-white border rounded-xl'>
        <div className='flex items-center gap-3 px-5 py-4 border-b'>
          <svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5 text-violet-600' fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className='font-semibold text-gray-700'>Recent Bookings</p>
        </div>

        <div className='flex flex-col items-center justify-center py-16 text-center'>
          <div className='w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4'>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-8 h-8 text-violet-500' fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className='text-gray-500 font-medium'>No bookings yet</p>
          <p className='text-gray-400 text-sm mt-1'>Lab bookings from patients will appear here once enabled.</p>
        </div>
      </div>
    </div>
  )
}

export default Bookings