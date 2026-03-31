import express from 'express';
import { loginPharmacy, addMedicine, getMedicines, updateMedicine, deleteMedicine, pharmacyDashboard, lookupPatient, createInvoice, getDoctorConsultations, markConsultationPharmacyInvoiced, getPharmacyInvoices } from '../controllers/pharmacyController.js';
import authPharmacy from '../middleware/authPharmacy.js';
import upload from '../middleware/multer.js';

const pharmacyRouter = express.Router();

pharmacyRouter.post("/login", loginPharmacy)
pharmacyRouter.post("/add-medicine", authPharmacy, upload.single('image'), addMedicine)
pharmacyRouter.get("/medicines", authPharmacy, getMedicines)
pharmacyRouter.post("/update-medicine", authPharmacy, updateMedicine)
pharmacyRouter.post("/delete-medicine", authPharmacy, deleteMedicine)
pharmacyRouter.get("/dashboard", authPharmacy, pharmacyDashboard)
pharmacyRouter.post("/patient-lookup", authPharmacy, lookupPatient)
pharmacyRouter.get("/consultations", authPharmacy, getDoctorConsultations)
pharmacyRouter.get("/invoices", authPharmacy, getPharmacyInvoices)
pharmacyRouter.post("/create-invoice", authPharmacy, createInvoice)
pharmacyRouter.post("/consultations/pharmacy-invoiced", authPharmacy, markConsultationPharmacyInvoiced)

export default pharmacyRouter;
