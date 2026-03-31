import React, { useContext, useEffect, useState } from 'react'
import { PharmacyContext } from '../../context/PharmacyContext'
import { AppContext } from '../../context/AppContext'

// ── Invoice Detail Modal ──────────────────────────────────────────────────────
const Row = ({ label, value, highlight }) => (
  <div className='flex flex-col py-0.5'>
    <span className='text-xs text-gray-400'>{label}</span>
    <span className={`font-medium text-sm ${highlight ? 'text-blue-700' : 'text-gray-800'}`}>{value || '-'}</span>
  </div>
)

const InvoiceDetailModal = ({ invoice, onClose, currency }) => {
  if (!invoice) return null
  const items = Array.isArray(invoice.items) ? invoice.items : []
  const formatMoney = (v) => `${currency}${Number(v || 0).toLocaleString()}`
  const formatTime = (v) => {
    if (!v) return '-'
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString()
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4' onClick={onClose}>
      <div
        className='bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto'
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b bg-slate-50 rounded-t-2xl'>
          <div>
            <p className='text-base font-semibold text-gray-800'>Pharmacy Invoice</p>
            <p className='text-xs text-gray-400 mt-0.5'>{formatTime(invoice.createdAt)}</p>
          </div>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 text-xl leading-none'>✕</button>
        </div>

        <div className='px-6 py-5 space-y-5'>
          {/* Patient */}
          <section>
            <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-2'>Patient</p>
            <div className='grid grid-cols-2 gap-x-6 gap-y-2'>
              <Row label='Name'   value={invoice.patientName} />
              <Row label='Phone'  value={invoice.patientPhone} />
              <Row label='Email'  value={invoice.patientEmail} />
              <Row label='Doctor' value={invoice.doctorName} />
            </div>
          </section>

          {/* Payment */}
          <section>
            <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-2'>Payment</p>
            <div className='grid grid-cols-2 gap-x-6 gap-y-2'>
              <Row label='Method' value={invoice.paymentMethod} highlight />
              <Row label='Total'  value={formatMoney(invoice.total)} highlight />
            </div>
          </section>

          {/* Items table */}
          {items.length > 0 && (
            <section>
              <p className='text-xs font-bold uppercase tracking-widest text-gray-400 mb-2'>Items Dispensed</p>
              <div className='border rounded-xl overflow-hidden'>
                <table className='w-full text-sm'>
                  <thead className='bg-slate-50 text-gray-500 text-xs uppercase'>
                    <tr>
                      <th className='text-left px-4 py-2'>Medicine</th>
                      <th className='text-center px-4 py-2'>Qty</th>
                      <th className='text-right px-4 py-2'>Price</th>
                      <th className='text-right px-4 py-2'>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr key={i} className={i % 2 === 1 ? 'bg-slate-50' : ''}>
                        <td className='px-4 py-2 text-gray-700'>{it.name || '-'}</td>
                        <td className='px-4 py-2 text-center text-gray-500'>{it.quantity ?? '-'}</td>
                        <td className='px-4 py-2 text-right text-gray-500'>{formatMoney(it.price)}</td>
                        <td className='px-4 py-2 text-right text-gray-700 font-medium'>
                          {formatMoney((it.quantity ?? 1) * Number(it.price || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className='border-t font-semibold'>
                      <td colSpan={3} className='px-4 py-2 text-gray-800'>Total</td>
                      <td className='px-4 py-2 text-right text-emerald-600 text-base'>{formatMoney(invoice.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { pharmToken, getDashData, dashData, getPharmacyInvoices } = useContext(PharmacyContext)
  const { currency } = useContext(AppContext)

  const [invoices, setInvoices]           = useState([])
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  useEffect(() => {
    if (!pharmToken) return
    getDashData()

    const loadInvoices = async () => {
      const data = await getPharmacyInvoices()
      if (data?.success) setInvoices(data.invoices || [])
    }
    loadInvoices()

    const interval = setInterval(loadInvoices, 30000)
    return () => clearInterval(interval)
  }, [pharmToken])

  const formatMoney = (v) => `${currency}${Number(v || 0).toLocaleString()}`
  const formatTime  = (v) => {
    if (!v) return '-'
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString()
  }

  const totalRevenue  = invoices.reduce((s, inv) => s + Number(inv.total || 0), 0)
  const recentInvoices = [...invoices].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5)

  if (!dashData) return <div className='m-5 text-gray-400 text-sm'>Loading…</div>

  return (
    <div className='m-5 w-full'>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          currency={currency}
        />
      )}

      <div className='flex items-center justify-between gap-3 mb-6'>
        <div>
          <p className='text-2xl font-semibold text-gray-700'>Pharmacy Dashboard</p>
          <p className='text-sm text-gray-400'>Medicine & billing overview</p>
        </div>
        <span className='text-xs text-gray-500'>Updated just now</span>
      </div>

      {/* Metric Cards */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6'>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-4'>
          <div className='w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0'>
            <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6 text-emerald-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' /></svg>
          </div>
          <div><p className='text-2xl font-bold text-gray-700'>{dashData.totalMedicines}</p><p className='text-gray-400 text-sm'>Total Medicines</p></div>
        </div>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-4'>
          <div className='w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0'>
            <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6 text-green-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' /></svg>
          </div>
          <div><p className='text-2xl font-bold text-emerald-600'>{dashData.availableMedicines}</p><p className='text-gray-400 text-sm'>Available</p></div>
        </div>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-4'>
          <div className='w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0'>
            <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6 text-red-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' /></svg>
          </div>
          <div><p className='text-2xl font-bold text-red-500'>{dashData.lowStockMedicines}</p><p className='text-gray-400 text-sm'>Low Stock (&lt;10)</p></div>
        </div>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-4'>
          <div className='w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0'>
            <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6 text-blue-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' /></svg>
          </div>
          <div><p className='text-2xl font-bold text-gray-700'>{dashData.prescriptionOnly}</p><p className='text-gray-400 text-sm'>Prescription Only</p></div>
        </div>
      </div>

      {/* Revenue Card */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8'>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-4'>
          <div className='w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0'>
            <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6 text-emerald-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' /></svg>
          </div>
          <div><p className='text-xs text-gray-400 uppercase tracking-wide'>Total Revenue</p><p className='text-2xl font-bold text-emerald-600 mt-1'>{formatMoney(totalRevenue)}</p><p className='text-xs text-gray-400'>All pharmacy invoices</p></div>
        </div>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-4'>
          <div className='w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0'>
            <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6 text-blue-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 14H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v3M9 14l-2 7m0 0h10m-10 0l2-7m8 0l2 7' /></svg>
          </div>
          <div><p className='text-xs text-gray-400 uppercase tracking-wide'>Invoices Issued</p><p className='text-2xl font-bold text-gray-700 mt-1'>{invoices.length}</p><p className='text-xs text-gray-400'>Total billed</p></div>
        </div>
        <div className='bg-white border rounded-xl p-5 flex items-center gap-4'>
          <div className='w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0'>
            <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6 text-red-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' /></svg>
          </div>
          <div><p className='text-xs text-gray-400 uppercase tracking-wide'>Out of Stock</p><p className='text-2xl font-bold text-red-500 mt-1'>{dashData.outOfStock ?? 0}</p><p className='text-xs text-gray-400'>Medicines</p></div>
        </div>
      </div>

      {/* Recent Invoices + Recent Medicines side by side */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>

        {/* Recent Invoices — clickable */}
        <div className='bg-white border rounded-xl'>
          <div className='flex items-center gap-3 px-5 py-4 border-b'>
            <p className='font-semibold text-gray-700'>Recent Pharmacy Invoices</p>
          </div>
          <div className='p-4'>
            {recentInvoices.length === 0 ? (
              <p className='text-gray-400 text-sm'>No invoices yet.</p>
            ) : (
              <div className='space-y-3'>
                {recentInvoices.map((inv, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedInvoice(inv)}
                    className='flex items-center justify-between text-sm text-gray-600 border rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-colors'
                  >
                    <div>
                      <p className='font-medium text-gray-800'>{inv.patientName || 'Patient'}</p>
                      <p className='text-xs text-gray-400'>
                        {inv.paymentMethod || '-'} • {formatTime(inv.createdAt)}
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-xs font-semibold text-emerald-600'>{formatMoney(inv.total)}</span>
                      <span className='text-gray-300'>›</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recently Added Medicines */}
        <div className='bg-white border rounded-xl'>
          <div className='flex items-center gap-3 px-5 py-4 border-b'>
            <p className='font-semibold text-gray-700'>Recently Added Medicines</p>
          </div>
          <div>
            {dashData.recentMedicines.length === 0 ? (
              <p className='text-center text-gray-400 py-8 text-sm'>No medicines added yet</p>
            ) : (
              dashData.recentMedicines.map((item, index) => (
                <div key={index} className='flex items-center px-5 py-3 gap-4 border-b last:border-0'>
                  {item.image
                    ? <img className='w-10 h-10 rounded-lg object-cover' src={item.image} alt='' />
                    : (
                      <div className='w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm flex-shrink-0'>
                        {item.name.charAt(0)}
                      </div>
                    )
                  }
                  <div className='flex-1 min-w-0'>
                    <p className='font-medium text-gray-800 truncate'>{item.name}</p>
                    <p className='text-xs text-gray-400'>{item.category}</p>
                  </div>
                  <div className='text-right flex-shrink-0'>
                    <p className='font-semibold text-gray-700 text-sm'>{currency}{item.price}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      item.available ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                    }`}>
                      {item.available ? 'In Stock' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard