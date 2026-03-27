import mongoose from "mongoose";

const labCatalogSchema = new mongoose.Schema({
    categories: {
        type: Array,
        default: []
    },
    updatedAt: { type: Number, default: Date.now }
}, { minimize: false })

const labCatalogModel = mongoose.models.labcatalog || mongoose.model("labcatalog", labCatalogSchema)
export default labCatalogModel
