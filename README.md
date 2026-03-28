# Hospitra

Multi‑app hospital management system with patient portal, admin, reception, labs, and pharmacy portals, plus a Node/Express backend.

## Live URLs
- Patient portal: https://hospitra.vercel.app/
- Admin: https://hospitra-admin.vercel.app/
- Reception: https://hospitra-reception.vercel.app/
- Labs: https://hospitra-labs.vercel.app/
- Pharmacy: https://hospitra-pharmacy.vercel.app/
- Backend API: https://hospitra.onrender.com

## Apps & Responsibilities
- **frontend**: Patient portal (appointments, reports, invoices, chat).
- **admin**: Hospital administration dashboard.
- **reception**: Appointment handling, billing initiation, lab assignment.
- **labs**: Lab processing, report generation, PDF reports.
- **pharmacy**: Medicine billing, inventory updates, PDF invoices.
- **backend**: REST API, auth, PDF generation, email delivery, payments.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **Payments**: Razorpay, Stripe
- **Email**: Nodemailer
- **PDF**: html2pdf.js (frontends) + pdfkit (backend)
- **Media**: Cloudinary

## Monorepo Structure
- backend/
- frontend/
- admin/
- reception/
- labs/
- pharmacy/

## Local Setup
1. Clone the repo and install dependencies in each app folder.
2. Backend: create backend/.env and set required variables.
3. Run backend: `npm run server` (or `npm start`).
4. Run each frontend app: `npm run dev` from its folder.

## Environment Variables
### Backend (backend/.env)
- CURRENCY
- JWT_SECRET
- ADMIN_EMAIL, ADMIN_PASSWORD
- PHARMACY_EMAIL, PHARMACY_PASSWORD
- LABS_EMAIL, LABS_PASSWORD
- RECEPTION_EMAIL, RECEPTION_PASSWORD
- MONGODB_URI
- CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_SECRET_KEY
- RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
- STRIPE_SECRET_KEY
- EMAIL_USER, EMAIL_PASS
- GEMINI_KEY
- (optional) GEMINI_MODEL
- (optional) DEBUG_EMAIL_TOKEN

### Frontend Apps (.env in each app)
- VITE_BACKEND_URL
- VITE_RAZORPAY_KEY_ID (frontend only, if payments are enabled)

## Build & Deploy
### Backend (Render)
- Root: backend
- Build: npm install
- Start: npm start
- Add backend environment variables

### Frontends (Vercel)
Create five separate Vercel projects with these root directories:
- frontend
- admin
- reception
- labs
- pharmacy

Set `VITE_BACKEND_URL` to the Render backend URL for each project and deploy.

## Notes
- Free tier hosts may sleep when idle; first request may be slow.
- Keep secrets out of Git and rotate any exposed keys.
