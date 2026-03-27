export default function bookedTemplate({
  logoUrl,
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
}) {
  const viewUrl = frontendUrl ? `${frontendUrl}/my-appointments` : '#'
  const bookUrl = frontendUrl ? `${frontendUrl}/doctors` : '#'
  const safeLogo = logoUrl || (frontendUrl ? `${frontendUrl}/Logo.png` : '')
  const brandLogo = safeLogo
    ? `<img src="${safeLogo}" alt="Hospitra" width="140" height="auto" style="display:block; border:0; outline:none; text-decoration:none;" />`
    : `<div style="font-size:22px; font-weight:700; color:#1f3af6;">Hospitra</div>`
  const billAmount = amount != null ? amount : fee
  const billingLine = payment
    ? `Payment received${billAmount != null ? `: \u20B9${billAmount}` : ''}.`
    : `Pay at clinic${billAmount != null ? `: \u20B9${billAmount}` : ''}.`

  return `
  <div style="font-family: Inter, Arial, sans-serif; background:#0f172a; padding:32px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="640" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 12px 28px rgba(2,6,23,0.18);">
            <tr>
              <td style="background:linear-gradient(135deg,#0ea5e9 0%, #0284c7 100%); padding:26px 28px; text-align:center;">
                ${brandLogo}
                <div style="margin-top:8px; color:#fff; font-size:18px; font-weight:600;">Appointment Confirmed</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px; color:#0f172a;">
                <h2 style="margin:0 0 8px 0; font-size:22px;">Hi ${userName || 'there'},</h2>
                <p style="margin:0 0 18px 0; color:#334155; font-size:15px;">Your appointment has been confirmed. Below are the details and quick actions.</p>
                <table width="100%" role="presentation" style="border:1px solid #e5e7eb; border-radius:14px; overflow:hidden;">
                  <tr>
                    <td style="background:#f8fafc; padding:16px 20px; font-weight:600; color:#0f172a;">Appointment Summary</td>
                  </tr>
                  <tr>
                    <td style="padding:18px 20px;">
                      <table width="100%" role="presentation">
                        <tr>
                          <td style="padding:8px 0; color:#334155;">Doctor</td>
                          <td style="padding:8px 0; color:#111827; font-weight:600;" align="right">${doctorName}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0; color:#334155;">Speciality</td>
                          <td style="padding:8px 0; color:#111827; font-weight:600;" align="right">${speciality || '-'}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0; color:#334155;">Date</td>
                          <td style="padding:8px 0; color:#111827; font-weight:600;" align="right">${slotDate}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0; color:#334155;">Time</td>
                          <td style="padding:8px 0; color:#111827; font-weight:600;" align="right">${slotTime}</td>
                        </tr>
                        ${appointmentId ? `
                        <tr>
                          <td style="padding:8px 0; color:#334155;">Appointment ID</td>
                          <td style="padding:8px 0; color:#111827; font-weight:600;" align="right">${appointmentId}</td>
                        </tr>` : ''}
                        ${clinicAddress ? `
                        <tr>
                          <td style="padding:8px 0; color:#334155;">Location</td>
                          <td style="padding:8px 0; color:#111827; font-weight:600;" align="right">${typeof clinicAddress === 'object' ? `${clinicAddress.line1 || ''}${clinicAddress.line2 ? ', ' + clinicAddress.line2 : ''}` : clinicAddress}</td>
                        </tr>` : ''}
                        ${billAmount != null ? `
                        <tr>
                          <td style="padding:8px 0; color:#334155;">Billing</td>
                          <td style="padding:8px 0; color:#111827; font-weight:600;" align="right">${billingLine}</td>
                        </tr>` : ''}
                      </table>
                    </td>
                  </tr>
                </table>
                
                <p style="margin:22px 0 0 0; color:#64748b; font-size:12px;">If you didn’t request this, please ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px; background:#f8fafc; color:#64748b; font-size:11px;">
                © ${new Date().getFullYear()} Hospitra — All rights reserved
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`
}
