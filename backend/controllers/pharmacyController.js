import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import medicineModel from "../models/pharmacyModel.js";
import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js";
import appointmentModel from "../models/appointmentModel.js";
import pharmacyInvoiceModel from "../models/pharmacyInvoiceModel.js";
import { sendPharmacyInvoiceEmail } from "../services/emailService.js";
import { generatePharmacyInvoicePdf } from "../services/pdfService.js";

// API for pharmacy admin login
const loginPharmacy = async (req, res) => {
    try {
        const { email, password } = req.body
        if (email === process.env.PHARMACY_EMAIL && password === process.env.PHARMACY_PASSWORD) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to add a new medicine
const addMedicine = async (req, res) => {
    try {
        const { name, description, category, price, stock, requiresPrescription, manufacturer, dosage } = req.body
        const imageFile = req.file

        if (!name || !description || !category || !price || stock === undefined) {
            return res.json({ success: false, message: "Missing required fields" })
        }

        let imageUrl = ''
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            imageUrl = imageUpload.secure_url
        }

        const medicineData = {
            name,
            description,
            category,
            price: Number(price),
            stock: Number(stock),
            image: imageUrl,
            requiresPrescription: requiresPrescription === 'true' || requiresPrescription === true,
            available: true,
            manufacturer: manufacturer || '',
            dosage: dosage || '',
            date: Date.now()
        }

        const newMedicine = new medicineModel(medicineData)
        await newMedicine.save()
        res.json({ success: true, message: 'Medicine Added Successfully' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all medicines
const getMedicines = async (req, res) => {
    try {
        const medicines = await medicineModel.find({})
        res.json({ success: true, medicines })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update medicine availability / details
const updateMedicine = async (req, res) => {
    try {
        const { medicineId, available, stock, price, name, description, category, requiresPrescription, manufacturer, dosage } = req.body
        const updateData = {}
        if (available !== undefined) updateData.available = available
        if (stock !== undefined) updateData.stock = Number(stock)
        if (price !== undefined) updateData.price = Number(price)
        if (name !== undefined) updateData.name = name
        if (description !== undefined) updateData.description = description
        if (category !== undefined) updateData.category = category
        if (requiresPrescription !== undefined) updateData.requiresPrescription = requiresPrescription === 'true' || requiresPrescription === true
        if (manufacturer !== undefined) updateData.manufacturer = manufacturer
        if (dosage !== undefined) updateData.dosage = dosage

        await medicineModel.findByIdAndUpdate(medicineId, updateData)
        res.json({ success: true, message: 'Medicine Updated' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to delete a medicine
const deleteMedicine = async (req, res) => {
    try {
        const { medicineId } = req.body
        await medicineModel.findByIdAndDelete(medicineId)
        res.json({ success: true, message: 'Medicine Deleted' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get pharmacy dashboard data
const pharmacyDashboard = async (req, res) => {
    try {
        const medicines = await medicineModel.find({})
        const totalMedicines = medicines.length
        const availableMedicines = medicines.filter(m => m.available).length
        const lowStockMedicines = medicines.filter(m => m.stock < 10 && m.stock >= 0)
        const outOfStock = medicines.filter(m => m.stock === 0).length
        const prescriptionOnly = medicines.filter(m => m.requiresPrescription).length

        const dashData = {
            totalMedicines,
            availableMedicines,
            outOfStock,
            prescriptionOnly,
            lowStockMedicines: lowStockMedicines.length,
            recentMedicines: medicines.slice(-5).reverse()
        }

        res.json({ success: true, dashData })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to lookup patient details and consulted doctors
const lookupPatient = async (req, res) => {
    try {
        const { patientId, patientName } = req.body

        if (!patientId && !patientName) {
            return res.json({ success: false, message: "Patient ID or Name is required" })
        }

        let patients = []

        if (patientId) {
            if (!mongoose.Types.ObjectId.isValid(patientId)) {
                return res.json({ success: false, message: "Invalid patient ID" })
            }
            const user = await userModel.findById(patientId).select('-password')
            if (user) patients = [user]
        } else {
            const regex = new RegExp(patientName, 'i')
            patients = await userModel.find({ name: regex }).select('-password').limit(10)
        }

        if (!patients.length) {
            return res.json({ success: false, message: "No patient found" })
        }

        const results = []
        for (const patient of patients) {
            const appointments = await appointmentModel.find({ userId: patient._id.toString() }).sort({ date: -1 })
            results.push({
                patient,
                appointments
            })
        }

        res.json({ success: true, results })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to create pharmacy invoice
const createInvoice = async (req, res) => {
    try {
        const { userId, patientName, patientEmail, patientPhone, doctorId, doctorName, items, total, paymentMethod } = req.body

        if (!userId || !Array.isArray(items) || items.length === 0) {
            return res.json({ success: false, message: 'Missing invoice details' })
        }

        const invoice = new pharmacyInvoiceModel({
            userId,
            patientName: patientName || '',
            patientEmail: patientEmail || '',
            patientPhone: patientPhone || '',
            doctorId: doctorId || '',
            doctorName: doctorName || '',
            items,
            total: Number(total || 0),
            paymentMethod: paymentMethod || '',
            createdAt: Date.now()
        })

        await invoice.save()

        if (invoice.patientEmail && !invoice.emailSentAt) {
            try {
                const appointment = await appointmentModel.findOne({ userId: userId }).sort({ date: -1 })
                const pdfBuffer = await generatePharmacyInvoicePdf({ invoice, appointment })
                await sendPharmacyInvoiceEmail({
                    to: invoice.patientEmail,
                    userName: invoice.patientName,
                    pdfBuffer,
                    invoiceId: invoice._id?.toString()
                })
                await pharmacyInvoiceModel.findByIdAndUpdate(invoice._id, { emailSentAt: Date.now() })
            } catch (e) {
                console.warn('Email send failed (pharmacy invoice):', e?.message || e)
            }
        }

        res.json({ success: true, message: 'Invoice saved', invoice })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export {
    loginPharmacy,
    addMedicine,
    getMedicines,
    updateMedicine,
    deleteMedicine,
    pharmacyDashboard,
    lookupPatient,
    createInvoice
}
