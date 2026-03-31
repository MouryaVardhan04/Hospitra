# HOSPITRA: Patient Module (User) Report

## 1. Module Overview
The **Patient Module** is the public-facing portal that empowers patients to manage their health journey. It focuses on accessibility, transparency of medical records, and ease of scheduling.

---

## 2. Key Technical Features
### A. Dynamic Appointment Slot Generator
- **Algorithm**: The client-side logic calculates a 7-day availability window. It cross-references the doctor's "Working Hours" with "Already Booked" slots fetched from the backend.
- **Validation**: Prevents booking in the past or overlapping appointments using a combination of frontend UI-blocking and backend schema-level unique constraints.

### B. Client-Side PDF Generation (`html2pdf.js`)
- **Performance**: Instead of taxing the server with PDF rendering, the system uses the patient's local browser to convert HTML templates into professional medical reports.
- **Branding**: Ensures every downloaded report (Lab or Pharmacy) follows the "Hospitra" design guidelines (Navy blue headers, structured tables).

### C. Real-Time Tele-health Chat
- **Instant Messaging**: Integrated with Socket.io for a responsive experience. Patients can consult with their doctors without refreshing the page.
- **Media Support**: Patients can upload photos of symptoms or physical copies of external reports, which are stored on Cloudinary for permanent access.

---

## 3. Data Flow & Integration
### The "Booking to Report" Journey
1. **Search**: Patient searches for a specialist (e.g., "Cardiologist").
2. **Booking**: Patient selects a slot. This creates an `Appointment` with status `Pending`.
3. **Execution**: After the doctor's visit, the doctor initiates a "Consultation."
4. **Visibility**: New reports and billing invoices appear in the patient's "My Reports" section instantly after the doctor or lab technician updates the record.

---

## 4. Technical Highlights for Interviews
- **Responsive Experience**: Built using Tailwind CSS to ensure patients can book appointments and view reports seamlessly on mobile devices.
- **Secure Authentication**: Uses JWT stored in `localStorage` for session persistence, with a global `AuthContext` to manage login states across the app.
- **Payment Integration Ready**: The architecture supports Razorpay/Stripe integration for OPD fees, with a structured billing model.

---

## 5. Patient Module Q&A

**Q: How do you handle "No Slots Available" for a doctor?**
> **A:** The frontend logic first fetches all booked slots for a specific date. If the array matches the doctor's total capacity for those hours, the UI hides those slots and suggests the next available date.

**Q: Why generate PDFs on the client-side?**
> **A:** It saves server resources and provides an instant download experience for the user. Since the data is already in the React state, we simply map it to an HTML template in a hidden `div` and use `html2pdf.js` to capture it.

**Q: Is the chat history private?**
> **A:** Yes. Chat messages are scoped to the `userId` and `doctorId`. On the backend, we verify the user's JWT before serving the message history for a specific room.
