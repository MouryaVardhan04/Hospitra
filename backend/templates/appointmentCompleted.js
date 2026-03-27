export default function completedTemplate({
  logoUrl,
  userName,
  doctorName,
  speciality,
  slotDate,
  slotTime,
  appointmentId,
  clinicAddress,
  frontendUrl,
}) {
  const viewUrl = frontendUrl ? `${frontendUrl}/my-appointments` : '#'
  const safeLogo = logoUrl || (frontendUrl ? `${frontendUrl}/Logo.png` : '')
  const brandLogo = safeLogo
    ? `<img src="${safeLogo}" alt="Hospitra" width="140" height="auto" style="display:block; border:0; outline:none; text-decoration:none; margin:0 auto;" />`
    : `<div style="font-size:22px; font-weight:700; color:#1f3af6;">Hospitra</div>`

  return `
  <div style="font-family: Inter, Arial, sans-serif; background:#0f172a; padding:32px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="640" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 12px 28px rgba(2,6,23,0.18);">
            <tr>
              <td style="background:linear-gradient(135deg,#10b981 0%, #059669 100%); padding:26px 28px; text-align:center; color:#fff;">
                ${brandLogo}
                <div style="margin-top:8px; font-size:18px; font-weight:600;">Appointment Completed</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px; color:#0f172a;">
                <h2 style="margin:0 0 8px 0; font-size:22px;">Hi ${userName || 'there'},</h2>
                <p style="margin:0 0 18px 0; color:#334155; font-size:15px;">Your appointment has been marked as completed. Below are the details and quick actions.</p>
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
                        ${speciality ? `
                        <tr>
                          <td style="padding:8px 0; color:#334155;">Speciality</td>
                          <td style="padding:8px 0; color:#111827; font-weight:600;" align="right">${speciality}</td>
                        </tr>` : ''}
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
                      </table>
                    </td>
                  </tr>
                </table>
                
                <p style="margin:22px 0 0 0; color:#64748b; font-size:12px;">Thank you for visiting. We wish you good health.</p>
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
