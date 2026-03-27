import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    image: { type: String, default: '' },
    requiresPrescription: { type: Boolean, default: false },
    available: { type: Boolean, default: true },
    manufacturer: { type: String, default: '' },
    dosage: { type: String, default: '' },
    date: { type: Number, required: true },
}, { minimize: false })

const medicineModel = mongoose.models.medicine || mongoose.model("medicine", medicineSchema);
export default medicineModel;
