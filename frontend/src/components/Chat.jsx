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
        className='fixed bottom-5 right-5 z-40 bg-primary text-white rounded-full px-5 py-3 shadow-lg hover:opacity-90'
        aria-expanded={open}
        aria-controls='chat-panel'
      >
        {buttonLabel}
      </button>

      {/* Floating chat panel at right end */}
      <div
        id='chat-panel'
        className={`fixed bottom-20 right-5 z-40 w-80 sm:w-96 h-[26rem] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden transition-transform ${open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}
        role='dialog'
        aria-label='Chat'
      >
        <div className='flex items-center justify-between px-4 py-3 border-b bg-gray-50'>
          <p className='font-medium text-gray-800'>Assistant</p>
          <button onClick={toggle} className='text-gray-500 hover:text-gray-800'>×</button>
        </div>

        <div ref={scrollRef} className='flex-1 overflow-y-auto p-3 space-y-2 bg-white'>
          {messages.map((m, i) => (
            <div key={i} className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${m.role === 'user' ? 'ml-auto bg-primary text-white' : 'mr-auto bg-gray-100 text-gray-800'}`}>
              {m.text}
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className='p-3 border-t bg-white flex items-center gap-2'>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Type a message...'
            className='flex-1 bg-gray-50 rounded-md px-3 py-2 outline-primary'
          />
          <button type='submit' className='bg-primary text-white rounded-md px-4 py-2 hover:opacity-90'>Send</button>
        </form>
      </div>
    </>
  )
}
