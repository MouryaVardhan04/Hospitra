import React, { useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { DoctorContext } from '../../context/DoctorContext'

const DoctorConsultation = () => {
  const { backendUrl, dToken, profileData, getProfileData } = useContext(DoctorContext)
  const [appointments, setAppointments] = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showWizard, setShowWizard] = useState(false)
  const [step, setStep] = useState(1)

  const [labCatalog, setLabCatalog] = useState([])
  const [labCategoryKey, setLabCategoryKey] = useState('')
  const [labSearch, setLabSearch] = useState('')
  const [labItems, setLabItems] = useState([])

  const [medicines, setMedicines] = useState([])
  const [medSearch, setMedSearch] = useState('')
  const [pharmacyItems, setPharmacyItems] = useState([])

  const [feesCatalog, setFeesCatalog] = useState([])
  const [feesCategoryKey, setFeesCategoryKey] = useState('')
  const [surgeryItems, setSurgeryItems] = useState([])

  const [condition, setCondition] = useState('')
  const [notes, setNotes] = useState('')

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const slotDateFormat = (slotDate) => {
    if (!slotDate) return ''
    const [day, month, year] = slotDate.split('_').map(Number)
    return `${day} ${months[Math.max(0, month - 1)]} ${year}`
  }

  useEffect(() => {
    if (dToken) getProfileData()
  }, [dToken])

  useEffect(() => {
    const load = async () => {
      if (!dToken) return
      try {
        const { data } = await axios.get(backendUrl + '/api/doctor/today-appointments', { headers: { dtoken: dToken } })
        if (data?.success) setAppointments(data.appointments || [])
      } catch (err) {
        toast.error(err.message)
      }
    }
    load()
  }, [backendUrl, dToken])

  const patients = useMemo(() => {
    const map = new Map()
    appointments.forEach((appt) => {
      const user = appt?.userData
      if (user?._id && !map.has(user._id)) {
        map.set(user._id, {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          age: user.age,
          image: user.image,
        })
      }
    })
    return Array.from(map.values())
  }, [appointments])

  const filteredAppointments = useMemo(() => {
    if (!selectedPatientId) return appointments
    return appointments.filter(a => a.userId === selectedPatientId)
  }, [appointments, selectedPatientId])

  const openWizard = async (appointment) => {
    setSelectedAppointment(appointment)
    setShowWizard(true)
    setStep(1)
    setCondition('')
    setNotes('')
    setLabItems([])
    setPharmacyItems([])
    setSurgeryItems([])

    try {
      const [labRes, medRes, feesRes] = await Promise.all([
        axios.get(backendUrl + '/api/doctor/lab-catalog', { headers: { dtoken: dToken } }),
        axios.get(backendUrl + '/api/doctor/medicines', { headers: { dtoken: dToken } }),
        axios.get(backendUrl + '/api/doctor/fees-catalog', { headers: { dtoken: dToken } })
      ])

      if (labRes?.data?.success) {
        const categories = labRes.data.categories || []
        setLabCatalog(categories)
        const firstKey = (categories[0]?.key || categories[0]?.name) || ''
        setLabCategoryKey(firstKey)
      }
      if (medRes?.data?.success) {
        setMedicines(medRes.data.medicines || [])
      }
      if (feesRes?.data?.success) {
        const categories = feesRes.data.categories || []
        setFeesCatalog(categories)
        const surgeryCategories = categories.filter(c => {
          const name = (c.name || '').toLowerCase()
          return name.includes('common') || name.includes('advance')
        })
        const firstKey = (surgeryCategories[0]?.key || surgeryCategories[0]?.name) || ''
        setFeesCategoryKey(firstKey)
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  const selectedLabCategory = useMemo(() => {
    if (!labCategoryKey) return null
    return labCatalog.find(c => (c.key || c.name) === labCategoryKey) || null
  }, [labCatalog, labCategoryKey])

  const filteredLabItems = useMemo(() => {
    const items = selectedLabCategory?.items || []
    if (!labSearch.trim()) return items
    const q = labSearch.trim().toLowerCase()
    return items.filter(it => (it.name || '').toLowerCase().includes(q))
  }, [selectedLabCategory, labSearch])

  const toggleLabItem = (categoryName, item) => {
    const key = `${categoryName}::${item.name}`
    const exists = labItems.find(i => i.key === key)
    if (exists) {
      setLabItems(prev => prev.filter(i => i.key !== key))
    } else {
      setLabItems(prev => ([
        ...prev,
        { key, name: item.name, price: Number(item.price || 0), category: categoryName }
      ]))
    }
  }

  const filteredMedicines = useMemo(() => {
    if (!medSearch.trim()) return medicines
    const q = medSearch.trim().toLowerCase()
    return medicines.filter(m => (m.name || '').toLowerCase().includes(q))
  }, [medicines, medSearch])

  const surgeryCategories = useMemo(() => {
    return feesCatalog.filter(c => {
      const name = (c.name || '').toLowerCase()
      return name.includes('common') || name.includes('advance')
    })
  }, [feesCatalog])

  const selectedFeesCategory = useMemo(() => {
    if (!feesCategoryKey) return null
    return feesCatalog.find(c => (c.key || c.name) === feesCategoryKey) || null
  }, [feesCatalog, feesCategoryKey])

  const toggleFeeItem = (categoryName, item) => {
    const key = `${categoryName}::${item.name}`
    const exists = surgeryItems.find(i => i.key === key)
    if (exists) {
      setSurgeryItems(prev => prev.filter(i => i.key !== key))
    } else {
      setSurgeryItems(prev => ([
        ...prev,
        { key, name: item.name, price: Number(item.price || 0), category: categoryName }
      ]))
    }
  }

  const toggleMedicine = (medicine) => {
    const exists = pharmacyItems.find(i => i.id === medicine._id)
    if (exists) {
      setPharmacyItems(prev => prev.filter(i => i.id !== medicine._id))
    } else {
      setPharmacyItems(prev => ([
        ...prev,
        { id: medicine._id, name: medicine.name, price: Number(medicine.price || 0), qty: 1, category: medicine.category }
      ]))
    }
  }

  const updateMedicineQty = (id, qty) => {
    setPharmacyItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }

  const onSubmit = async () => {
    if (!selectedAppointment?._id) return
    try {
      const payload = {
        appointmentId: selectedAppointment._id,
        condition,
        notes,
        labItems: labItems.map(({ key, ...rest }) => rest),
        pharmacyItems: pharmacyItems.map(({ id, ...rest }) => rest),
        surgeryItems: surgeryItems.map(({ key, ...rest }) => rest)
      }
      const { data } = await axios.post(backendUrl + '/api/doctor/consultation', payload, { headers: { dtoken: dToken } })
      if (data?.success) {
        toast.success('Consultation saved')
        setShowWizard(false)
      } else {
        toast.error(data?.message || 'Failed to save')
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className='w-full p-6 h-[calc(100vh-120px)] overflow-hidden'>
      <div className='bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-[300px_1fr] h-full'>
        <aside className='border-r border-slate-200'>
          <div className='p-4 border-b'>
            <h2 className='font-semibold text-slate-800'>Patients</h2>
            <p className='text-xs text-slate-500'>Today\'s appointments</p>
          </div>
          <div className='h-full overflow-y-auto'>
            {patients.length === 0 && (
              <p className='p-4 text-sm text-slate-500'>No appointments today.</p>
            )}
            {patients.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPatientId(p.id)}
                className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition ${selectedPatientId === p.id ? 'bg-slate-50' : ''}`}
              >
                <div className='flex items-center gap-3'>
                  <img src={p.image} alt='' className='w-10 h-10 rounded-full object-cover border' />
                  <div className='flex-1 min-w-0'>
                    <p className='font-medium text-slate-800 truncate'>{p.name || p.email}</p>
                    <p className='text-xs text-slate-500 truncate'>{p.phone || p.email}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className='flex flex-col h-full min-h-0'>
          <div className='p-4 border-b'>
            <h2 className='font-semibold text-slate-800'>Today\'s Appointments</h2>
          </div>
          <div className='flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-0'>
            {filteredAppointments.length === 0 && (
              <div className='text-sm text-slate-500 bg-white border border-slate-200 rounded-lg p-3'>
                Select a patient to view appointments.
              </div>
            )}
            {filteredAppointments.map((appt) => (
              <div key={appt._id} className='bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4'>
                <div>
                  <p className='font-medium text-slate-800'>{appt?.userData?.name || 'Patient'}</p>
                  <p className='text-xs text-slate-500'>{slotDateFormat(appt.slotDate)} • {appt.slotTime}</p>
                </div>
                <button
                  onClick={() => openWizard(appt)}
                  className='px-3 py-2 text-xs rounded-lg bg-primary text-white hover:opacity-90'
                >
                  Start Consultation
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {showWizard && selectedAppointment && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'>
          <div className='bg-white rounded-2xl shadow-xl max-w-5xl w-full overflow-hidden'>
            <div className='p-4 border-b flex items-center justify-between'>
              <div>
                <p className='font-semibold text-slate-800'>Consultation Wizard</p>
                <p className='text-xs text-slate-500'>Step {step} of 3</p>
              </div>
              <button onClick={() => setShowWizard(false)} className='text-slate-500 hover:text-slate-700'>×</button>
            </div>

            <div className='p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-b'>
              <div>
                <p className='text-slate-500'>Patient</p>
                <p className='font-medium text-slate-800'>{selectedAppointment?.userData?.name}</p>
              </div>
              <div>
                <p className='text-slate-500'>Appointment</p>
                <p className='font-medium text-slate-800'>{slotDateFormat(selectedAppointment?.slotDate)} • {selectedAppointment?.slotTime}</p>
              </div>
              <div>
                <p className='text-slate-500'>Doctor</p>
                <p className='font-medium text-slate-800'>{profileData?.name || selectedAppointment?.docData?.name}</p>
              </div>
              <div>
                <p className='text-slate-500'>Contact</p>
                <p className='font-medium text-slate-800'>{selectedAppointment?.userData?.phone || '-'}</p>
              </div>
            </div>

            <div className='p-4'>
              <label className='text-xs text-slate-500'>Condition / Diagnosis</label>
              <textarea value={condition} onChange={(e) => setCondition(e.target.value)} className='w-full border rounded-lg p-2 mt-1 text-sm' rows={2} />
              <label className='text-xs text-slate-500 mt-3 block'>Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className='w-full border rounded-lg p-2 mt-1 text-sm' rows={2} />
            </div>

            <div className='p-4 pt-0'>
              <div className='flex items-center gap-2 mb-3 flex-wrap'>
                <button onClick={() => setStep(1)} className={`px-3 py-1.5 text-xs rounded-full border ${step === 1 ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600'}`}>Lab Tests</button>
                <button onClick={() => setStep(2)} className={`px-3 py-1.5 text-xs rounded-full border ${step === 2 ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600'}`}>Pharmacy</button>
                <button onClick={() => setStep(3)} className={`px-3 py-1.5 text-xs rounded-full border ${step === 3 ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600'}`}>Surgeries</button>
              </div>

              {step === 1 ? (
                <div className='grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4'>
                  <div className='border rounded-lg p-3 max-h-80 overflow-y-auto'>
                    {(labCatalog || []).map((c) => (
                      <button
                        key={c.key || c.name}
                        onClick={() => setLabCategoryKey(c.key || c.name)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${labCategoryKey === (c.key || c.name) ? 'bg-primary text-white' : 'hover:bg-slate-50'}`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                  <div className='border rounded-lg p-3'>
                    <input
                      value={labSearch}
                      onChange={(e) => setLabSearch(e.target.value)}
                      placeholder='Search tests'
                      className='w-full text-sm px-3 py-2 border rounded-lg mb-3'
                    />
                    <div className='max-h-64 overflow-y-auto space-y-2'>
                      {filteredLabItems.map((it) => {
                        const key = `${selectedLabCategory?.name}::${it.name}`
                        const selected = labItems.find(i => i.key === key)
                        return (
                          <button
                            key={key}
                            onClick={() => toggleLabItem(selectedLabCategory?.name, it)}
                            className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-lg border ${selected ? 'border-primary bg-primary/5' : 'border-slate-200'}`}
                          >
                            <span>{it.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : step === 2 ? (
                <div className='border rounded-lg p-3'>
                  <input
                    value={medSearch}
                    onChange={(e) => setMedSearch(e.target.value)}
                    placeholder='Search medicines'
                    className='w-full text-sm px-3 py-2 border rounded-lg mb-3'
                  />
                  <div className='max-h-72 overflow-y-auto space-y-2'>
                    {filteredMedicines.map((m) => {
                      const selected = pharmacyItems.find(i => i.id === m._id)
                      return (
                        <div key={m._id} className='flex items-center justify-between border rounded-lg px-3 py-2'>
                          <div>
                            <p className='text-sm font-medium text-slate-800'>{m.name}</p>
                            <p className='text-xs text-slate-500'>{m.category}</p>
                          </div>
                          <div className='flex items-center gap-2'>
                            {selected && (
                              <input
                                type='number'
                                min='1'
                                value={selected.qty}
                                onChange={(e) => updateMedicineQty(m._id, Number(e.target.value))}
                                className='w-16 text-xs border rounded px-2 py-1'
                              />
                            )}
                            <button
                              onClick={() => toggleMedicine(m)}
                              className={`text-xs px-3 py-1.5 rounded-full border ${selected ? 'border-primary text-primary' : 'border-slate-200 text-slate-600'}`}
                            >
                              {selected ? 'Remove' : 'Add'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4'>
                  <div className='border rounded-lg p-3 max-h-80 overflow-y-auto'>
                    {surgeryCategories.map((c) => (
                      <button
                        key={c.key || c.name}
                        onClick={() => setFeesCategoryKey(c.key || c.name)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${feesCategoryKey === (c.key || c.name) ? 'bg-primary text-white' : 'hover:bg-slate-50'}`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                  <div className='border rounded-lg p-3'>
                    <div className='max-h-64 overflow-y-auto space-y-2'>
                      {(selectedFeesCategory?.items || []).map((it) => {
                        const key = `${selectedFeesCategory?.name}::${it.name}`
                        const selected = surgeryItems.find(i => i.key === key)
                        return (
                          <button
                            key={key}
                            onClick={() => toggleFeeItem(selectedFeesCategory?.name, it)}
                            className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-lg border ${selected ? 'border-primary bg-primary/5' : 'border-slate-200'}`}
                          >
                            <span>{it.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className='p-4 border-t flex items-center justify-between'>
              <div className='text-xs text-slate-500'>
                Selected: {labItems.length} tests, {pharmacyItems.length} medicines, {surgeryItems.length} procedures
              </div>
              <div className='flex items-center gap-2'>
                {step > 1 && (
                  <button onClick={() => setStep(step - 1)} className='px-3 py-2 text-xs border rounded-lg'>Back</button>
                )}
                {step < 3 ? (
                  <button onClick={() => setStep(step + 1)} className='px-3 py-2 text-xs bg-primary text-white rounded-lg'>Next</button>
                ) : (
                  <button onClick={onSubmit} className='px-3 py-2 text-xs bg-primary text-white rounded-lg'>Submit</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorConsultation
