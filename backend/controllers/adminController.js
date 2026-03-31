import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js";
import labAssignmentModel from "../models/labAssignmentModel.js";
import labCatalogModel from "../models/labCatalogModel.js";
import feesCatalogModel from "../models/feesCatalogModel.js";
import billingInvoiceModel from "../models/billingInvoiceModel.js";
import auditLogModel from "../models/auditLogModel.js";
import doctorConsultationModel from "../models/doctorConsultationModel.js";
import pharmacyInvoiceModel from "../models/pharmacyInvoiceModel.js";
import medicineModel from "../models/pharmacyModel.js";

// API for admin login
const loginAdmin = async (req, res) => {
    try {

        const { email, password } = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
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

// API for reception login
const loginReception = async (req, res) => {
    try {
        const { email, password } = req.body

        if (email === process.env.RECEPTION_EMAIL && password === process.env.RECEPTION_PASSWORD) {
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


// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
    try {

        const appointments = await appointmentModel.find({})
        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const appointment = await appointmentModel.findById(appointmentId)

        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' })
        }

        // Mark as cancelled
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API for adding Doctor
const addDoctor = async (req, res) => {

    try {

        const { name, email, password, speciality, degree, experience, about, fees, address } = req.body
        const imageFile = req.file

        // checking for all data to add doctor
        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
            return res.json({ success: false, message: "Missing Details" })
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        // validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
        const hashedPassword = await bcrypt.hash(password, salt)

        // upload image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
        const imageUrl = imageUpload.secure_url

        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            address: JSON.parse(address),
            date: Date.now()
        }

        const newDoctor = new doctorModel(doctorData)
        await newDoctor.save()
        res.json({ success: true, message: 'Doctor Added' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select('-password')
        res.json({ success: true, doctors })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update doctor details from admin panel
const updateDoctor = async (req, res) => {
    try {
        const { docId, name, email, speciality, degree, experience, fees, about, address } = req.body

        if (!docId) {
            return res.json({ success: false, message: 'Missing doctor id' })
        }

        const updateData = {}
        if (name) updateData.name = name
        if (email) {
            if (!validator.isEmail(email)) {
                return res.json({ success: false, message: 'Please enter a valid email' })
            }
            updateData.email = email
        }
        if (speciality) updateData.speciality = speciality
        if (degree) updateData.degree = degree
        if (experience) updateData.experience = experience
        if (fees !== undefined) updateData.fees = Number(fees)
        if (about) updateData.about = about
        if (address) updateData.address = typeof address === 'string' ? JSON.parse(address) : address

        await doctorModel.findByIdAndUpdate(docId, updateData)
        res.json({ success: true, message: 'Doctor Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
    try {

        const [
            doctors,
            users,
            appointments,
            labAssignments,
            billingInvoices,
            pharmacyInvoices,
            medicines
        ] = await Promise.all([
            doctorModel.find({}),
            userModel.find({}),
            appointmentModel.find({}),
            labAssignmentModel.find({}),
            billingInvoiceModel.find({}),
            pharmacyInvoiceModel.find({}),
            medicineModel.find({})
        ])

        // Revenue calculations
        const pharmacyRevenue = pharmacyInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
        const labsRevenue = labAssignments.reduce((sum, ass) => sum + Number(ass.total || 0), 0)
        const billingRevenue = billingInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
        const appointmentRevenue = appointments.reduce((sum, app) => sum + Number(app.amount || 0), 0)
        const totalRevenue = pharmacyRevenue + labsRevenue + billingRevenue + appointmentRevenue

        // Summary metrics
        const lowStockMedicines = medicines.filter(m => m.stock < 10).length
        const pendingLabs = labAssignments.filter(a => a.status === 'Assigned' || a.status === 'Processing').length

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: users.length,
            totalRevenue,
            pharmacyRevenue,
            labsRevenue,
            billingRevenue,
            appointmentRevenue,
            medicineSummary: {
                total: medicines.length,
                lowStock: lowStockMedicines
            },
            labSummary: {
                total: labAssignments.length,
                pending: pendingLabs
            },
            latestAppointments: appointments.reverse().slice(0, 10),
            latestPharmacyInvoices: pharmacyInvoices.reverse().slice(0, 5),
            latestLabAssignments: labAssignments.reverse().slice(0, 5)
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to create lab assignment from reception
const createLabAssignment = async (req, res) => {
    try {
        const { patientId, patientName, tests, items, total, priority, notes } = req.body

        if (!patientId && !patientName) {
            return res.json({ success: false, message: 'Patient ID or name is required' })
        }

        let patientSnapshot = { name: patientName || '', email: '', phone: '', age: '', gender: '', height: null, weight: null }
        if (patientId) {
            const user = await userModel.findById(patientId).select('name email phone age gender height weight assignedDoctorId assignedDoctorName')
            if (user) {
                patientSnapshot = {
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    age: user.age || '',
                    gender: user.gender || '',
                    height: user.height ?? null,
                    weight: user.weight ?? null,
                    assignedDoctorId: user.assignedDoctorId || '',
                    assignedDoctorName: user.assignedDoctorName || ''
                }
            }
        }

        const latestAppointment = patientId
            ? await appointmentModel.findOne({ userId: patientId }).sort({ date: -1 })
            : null

        const doctorId = latestAppointment?.docId || patientSnapshot.assignedDoctorId || ''
        const doctorName = latestAppointment?.docData?.name || patientSnapshot.assignedDoctorName || ''
        const appointmentId = latestAppointment?._id?.toString() || ''
        const visitDate = latestAppointment?.slotDate || ''

        const testsArray = Array.isArray(tests)
            ? tests
            : typeof tests === 'string'
                ? tests.split(',').map(t => t.trim()).filter(Boolean)
                : []

        const itemsArray = Array.isArray(items) ? items : []
        const computedTotal = itemsArray.reduce((sum, it) => sum + Number(it?.price || 0), 0)

        const assignment = new labAssignmentModel({
            patientId: patientId || '',
            patientName: patientSnapshot.name || patientName,
            patientEmail: patientSnapshot.email || '',
            patientPhone: patientSnapshot.phone || '',
            patientAge: patientSnapshot.age || '',
            patientGender: patientSnapshot.gender || '',
            patientHeight: patientSnapshot.height ?? null,
            patientWeight: patientSnapshot.weight ?? null,
            doctorId,
            doctorName,
            appointmentId,
            visitDate,
            tests: testsArray,
            items: itemsArray,
            total: total !== undefined ? Number(total) : computedTotal,
            priority: priority || 'Routine',
            notes: notes || '',
            status: 'Assigned',
            createdAt: Date.now()
        })

        await assignment.save()
        res.json({ success: true, message: 'Lab assignment created', assignment })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get lab catalog
const getLabCatalog = async (req, res) => {
    try {
        const doc = await labCatalogModel.findOne({})
        if (!doc) {
            return res.json({ success: true, catalog: { categories: defaultLabCatalog() } })
        }
        res.json({ success: true, catalog: { categories: doc.categories || [] } })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update lab catalog
const updateLabCatalog = async (req, res) => {
    try {
        const { categories } = req.body
        if (!Array.isArray(categories)) {
            return res.json({ success: false, message: 'Invalid catalog format' })
        }
        const doc = await labCatalogModel.findOne({})
        if (!doc) {
            await labCatalogModel.create({ categories, updatedAt: Date.now() })
        } else {
            doc.categories = categories
            doc.updatedAt = Date.now()
            await doc.save()
        }
        res.json({ success: true, message: 'Lab catalog updated' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor consultations (reception)
const getDoctorConsultations = async (req, res) => {
    try {
        const consultations = await doctorConsultationModel.find({}).sort({ createdAt: -1 })
        res.json({ success: true, consultations })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to mark consultation lab assignment as completed
const markConsultationLabAssigned = async (req, res) => {
    try {
        const { consultationId } = req.body
        if (!consultationId) return res.json({ success: false, message: 'consultationId is required' })
        await doctorConsultationModel.findByIdAndUpdate(consultationId, { labAssigned: true })
        res.json({ success: true, message: 'Lab assignment marked' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to mark consultation surgery invoice as completed
const markConsultationSurgeryInvoiced = async (req, res) => {
    try {
        const { consultationId } = req.body
        if (!consultationId) return res.json({ success: false, message: 'consultationId is required' })
        await doctorConsultationModel.findByIdAndUpdate(consultationId, { surgeryInvoiced: true })
        res.json({ success: true, message: 'Surgery invoice marked' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const defaultLabCatalog = () => ([
    {
        key: 'blood_tests',
        name: 'Blood tests',
        items: [
            { name: 'CBC', price: 300 },
            { name: 'Blood Sugar (Fasting)', price: 150 },
            { name: 'HbA1c', price: 500 },
            { name: 'Lipid Profile', price: 800 },
            { name: 'Liver Function Test (LFT)', price: 700 },
            { name: 'Kidney Function Test (KFT)', price: 700 },
            { name: 'Thyroid Profile (TSH, T3, T4)', price: 600 },
            { name: 'Vitamin D', price: 1200 },
            { name: 'Vitamin B12', price: 800 },
            { name: 'CRP', price: 600 },
            { name: 'ESR', price: 200 },
            { name: 'Uric Acid', price: 250 },
            { name: 'Calcium', price: 300 },
            { name: 'Creatinine', price: 300 },
            { name: 'Iron Studies', price: 1200 }
        ]
    },
    {
        key: 'urine_tests',
        name: 'Urine tests',
        items: [
            { name: 'Urine Routine', price: 150 },
            { name: 'Urine Culture', price: 500 },
            { name: 'Microalbumin', price: 400 }
        ]
    },
    {
        key: 'cardiac_tests',
        name: 'Cardiac tests',
        items: [
            { name: 'ECG', price: 300 },
            { name: '2D Echo', price: 1500 },
            { name: 'TMT (Stress Test)', price: 2000 },
            { name: 'Cardiac Profile', price: 3000 }
        ]
    },
    {
        key: 'xray',
        name: 'Xray',
        items: [
            { name: 'Chest X-ray', price: 400 },
            { name: 'Hand X-ray', price: 300 },
            { name: 'Spine X-ray', price: 500 },
            { name: 'Skull X-ray', price: 400 },
            { name: 'Dental X-ray', price: 300 },
            { name: 'Full Body X-ray Package', price: 1500 }
        ]
    },
    {
        key: 'ultrasound',
        name: 'Ultrasound',
        items: [
            { name: 'Abdomen Ultrasound', price: 1200 },
            { name: 'Pelvic Ultrasound', price: 1000 },
            { name: 'Pregnancy Scan', price: 1500 },
            { name: 'Color Doppler', price: 2500 }
        ]
    },
    {
        key: 'ct_scan',
        name: 'CT Scan',
        items: [
            { name: 'CT Brain', price: 2500 },
            { name: 'CT Chest', price: 4000 },
            { name: 'CT Abdomen', price: 5000 },
            { name: 'CT KUB', price: 4500 },
            { name: 'CT Angiography', price: 9000 }
        ]
    },
    {
        key: 'mri_scan',
        name: 'MRI Scan',
        items: [
            { name: 'MRI Brain', price: 6000 },
            { name: 'MRI Spine', price: 7000 },
            { name: 'MRI Knee', price: 6500 },
            { name: 'MRI Abdomen', price: 9000 },
            { name: 'Full Body MRI', price: 12000 }
        ]
    },
    {
        key: 'advanced_tests',
        name: 'Advanced tests',
        items: [
            { name: 'COVID RT-PCR', price: 800 },
            { name: 'Dengue Test', price: 1200 },
            { name: 'Malaria Test', price: 400 },
            { name: 'Allergy Panel', price: 2500 },
            { name: 'Cancer Markers (CA-125, PSA, etc.)', price: 4000 },
            { name: 'Hormone Panel', price: 3000 }
        ]
    },
    {
        key: 'packages',
        name: 'Packages',
        items: [
            { name: 'Basic Health Checkup', price: 1500 },
            { name: 'Full Body Checkup', price: 4000 },
            { name: 'Diabetes Package', price: 1200 },
            { name: 'Heart Checkup Package', price: 3500 }
        ]
    }
])

// API to get fees catalog
const getFeesCatalog = async (req, res) => {
    try {
        const doc = await feesCatalogModel.findOne({})
        if (!doc) {
            return res.json({ success: true, catalog: { categories: defaultFeesCatalog() } })
        }
        res.json({ success: true, catalog: { categories: doc.categories || [] } })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update fees catalog
const updateFeesCatalog = async (req, res) => {
    try {
        const { categories } = req.body
        if (!Array.isArray(categories)) {
            return res.json({ success: false, message: 'Invalid catalog format' })
        }
        const doc = await feesCatalogModel.findOne({})
        if (!doc) {
            await feesCatalogModel.create({ categories, updatedAt: Date.now() })
        } else {
            doc.categories = categories
            doc.updatedAt = Date.now()
            await doc.save()
        }
        res.json({ success: true, message: 'Fees catalog updated' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const defaultFeesCatalog = () => ([
    {
        key: 'emergency_services',
        name: 'Emergency Services',
        items: [
            { name: 'Emergency Bed Charges (per hour)', price: 500 },
            { name: 'Emergency Handling Charges', price: 1000 },
            { name: 'Ambulance (Basic)', price: 1500 },
            { name: 'Ambulance (ICU)', price: 4000 }
        ]
    },
    {
        key: 'room_charges',
        name: 'Room Charges',
        items: [
            { name: 'General Ward (per day)', price: 1500 },
            { name: 'Semi-Private Room (per day)', price: 3000 },
            { name: 'Private Room (per day)', price: 5000 },
            { name: 'ICU (per day)', price: 8000 },
            { name: 'NICU (per day)', price: 9000 }
        ]
    },
    {
        key: 'nursing_services',
        name: 'Nursing Services',
        items: [
            { name: 'Basic Nursing Care (per day)', price: 500 },
            { name: 'Special Nursing (per day)', price: 1500 },
            { name: 'Injection Charges', price: 100 },
            { name: 'Dressing Charges', price: 300 }
        ]
    },
    {
        key: 'operation_theatre',
        name: 'Operation Theatre',
        items: [
            { name: 'Minor OT Charges', price: 2000 },
            { name: 'Major OT Charges', price: 8000 },
            { name: 'Laparoscopic OT Charges', price: 15000 },
            { name: 'Anesthesia Charges', price: 3000 },
            { name: 'Surgeon Fees (Basic)', price: 10000 }
        ]
    },
    {
        key: 'surgeries_common',
        name: 'Surgeries (Common)',
        items: [
            { name: 'Appendectomy', price: 50000 },
            { name: 'Cataract Surgery', price: 25000 },
            { name: 'Normal Delivery', price: 30000 },
            { name: 'Cesarean Section (C-Section)', price: 70000 },
            { name: 'Hernia Surgery', price: 45000 },
            { name: 'Gallbladder Surgery', price: 60000 }
        ]
    },
    {
        key: 'advanced_surgeries',
        name: 'Surgeries (Advanced)',
        items: [
            { name: 'Heart Bypass Surgery', price: 250000 },
            { name: 'Knee Replacement', price: 300000 },
            { name: 'Hip Replacement', price: 280000 },
            { name: 'Brain Surgery', price: 350000 },
            { name: 'Spine Surgery', price: 200000 }
        ]
    },
    {
        key: 'pharmacy_services',
        name: 'Pharmacy Services',
        items: [
            { name: 'Medicine Handling Charges', price: 50 },
            { name: 'Injection Administration', price: 100 }
        ]
    },
    {
        key: 'other_services',
        name: 'Other Services',
        items: [
            { name: 'Physiotherapy Session', price: 500 },
            { name: 'Vaccination Charges', price: 300 },
            { name: 'Medical Certificate', price: 200 }
        ]
    }
])

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

// API to book appointment from reception
const bookAppointmentReception = async (req, res) => {
    try {
        const { patientId, docId, slotDate, slotTime } = req.body

        if (!patientId || !docId || !slotDate || !slotTime) {
            return res.json({ success: false, message: "Missing details" })
        }

        const docData = await doctorModel.findById(docId).select("-password")

        if (!docData?.available) {
            return res.json({ success: false, message: 'Doctor Not Available' })
        }

        let slots_booked = docData.slots_booked

        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: 'Slot Not Available' })
            } else {
                slots_booked[slotDate].push(slotTime)
            }
        } else {
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }

        const userData = await userModel.findById(patientId).select("-password")
        if (!userData) {
            return res.json({ success: false, message: 'Patient not found' })
        }

        delete docData.slots_booked

        const appointmentData = {
            userId: patientId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()
        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: 'Appointment Booked' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to create billing invoice from reception (fees/room charges)
const createBillingInvoice = async (req, res) => {
    try {
        const { patientId, patientName, department, notes, items, total } = req.body

        if (!patientId && !patientName) {
            return res.json({ success: false, message: 'Patient ID or name is required' })
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.json({ success: false, message: 'Billing items are required' })
        }

        let patientSnapshot = { name: patientName || '', email: '', phone: '' }
        if (patientId) {
            const user = await userModel.findById(patientId).select('name email phone')
            if (user) {
                patientSnapshot = {
                    name: user.name,
                    email: user.email,
                    phone: user.phone
                }
            }
        }

        const latestAppointment = patientId
            ? await appointmentModel.findOne({ userId: patientId }).sort({ date: -1 })
            : null

        const doctorId = latestAppointment?.docId || ''
        const doctorName = latestAppointment?.docData?.name || ''
        const appointmentId = latestAppointment?._id?.toString() || ''
        const visitDate = latestAppointment?.slotDate || ''
        const visitTime = latestAppointment?.slotTime || ''

        const invoice = new billingInvoiceModel({
            patientId: patientId || '',
            patientName: patientSnapshot.name || patientName,
            patientEmail: patientSnapshot.email || '',
            patientPhone: patientSnapshot.phone || '',
            doctorId,
            doctorName,
            appointmentId,
            visitDate,
            visitTime,
            department: department || '',
            notes: notes || '',
            items,
            total: Number(total || 0),
            createdAt: Date.now()
        })

        await invoice.save()

        res.json({ success: true, message: 'Billing invoice saved', invoice })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get billing invoices (admin/reception)
const getBillingInvoices = async (req, res) => {
    try {
        const invoices = await billingInvoiceModel.find({}).sort({ createdAt: -1 }).limit(200)
        res.json({ success: true, invoices })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to list audit logs (admin only)
const getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50, actorType, action, status, from, to } = req.query
        const filters = {}
        if (actorType) filters.actorType = actorType
        if (action) filters.action = new RegExp(action, 'i')
        if (status) filters.statusCode = Number(status)
        if (from || to) {
            filters.createdAt = {}
            if (from) filters.createdAt.$gte = Number(from)
            if (to) filters.createdAt.$lte = Number(to)
        }

        const safeLimit = Math.min(Number(limit) || 50, 200)
        const skip = (Number(page) - 1) * safeLimit

        const [logs, total] = await Promise.all([
            auditLogModel.find(filters).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
            auditLogModel.countDocuments(filters)
        ])

        res.json({ success: true, logs, total, page: Number(page), limit: safeLimit })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export {
    loginAdmin,
    loginReception,
    appointmentsAdmin,
    appointmentCancel,
    addDoctor,
    allDoctors,
    updateDoctor,
    adminDashboard,
    lookupPatient,
    bookAppointmentReception,
    createBillingInvoice,
    createLabAssignment,
    getLabCatalog,
    updateLabCatalog,
    getFeesCatalog,
    updateFeesCatalog,
    getBillingInvoices,
    getDoctorConsultations,
    markConsultationLabAssigned,
    markConsultationSurgeryInvoiced,
    getAuditLogs
}