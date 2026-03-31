import jwt from 'jsonwebtoken'
import chatMessageModel from '../models/chatMessageModel.js'

const buildRoomId = ({ userId, doctorId }) => `user-${userId}_doctor-${doctorId}`

export default function registerChatSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      const role = socket.handshake.auth?.role
      if (!token || !role) {
        return next(new Error('Unauthorized'))
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.data.userId = decoded.id
      socket.data.role = role
      next()
    } catch (err) {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    socket.on('join', ({ userId, doctorId }) => {
      if (!userId || !doctorId) return
      const roomId = buildRoomId({ userId, doctorId })
      socket.join(roomId)
      socket.emit('joined', { roomId })
    })

    socket.on('message', async (payload) => {
      try {
        const {
          userId,
          doctorId,
          senderId,
          senderRole,
          receiverId,
          receiverRole,
          messageType,
          text,
          file,
        } = payload || {}

        if (!userId || !doctorId) return
        if (senderId !== socket.data.userId || senderRole !== socket.data.role) return

        const roomId = buildRoomId({ userId, doctorId })

        const messageDoc = await chatMessageModel.create({
          roomId,
          senderId,
          senderRole,
          receiverId,
          receiverRole,
          messageType,
          text: text || '',
          file: file || null,
        })

        io.to(roomId).emit('message', {
          _id: messageDoc._id,
          roomId,
          senderId,
          senderRole,
          receiverId,
          receiverRole,
          messageType,
          text: text || '',
          file: file || null,
          createdAt: messageDoc.createdAt,
        })
      } catch (err) {
        console.warn('[socket] message error:', err?.message || err)
      }
    })
  })
}

export { buildRoomId }