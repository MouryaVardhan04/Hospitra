import mongoose from "mongoose";

const feesCatalogSchema = new mongoose.Schema({
    categories: {
        type: Array,
        default: []
    },
    updatedAt: { type: Number, default: Date.now }
}, { minimize: false })

const feesCatalogModel = mongoose.models.feescatalog || mongoose.model("feescatalog", feesCatalogSchema)
export default feesCatalogModel
