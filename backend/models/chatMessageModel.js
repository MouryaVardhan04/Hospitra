import mongoose from 'mongoose'

const fileSchema = new mongoose.Schema(
  {
    url: { type: String, default: '' },
    name: { type: String, default: '' },
    type: { type: String, default: '' },
    size: { type: Number, default: 0 },
  },
  { _id: false }
)

const chatMessageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderRole: { type: String, enum: ['user', 'doctor'], required: true },
    receiverId: { type: String, required: true },
    receiverRole: { type: String, enum: ['user', 'doctor'], required: true },
    messageType: { type: String, enum: ['text', 'file'], required: true },
    text: { type: String, default: '' },
    file: { type: fileSchema, default: null },
  },
  { timestamps: true }
)

const chatMessageModel = mongoose.models.chatMessage || mongoose.model('chatMessage', chatMessageSchema)

export default chatMessageModel