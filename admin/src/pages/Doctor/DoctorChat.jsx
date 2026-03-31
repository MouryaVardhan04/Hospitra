import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { io } from 'socket.io-client'
import axios from 'axios'
import { toast } from 'react-toastify'

const DoctorChat = () => {
  const { backendUrl, dToken, appointments, getAppointments, profileData, getProfileData } = useContext(DoctorContext)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [patientMeta, setPatientMeta] = useState({})
  const [patientPrescriptions, setPatientPrescriptions] = useState([])
  const [patientConsultations, setPatientConsultations] = useState([])
  const [selectedConsultation, setSelectedConsultation] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const socketRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (dToken) {
      getAppointments()
      getProfileData()
    }
  }, [dToken])

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const slotDateFormat = (slotDate) => {
    if (!slotDate) return ''
    const dateArray = slotDate.split('_')
    const monthIndex = Math.max(0, Number(dateArray[1]) - 1)
    return dateArray[0] + ' ' + months[monthIndex] + ' ' + dateArray[2]
  }

  const formatTime = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleString()
  }

  const formatDateLabel = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTimeOnly = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  const formatRelative = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const diffMs = Date.now() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHrs = Math.floor(diffMins / 60)
    if (diffHrs < 24) return `${diffHrs}h ago`
    const diffDays = Math.floor(diffHrs / 24)
    return `${diffDays}d ago`
  }

  const seenKey = (userId) => `doctorChatSeen:${profileData?._id || 'doctor'}:${userId}`

  const patients = useMemo(() => {
    const map = new Map()
    appointments?.forEach((appt) => {
      const user = appt?.userData
      if (user?._id && !map.has(user._id)) {
        map.set(user._id, {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          dob: user.dob,
          gender: user.gender,
          address: user.address,
          image: user.image,
          appointments: [],
        })
      }
      if (user?._id) {
        const entry = map.get(user._id)
        entry.appointments.push(appt)
      }
    })
    return Array.from(map.values()).map((p) => {
      const sorted = [...p.appointments].sort((a, b) => (b.date || 0) - (a.date || 0))
      const hasAccepted = sorted.some(a => a.isAccepted && !a.cancelled)
      return { ...p, appointments: sorted, latest: sorted[0], hasAccepted }
    })
  }, [appointments])

  useEffect(() => {
    const totalUnread = Object.values(patientMeta).reduce((sum, item) => sum + (item?.unreadCount || 0), 0)
    const totalUnreadPersons = Object.values(patientMeta).filter(item => (item?.unreadCount || 0) > 0).length
    localStorage.setItem('doctorChatUnreadTotal', String(totalUnread))
    localStorage.setItem('doctorChatUnreadPersons', String(totalUnreadPersons))
  }, [patientMeta])

  useEffect(() => {
    const loadPatientMeta = async () => {
      if (!dToken || !profileData?._id || patients.length === 0) return

      try {
        const results = await Promise.all(
          patients.map(async (p) => {
            try {
              const { data } = await axios.get(backendUrl + '/api/chat/history', {
                headers: { dtoken: dToken },
                params: { userId: p.id }
              })
              const messages = data?.messages || []
              const lastMessage = messages[messages.length - 1] || null
              const lastUserMessage = [...messages].reverse().find(m => m.senderRole === 'user') || null
              const lastSeen = Number(localStorage.getItem(seenKey(p.id)) || 0)
              const unreadCount = messages.filter(m => m.senderRole === 'user' && new Date(m.createdAt).getTime() > lastSeen).length

              return {
                id: p.id,
                lastMessage,
                lastUserMessageAt: lastUserMessage?.createdAt || null,
                unreadCount,
              }
            } catch (err) {
              return { id: p.id, lastMessage: null, lastUserMessageAt: null, unreadCount: 0 }
            }
          })
        )

        const meta = results.reduce((acc, item) => {
          acc[item.id] = item
          return acc
        }, {})
        setPatientMeta(meta)
      } catch (err) {
        console.warn(err)
      }
    }

    loadPatientMeta()
  }, [backendUrl, dToken, profileData?._id, patients])

  useEffect(() => {
    if (!dToken || !profileData?._id || !selectedUserId) return

    const socket = io(backendUrl, {
      auth: { token: dToken, role: 'doctor' }
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join', { userId: selectedUserId, doctorId: profileData._id })
    })

    socket.on('message', (msg) => {
      setMessages(prev => [...prev, msg])
      setPatientMeta(prev => {
        const current = prev[selectedUserId] || {}
        const lastUserMessageAt = msg.senderRole === 'user' ? msg.createdAt : current.lastUserMessageAt
        return {
          ...prev,
          [selectedUserId]: {
            ...current,
            lastMessage: msg,
            lastUserMessageAt,
            unreadCount: 0,
          }
        }
      })
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    })

    return () => socket.disconnect()
  }, [backendUrl, dToken, profileData?._id, selectedUserId])

  useEffect(() => {
    const loadPrescriptions = async () => {
      if (!showProfile || !dToken || !selectedUserId) return
      try {
        const { data } = await axios.get(backendUrl + '/api/doctor/patient-prescriptions', {
          headers: { dtoken: dToken },
          params: { userId: selectedUserId }
        })
        if (data?.success) {
          setPatientPrescriptions(data.invoices || [])
        } else {
          setPatientPrescriptions([])
        }
      } catch (err) {
        setPatientPrescriptions([])
      }
    }
    loadPrescriptions()
  }, [backendUrl, dToken, selectedUserId, showProfile])

  useEffect(() => {
    const loadConsultations = async () => {
      if (!showProfile || !dToken || !selectedUserId) return
      try {
        const { data } = await axios.get(backendUrl + '/api/doctor/patient-consultations', {
          headers: { dtoken: dToken },
          params: { userId: selectedUserId }
        })
        if (data?.success) {
          setPatientConsultations(data.consultations || [])
        } else {
          setPatientConsultations([])
        }
      } catch (err) {
        setPatientConsultations([])
      }
    }
    loadConsultations()
  }, [backendUrl, dToken, selectedUserId, showProfile])

  useEffect(() => {
    if (!dToken || !profileData?._id || !selectedUserId) return
    const loadHistory = async () => {
      try {
        const { data } = await axios.get(backendUrl + '/api/chat/history', {
          headers: { dtoken: dToken },
          params: { userId: selectedUserId }
        })
        if (data?.success) {
          setMessages(data.messages || [])
          localStorage.setItem(seenKey(selectedUserId), String(Date.now()))
          setPatientMeta(prev => ({
            ...prev,
            [selectedUserId]: { ...prev[selectedUserId], unreadCount: 0 }
          }))
        }
      } catch (err) {
        console.warn(err)
      }
    }
    loadHistory()
  }, [backendUrl, dToken, profileData?._id, selectedUserId])

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!input.trim() || !profileData?._id || !selectedUserId) return

    socketRef.current?.emit('message', {
      userId: selectedUserId,
      doctorId: profileData._id,
      senderId: profileData._id,
      senderRole: 'doctor',
      receiverId: selectedUserId,
      receiverRole: 'user',
      messageType: 'text',
      text: input.trim(),
    })
    setInput('')
  }

  const handleFileUpload = async (file) => {
    if (!file || !dToken || !profileData?._id || !selectedUserId) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await axios.post(backendUrl + '/api/chat/upload', formData, {
        headers: { dtoken: dToken }
      })
      if (!data?.success) throw new Error(data?.message || 'Upload failed')

      socketRef.current?.emit('message', {
        userId: selectedUserId,
        doctorId: profileData._id,
        senderId: profileData._id,
        senderRole: 'doctor',
        receiverId: selectedUserId,
        receiverRole: 'user',
        messageType: 'file',
        text: '',
        file: data.file,
      })
    } catch (err) {
      toast.error(err?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    if (!selectedUserId || !scrollRef.current) return
    requestAnimationFrame(() => {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    })
  }, [messages, selectedUserId])

  const selectedPatient = patients.find(p => p.id === selectedUserId)
  const selectedMeta = patientMeta[selectedUserId] || {}
  const canChat = Boolean(selectedPatient?.hasAccepted && !selectedPatient?.latest?.cancelled)
  const lastSeenLabel = selectedMeta.lastUserMessageAt ? formatRelative(selectedMeta.lastUserMessageAt) : 'No activity'
  const isOnline = selectedMeta.lastUserMessageAt ? (Date.now() - new Date(selectedMeta.lastUserMessageAt).getTime() < 2 * 60 * 1000) : false

  const messagesWithDates = useMemo(() => {
    const items = []
    let lastDate = ''
    let insertedUnread = false
    const lastSeen = Number(localStorage.getItem(seenKey(selectedUserId)) || 0)

    messages.forEach((msg) => {
      const msgTime = new Date(msg.createdAt).getTime()
      if (!insertedUnread && lastSeen && msg.senderRole === 'user' && msgTime > lastSeen) {
        items.push({ type: 'unread', id: 'unread-divider', label: 'Unread messages' })
        insertedUnread = true
      }
      const dateLabel = formatDateLabel(msg.createdAt)
      if (dateLabel && dateLabel !== lastDate) {
        items.push({ type: 'date', id: `date-${dateLabel}`, label: dateLabel })
        lastDate = dateLabel
      }
      items.push({ type: 'message', id: msg._id || `${msg.createdAt}-${Math.random()}`, data: msg })
    })
    return items
  }, [messages, selectedUserId])

  const orderedPatients = useMemo(() => {
    return [...patients].sort((a, b) => {
      const aTime = new Date(patientMeta[a.id]?.lastMessage?.createdAt || 0).getTime()
      const bTime = new Date(patientMeta[b.id]?.lastMessage?.createdAt || 0).getTime()
      return bTime - aTime
    })
  }, [patients, patientMeta])

  return (
    <div className='w-full p-6 h-[calc(100vh-120px)] overflow-hidden'>
      <div className='bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-[360px_1fr] h-full'>
        {/* Left: Appointments list */}
        <aside className='border-r border-slate-200 bg-white'>
          <div className='p-4 border-b border-slate-200 flex items-center justify-between'>
            <div>
              <h2 className='font-semibold text-slate-800'>Appointments</h2>
              <p className='text-xs text-slate-500'>Patients you can chat with</p>
            </div>
          </div>
          <div className='h-full overflow-y-auto'>
            {patients.length === 0 && (
              <p className='p-4 text-sm text-slate-500'>No appointments yet.</p>
            )}
            {orderedPatients.map((p) => {
              const meta = patientMeta[p.id] || {}
              const lastMsg = meta.lastMessage
              const lastUserMessageAt = meta.lastUserMessageAt
              const online = lastUserMessageAt ? (Date.now() - new Date(lastUserMessageAt).getTime() < 2 * 60 * 1000) : false
              const lastSeen = lastUserMessageAt ? formatRelative(lastUserMessageAt) : 'No activity'
              const hasUnread = meta.unreadCount > 0
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedUserId(p.id)
                    localStorage.setItem(seenKey(p.id), String(Date.now()))
                    setPatientMeta(prev => ({
                      ...prev,
                      [p.id]: { ...prev[p.id], unreadCount: 0 }
                    }))
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition ${selectedUserId === p.id ? 'bg-slate-50' : ''}`}
                >
                  <div className='flex items-center gap-3'>
                    <img src={p.image} alt='' className='w-10 h-10 rounded-full object-cover border' />
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between gap-2'>
                        <p className={`truncate ${hasUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'}`}>{p.name || p.email}</p>
                        {meta.unreadCount > 0 && (
                          <span className='text-xs bg-primary text-white rounded-full px-2 py-0.5'>{meta.unreadCount}</span>
                        )}
                      </div>
                      <p className={`text-xs truncate ${hasUnread ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                        {lastMsg?.messageType === 'file' ? '📎 File' : (lastMsg?.text || 'No messages yet')}
                      </p>
                      <div className='flex items-center justify-between text-[11px] text-slate-400 mt-1'>
                        <span>{p.latest ? `${slotDateFormat(p.latest.slotDate)} • ${p.latest.slotTime}` : 'No appointment date'}</span>
                        <span>{online ? 'Online' : `Last seen ${lastSeen}`}</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Right: Chat section */}
        <section className='flex flex-col h-full min-h-0'>
          <div className='p-4 border-b border-slate-200 flex items-center justify-between'>
            {selectedPatient ? (
              <>
                <div className='flex items-center gap-3'>
                  <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <div>
                    <p className='font-semibold text-slate-800'>{selectedPatient?.name}</p>
                    <p className='text-xs text-slate-500'>{selectedPatient?.email || ''}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-xs text-slate-500'>{isOnline ? 'Online' : `Last seen ${lastSeenLabel}`}</span>
                  <button
                    onClick={() => setShowProfile(true)}
                    className='text-xs px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-50'
                  >
                    Patient Profile
                  </button>
                </div>
              </>
            ) : (
              <div className='h-5' />
            )}
          </div>

          <div ref={scrollRef} className='flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-0'>
            {selectedUserId && !canChat && (
              <div className='text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3'>
                Chat will be enabled after you accept the appointment.
              </div>
            )}
            {selectedUserId && messagesWithDates.map((item) => (
              item.type === 'date' ? (
                <div key={item.id} className='flex items-center justify-center'>
                  <span className='text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm'>
                    {item.label}
                  </span>
                </div>
              ) : item.type === 'unread' ? (
                <div key={item.id} className='flex items-center justify-center'>
                  <span className='text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full'>
                    {item.label}
                  </span>
                </div>
              ) : (
                <div
                  key={item.id}
                  className={`max-w-[70%] w-fit px-4 py-2 rounded-2xl text-sm shadow-sm ${item.data.senderRole === 'doctor' ? 'ml-auto bg-emerald-500 text-white rounded-br-md' : 'mr-auto bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-md'}`}
                >
                  {item.data.messageType === 'file' && item.data.file?.url ? (
                    item.data.file.type?.startsWith('image') ? (
                      <img src={item.data.file.url} alt={item.data.file.name || 'file'} className='rounded-lg max-w-[240px]' />
                    ) : (
                      <a href={item.data.file.url} target='_blank' rel='noreferrer' className={`underline ${item.data.senderRole === 'doctor' ? 'text-white/90' : 'text-slate-700'}`}>
                        {item.data.file.name || 'Download file'}
                      </a>
                    )
                  ) : (
                    item.data.text
                  )}
                  <div className={`text-[10px] mt-1 text-right ${item.data.senderRole === 'doctor' ? 'text-emerald-50/80' : 'text-slate-500'}`}>
                    {formatTimeOnly(item.data.createdAt)}
                  </div>
                </div>
              )
            ))}
          </div>

          {selectedUserId && (
            <form onSubmit={handleSend} className='mt-auto p-4 border-t border-slate-200 bg-white flex items-center gap-2 sticky bottom-0'>
              <label className='cursor-pointer text-sm text-slate-500'>
                <input
                  type='file'
                  className='hidden'
                  accept='image/*,application/pdf'
                  onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  disabled={!selectedUserId || !canChat || uploading}
                />
                📎
              </label>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Type a message...'
                className='flex-1 bg-slate-50 rounded-full px-4 py-2 outline-primary border border-slate-200 focus:ring-2 focus:ring-emerald-200'
                disabled={!selectedUserId || !canChat}
              />
              <button type='submit' className='bg-primary text-white rounded-full px-4 py-2 hover:opacity-90 shadow' disabled={!selectedUserId || !canChat}>Send</button>
            </form>
          )}
        </section>
      </div>

      {showProfile && selectedPatient && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'>
          <div className='bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden'>
            <div className='p-4 border-b flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <img src={selectedPatient.image} alt='' className='w-12 h-12 rounded-full object-cover border' />
                <div>
                  <p className='font-semibold text-slate-800'>{selectedPatient.name || selectedPatient.email}</p>
                  <p className='text-xs text-slate-500'>{selectedPatient.email}</p>
                </div>
              </div>
              <button onClick={() => setShowProfile(false)} className='text-slate-500 hover:text-slate-700'>×</button>
            </div>

            <div className='p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
              <div>
                <p className='text-slate-500'>Phone</p>
                <p className='font-medium text-slate-800'>{selectedPatient.phone || '—'}</p>
              </div>
              <div>
                <p className='text-slate-500'>Gender</p>
                <p className='font-medium text-slate-800'>{selectedPatient.gender || '—'}</p>
              </div>
              <div>
                <p className='text-slate-500'>DOB</p>
                <p className='font-medium text-slate-800'>{selectedPatient.dob || '—'}</p>
              </div>
              <div>
                <p className='text-slate-500'>Address</p>
                <p className='font-medium text-slate-800'>
                  {selectedPatient.address?.line1 || ''} {selectedPatient.address?.line2 || ''}
                </p>
              </div>
            </div>

            <div className='p-4 border-t'>
              <p className='text-sm font-semibold text-slate-800 mb-2'>Recent Appointments</p>
              <div className='space-y-2 max-h-48 overflow-y-auto'>
                {selectedPatient.appointments.slice(0, 5).map((appt) => (
                  <div key={appt._id} className='text-xs flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2'>
                    <span>{slotDateFormat(appt.slotDate)} • {appt.slotTime}</span>
                    <span className={`px-2 py-0.5 rounded-full border ${appt.cancelled ? 'border-red-300 text-red-600' : appt.isCompleted ? 'border-green-300 text-green-600' : appt.isAccepted ? 'border-emerald-300 text-emerald-600' : 'border-amber-300 text-amber-600'}`}>
                      {appt.cancelled ? 'Cancelled' : appt.isCompleted ? 'Completed' : appt.isAccepted ? 'Accepted' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className='p-4 border-t'>
              <p className='text-sm font-semibold text-slate-800 mb-2'>Recent Diagnosis</p>
              {patientConsultations.length === 0 ? (
                <p className='text-xs text-slate-500'>No diagnosis records available.</p>
              ) : (
                <div className='space-y-2 max-h-48 overflow-y-auto'>
                  {patientConsultations.map((c) => (
                    <button
                      key={c._id}
                      type='button'
                      onClick={() => setSelectedConsultation(c)}
                      className='w-full text-left border border-slate-100 rounded-lg px-3 py-2 text-xs hover:bg-slate-50'
                    >
                      <div className='flex items-center justify-between text-slate-500'>
                        <span>{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</span>
                        <span className='text-slate-700 font-medium'>View</span>
                      </div>
                      <p className='mt-1 text-slate-800 font-semibold'>{c.condition || 'Diagnosis'}</p>
                      {c.notes && <p className='mt-1 text-slate-500 line-clamp-2'>{c.notes}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {selectedConsultation && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'>
          <div className='bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden'>
            <div className='p-4 border-b flex items-center justify-between'>
              <div>
                <p className='text-sm text-slate-500'>Diagnosis Details</p>
                <p className='font-semibold text-slate-800'>{selectedConsultation.condition || 'Diagnosis'}</p>
              </div>
              <button onClick={() => setSelectedConsultation(null)} className='text-slate-500 hover:text-slate-700'>×</button>
            </div>

            <div className='p-4 space-y-4 text-sm'>
              {selectedConsultation.notes && (
                <div>
                  <p className='text-slate-500'>Notes</p>
                  <p className='text-slate-800'>{selectedConsultation.notes}</p>
                </div>
              )}

              <div>
                <p className='text-slate-500 mb-2'>Lab Reports</p>
                {selectedConsultation.labAssignment ? (
                  <div className='border border-slate-100 rounded-lg p-3'>
                    <div className='flex items-center justify-between text-xs text-slate-500'>
                      <span>Status: {selectedConsultation.labAssignment.status || 'Assigned'}</span>
                      <span>{selectedConsultation.labAssignment.reportGeneratedAt ? new Date(selectedConsultation.labAssignment.reportGeneratedAt).toLocaleString() : ''}</span>
                    </div>
                    {(selectedConsultation.labAssignment.items || []).length === 0 ? (
                      <p className='text-xs text-slate-500 mt-2'>No lab items.</p>
                    ) : (
                      <ul className='mt-2 space-y-1 text-xs text-slate-700'>
                        {selectedConsultation.labAssignment.items.map((item, idx) => (
                          <li key={idx} className='flex items-center justify-between'>
                            <span>{item.name}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <p className='text-xs text-slate-500'>No lab assignment.</p>
                )}
              </div>

              <div>
                <p className='text-slate-500 mb-2'>Pharmacy Details</p>
                {(selectedConsultation.pharmacyItems || []).length === 0 ? (
                  <p className='text-xs text-slate-500'>No pharmacy items.</p>
                ) : (
                  <div className='border border-slate-100 rounded-lg p-3'>
                    <ul className='space-y-1 text-xs text-slate-700'>
                      {selectedConsultation.pharmacyItems.map((item, idx) => (
                        <li key={idx} className='flex items-center justify-between'>
                          <span>{item.name} × {item.qty || 1}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorChat