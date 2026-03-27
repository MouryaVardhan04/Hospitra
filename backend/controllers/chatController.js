import { generateGeminiReply } from '../services/geminiService.js'

export async function chatProxy(req, res) {
  try {
    if (!process.env.GEMINI_KEY) {
      return res.status(500).json({ error: 'GEMINI_KEY not configured' })
    }

    const text = req.body?.text
    const messages = req.body?.messages
    const data = await generateGeminiReply({ text, messages })
    return res.json({ reply: data.reply, raw: data.raw })
  } catch (err) {
    console.warn('[chat] gemini error:', err?.message || err)
    return res.status(502).json({ error: 'Failed to contact Gemini', reason: err?.message || String(err) })
  }
}
