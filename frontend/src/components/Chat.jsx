import { useMemo, useRef, useState } from 'react'

export default function Chat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)
  const sessionIdRef = useRef(
    crypto.randomUUID()
  )

  const toggle = () => setOpen(v => !v)

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!input.trim()) return

    const userText = input.trim()
    const userMsg = { role: 'user', text: userText }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')

    try {
      const res = await fetch('/api/chat/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userText,
          messages: nextMessages,
          sessionId: sessionIdRef.current,
        })

      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.reason || data?.error || 'Chat request failed')
      }
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: data.reply || 'No response' },
      ])
    } catch (err) {
      console.error(err)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: err?.message || 'Sorry, something went wrong.' },
      ])
    } finally {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }

  const buttonLabel = useMemo(() => (open ? 'Close' : 'Chat'), [open])

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={toggle}
        className='fixed bottom-5 right-5 z-40 bg-gradient-to-r from-primary to-emerald-500 text-white rounded-full px-5 py-3 shadow-xl hover:shadow-2xl hover:opacity-95 transition'
        aria-expanded={open}
        aria-controls='chat-panel'
      >
        {buttonLabel}
      </button>

      {/* Floating chat panel at right end */}
      <div
        id='chat-panel'
        className={`fixed bottom-20 right-5 z-40 w-80 sm:w-96 h-[28rem] bg-white/95 backdrop-blur border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all ${open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}
        role='dialog'
        aria-label='Chat'
      >
        <div className='flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50'>
          <div className='flex items-center gap-2'>
            <span className='h-2 w-2 rounded-full bg-emerald-500'></span>
            <p className='font-semibold text-slate-800'>Assistant</p>
            <span className='text-xs text-slate-500'>Online</span>
          </div>
          <button onClick={toggle} className='text-slate-500 hover:text-slate-800'>×</button>
        </div>

        <div ref={scrollRef} className='flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50'>
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] w-fit px-4 py-2 rounded-2xl text-sm shadow-sm ${m.role === 'user' ? 'ml-auto bg-primary text-white rounded-br-md' : 'mr-auto bg-white text-slate-800 border border-slate-200 rounded-bl-md'}`}
            >
              {m.text}
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className='p-3 border-t border-slate-200 bg-white flex items-center gap-2'>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Type a message...'
            className='flex-1 bg-slate-50 rounded-full px-4 py-2 outline-primary border border-slate-200 focus:ring-2 focus:ring-emerald-200'
          />
          <button type='submit' className='bg-primary text-white rounded-full px-4 py-2 hover:opacity-90 shadow'>Send</button>
        </form>
      </div>
    </>
  )
}
