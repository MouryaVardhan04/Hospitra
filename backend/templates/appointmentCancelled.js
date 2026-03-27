export default function cancelledTemplate({
  logoUrl,
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
}) {
  const viewUrl = frontendUrl ? `${frontendUrl}/my-appointments` : '#'
  const bookUrl = frontendUrl ? `${frontendUrl}/doctors` : '#'
  const refundText = payment
    ? `A refund${amount ? ` of \u20B9${amount}` : ''} is being processed. It typically reflects in your account within 5-7 business days.`
    : `No payment was charged for this appointment.`
  const safeLogo = logoUrl || (frontendUrl ? `${frontendUrl}/Logo.png` : '')

  return `
  <div style="font-family: Inter, Arial, sans-serif; background:#f6f7f9; padding:24px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="640" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 6px 24px rgba(17,24,39,0.08); border:1px solid #e5e7eb;">
            <!-- Brand Header -->
            <tr>
              <td style="padding:26px 28px; background:linear-gradient(135deg,#ef4444 0%, #dc2626 100%); color:#fff; text-align:center;">
                ${safeLogo ? `<img src="${safeLogo}" alt="Hospitra" width="140" height="auto" style="display:block; border:0; outline:none; text-decoration:none; margin:0 auto;"/>` : `<span style="font-size:22px; font-weight:700; letter-spacing:.3px; display:inline-block;">Hospitra</span>`}
                <div style="margin-top:8px; font-size:18px; font-weight:600;">Appointment Cancelled</div>
              </td>
            </tr>

            <!-- Title & Intro -->
            <tr>
              <td style="padding:26px 28px; color:#111827;">
                <h2 style="margin:0 0 8px 0; font-size:22px;">Your appointment has been cancelled</h2>
                <p style="margin:0; color:#4b5563; font-size:14px;">Hi ${userName || 'there'}, we want to let you know that your appointment was cancelled. Below are the full details along with next steps.</p>
              </td>
            </tr>

            <!-- Details Card -->
            <tr>
              <td style="padding:0 28px 28px 28px;">
                <table width="100%" role="presentation" style="border:1px solid #e5e7eb; border-radius:12px;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <table width="100%" role="presentation">
                        <tr>
                          <td style="padding-bottom:12px;">
                            <div style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:.2px; font-weight:600;">Doctor</div>
                            <div style="font-size:16px; color:#111827; font-weight:600;">${doctorName || '-'}</div>
                            ${speciality ? `<div style="font-size:13px; color:#6b7280;">${speciality}</div>` : ''}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom:12px;">
                            <div style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:.2px; font-weight:600;">Date & Time</div>
                            <div style="font-size:15px; color:#111827;">${slotDate || '-'} at ${slotTime || '-'}</div>
                          </td>
                        </tr>
                        ${appointmentId ? `
                        <tr>
                          <td style="padding-bottom:12px;">
                            <div style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:.2px; font-weight:600;">Appointment ID</div>
                            <div style="font-size:15px; color:#111827;">${appointmentId}</div>
                          </td>
                        </tr>` : ''}
                        ${clinicAddress ? `
                        <tr>
                          <td style="padding-bottom:6px;">
                            <div style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:.2px; font-weight:600;">Location</div>
                            <div style="font-size:14px; color:#111827;">
                              ${typeof clinicAddress === 'object' ? `${clinicAddress.line1 || ''}${clinicAddress.line2 ? ', ' + clinicAddress.line2 : ''}` : clinicAddress}
                            </div>
                          </td>
                        </tr>` : ''}
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Refund / Billing Info -->
            <tr>
              <td style="padding:0 28px 6px 28px;">
                <div style="background:#f9fafb; border:1px dashed #e5e7eb; border-radius:12px; padding:16px;">
                  <div style="font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:.2px; font-weight:600; margin-bottom:6px;">Billing</div>
                  <div style="font-size:14px; color:#374151;">${refundText}</div>
                </div>
              </td>
            </tr>

            

            <!-- Help & Policy -->
            <tr>
              <td style="padding:0 28px 26px 28px;">
                <div style="border-top:1px solid #e5e7eb; padding-top:18px;">
                  <p style="margin:0 0 6px 0; font-size:13px; color:#6b7280;">Need help? Reply to this email or visit your dashboard for support.</p>
                  <p style="margin:0; font-size:12px; color:#9ca3af;">Note: Cancellations close to the appointment time may be subject to policy terms.</p>
                </div>
              </td>
            </tr>
          </table>
          <div style="color:#9ca3af; font-size:11px; margin-top:16px;">© ${new Date().getFullYear()} Hospitra</div>
        </td>
      </tr>
    </table>
  </div>`
}
