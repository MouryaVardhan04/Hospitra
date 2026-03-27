import React, { useContext, useEffect } from 'react'
import { LabsContext } from '../../context/LabsContext'
import { AppContext } from '../../context/AppContext'

const Dashboard = () => {
  const { labsToken, getDashData, dashData } = useContext(LabsContext)
  const { currency } = useContext(AppContext)

  useEffect(() => {
    if (labsToken) getDashData()
  }, [labsToken])

  return dashData && (
    <div className='m-5 w-full'>

      {/* Stats Cards */}
      <div className='flex flex-wrap gap-4 mb-8'>
        <div className='flex items-center gap-3 bg-white p-5 min-w-52 rounded-xl border-2 border-gray-100 cursor-pointer hover:shadow-md transition-shadow'>
          <div className='w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center'>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-6 h-6 text-amber-600' fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className='text-2xl font-bold text-gray-700'>{dashData.pendingSamples}</p>
            <p className='text-gray-400 text-sm'>Pending Samples</p>
          </div>
        </div>

        <div className='flex items-center gap-3 bg-white p-5 min-w-52 rounded-xl border-2 border-gray-100 cursor-pointer hover:shadow-md transition-shadow'>
          <div className='w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center'>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-6 h-6 text-blue-600' fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className='text-2xl font-bold text-gray-700'>{dashData.inProcessSamples}</p>
            <p className='text-gray-400 text-sm'>In Process</p>
          </div>
        </div>

        <div className='flex items-center gap-3 bg-white p-5 min-w-52 rounded-xl border-2 border-gray-100 cursor-pointer hover:shadow-md transition-shadow'>
          <div className='w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center'>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-6 h-6 text-emerald-600' fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className='text-2xl font-bold text-gray-700'>{dashData.completedReports}</p>
            <p className='text-gray-400 text-sm'>Completed</p>
          </div>
        </div>

        <div className='flex items-center gap-3 bg-white p-5 min-w-52 rounded-xl border-2 border-gray-100 cursor-pointer hover:shadow-md transition-shadow'>
          <div className='w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center'>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-6 h-6 text-violet-600' fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 11h10M7 15h6" />
            </svg>
          </div>
          <div>
            <p className='text-2xl font-bold text-gray-700'>{dashData.collectedReports}</p>
            <p className='text-gray-400 text-sm'>Collected</p>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Dashboard