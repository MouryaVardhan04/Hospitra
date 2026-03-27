import mongoose from "mongoose";

const billingInvoiceSchema = new mongoose.Schema({
    patientId: { type: String, default: '' },
    patientName: { type: String, default: '' },
    patientEmail: { type: String, default: '' },
    patientPhone: { type: String, default: '' },
    doctorId: { type: String, default: '' },
    doctorName: { type: String, default: '' },
    appointmentId: { type: String, default: '' },
    visitDate: { type: String, default: '' },
    visitTime: { type: String, default: '' },
    department: { type: String, default: '' },
    notes: { type: String, default: '' },
    items: { type: Array, default: [] },
    total: { type: Number, default: 0 },
    emailSentAt: { type: Number, default: null },
    createdAt: { type: Number, required: true }
}, { minimize: false })

const billingInvoiceModel = mongoose.models.billinginvoice || mongoose.model('billinginvoice', billingInvoiceSchema)
export default billingInvoiceModel
