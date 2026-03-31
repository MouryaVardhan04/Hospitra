import mongoose from "mongoose";

const doctorConsultationSchema = new mongoose.Schema({
    appointmentId: { type: String, required: true },
    doctorId: { type: String, required: true },
    doctorName: { type: String, default: '' },
    patientId: { type: String, required: true },
    patientName: { type: String, default: '' },
    patientEmail: { type: String, default: '' },
    patientPhone: { type: String, default: '' },
    patientAge: { type: String, default: '' },
    patientGender: { type: String, default: '' },
    appointmentDate: { type: String, default: '' },
    appointmentTime: { type: String, default: '' },
    condition: { type: String, default: '' },
    notes: { type: String, default: '' },
    labItems: { type: Array, default: [] },
    pharmacyItems: { type: Array, default: [] },
    surgeryItems: { type: Array, default: [] },
    labTotal: { type: Number, default: 0 },
    pharmacyTotal: { type: Number, default: 0 },
    surgeryTotal: { type: Number, default: 0 },
    labAssigned: { type: Boolean, default: false },
    pharmacyInvoiced: { type: Boolean, default: false },
    surgeryInvoiced: { type: Boolean, default: false },
    createdAt: { type: Number, required: true }
}, { minimize: false })

const doctorConsultationModel = mongoose.models.doctorconsultation || mongoose.model("doctorconsultation", doctorConsultationSchema)
export default doctorConsultationModel
