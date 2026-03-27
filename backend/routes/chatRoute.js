import express from 'express'
import { chatProxy } from '../controllers/chatController.js'

const router = express.Router()

router.post('/webhook', chatProxy)

export default router
