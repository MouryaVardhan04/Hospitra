import mongoose from "mongoose";

const pharmacyInvoiceSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    patientName: { type: String, default: '' },
    patientEmail: { type: String, default: '' },
    patientPhone: { type: String, default: '' },
    doctorId: { type: String, default: '' },
    doctorName: { type: String, default: '' },
    items: { type: Array, default: [] },
    total: { type: Number, default: 0 },
    paymentMethod: { type: String, default: '' },
    emailSentAt: { type: Number, default: null },
    createdAt: { type: Number, required: true }
}, { minimize: false })

const pharmacyInvoiceModel = mongoose.models.pharmacyinvoice || mongoose.model('pharmacyinvoice', pharmacyInvoiceSchema)
export default pharmacyInvoiceModel
