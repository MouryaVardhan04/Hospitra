import express from 'express';
import { loginAdmin, loginReception, appointmentsAdmin, appointmentCancel, addDoctor, allDoctors, updateDoctor, adminDashboard, lookupPatient, bookAppointmentReception, createBillingInvoice, createLabAssignment, getLabCatalog, updateLabCatalog, getFeesCatalog, updateFeesCatalog, getAuditLogs } from '../controllers/adminController.js';
import { changeAvailablity } from '../controllers/doctorController.js';
import authAdmin from '../middleware/authAdmin.js';
import authAdminOrReception from '../middleware/authAdminOrReception.js';
import upload from '../middleware/multer.js';
const adminRouter = express.Router();

adminRouter.post("/login", loginAdmin)
adminRouter.post("/reception-login", loginReception)
adminRouter.post("/add-doctor", authAdmin, upload.single('image'), addDoctor)
adminRouter.get("/appointments", authAdmin, appointmentsAdmin)
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel)
adminRouter.get("/all-doctors", authAdminOrReception, allDoctors)
adminRouter.post("/update-doctor", authAdmin, updateDoctor)
adminRouter.post("/change-availability", authAdmin, changeAvailablity)
adminRouter.get("/dashboard", authAdmin, adminDashboard)
adminRouter.post("/patient-lookup", authAdminOrReception, lookupPatient)
adminRouter.post("/book-appointment", authAdminOrReception, bookAppointmentReception)
adminRouter.post("/billing-invoice", authAdminOrReception, createBillingInvoice)
adminRouter.post("/lab-assignment", authAdminOrReception, createLabAssignment)
adminRouter.get("/lab-catalog", authAdminOrReception, getLabCatalog)
adminRouter.post("/lab-catalog", authAdmin, updateLabCatalog)
adminRouter.get("/fees-catalog", authAdminOrReception, getFeesCatalog)
adminRouter.post("/fees-catalog", authAdmin, updateFeesCatalog)
adminRouter.get("/audit-logs", authAdmin, getAuditLogs)

export default adminRouter;