import React, { useContext, useEffect, useMemo, useState } from 'react'
import { PharmacyContext } from '../../context/PharmacyContext'
import { toast } from 'react-toastify'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'

const Orders = () => {
  const { backendUrl, pharmToken } = useContext(PharmacyContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [consultations, setConsultations] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [invoices, setInvoices] = useState([])
  const [loadingInvoices, setLoadingInvoices] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [recentQuery, setRecentQuery] = useState('')

  useEffect(() => {
    const loadOrders = async () => {
      if (!pharmToken) return
      try {
        setLoadingOrders(true)
        const { data } = await axios.get(backendUrl + '/api/pharmacy/consultations', { headers: { pharmtoken: pharmToken } })
        if (data?.success) setConsultations(data.consultations || [])
      } catch (err) {
        toast.error(err.message)
      } finally {
        setLoadingOrders(false)
      }
    }
    loadOrders()
  }, [backendUrl, pharmToken])

  useEffect(() => {
    const loadInvoices = async () => {
      if (!pharmToken) return
      try {
        setLoadingInvoices(true)
        const { data } = await axios.get(backendUrl + '/api/pharmacy/invoices', { headers: { pharmtoken: pharmToken } })
        if (data?.success) setInvoices(data.invoices || [])
      } catch (err) {
        toast.error(err.message)
      } finally {
        setLoadingInvoices(false)
      }
    }
    loadInvoices()
  }, [backendUrl, pharmToken])

  const filteredInvoices = useMemo(() => {
    const q = recentQuery.trim().toLowerCase()
    if (!q) return invoices
    return invoices.filter(inv => {
      return String(inv.userId || '').toLowerCase().includes(q)
        || String(inv.patientName || '').toLowerCase().includes(q)
        || String(inv.doctorName || '').toLowerCase().includes(q)
    })
  }, [invoices, recentQuery])

  useEffect(() => {
    const state = location.state
    if (!state?.patientId && !state?.patientName) return
    const seededQuery = (state.patientId || state.patientName || '').trim()
    if (seededQuery) setRecentQuery(seededQuery)
  }, [location.state])

  return (
    <div className='m-5 w-full'>
      <p className='text-xl font-semibold text-gray-700 mb-4'>Prescription Orders</p>

      <div className='bg-white border rounded-xl mb-6'>
        <div className='flex items-center gap-3 px-5 py-4 border-b'>
          <p className='font-semibold text-gray-700'>Consultation Orders</p>
        </div>
        {loadingOrders ? (
          <p className='p-4 text-sm text-gray-500'>Loading consultations...</p>
        ) : consultations.length === 0 ? (
          <p className='p-4 text-sm text-gray-500'>No consultation orders.</p>
        ) : (
          <div className='p-4 space-y-4'>
            {consultations.map((c) => (
              <div key={c._id} className='border rounded-xl p-4'>
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

                <div className='mt-4'>
                  {(c.pharmacyItems || []).length === 0 ? (
                    <p className='text-sm text-gray-400'>No pharmacy items</p>
                  ) : (
                    <ul className='space-y-1 text-sm text-gray-600'>
                      {c.pharmacyItems.map((it, idx) => (
                        <li key={idx} className='flex items-center justify-between'>
                          <span>{it.name} × {it.qty || 1}</span>
                          <span>₹{(it.price || 0) * (it.qty || 1)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className='mt-4'>
                  <button
                    onClick={() => {
                      navigate('/pharmacy-billing', { state: { consultation: c } })
                    }}
                    disabled={(c.pharmacyItems || []).length === 0 || c.pharmacyInvoiced}
                    className={`px-3 py-2 text-xs rounded-lg ${(c.pharmacyItems || []).length === 0 || c.pharmacyInvoiced ? 'bg-slate-200 text-slate-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                  >
                    {c.pharmacyInvoiced ? 'Invoice Created' : 'Open Billing'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='bg-white border rounded-xl'>
        <div className='flex flex-col gap-3 px-5 py-4 border-b md:flex-row md:items-center md:justify-between'>
          <svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5 text-emerald-600' fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className='font-semibold text-gray-700'>Recent Orders</p>
          <input
            value={recentQuery}
            onChange={(e) => setRecentQuery(e.target.value)}
            className='w-full md:w-72 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400'
            placeholder='Search recent orders...'
          />
        </div>
        {loadingInvoices ? (
          <p className='p-4 text-sm text-gray-500'>Loading recent orders...</p>
        ) : filteredInvoices.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <div className='w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4'>
              <svg xmlns="http://www.w3.org/2000/svg" className='w-8 h-8 text-emerald-500' fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className='text-gray-500 font-medium'>No recent orders</p>
            <p className='text-gray-400 text-sm mt-1'>Search by patient ID or name to see invoices.</p>
          </div>
        ) : (
          <div className='p-4 space-y-3'>
            {filteredInvoices.map((inv) => (
              <button
                type='button'
                key={inv._id}
                onClick={() => setSelectedInvoice(inv)}
                className='w-full text-left border rounded-xl p-4 hover:bg-emerald-50 transition'
              >
                <div className='grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr_1fr] gap-3 text-sm text-gray-600'>
                  <div>
                    <p className='text-xs text-gray-400'>Patient ID</p>
                    <p className='font-medium text-gray-800'>{inv.userId || '-'}</p>
                  </div>
                  <div>
                    <p className='text-xs text-gray-400'>Patient Name</p>
                    <p className='font-medium text-gray-800'>{inv.patientName || '-'}</p>
                  </div>
                  <div>
                    <p className='text-xs text-gray-400'>Doctor</p>
                    <p className='font-medium text-gray-800'>{inv.doctorName || '-'}</p>
                  </div>
                  <div>
                    <p className='text-xs text-gray-400'>Appointment</p>
                    <p className='font-medium text-gray-800'>{inv.createdAt ? new Date(inv.createdAt).toLocaleString() : '-'}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedInvoice && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'>
          <div className='bg-white rounded-2xl w-full max-w-2xl p-6 relative'>
            <button
              type='button'
              onClick={() => setSelectedInvoice(null)}
              className='absolute top-4 right-4 text-gray-400 hover:text-gray-600'
            >
              ✕
            </button>
            <h3 className='text-lg font-semibold text-gray-800'>Order Details</h3>
            <p className='text-xs text-gray-400 mt-1'>Invoice: {selectedInvoice._id}</p>

            <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
              <div className='border rounded-lg p-3'>
                <p className='text-xs text-gray-500'>Patient</p>
                <p className='font-medium text-gray-700'>{selectedInvoice.patientName || '-'}</p>
                <p className='text-xs text-gray-500'>ID: {selectedInvoice.userId || '-'}</p>
                <p className='text-xs text-gray-500'>Phone: {selectedInvoice.patientPhone || '-'}</p>
                <p className='text-xs text-gray-500'>Email: {selectedInvoice.patientEmail || '-'}</p>
              </div>
              <div className='border rounded-lg p-3'>
                <p className='text-xs text-gray-500'>Doctor & Visit</p>
                <p className='font-medium text-gray-700'>{selectedInvoice.doctorName || '-'}</p>
                <p className='text-xs text-gray-500'>Doctor ID: {selectedInvoice.doctorId || '-'}</p>
                <p className='text-xs text-gray-500'>Date: {selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleDateString() : '-'}</p>
                <p className='text-xs text-gray-500'>Time: {selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleTimeString() : '-'}</p>
              </div>
            </div>

            <div className='mt-4'>
              <p className='text-sm font-semibold text-gray-700 mb-2'>Medicines</p>
              {(!selectedInvoice.items || selectedInvoice.items.length === 0) ? (
                <p className='text-sm text-gray-400'>No medicines listed.</p>
              ) : (
                <ul className='space-y-2 text-sm text-gray-600 max-h-56 overflow-y-auto'>
                  {selectedInvoice.items.map((it, idx) => (
                    <li key={idx} className='flex items-center justify-between border rounded-lg px-3 py-2'>
                      <span>{it.name} × {it.qty || 1}</span>
                      <span>₹{(it.price || 0) * (it.qty || 1)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className='mt-5 flex justify-end gap-2'>
              <button
                type='button'
                onClick={() => setSelectedInvoice(null)}
                className='px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600'
              >
                Close
              </button>
              <button
                type='button'
                onClick={() => navigate('/pharmacy-billing', { state: { invoice: selectedInvoice } })}
                className='px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700'
              >
                Open Billing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
