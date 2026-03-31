import express from 'express'
import { chatProxy, getChatHistory, uploadChatFile } from '../controllers/chatController.js'
import authChat from '../middleware/authChat.js'
import upload from '../middleware/multer.js'

const router = express.Router()

router.post('/webhook', chatProxy)
router.get('/history', authChat, getChatHistory)
router.post('/upload', authChat, upload.single('file'), uploadChatFile)

export default router
