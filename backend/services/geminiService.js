async function callGeminiApi({ apiKey, contents }) {
  if (!apiKey) throw new Error('GEMINI_KEY not configured')
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents })
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data?.error?.message || JSON.stringify(data)
    throw new Error(`Gemini error: ${res.status} ${message}`)
  }
  return data
}

function normalizeContents({ text, messages }) {
  if (Array.isArray(messages) && messages.length) {
    return messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content ?? m.text ?? '') }]
    }))
  }
  const finalText = text ?? ''
  return [{ role: 'user', parts: [{ text: String(finalText) }] }]
}

export async function generateGeminiReply({ text, messages }) {
  const apiKey = process.env.GEMINI_KEY
  const contents = normalizeContents({ text, messages })
  const data = await callGeminiApi({ apiKey, contents })
  const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('')
  return { reply: reply || '', raw: data }
}
