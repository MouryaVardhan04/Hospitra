import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useSearchParams } from 'react-router-dom'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [appointments, setAppointments] = useState([])
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [chatEnabled, setChatEnabled] = useState(false)
  const [doctorMeta, setDoctorMeta] = useState({})
  const [showDoctorProfile, setShowDoctorProfile] = useState(false)
  const scrollRef = useRef(null)
  const socketRef = useRef(null)
  const { backendUrl, token, userData } = useContext(AppContext)
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('appointmentId') || ''

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const slotDateFormat = (slotDate) => {
    if (!slotDate) return ''
    const dateArray = slotDate.split('_')
    const monthIndex = Math.max(0, Number(dateArray[1]) - 1)
    return dateArray[0] + ' ' + months[monthIndex] + ' ' + dateArray[2]
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

  const seenKey = (doctorId) => `userChatSeen:${userData?._id || 'user'}:${doctorId}`

  const messagesWithDates = useMemo(() => {
    const items = []
    let lastDate = ''
    let insertedUnread = false
    const lastSeen = Number(localStorage.getItem(seenKey(selectedDoctorId)) || 0)

    messages.forEach((msg) => {
      const msgTime = new Date(msg.createdAt).getTime()
      if (!insertedUnread && lastSeen && msg.senderRole === 'doctor' && msgTime > lastSeen) {
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
  }, [messages, selectedDoctorId])

  const doctors = useMemo(() => {
    const map = new Map()
    appointments.forEach((appt) => {
      if (!appt?.docId) return
      const doc = appt.docData || {}
      if (!map.has(appt.docId)) {
        map.set(appt.docId, {
          id: appt.docId,
          name: doc.name,
          email: doc.email,
          image: doc.image,
          speciality: doc.speciality,
          appointments: [],
        })
      }
      map.get(appt.docId).appointments.push(appt)
    })

    return Array.from(map.values()).map((d) => {
      const sorted = [...d.appointments].sort((a, b) => (b.date || 0) - (a.date || 0))
      const hasAccepted = sorted.some(a => a.isAccepted && !a.cancelled)
      return { ...d, appointments: sorted, latest: sorted[0], hasAccepted }
    })
  }, [appointments])

  const orderedDoctors = useMemo(() => {
    return [...doctors].sort((a, b) => {
      const aTime = new Date(doctorMeta[a.id]?.lastMessage?.createdAt || 0).getTime()
      const bTime = new Date(doctorMeta[b.id]?.lastMessage?.createdAt || 0).getTime()
      return bTime - aTime
    })
  }, [doctors, doctorMeta])

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!input.trim() || !chatEnabled) return
    if (!userData?._id || !selectedDoctorId) return

    const payload = {
      userId: userData._id,
      doctorId: selectedDoctorId,
      senderId: userData._id,
      senderRole: 'user',
      receiverId: selectedDoctorId,
      receiverRole: 'doctor',
      messageType: 'text',
      text: input.trim(),
    }

    socketRef.current?.emit('message', payload)
    setInput('')
  }

  const handleFileUpload = async (file) => {
    if (!file || !token || !chatEnabled) return
    if (!userData?._id || !selectedDoctorId) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await axios.post(backendUrl + '/api/chat/upload', formData, {
        headers: { token }
      })
      if (!data?.success) throw new Error(data?.message || 'Upload failed')

      socketRef.current?.emit('message', {
        userId: userData._id,
        doctorId: selectedDoctorId,
        senderId: userData._id,
        senderRole: 'user',
        receiverId: selectedDoctorId,
        receiverRole: 'doctor',
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
    if (!selectedDoctorId || !scrollRef.current) return
    requestAnimationFrame(() => {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    })
  }, [messages, selectedDoctorId])

  useEffect(() => {
    if (!token || !userData?._id) return
    if (!selectedDoctorId) return

    const socket = io(backendUrl, {
      auth: { token, role: 'user' }
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join', { userId: userData._id, doctorId: selectedDoctorId })
    })

    socket.on('message', (msg) => {
      setMessages(prev => [...prev, msg])
      setDoctorMeta(prev => {
        const current = prev[selectedDoctorId] || {}
        const lastDoctorMessageAt = msg.senderRole === 'doctor' ? msg.createdAt : current.lastDoctorMessageAt
        return {
          ...prev,
          [selectedDoctorId]: {
            ...current,
            lastMessage: msg,
            lastDoctorMessageAt,
            unreadCount: 0,
          }
        }
      })
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [backendUrl, token, userData?._id, selectedDoctorId])

  useEffect(() => {
    if (!token || !userData?._id || !selectedDoctorId) return
    const loadHistory = async () => {
      try {
        const { data } = await axios.get(backendUrl + '/api/chat/history', {
          headers: { token },
          params: { doctorId: selectedDoctorId }
        })
        if (data?.success) {
          setMessages(data.messages || [])
          localStorage.setItem(seenKey(selectedDoctorId), String(Date.now()))
          setDoctorMeta(prev => ({
            ...prev,
            [selectedDoctorId]: { ...prev[selectedDoctorId], unreadCount: 0 }
          }))
        }
      } catch (err) {
        console.warn(err)
      }
    }
    loadHistory()
  }, [backendUrl, token, userData?._id, selectedDoctorId])

  useEffect(() => {
    const loadAppointments = async () => {
      if (!token) return
      try {
        setLoadingAppointments(true)
        const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } })
        const appts = data?.appointments || []
        setAppointments(appts)
        if (appointmentId) {
          const appt = appts.find(a => a._id === appointmentId)
          setSelectedAppointmentId(appt?._id || '')
        }
      } catch (err) {
        console.warn(err)
      } finally {
        setLoadingAppointments(false)
      }
    }

    loadAppointments()
  }, [backendUrl, token, appointmentId])

  useEffect(() => {
    if (!selectedAppointmentId) {
      setSelectedDoctorId('')
      setChatEnabled(false)
      setMessages([])
      return
    }
    const appt = appointments.find(a => a._id === selectedAppointmentId)
    setSelectedDoctorId(appt?.docId || '')
    setChatEnabled(Boolean(appt && appt.isAccepted && !appt.cancelled))
  }, [selectedAppointmentId, appointments])

  useEffect(() => {
    const loadDoctorMeta = async () => {
      if (!token || doctors.length === 0) return
      try {
        const results = await Promise.all(
          doctors.map(async (doc) => {
            try {
              const { data } = await axios.get(backendUrl + '/api/chat/history', {
                headers: { token },
                params: { doctorId: doc.id }
              })
              const messages = data?.messages || []
              const lastMessage = messages[messages.length - 1] || null
              const lastDoctorMessage = [...messages].reverse().find(m => m.senderRole === 'doctor') || null
              const lastSeen = Number(localStorage.getItem(seenKey(doc.id)) || 0)
              const unreadCount = messages.filter(m => m.senderRole === 'doctor' && new Date(m.createdAt).getTime() > lastSeen).length

              return {
                id: doc.id,
                lastMessage,
                lastDoctorMessageAt: lastDoctorMessage?.createdAt || null,
                unreadCount,
              }
            } catch (err) {
              return { id: doc.id, lastMessage: null, lastDoctorMessageAt: null, unreadCount: 0 }
            }
          })
        )

        const meta = results.reduce((acc, item) => {
          acc[item.id] = item
          return acc
        }, {})
        setDoctorMeta(meta)
      } catch (err) {
        console.warn(err)
      }
    }

    loadDoctorMeta()
  }, [backendUrl, token, doctors])

  useEffect(() => {
    const totalUnreadPersons = Object.values(doctorMeta).filter(item => (item?.unreadCount || 0) > 0).length
    localStorage.setItem('userChatUnreadPersons', String(totalUnreadPersons))
  }, [doctorMeta])

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId)
  const selectedMeta = doctorMeta[selectedDoctorId] || {}
  const lastSeenLabel = selectedMeta.lastDoctorMessageAt ? formatRelative(selectedMeta.lastDoctorMessageAt) : 'No activity'
  const isOnline = selectedMeta.lastDoctorMessageAt ? (Date.now() - new Date(selectedMeta.lastDoctorMessageAt).getTime() < 2 * 60 * 1000) : false
  const canChat = chatEnabled

  return (
    <div className='w-full p-6 h-[calc(100vh-120px)] overflow-hidden'>
      <div className='bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-[360px_1fr] h-full'>
        {/* Left: Doctors list */}
        <aside className='border-r border-slate-200 bg-white'>
          <div className='p-4 border-b border-slate-200'>
            <h2 className='font-semibold text-slate-800'>Doctors</h2>
            <p className='text-xs text-slate-500'>Appointments you can chat with</p>
          </div>
          <div className='h-full overflow-y-auto'>
            {loadingAppointments && (
              <p className='p-4 text-sm text-slate-500'>Loading...</p>
            )}
            {!loadingAppointments && doctors.length === 0 && (
              <p className='p-4 text-sm text-slate-500'>No appointments yet.</p>
            )}
            {orderedDoctors.map((doc) => {
              const meta = doctorMeta[doc.id] || {}
              const lastMsg = meta.lastMessage
              const lastDoctorMessageAt = meta.lastDoctorMessageAt
              const online = lastDoctorMessageAt ? (Date.now() - new Date(lastDoctorMessageAt).getTime() < 2 * 60 * 1000) : false
              const lastSeen = lastDoctorMessageAt ? formatRelative(lastDoctorMessageAt) : 'No activity'
              const hasUnread = meta.unreadCount > 0
              const latestAppt = doc.latest
              return (
                <button
                  key={doc.id}
                  onClick={() => {
                    const apptId = latestAppt?._id || ''
                    setSelectedAppointmentId(apptId)
                    localStorage.setItem(seenKey(doc.id), String(Date.now()))
                    setDoctorMeta(prev => ({
                      ...prev,
                      [doc.id]: { ...prev[doc.id], unreadCount: 0 }
                    }))
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition ${selectedDoctorId === doc.id ? 'bg-slate-50' : ''}`}
                >
                  <div className='flex items-center gap-3'>
                    <img src={doc.image} alt='' className='w-10 h-10 rounded-full object-cover border' />
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between gap-2'>
                        <p className={`truncate ${hasUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'}`}>{doc.name || doc.email}</p>
                        {meta.unreadCount > 0 && (
                          <span className='text-xs bg-primary text-white rounded-full px-2 py-0.5'>{meta.unreadCount}</span>
                        )}
                      </div>
                      <p className={`text-xs truncate ${hasUnread ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                        {lastMsg?.messageType === 'file' ? '📎 File' : (lastMsg?.text || 'No messages yet')}
                      </p>
                      <div className='flex items-center justify-between text-[11px] text-slate-400 mt-1'>
                        <span>{latestAppt ? `${slotDateFormat(latestAppt.slotDate)} • ${latestAppt.slotTime}` : 'No appointment date'}</span>
                        <span>{online ? 'Online' : `Last seen ${lastSeen}`}</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Right: Chat */}
        <section className='flex flex-col h-full min-h-0'>
          <div className='p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10'>
            {selectedDoctor ? (
              <>
                <div className='flex items-center gap-3'>
                  <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <div>
                    <p className='font-semibold text-slate-800'>{selectedDoctor.name}</p>
                    <p className='text-xs text-slate-500'>{selectedDoctor.speciality || ''}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-xs text-slate-500'>{isOnline ? 'Online' : `Last seen ${lastSeenLabel}`}</span>
                  <button
                    onClick={() => setShowDoctorProfile(true)}
                    className='text-xs px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-50'
                  >
                    Doctor Profile
                  </button>
                </div>
              </>
            ) : (
              <div className='h-5' />
            )}
          </div>

          <div ref={scrollRef} className='flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-0'>
            {selectedDoctorId && !canChat && (
              <div className='sticky top-0 z-20 flex justify-center'>
                <div className='text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 w-fit'>
                  Chat will be available after the doctor accepts your appointment.
                </div>
              </div>
            )}
            {selectedDoctorId && messagesWithDates.map((item) => (
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
                  className={`max-w-[85%] w-fit px-4 py-2 rounded-2xl text-sm shadow-sm ${item.data.senderRole === 'user' ? 'ml-auto bg-emerald-500 text-white rounded-br-md' : 'mr-auto bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-md'}`}
                >
                  {item.data.messageType === 'file' && item.data.file?.url ? (
                    item.data.file.type?.startsWith('image') ? (
                      <img src={item.data.file.url} alt={item.data.file.name || 'file'} className='rounded-lg max-w-[240px]' />
                    ) : (
                      <a href={item.data.file.url} target='_blank' rel='noreferrer' className={`underline ${item.data.senderRole === 'user' ? 'text-white/90' : 'text-slate-700'}`}>
                        {item.data.file.name || 'Download file'}
                      </a>
                    )
                  ) : (
                    item.data.text
                  )}
                  <div className={`text-[10px] mt-1 text-right ${item.data.senderRole === 'user' ? 'text-emerald-50/80' : 'text-slate-500'}`}>
                    {formatTimeOnly(item.data.createdAt)}
                  </div>
                </div>
              )
            ))}
          </div>

          {selectedDoctorId && (
            <form onSubmit={handleSend} className='mt-auto p-4 border-t border-slate-200 bg-white flex items-center gap-2 sticky bottom-0'>
              <label className='cursor-pointer text-sm text-slate-500'>
                <input
                  type='file'
                  className='hidden'
                  accept='image/*,application/pdf'
                  onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  disabled={!selectedDoctorId || !canChat || uploading}
                />
                📎
              </label>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Type a message...'
                className='flex-1 bg-slate-50 rounded-full px-4 py-2 outline-primary border border-slate-200 focus:ring-2 focus:ring-emerald-200'
                disabled={!selectedDoctorId}
              />
              <button
                type='submit'
                className={`rounded-full px-4 py-2 shadow ${(!selectedDoctorId || !canChat) ? 'bg-slate-300 text-slate-600 cursor-not-allowed' : 'bg-primary text-white hover:opacity-90'}`}
                disabled={!selectedDoctorId || !canChat}
              >
                Send
              </button>
            </form>
          )}
        </section>
      </div>

      {showDoctorProfile && selectedDoctor && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'>
          <div className='bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden'>
            <div className='p-4 border-b flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <img src={selectedDoctor.image} alt='' className='w-12 h-12 rounded-full object-cover border' />
                <div>
                  <p className='font-semibold text-slate-800'>{selectedDoctor.name || selectedDoctor.email}</p>
                  <p className='text-xs text-slate-500'>{selectedDoctor.speciality || '—'}</p>
                </div>
              </div>
              <button onClick={() => setShowDoctorProfile(false)} className='text-slate-500 hover:text-slate-700'>×</button>
            </div>

            <div className='p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
              <div>
                <p className='text-slate-500'>Email</p>
                <p className='font-medium text-slate-800'>{selectedDoctor.email || '—'}</p>
              </div>
              <div>
                <p className='text-slate-500'>Speciality</p>
                <p className='font-medium text-slate-800'>{selectedDoctor.speciality || '—'}</p>
              </div>
              <div>
                <p className='text-slate-500'>Address</p>
                <p className='font-medium text-slate-800'>
                  {selectedDoctor.appointments?.[0]?.docData?.address?.line1 || ''} {selectedDoctor.appointments?.[0]?.docData?.address?.line2 || ''}
                </p>
              </div>
            </div>

            <div className='p-4 border-t'>
              <p className='text-sm font-semibold text-slate-800 mb-2'>Recent Appointments</p>
              <div className='space-y-2 max-h-48 overflow-y-auto'>
                {selectedDoctor.appointments.slice(0, 5).map((appt) => (
                  <div key={appt._id} className='text-xs flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2'>
                    <span>{slotDateFormat(appt.slotDate)} • {appt.slotTime}</span>
                    <span className={`px-2 py-0.5 rounded-full border ${appt.cancelled ? 'border-red-300 text-red-600' : appt.isCompleted ? 'border-green-300 text-green-600' : appt.isAccepted ? 'border-emerald-300 text-emerald-600' : 'border-amber-300 text-amber-600'}`}>
                      {appt.cancelled ? 'Cancelled' : appt.isCompleted ? 'Completed' : appt.isAccepted ? 'Accepted' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
