import React, { useContext, useEffect, useMemo, useState } from 'react'
import { LabsContext } from '../../context/LabsContext'
import { toast } from 'react-toastify'

const SamplesCollected = () => {
  const { getLabAssignments, updateLabAssignment } = useContext(LabsContext)
  const [assignments, setAssignments] = useState([])
  const [pendingInputs, setPendingInputs] = useState({})
  const [searchInProcess, setSearchInProcess] = useState('')
  const [searchCompleted, setSearchCompleted] = useState('')

  useEffect(() => {
    const fetchAssignments = async () => {
      const data = await getLabAssignments()
      if (data.success) {
        setAssignments(data.assignments || [])
      }
    }
    fetchAssignments()
  }, [])

  const pendingAssignments = useMemo(
    () => assignments.filter(a => a.status === 'Pending Sample'),
    [assignments]
  )

  const inProcessAssignments = useMemo(
    () => assignments.filter(a => a.status === 'Sample Collected'),
    [assignments]
  )

  const completedAssignments = useMemo(
    () => assignments.filter(a => a.status === 'Reported'),
    [assignments]
  )

  const sortByPriority = (list) => {
    const priorityRank = (p) => (p === 'Emergency' ? 0 : 1)
    return [...list].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
  }

  const filteredInProcess = useMemo(() => {
    if (!searchInProcess.trim()) return sortByPriority(inProcessAssignments)
    const q = searchInProcess.trim().toLowerCase()
    return sortByPriority(inProcessAssignments.filter(a =>
      (a.patientName || '').toLowerCase().includes(q) ||
      (a.patientId || '').toLowerCase().includes(q) ||
      (a.sampleId || '').toLowerCase().includes(q)
    ))
  }, [inProcessAssignments, searchInProcess])

  const filteredCompleted = useMemo(() => {
    if (!searchCompleted.trim()) return sortByPriority(completedAssignments)
    const q = searchCompleted.trim().toLowerCase()
    return sortByPriority(completedAssignments.filter(a =>
      (a.patientName || '').toLowerCase().includes(q) ||
      (a.patientId || '').toLowerCase().includes(q) ||
      (a.sampleId || '').toLowerCase().includes(q)
    ))
  }, [completedAssignments, searchCompleted])

  const refreshAssignments = async () => {
    const data = await getLabAssignments()
    if (data.success) {
      setAssignments(data.assignments || [])
    }
  }

  useEffect(() => {
    if (pendingAssignments.length === 0) return
    setPendingInputs((prev) => {
      const next = { ...prev }
      pendingAssignments.forEach((a) => {
        if (!next[a._id]) {
          const now = new Date()
          next[a._id] = {
            sampleId: `SMP-${String(a._id || '').slice(-6)}-${now.getTime().toString().slice(-6)}`,
            sampleTime: now.toISOString().slice(0, 16)
          }
        }
      })
      return next
    })
  }, [pendingAssignments])

  const handleSampleCollected = async (assignmentId) => {
    const input = pendingInputs[assignmentId] || {}
    if (!input.sampleId?.trim() || !input.sampleTime?.trim()) {
      toast.error('Enter sample ID and time')
      return
    }
    const sampleCollectedAt = new Date(input.sampleTime).getTime()
    if (Number.isNaN(sampleCollectedAt)) {
      toast.error('Invalid sample time')
      return
    }
    const data = await updateLabAssignment({
      assignmentId,
      status: 'Sample Collected',
      sampleCollected: true,
      sampleCollectedAt,
      sampleId: input.sampleId.trim()
    })
    if (data.success) {
      toast.success('Sample collected')
      setPendingInputs(prev => ({ ...prev, [assignmentId]: { sampleId: '', sampleTime: '' } }))
      refreshAssignments()
    } else {
      toast.error(data.message)
    }
  }

  return (
    <div className='m-5 w-full'>
      <div className='flex items-center justify-between gap-3 mb-4'>
        <p className='text-xl font-semibold text-gray-700'>Samples Workflow</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-white border rounded-xl'>
          <div className='flex items-center gap-3 px-5 py-4 border-b'>
            <p className='font-semibold text-gray-700'>Pending</p>
          </div>
          <div className='p-4'>
            {pendingAssignments.length === 0 ? (
              <p className='text-sm text-gray-400'>No pending samples.</p>
            ) : (
              <div className='space-y-3'>
                {sortByPriority(pendingAssignments).map((a) => (
                  <div key={a._id} className='border rounded-lg p-3 text-sm text-gray-600'>
                    <div className='flex flex-wrap justify-between gap-3'>
                      <div>
                        <p className='font-semibold text-gray-800'>{a.patientName || a.patientId}</p>
                        <p className='text-xs text-gray-400'>Priority: {a.priority}</p>
                      </div>
                    </div>
                    {Array.isArray(a.items) && a.items.length > 0 && (
                      <div className='flex flex-wrap gap-2 mt-2'>
                        {a.items.map((it, idx) => (
                          <span key={idx} className='text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700'>{it.name}</span>
                        ))}
                      </div>
                    )}
                    <div className='mt-3 grid grid-cols-1 md:grid-cols-2 gap-2'>
                      <input
                        value={pendingInputs[a._id]?.sampleId || ''}
                        onChange={(e) => setPendingInputs(prev => ({ ...prev, [a._id]: { ...prev[a._id], sampleId: e.target.value } }))}
                        className='w-full border rounded-lg px-3 py-2 text-xs'
                        placeholder='Sample ID'
                      />
                      <input
                        type='datetime-local'
                        value={pendingInputs[a._id]?.sampleTime || ''}
                        onChange={(e) => setPendingInputs(prev => ({ ...prev, [a._id]: { ...prev[a._id], sampleTime: e.target.value } }))}
                        className='w-full border rounded-lg px-3 py-2 text-xs'
                      />
                    </div>
                    <div className='mt-2'>
                      <button
                        onClick={() => handleSampleCollected(a._id)}
                        className='px-3 py-1 rounded-lg text-xs bg-emerald-50 text-emerald-700'
                      >
                        Sample Collected
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className='bg-white border rounded-xl'>
          <div className='flex items-center gap-3 px-5 py-4 border-b'>
            <p className='font-semibold text-gray-700'>In Process</p>
          </div>
          <div className='p-4'>
            <input
              value={searchInProcess}
              onChange={(e) => setSearchInProcess(e.target.value)}
              className='w-full mb-4 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400'
              placeholder='Search in process by patient or sample ID'
            />
            {filteredInProcess.length === 0 ? (
              <p className='text-sm text-gray-400'>No in-process samples.</p>
            ) : (
              <div className='space-y-3'>
                {filteredInProcess.map((a) => (
                  <div key={a._id} className='border rounded-lg p-3 text-sm text-gray-600'>
                    <p className='font-semibold text-gray-800'>{a.patientName || a.patientId}</p>
                    <p className='text-xs text-gray-400'>Sample ID: {a.sampleId || '-'}</p>
                    <p className='text-xs text-gray-400'>Collected: {a.sampleCollectedAt ? new Date(a.sampleCollectedAt).toLocaleString() : '-'}</p>
                    {Array.isArray(a.items) && a.items.length > 0 && (
                      <div className='flex flex-wrap gap-2 mt-2'>
                        {a.items.map((it, idx) => (
                          <span key={idx} className='text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700'>{it.name}</span>
                        ))}
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className='bg-white border rounded-xl'>
          <div className='flex items-center gap-3 px-5 py-4 border-b'>
            <p className='font-semibold text-gray-700'>Completed</p>
          </div>
          <div className='p-4'>
            <input
              value={searchCompleted}
              onChange={(e) => setSearchCompleted(e.target.value)}
              className='w-full mb-4 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400'
              placeholder='Search completed by patient or sample ID'
            />
            {filteredCompleted.length === 0 ? (
              <p className='text-sm text-gray-400'>No completed reports.</p>
            ) : (
              <div className='space-y-3'>
                {filteredCompleted.map((a) => (
                  <div key={a._id} className='border rounded-lg p-3 text-sm text-gray-600'>
                    <p className='font-semibold text-gray-800'>{a.patientName || a.patientId}</p>
                    <p className='text-xs text-gray-400'>Sample ID: {a.sampleId || '-'}</p>
                    <p className='text-xs text-gray-400'>Report Date: {a.reportGeneratedAt ? new Date(a.reportGeneratedAt).toLocaleDateString() : '-'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SamplesCollected
