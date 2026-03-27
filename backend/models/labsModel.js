import mongoose from "mongoose";

const labTestSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    turnaroundTime: { type: String, required: true }, // e.g. "24 hours", "2-3 days"
    sampleType: { type: String, default: 'Blood' },   // Blood, Urine, Stool, etc.
    available: { type: Boolean, default: true },
    homeCollection: { type: Boolean, default: false },
    date: { type: Number, required: true },
}, { minimize: false })

const labTestModel = mongoose.models.labtest || mongoose.model("labtest", labTestSchema);
export default labTestModel;
