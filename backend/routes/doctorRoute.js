import express from 'express';
import { loginDoctor, appointmentsDoctor, appointmentCancel, appointmentAccept, doctorList, changeAvailablity, appointmentComplete, doctorDashboard, doctorTodayAppointments, doctorLabCatalog, doctorFeesCatalog, doctorMedicines, doctorCreateConsultation, doctorPatientPrescriptions, doctorPatientConsultations, doctorProfile, updateDoctorProfile } from '../controllers/doctorController.js';
import authDoctor from '../middleware/authDoctor.js';
const doctorRouter = express.Router();

doctorRouter.post("/login", loginDoctor)
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel)
doctorRouter.post("/accept-appointment", authDoctor, appointmentAccept)
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor)
doctorRouter.get("/list", doctorList)
doctorRouter.post("/change-availability", authDoctor, changeAvailablity)
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete)
doctorRouter.get("/dashboard", authDoctor, doctorDashboard)
doctorRouter.get("/today-appointments", authDoctor, doctorTodayAppointments)
doctorRouter.get("/lab-catalog", authDoctor, doctorLabCatalog)
doctorRouter.get("/fees-catalog", authDoctor, doctorFeesCatalog)
doctorRouter.get("/medicines", authDoctor, doctorMedicines)
doctorRouter.post("/consultation", authDoctor, doctorCreateConsultation)
doctorRouter.get("/patient-prescriptions", authDoctor, doctorPatientPrescriptions)
doctorRouter.get("/patient-consultations", authDoctor, doctorPatientConsultations)
doctorRouter.get("/profile", authDoctor, doctorProfile)
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile)

export default doctorRouter;