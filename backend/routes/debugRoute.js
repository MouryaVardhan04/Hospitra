import express from 'express'
import {
  sendAppointmentBookedEmail,
  sendAppointmentCancelledEmail,
  sendAppointmentCancelledByDoctorEmail,
  sendAppointmentCompletedEmail,
} from '../services/emailService.js'

const router = express.Router()

// Simple auth middleware: require header x-debug-token to match env
router.use((req, res, next) => {
  const token = req.header('x-debug-token')
  if (!process.env.DEBUG_EMAIL_TOKEN || token !== process.env.DEBUG_EMAIL_TOKEN) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }
  next()
})

// POST /api/debug/email
// Body: { to?: string, type: 'booked'|'cancelled'|'cancelledByDoctor'|'completed', payload?: object }
router.post('/email', async (req, res) => {
  try {
    const { type, to, payload = {} } = req.body || {}
    if (!type) return res.status(400).json({ success: false, message: 'type is required' })

    const recipient = to || process.env.EMAIL_REDIRECT_TO || process.env.EMAIL_USER

    // Minimal mock payloads with sensible defaults
    const base = {
      userName: payload.userName || 'John Doe',
      doctorName: payload.doctorName || 'Dr. Smith',
      appointmentTime: payload.appointmentTime || new Date().toISOString(),
      appointmentId: payload.appointmentId || 'TEST-APPT-1234',
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    }

    let info
    switch (type) {
      case 'booked':
        info = await sendAppointmentBookedEmail(recipient, base)
        break
      case 'cancelled':
        info = await sendAppointmentCancelledEmail(recipient, base)
        break
      case 'cancelledByDoctor':
        info = await sendAppointmentCancelledByDoctorEmail(recipient, base)
        break
      case 'completed':
        info = await sendAppointmentCompletedEmail(recipient, base)
        break
      default:
        return res.status(400).json({ success: false, message: 'unknown type' })
    }

    return res.json({ success: true, to: recipient, messageId: info?.messageId || null })
  } catch (err) {
    console.error('[debug] email error', err)
    return res.status(500).json({ success: false, message: err.message })
  }
})

export default router
