import React, { useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'

const ConsultationOrders = () => {
  const { aToken } = useContext(AdminContext)
  const { backendUrl, currency } = useContext(AppContext)
  const navigate = useNavigate()
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const markLabAssigned = async (id) => {
    await axios.post(backendUrl + '/api/admin/consultations/lab-assigned', { consultationId: id }, { headers: { aToken } })
  }

  const markSurgeryInvoiced = async (id) => {
    await axios.post(backendUrl + '/api/admin/consultations/surgery-invoiced', { consultationId: id }, { headers: { aToken } })
  }

  useEffect(() => {
    const load = async () => {
      if (!aToken) return
      try {
        setLoading(true)
        const { data } = await axios.get(backendUrl + '/api/admin/consultations', { headers: { aToken } })
        if (data?.success) setConsultations(data.consultations || [])
      } catch (err) {
        toast.error(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [backendUrl, aToken])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return consultations
    return consultations.filter(c => {
      return (
        (c.patientName || '').toLowerCase().includes(term) ||
        (c.patientEmail || '').toLowerCase().includes(term) ||
        (c.patientPhone || '').toLowerCase().includes(term) ||
        (c.doctorName || '').toLowerCase().includes(term)
      )
    })
  }, [consultations, search])

  const openLabAssignment = (consultation) => {
    navigate('/lab-assignment', { state: { consultation } })
  }

  const createSurgeryInvoice = async (consultation) => {
    try {
      const payload = {
        patientId: consultation.patientId,
        patientName: consultation.patientName,
        department: 'Surgery',
        notes: consultation.notes || '',
        items: consultation.surgeryItems || [],
        total: consultation.surgeryTotal || 0
      }
      const { data } = await axios.post(backendUrl + '/api/admin/billing-invoice', payload, { headers: { aToken } })
      if (data?.success) {
        toast.success('Surgery invoice created')
        markProcessed(consultation._id, 'surgery')
      } else {
        toast.error(data?.message || 'Failed to create invoice')
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  const openSurgeryBilling = (consultation) => {
    navigate('/billing-initiation', { state: { consultation } })
  }

  return (
    <div className='m-5 w-full'>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-4'>
        <p className='text-xl font-semibold text-gray-700'>Consultation Orders</p>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search patient or doctor'
          className='text-sm px-3 py-2 border rounded-lg w-72 max-w-full'
        />
      </div>

      {loading ? (
        <p className='text-sm text-gray-500'>Loading consultations...</p>
      ) : filtered.length === 0 ? (
        <p className='text-sm text-gray-500'>No consultations found.</p>
      ) : (
        <div className='space-y-4'>
          {filtered.map((c) => (
            <div key={c._id} className='bg-white border rounded-xl p-4'>
              <div className='flex flex-wrap justify-between gap-4'>
                <div>
                  <p className='text-lg font-semibold text-gray-800'>{c.patientName || 'Patient'}</p>
                  <p className='text-sm text-gray-500'>{c.patientEmail || '-'} • {c.patientPhone || '-'}</p>
                  <p className='text-xs text-gray-400'>Appointment: {c.appointmentDate} • {c.appointmentTime}</p>
                </div>
                <div className='text-sm text-gray-600'>
                  <p className='font-medium text-gray-700'>Doctor</p>
                  <p>{c.doctorName || '-'}</p>
                </div>
              </div>

              <div className='mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                <div>
                  <p className='font-medium text-gray-700 mb-2'>Lab Tests</p>
                  {(c.labItems || []).length === 0 ? (
                    <p className='text-gray-400'>None</p>
                  ) : (
                    <ul className='space-y-1 text-gray-600'>
                      {c.labItems.map((it, idx) => (
                        <li key={idx} className='flex items-center justify-between'>
                          <span>{it.name}</span>
                          <span>{currency}{it.price}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className='font-medium text-gray-700 mb-2'>Surgeries</p>
                  {(c.surgeryItems || []).length === 0 ? (
                    <p className='text-gray-400'>None</p>
                  ) : (
                    <ul className='space-y-1 text-gray-600'>
                      {c.surgeryItems.map((it, idx) => (
                        <li key={idx} className='flex items-center justify-between'>
                          <span>{it.name}</span>
                          <span>{currency}{it.price}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className='font-medium text-gray-700 mb-2'>Pharmacy</p>
                  {(c.pharmacyItems || []).length === 0 ? (
                    <p className='text-gray-400'>None</p>
                  ) : (
                    <ul className='space-y-1 text-gray-600'>
                      {c.pharmacyItems.map((it, idx) => (
                        <li key={idx} className='flex items-center justify-between'>
                          <span>{it.name} × {it.qty || 1}</span>
                          <span>{currency}{(it.price || 0) * (it.qty || 1)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className='mt-4 flex flex-wrap gap-2'>
                <button
                  onClick={() => openLabAssignment(c)}
                  disabled={(c.labItems || []).length === 0 || c.labAssigned}
                  className={`px-3 py-2 text-xs rounded-lg ${(c.labItems || []).length === 0 || c.labAssigned ? 'bg-slate-200 text-slate-500' : 'bg-primary text-white hover:opacity-90'}`}
                >
                  {c.labAssigned ? 'Lab Assigned' : 'Open Lab Assignment'}
                </button>
                <button
                  onClick={() => openSurgeryBilling(c)}
                  disabled={(c.surgeryItems || []).length === 0 || c.surgeryInvoiced}
                  className={`px-3 py-2 text-xs rounded-lg ${(c.surgeryItems || []).length === 0 || c.surgeryInvoiced ? 'bg-slate-200 text-slate-500' : 'bg-amber-500 text-white hover:opacity-90'}`}
                >
                  {c.surgeryInvoiced ? 'Surgery Invoiced' : 'Open Billing & Surgery'}
                </button>
                {c.labAssigned && c.surgeryInvoiced && (
                  <span className='text-xs text-emerald-600 border border-emerald-200 bg-emerald-50 px-2 py-1 rounded-full'>
                    Completed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ConsultationOrders
