import { generateGeminiReply } from '../services/geminiService.js'
import { v2 as cloudinary } from 'cloudinary'
import chatMessageModel from '../models/chatMessageModel.js'
import { buildRoomId } from '../socket/chatSocket.js'

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

export async function getChatHistory(req, res) {
  try {
    const actor = req.chatActor
    if (!actor) return res.status(401).json({ success: false, message: 'Not Authorized' })

    const doctorId = actor.role === 'doctor' ? actor.id : req.query?.doctorId
    const userId = actor.role === 'user' ? actor.id : req.query?.userId

    if (!doctorId || !userId) {
      return res.status(400).json({ success: false, message: 'doctorId and userId are required' })
    }

    const roomId = buildRoomId({ userId, doctorId })
    const messages = await chatMessageModel.find({ roomId }).sort({ createdAt: 1 }).limit(500)
    return res.json({ success: true, roomId, messages })
  } catch (err) {
    console.warn('[chat] history error:', err?.message || err)
    return res.status(500).json({ success: false, message: 'Failed to load chat history' })
  }
}

export async function uploadChatFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File is required' })
    }

    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'auto',
      folder: 'hospitra/chat',
      use_filename: true,
      unique_filename: true,
    })

    return res.json({
      success: true,
      file: {
        url: uploadResult.secure_url,
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
      }
    })
  } catch (err) {
    console.warn('[chat] upload error:', err?.message || err)
    return res.status(500).json({ success: false, message: 'Upload failed' })
  }
}
