import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
    actorType: { type: String, default: '' },
    actorId: { type: String, default: '' },
    actorName: { type: String, default: '' },
    action: { type: String, default: '' },
    method: { type: String, default: '' },
    path: { type: String, default: '' },
    statusCode: { type: Number, default: 0 },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    params: { type: Object, default: {} },
    query: { type: Object, default: {} },
    bodyKeys: { type: Array, default: [] },
    createdAt: { type: Number, required: true }
}, { minimize: false })

const auditLogModel = mongoose.models.auditlog || mongoose.model('auditlog', auditLogSchema)
export default auditLogModel
