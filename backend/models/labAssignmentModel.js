import mongoose from "mongoose";

const labAssignmentSchema = new mongoose.Schema({
    patientId: { type: String, default: '' },
    patientName: { type: String, required: true },
    patientEmail: { type: String, default: '' },
    patientPhone: { type: String, default: '' },
    patientAge: { type: String, default: '' },
    patientGender: { type: String, default: '' },
    patientHeight: { type: Number, default: null },
    patientWeight: { type: Number, default: null },
    doctorId: { type: String, default: '' },
    doctorName: { type: String, default: '' },
    appointmentId: { type: String, default: '' },
    visitDate: { type: String, default: '' },
    tests: { type: [String], default: [] },
    items: { type: Array, default: [] },
    total: { type: Number, default: 0 },
    priority: { type: String, default: 'Routine' },
    notes: { type: String, default: '' },
    status: { type: String, default: 'Assigned' },
    sampleCollected: { type: Boolean, default: false },
    sampleCollectedAt: { type: Number, default: null },
    sampleId: { type: String, default: '' },
    reportText: { type: String, default: '' },
    reportGeneratedAt: { type: Number, default: null },
    reportEmailSentAt: { type: Number, default: null },
    createdAt: { type: Number, required: true }
}, { minimize: false })

const labAssignmentModel = mongoose.models.labassignment || mongoose.model("labassignment", labAssignmentSchema)
export default labAssignmentModel
