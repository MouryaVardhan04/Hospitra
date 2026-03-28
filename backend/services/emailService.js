import nodemailer from 'nodemailer'
import bookedTemplate from '../templates/appointmentBooked.js'
import cancelledTemplate from '../templates/appointmentCancelled.js'
import cancelledByDoctorTemplate from '../templates/appointmentCancelledByDoctor.js'
import completedTemplate from '../templates/appointmentCompleted.js'

let transporter

function getTransporter() {
  if (!transporter) {
    const user = process.env.EMAIL_USER
    const pass = process.env.EMAIL_PASS
    if (!user || !pass) {
      console.warn('Email disabled: EMAIL_USER/EMAIL_PASS not set')
      return null
    }
    const host = process.env.SMTP_HOST
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
    const secure = process.env.SMTP_SECURE === 'true'

    transporter = nodemailer.createTransport({
      service: host ? undefined : 'gmail',
      host: host || undefined,
      port: port || undefined,
      secure: host ? secure : undefined,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    })
  }
  return transporter
}

async function sendMail({ to, subject, html, attachments }) {
  const tx = getTransporter()
  if (!tx) return
  const fromName = process.env.EMAIL_FROM_NAME || 'Hospitra'
  const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER
  const overrideTo = process.env.EMAIL_REDIRECT_TO
  const finalTo = overrideTo || to
  const info = await tx.sendMail({
    from: `${fromName} <${fromAddress}>`,
    to: finalTo,
    subject,
    html,
    attachments,
  })
  console.log(`[email] sent to ${finalTo} subject="${subject}" id=${info.messageId}`)
  return info
}

function invoiceEmailWrapper(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a56db 0%,#1e3a8a 100%);padding:28px 36px;text-align:center;">
            <div style="color:#ffffff;font-size:26px;font-weight:800;letter-spacing:1px;">🏥 HOSPITRA</div>
            <div style="color:#bfdbfe;font-size:12px;margin-top:4px;">Quality Care, Every Time</div>
          </td>
        </tr>

        <!-- Body -->
        <tr><td style="padding:32px 36px;">{{BODY}}</td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1e3a8a;padding:20px 36px;text-align:center;">
            <p style="margin:0;color:#bfdbfe;font-size:11px;">This is an automated message from Hospitra Healthcare System.</p>
            <p style="margin:6px 0 0;color:#93c5fd;font-size:11px;">For queries, contact your nearest Hospitra centre.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body></html>`.replace('{{BODY}}', bodyHtml)
}

function infoRow(label, value) {
  return `
    <tr>
      <td style="padding:7px 12px;color:#64748b;font-size:12px;width:40%;border-bottom:1px solid #e2e8f0;">${label}</td>
      <td style="padding:7px 12px;color:#0f172a;font-size:12px;font-weight:600;border-bottom:1px solid #e2e8f0;">${value || '—'}</td>
    </tr>`
}

export async function sendLabReportEmail({
  to,
  userName,
  pdfBuffer,          // legacy single-buffer support
  reportPdfBuffer,    // new: lab report PDF
  invoicePdfBuffer,   // new: lab invoice PDF (separate)
  assignmentId,
  assignment,
  appointment,
}) {
  // Support both old single-buffer and new dual-buffer calling conventions
  const finalReportBuf  = reportPdfBuffer || pdfBuffer
  const finalInvoiceBuf = invoicePdfBuffer || null
  const body = `
    <h2 style="margin:0 0 6px;color:#1a56db;font-size:20px;">🔬 Lab Report Ready</h2>
    <p style="margin:0 0 20px;color:#475569;font-size:13px;">Dear <strong>${userName || 'Patient'}</strong>, your lab report has been generated and is attached below.</p>

    <!-- Assignment badge -->
    <div style="background:#eff6ff;border-left:4px solid #1a56db;border-radius:6px;padding:12px 16px;margin-bottom:24px;">
      <span style="font-size:11px;color:#64748b;">Assignment ID &nbsp;</span>
      <span style="font-size:13px;color:#1e3a8a;font-weight:700;">#${assignmentId || '—'}</span>
      &nbsp;&nbsp;
      <span style="background:#16a34a;color:#fff;font-size:10px;font-weight:700;padding:2px 10px;border-radius:99px;">REPORT READY</span>
    </div>

    ${assignment ? `
    <!-- Patient summary -->
    <h3 style="margin:0 0 8px;color:#0f172a;font-size:13px;text-transform:uppercase;letter-spacing:.5px;">Patient Details</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <tbody>
        ${infoRow('Name', assignment.patientName)}
        ${infoRow('Phone', assignment.patientPhone)}
        ${infoRow('Age / Gender', (assignment.patientAge || '—') + ' / ' + (assignment.patientGender || '—'))}
      </tbody>
    </table>

    <!-- Appointment summary -->
    <h3 style="margin:0 0 8px;color:#0f172a;font-size:13px;text-transform:uppercase;letter-spacing:.5px;">Appointment Details</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <tbody>
        ${infoRow('Referring Doctor', assignment.doctorName)}
        ${infoRow('Visit Date', appointment?.slotDate || assignment.visitDate)}
        ${infoRow('Visit Time', appointment?.slotTime)}
      </tbody>
    </table>` : ''}

    <p style="font-size:13px;color:#475569;margin:0 0 6px;">📎 Your lab report PDF is attached${finalInvoiceBuf ? ' along with a separate lab invoice' : ''}.</p>
    <p style="font-size:12px;color:#94a3b8;margin:0;">Thank you for choosing Hospitra. We wish you good health.</p>
  `
  const attachments = []
  if (finalReportBuf) {
    attachments.push({
      filename: `lab-report-${assignmentId || 'report'}.pdf`,
      content: finalReportBuf,
      contentType: 'application/pdf'
    })
  }
  if (finalInvoiceBuf) {
    attachments.push({
      filename: `lab-invoice-${assignmentId || 'invoice'}.pdf`,
      content: finalInvoiceBuf,
      contentType: 'application/pdf'
    })
  }
  return await sendMail({
    to,
    subject: '🔬 Your Lab Report & Invoice — Hospitra',
    html: invoiceEmailWrapper(body),
    attachments,
  })
}

export async function sendPharmacyInvoiceEmail({
  to,
  userName,
  pdfBuffer,
  invoiceId,
  invoice,
  appointment,
}) {
  const body = `
    <h2 style="margin:0 0 6px;color:#1a56db;font-size:20px;">💊 Pharmacy Invoice</h2>
    <p style="margin:0 0 20px;color:#475569;font-size:13px;">Dear <strong>${userName || 'Patient'}</strong>, your pharmacy invoice has been generated. Please find the PDF attached.</p>

    <!-- Invoice badge -->
    <div style="background:#eff6ff;border-left:4px solid #1a56db;border-radius:6px;padding:12px 16px;margin-bottom:24px;">
      <span style="font-size:11px;color:#64748b;">Invoice No &nbsp;</span>
      <span style="font-size:13px;color:#1e3a8a;font-weight:700;">#${invoiceId || '—'}</span>
      &nbsp;&nbsp;
      <span style="background:#16a34a;color:#fff;font-size:10px;font-weight:700;padding:2px 10px;border-radius:99px;">PAID</span>
    </div>

    ${invoice ? `
    <!-- Patient info -->
    <h3 style="margin:0 0 8px;color:#0f172a;font-size:13px;text-transform:uppercase;letter-spacing:.5px;">Patient Details</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <tbody>
        ${infoRow('Name', invoice.patientName)}
        ${infoRow('Phone', invoice.patientPhone)}
        ${infoRow('Email', invoice.patientEmail)}
      </tbody>
    </table>

    <!-- Appointment info -->
    <h3 style="margin:0 0 8px;color:#0f172a;font-size:13px;text-transform:uppercase;letter-spacing:.5px;">Appointment & Doctor</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <tbody>
        ${infoRow('Doctor', invoice.doctorName)}
        ${infoRow('Visit Date', appointment?.slotDate || invoice.visitDate)}
        ${infoRow('Visit Time', appointment?.slotTime || invoice.visitTime)}
        ${infoRow('Payment Method', invoice.paymentMethod)}
      </tbody>
    </table>

    <!-- Total -->
    <div style="background:#1a56db;color:#fff;border-radius:8px;padding:14px 20px;text-align:right;margin-bottom:20px;">
      <span style="font-size:12px;opacity:.85;">Grand Total &nbsp;</span>
      <span style="font-size:20px;font-weight:800;">₹${Number(invoice.total || 0).toFixed(2)}</span>
    </div>` : ''}

    <p style="font-size:13px;color:#475569;margin:0 0 6px;">📎 The full pharmacy invoice PDF is attached to this email.</p>
    <p style="font-size:12px;color:#94a3b8;margin:0;">Thank you for choosing Hospitra. We wish you good health.</p>
  `
  return await sendMail({
    to,
    subject: '💊 Your Pharmacy Invoice — Hospitra',
    html: invoiceEmailWrapper(body),
    attachments: [
      {
        filename: `pharmacy-invoice-${invoiceId || 'invoice'}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  })
}

export async function sendBillingInvoiceEmail({
  to,
  userName,
  pdfBuffer,
  invoiceId,
  invoice,
}) {
  const body = `
    <h2 style="margin:0 0 6px;color:#1a56db;font-size:20px;">🧾 Billing Invoice</h2>
    <p style="margin:0 0 20px;color:#475569;font-size:13px;">Dear <strong>${userName || 'Patient'}</strong>, your billing invoice is ready. Please find the PDF attached for your records.</p>

    <!-- Invoice badge -->
    <div style="background:#eff6ff;border-left:4px solid #1a56db;border-radius:6px;padding:12px 16px;margin-bottom:24px;">
      <span style="font-size:11px;color:#64748b;">Invoice No &nbsp;</span>
      <span style="font-size:13px;color:#1e3a8a;font-weight:700;">#${invoiceId || '—'}</span>
      &nbsp;&nbsp;
      <span style="background:#1a56db;color:#fff;font-size:10px;font-weight:700;padding:2px 10px;border-radius:99px;">BILLING</span>
    </div>

    ${invoice ? `
    <!-- Patient info -->
    <h3 style="margin:0 0 8px;color:#0f172a;font-size:13px;text-transform:uppercase;letter-spacing:.5px;">Patient Details</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <tbody>
        ${infoRow('Name', invoice.patientName)}
        ${infoRow('Phone', invoice.patientPhone)}
        ${infoRow('Email', invoice.patientEmail)}
      </tbody>
    </table>

    <!-- Appointment info -->
    <h3 style="margin:0 0 8px;color:#0f172a;font-size:13px;text-transform:uppercase;letter-spacing:.5px;">Appointment & Doctor</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <tbody>
        ${infoRow('Doctor', invoice.doctorName)}
        ${infoRow('Department', invoice.department)}
        ${infoRow('Appointment ID', invoice.appointmentId)}
        ${infoRow('Visit Date', invoice.visitDate)}
        ${infoRow('Visit Time', invoice.visitTime)}
      </tbody>
    </table>

    <!-- Total -->
    <div style="background:#1a56db;color:#fff;border-radius:8px;padding:14px 20px;text-align:right;margin-bottom:20px;">
      <span style="font-size:12px;opacity:.85;">Grand Total &nbsp;</span>
      <span style="font-size:20px;font-weight:800;">₹${Number(invoice.total || 0).toFixed(2)}</span>
    </div>` : ''}

    <p style="font-size:13px;color:#475569;margin:0 0 6px;">📎 The full billing invoice PDF is attached to this email.</p>
    <p style="font-size:12px;color:#94a3b8;margin:0;">Thank you for choosing Hospitra. We wish you good health.</p>
  `
  return await sendMail({
    to,
    subject: '🧾 Your Billing Invoice — Hospitra',
    html: invoiceEmailWrapper(body),
    attachments: [
      {
        filename: `billing-invoice-${invoiceId || 'invoice'}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  })
}

export async function sendOtpEmail({ to, userName, otp }) {
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827;">
      <h2 style="margin: 0 0 12px;">Hospitra Verification Code</h2>
      <p style="margin: 0 0 16px;">Hi ${userName || 'there'},</p>
      <p style="margin: 0 0 16px;">Your one-time verification code is:</p>
      <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 12px 0 20px;">${otp}</div>
      <p style="margin: 0; color: #6B7280;">If you didn’t request this, please ignore this email.</p>
    </div>
  `
  return await sendMail({ to, subject: 'Your Hospitra OTP', html })
}

export async function sendAppointmentBookedEmail({
  to,
  userName,
  doctorName,
  speciality,
  slotDate,
  slotTime,
  fee,
  amount,
  appointmentId,
  clinicAddress,
  payment,
  logoUrl,
}) {
  const frontendUrl = process.env.FRONTEND_URL || ''
  const effectiveLogo = logoUrl || (frontendUrl ? `${frontendUrl}/Logo.png` : undefined)
  const html = bookedTemplate({
    logoUrl: effectiveLogo,
    userName,
    doctorName,
    speciality,
    slotDate,
    slotTime,
    fee,
    amount,
    appointmentId,
    clinicAddress,
    payment,
    frontendUrl,
  })
  return await sendMail({ to, subject: 'Your appointment is confirmed', html })
}

export async function sendAppointmentCancelledEmail({
  to,
  userName,
  doctorName,
  speciality,
  slotDate,
  slotTime,
  appointmentId,
  amount,
  payment,
  clinicAddress,
  logoUrl,
}) {
  const frontendUrl = process.env.FRONTEND_URL || ''
  const effectiveLogo = logoUrl || (frontendUrl ? `${frontendUrl}/Logo.png` : undefined)
  const html = cancelledTemplate({
    logoUrl: effectiveLogo,
    userName,
    doctorName,
    speciality,
    slotDate,
    slotTime,
    appointmentId,
    amount,
    payment,
    clinicAddress,
    frontendUrl,
  })
  return await sendMail({ to, subject: 'Your appointment has been cancelled', html })
}

export async function sendAppointmentCancelledByDoctorEmail({
  to,
  userName,
  doctorName,
  speciality,
  slotDate,
  slotTime,
  appointmentId,
  amount,
  payment,
  clinicAddress,
  reason,
  logoUrl,
}) {
  const frontendUrl = process.env.FRONTEND_URL || ''
  const effectiveLogo = logoUrl || (frontendUrl ? `${frontendUrl}/Logo.png` : undefined)
  const html = cancelledByDoctorTemplate({
    logoUrl: effectiveLogo,
    userName,
    doctorName,
    speciality,
    slotDate,
    slotTime,
    appointmentId,
    amount,
    payment,
    clinicAddress,
    reason,
    frontendUrl,
  })
  return await sendMail({ to, subject: 'Your appointment is cancelled by the doctor', html })
}

export async function sendAppointmentCompletedEmail({
  to,
  userName,
  doctorName,
  speciality,
  slotDate,
  slotTime,
  appointmentId,
  clinicAddress,
  logoUrl,
}) {
  const frontendUrl = process.env.FRONTEND_URL || ''
  const effectiveLogo = logoUrl || (frontendUrl ? `${frontendUrl}/Logo.png` : undefined)
  const html = completedTemplate({
    logoUrl: effectiveLogo,
    userName,
    doctorName,
    speciality,
    slotDate,
    slotTime,
    appointmentId,
    clinicAddress,
    frontendUrl,
  })
  return await sendMail({ to, subject: 'Your appointment is completed', html })
}

export async function verifyEmailTransport() {
  const tx = getTransporter()
  if (!tx) {
    console.warn('[email] transport disabled (missing EMAIL_USER/EMAIL_PASS)')
    return { ok: false, reason: 'disabled' }
  }
  try {
    await tx.verify()
    console.log('[email] smtp transport verified')
    return { ok: true }
  } catch (e) {
    console.warn('[email] smtp verify failed:', e?.message || e)
    return { ok: false, reason: e?.message || String(e) }
  }
}
