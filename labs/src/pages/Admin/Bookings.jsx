import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LabsContext } from '../../context/LabsContext'
import { toast } from 'react-toastify'

const Bookings = () => {
  const { getLabAssignments, updateLabAssignment } = useContext(LabsContext)
  const [assignments, setAssignments] = useState([])
  const navigate = useNavigate()
  const [reportModal, setReportModal] = useState(null)
  const [reportForm, setReportForm] = useState({
    patientId: '',
    name: '',
    age: '',
    gender: '',
    phone: '',
    appointmentId: '',
    visitDate: '',
    doctorId: '',
    doctorName: '',
    labId: '',
    labName: 'Hospitra Lab',
    technicianName: '',
    tests: [],
    reportText: ''
  })

  useEffect(() => {
    const fetchAssignments = async () => {
      const data = await getLabAssignments()
      if (data.success) {
        setAssignments(data.assignments || [])
      }
    }
    fetchAssignments()
  }, [])

  const pendingAssignments = useMemo(() => assignments.filter(a => a.status === 'Assigned' || !a.status), [assignments])
  const rejectedAssignments = useMemo(() => assignments.filter(a => a.status === 'Rejected'), [assignments])
  const refreshAssignments = async () => {
    const data = await getLabAssignments()
    if (data.success) {
      setAssignments(data.assignments || [])
    }
  }

  const handleStatus = async (assignmentId, status) => {
    const data = await updateLabAssignment({ assignmentId, status })
    if (data.success) {
      toast.success(data.message)
      refreshAssignments()
    } else {
      toast.error(data.message)
    }
  }

  const handleReport = async (assignmentId, reportText) => {
    if (!reportText.trim()) {
      toast.error('Enter report details')
      return
    }
    const data = await updateLabAssignment({ assignmentId, reportText })
    if (data.success) {
      toast.success('Report generated')
      refreshAssignments()
    } else {
      toast.error(data.message)
    }
  }

  const handleCollectSample = async (assignmentId) => {
    const data = await updateLabAssignment({ assignmentId, status: 'Pending Sample' })
    if (data.success) {
      toast.success('Sample moved to pending')
      refreshAssignments()
      navigate('/samples-collected')
    } else {
      toast.error(data.message)
    }
  }


  const openReportModal = (assignment) => {
    const items = Array.isArray(assignment.items) && assignment.items.length
      ? assignment.items.map(i => i.name)
      : (assignment.tests || [])
    setReportModal(assignment)
    setReportForm({
      patientId: assignment.patientId || '',
      name: assignment.patientName || '',
      age: assignment.patientAge || '',
      gender: assignment.patientGender || '',
      phone: assignment.patientPhone || '',
      appointmentId: assignment.appointmentId || '',
      visitDate: assignment.visitDate || '',
      doctorId: assignment.doctorId || '',
      doctorName: assignment.doctorName || '',
      labId: assignment.labId || '',
      labName: assignment.labName || 'Hospitra Lab',
      technicianName: '',
      tests: items,
      reportText: ''
    })
  }

  const closeReportModal = () => {
    setReportModal(null)
  }

  const submitReport = async (e) => {
    e.preventDefault()
    if (!reportModal?._id) return
    if (!reportForm.reportText.trim()) {
      toast.error('Enter report details')
      return
    }
    const compiledReport = [
      `Patient ID: ${reportForm.patientId || '-'}`,
      `Patient Name: ${reportForm.name || '-'}`,
      `Age: ${reportForm.age || '-'}`,
      `Gender: ${reportForm.gender || '-'}`,
      `Phone: ${reportForm.phone || '-'}`,
      `Appointment ID: ${reportForm.appointmentId || '-'}`,
      `Visit Date: ${reportForm.visitDate || '-'}`,
      `Doctor: ${reportForm.doctorName || reportForm.doctorId || '-'}`,
      `Lab: ${reportForm.labName || reportForm.labId || '-'}`,
      `Technician: ${reportForm.technicianName || '-'}`,
      `Tests: ${(reportForm.tests || []).join(', ') || '-'}`,
      `Report: ${reportForm.reportText || '-'}`
    ].join('\n')

    await handleReport(reportModal._id, compiledReport)
    closeReportModal()
  }
  return (
    <div className='m-5 w-full'>
      <p className='text-xl font-semibold text-gray-700 mb-4'>Lab Bookings</p>

      <div className='space-y-6'>
          <div className='bg-white border rounded-xl' id='orders'>
            <div className='flex items-center gap-3 px-5 py-4 border-b'>
              <svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5 text-violet-600' fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
              <p className='font-semibold text-gray-700'>Lab Assignments (Orders)</p>
            </div>
            <div className='p-4'>
              {pendingAssignments.length === 0 ? (
                <p className='text-sm text-gray-400'>No lab assignments yet.</p>
              ) : (
                <div className='space-y-3'>
                  {pendingAssignments.map((a) => (
                    <div key={a._id} className='border rounded-lg p-3 text-sm text-gray-600'>
                      <div className='flex flex-wrap justify-between gap-3'>
                        <div>
                          <p className='font-semibold text-gray-800'>{a.patientName || a.patientId}</p>
                          <p className='text-xs text-gray-400'>{a.patientEmail}</p>
                          <p className='text-xs text-gray-400'>Phone: {a.patientPhone}</p>
                        </div>
                        <div className='text-xs'>
                          <span className='px-2 py-1 rounded-full bg-violet-100 text-violet-700'>{a.priority}</span>
                        </div>
                      </div>
                      <div className='mt-2'>
                        {Array.isArray(a.items) && a.items.length > 0 ? (
                          <>
                            <p className='text-xs text-gray-500'>Tests & Prices</p>
                            <div className='mt-2 space-y-1'>
                              {a.items.map((it, idx) => (
                                <div key={idx} className='flex justify-between text-xs text-gray-600'>
                                  <span>{it.name}</span>
                                  <span>₹{it.price}</span>
                                </div>
                              ))}
                              <div className='flex justify-between text-xs font-semibold text-gray-700 pt-1 border-t'>
                                <span>Total</span>
                                <span>₹{a.total || 0}</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className='text-xs text-gray-500'>Tests</p>
                            <div className='flex flex-wrap gap-2 mt-1'>
                              {(a.tests || []).map((t, idx) => (
                                <span key={idx} className='text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700'>{t}</span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      {a.notes && <p className='text-xs text-gray-500 mt-2'>Notes: {a.notes}</p>}
                      <div className='mt-3 flex flex-wrap gap-2'>
                        <button
                          onClick={() => handleCollectSample(a._id)}
                          className='px-3 py-1 rounded-lg text-xs bg-emerald-50 text-emerald-700'
                        >
                          Collect Sample
                        </button>
                        <button
                          onClick={() => handleStatus(a._id, 'Rejected')}
                          className='px-3 py-1 rounded-lg text-xs bg-red-50 text-red-600'
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>


          <div className='bg-white border rounded-xl' id='rejected'>
            <div className='flex items-center gap-3 px-5 py-4 border-b'>
              <svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5 text-red-500' fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l2 2m-2-2l-2-2m12 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className='font-semibold text-gray-700'>Rejected</p>
            </div>
            <div className='p-4'>
              {rejectedAssignments.length === 0 ? (
                <p className='text-sm text-gray-400'>No rejected assignments.</p>
              ) : (
                <div className='space-y-3'>
                  {rejectedAssignments.map((a) => (
                    <div key={a._id} className='border rounded-lg p-3 text-sm text-gray-600'>
                      <p className='font-semibold text-gray-800'>{a.patientName || a.patientId}</p>
                      <p className='text-xs text-gray-400'>Reason: {a.notes || 'Not specified'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
      </div>

      {reportModal && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
          <div className='bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <p className='text-lg font-semibold text-gray-800'>Generate Report</p>
                <p className='text-xs text-gray-500'>Fill the report details and save.</p>
              </div>
              <button onClick={closeReportModal} className='text-gray-400 hover:text-gray-600'>✕</button>
            </div>
            <form onSubmit={submitReport} className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='text-xs text-gray-500'>Patient ID</label>
                  <input
                    value={reportForm.patientId}
                    onChange={(e) => setReportForm(prev => ({ ...prev, patientId: e.target.value }))}
                    className='w-full border rounded-lg px-3 py-2 text-sm'
                  />
                </div>
                <div>
                  <label className='text-xs text-gray-500'>Patient Name</label>
                  <input
                    value={reportForm.name}
                    onChange={(e) => setReportForm(prev => ({ ...prev, name: e.target.value }))}
                    className='w-full border rounded-lg px-3 py-2 text-sm'
                  />
                </div>
                <div>
                  <label className='text-xs text-gray-500'>Age</label>
                  <input
                    value={reportForm.age}
                    onChange={(e) => setReportForm(prev => ({ ...prev, age: e.target.value }))}
                    className='w-full border rounded-lg px-3 py-2 text-sm'
                  />
                </div>
                <div>
                  <label className='text-xs text-gray-500'>Gender</label>
                  <input
                    value={reportForm.gender}
                    onChange={(e) => setReportForm(prev => ({ ...prev, gender: e.target.value }))}
                    className='w-full border rounded-lg px-3 py-2 text-sm'
                  />
                </div>
                <div>
                  <label className='text-xs text-gray-500'>Phone</label>
                  <input
                    value={reportForm.phone}
                    onChange={(e) => setReportForm(prev => ({ ...prev, phone: e.target.value }))}
                    className='w-full border rounded-lg px-3 py-2 text-sm'
                  />
                </div>
                <div>
                  <label className='text-xs text-gray-500'>Appointment ID</label>
                  <input
                    value={reportForm.appointmentId}
                    onChange={(e) => setReportForm(prev => ({ ...prev, appointmentId: e.target.value }))}
                    className='w-full border rounded-lg px-3 py-2 text-sm'
                  />
                </div>
                <div>
                  <label className='text-xs text-gray-500'>Visit Date</label>
                  <input
                    value={reportForm.visitDate}
                    onChange={(e) => setReportForm(prev => ({ ...prev, visitDate: e.target.value }))}
                    className='w-full border rounded-lg px-3 py-2 text-sm'
                  />
                </div>
                <div>
                  <label className='text-xs text-gray-500'>Doctor Name</label>
                  <input
                    value={reportForm.doctorName}
                    onChange={(e) => setReportForm(prev => ({ ...prev, doctorName: e.target.value }))}
                    className='w-full border rounded-lg px-3 py-2 text-sm'
                  />
                </div>
                <div>
                  <label className='text-xs text-gray-500'>Lab Name</label>
                  <input
                    value={reportForm.labName}
                    onChange={(e) => setReportForm(prev => ({ ...prev, labName: e.target.value }))}
                    className='w-full border rounded-lg px-3 py-2 text-sm'
                  />
                </div>
                <div>
                  <label className='text-xs text-gray-500'>Technician Name</label>
                  <input
                    value={reportForm.technicianName}
                    onChange={(e) => setReportForm(prev => ({ ...prev, technicianName: e.target.value }))}
                    className='w-full border rounded-lg px-3 py-2 text-sm'
                  />
                </div>
              </div>

              <div>
                <label className='text-xs text-gray-500'>Tests</label>
                <div className='mt-2 flex flex-wrap gap-2'>
                  {(reportForm.tests || []).length === 0 ? (
                    <span className='text-xs text-gray-400'>No tests found</span>
                  ) : (
                    reportForm.tests.map((t, idx) => (
                      <span key={idx} className='text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700'>{t}</span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className='text-xs text-gray-500'>Report Notes / Results</label>
                <textarea
                  rows={4}
                  value={reportForm.reportText}
                  onChange={(e) => setReportForm(prev => ({ ...prev, reportText: e.target.value }))}
                  className='w-full border rounded-lg px-3 py-2 text-sm'
                  placeholder='Enter report results...'
                />
              </div>

              <div className='flex justify-end gap-2'>
                <button type='button' onClick={closeReportModal} className='px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-700'>Cancel</button>
                <button type='submit' className='px-4 py-2 rounded-lg text-sm bg-emerald-600 text-white'>Save Report</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Bookings
