import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import labCatalogModel from "../models/labCatalogModel.js";
import feesCatalogModel from "../models/feesCatalogModel.js";
import medicineModel from "../models/pharmacyModel.js";
import labAssignmentModel from "../models/labAssignmentModel.js";
import pharmacyInvoiceModel from "../models/pharmacyInvoiceModel.js";
import billingInvoiceModel from "../models/billingInvoiceModel.js";
import doctorConsultationModel from "../models/doctorConsultationModel.js";

// API for doctor Login 
const loginDoctor = async (req, res) => {

    try {

        const { email, password } = req.body
        const user = await doctorModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
    try {

        const { docId } = req.body
        const appointments = await appointmentModel.find({ docId })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
    try {

        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

            return res.json({ success: true, message: 'Appointment Cancelled' })
        }

        res.json({ success: false, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
    try {

        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })

            return res.json({ success: true, message: 'Appointment Completed' })
        }

        res.json({ success: false, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to accept appointment for doctor panel
const appointmentAccept = async (req, res) => {
    try {

        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (!appointmentData || appointmentData.docId !== docId) {
            return res.json({ success: false, message: 'Unauthorized action' })
        }

        if (appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled' })
        }

        if (appointmentData.isAccepted) {
            return res.json({ success: true, message: 'Appointment already accepted' })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { isAccepted: true })

        return res.json({ success: true, message: 'Appointment Accepted' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all doctors list for Frontend
const doctorList = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select(['-password', '-email'])
        res.json({ success: true, doctors })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to change doctor availablity for Admin and Doctor Panel
const changeAvailablity = async (req, res) => {
    try {

        const { docId } = req.body

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
        res.json({ success: true, message: 'Availablity Changed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor profile for  Doctor Panel
const doctorProfile = async (req, res) => {
    try {

        const { docId } = req.body
        const profileData = await doctorModel.findById(docId).select('-password')

        res.json({ success: true, profileData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update doctor profile data from  Doctor Panel
const updateDoctorProfile = async (req, res) => {
    try {

        const { docId, fees, address, available } = req.body

        await doctorModel.findByIdAndUpdate(docId, { fees, address, available })

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
    try {

        const { docId } = req.body

        const appointments = await appointmentModel.find({ docId })

        let earnings = 0

        appointments.map((item) => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount
            }
        })

        let patients = []

        appointments.map((item) => {
            if (!patients.includes(item.userId)) {
                patients.push(item.userId)
            }
        })



        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latestAppointments: appointments.reverse()
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get today's appointments for doctor consultation
const doctorTodayAppointments = async (req, res) => {
    try {
        const { docId } = req.body

        const today = new Date()
        const slotDate = `${today.getDate()}_${today.getMonth() + 1}_${today.getFullYear()}`

        const appointments = await appointmentModel.find({
            docId,
            slotDate,
            cancelled: false,
            isAccepted: true
        }).sort({ date: -1 })

        res.json({ success: true, appointments })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get lab catalog for doctor
const doctorLabCatalog = async (req, res) => {
    try {
        const doc = await labCatalogModel.findOne({})
        res.json({ success: true, categories: doc?.categories || [] })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get fees catalog for doctor (surgeries/medical catalog)
const doctorFeesCatalog = async (req, res) => {
    try {
        const doc = await feesCatalogModel.findOne({})
        res.json({ success: true, categories: doc?.categories || [] })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get medicines catalog for doctor
const doctorMedicines = async (req, res) => {
    try {
        const medicines = await medicineModel.find({}).sort({ date: -1 })
        res.json({ success: true, medicines })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to create doctor consultation with lab/pharmacy assignments
const doctorCreateConsultation = async (req, res) => {
    try {
        const { docId } = req.body
        const { appointmentId, condition, notes, labItems, pharmacyItems, surgeryItems } = req.body

        if (!appointmentId) {
            return res.json({ success: false, message: 'Appointment ID is required' })
        }

        const appointment = await appointmentModel.findById(appointmentId)
        if (!appointment || appointment.docId !== docId) {
            return res.json({ success: false, message: 'Unauthorized action' })
        }

        const user = await userModel.findById(appointment.userId).select('-password')

        const patientName = appointment?.userData?.name || user?.name || ''
        const patientEmail = appointment?.userData?.email || user?.email || ''
        const patientPhone = appointment?.userData?.phone || user?.phone || ''
        const patientAge = appointment?.userData?.age || user?.age || ''
        const patientGender = appointment?.userData?.gender || user?.gender || ''
        const doctorName = appointment?.docData?.name || ''

        const labItemsArray = Array.isArray(labItems) ? labItems : []
        const pharmacyItemsArray = Array.isArray(pharmacyItems) ? pharmacyItems : []
        const surgeryItemsArray = Array.isArray(surgeryItems) ? surgeryItems : []

        const labTotal = labItemsArray.reduce((sum, it) => sum + Number(it?.price || 0), 0)
        const pharmacyTotal = pharmacyItemsArray.reduce((sum, it) => sum + (Number(it?.price || 0) * Number(it?.qty || 1)), 0)
        const surgeryTotal = surgeryItemsArray.reduce((sum, it) => sum + Number(it?.price || 0), 0)

        const consultation = new doctorConsultationModel({
            appointmentId: appointment._id.toString(),
            doctorId: docId,
            doctorName,
            patientId: appointment.userId,
            patientName,
            patientEmail,
            patientPhone,
            patientAge,
            patientGender,
            appointmentDate: appointment.slotDate || '',
            appointmentTime: appointment.slotTime || '',
            condition: condition || '',
            notes: notes || '',
            labItems: labItemsArray,
            pharmacyItems: pharmacyItemsArray,
            surgeryItems: surgeryItemsArray,
            labTotal,
            pharmacyTotal,
            surgeryTotal,
            createdAt: Date.now()
        })

        await consultation.save()

        if (labItemsArray.length > 0) {
            const labAssignment = new labAssignmentModel({
                patientId: appointment.userId || '',
                patientName,
                patientEmail,
                patientPhone,
                patientAge,
                patientGender,
                doctorId: docId,
                doctorName,
                appointmentId: appointment._id.toString(),
                visitDate: appointment.slotDate || '',
                tests: labItemsArray.map(i => i.name),
                items: labItemsArray,
                total: labTotal,
                priority: 'Routine',
                notes: notes || '',
                status: 'Assigned',
                createdAt: Date.now()
            })
            await labAssignment.save()
        }

        if (pharmacyItemsArray.length > 0) {
            const invoice = new pharmacyInvoiceModel({
                userId: appointment.userId,
                patientName,
                patientEmail,
                patientPhone,
                doctorId: docId,
                doctorName,
                items: pharmacyItemsArray,
                total: pharmacyTotal,
                paymentMethod: 'Pending',
                createdAt: Date.now()
            })
            await invoice.save()
        }

        if (surgeryItemsArray.length > 0) {
            const billing = new billingInvoiceModel({
                patientId: appointment.userId,
                patientName,
                patientEmail,
                patientPhone,
                doctorId: docId,
                doctorName,
                appointmentId: appointment._id.toString(),
                visitDate: appointment.slotDate || '',
                visitTime: appointment.slotTime || '',
                department: 'Surgery',
                notes: notes || '',
                items: surgeryItemsArray,
                total: surgeryTotal,
                createdAt: Date.now()
            })
            await billing.save()
        }

        res.json({ success: true, message: 'Consultation saved', consultationId: consultation._id })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get patient prescriptions for doctor
const doctorPatientPrescriptions = async (req, res) => {
    try {
        const { userId } = req.query
        if (!userId) return res.json({ success: false, message: 'User ID required' })

        const invoices = await pharmacyInvoiceModel.find({ userId }).sort({ createdAt: -1 }).limit(20)
        res.json({ success: true, invoices })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get recent consultations with lab/pharmacy details for a patient
const doctorPatientConsultations = async (req, res) => {
    try {
        const { userId } = req.query
        const docId = req.doctor?.id || req.body?.docId
        if (!userId) return res.json({ success: false, message: 'User ID required' })

        const consultations = await doctorConsultationModel
            .find({ patientId: userId, doctorId: docId })
            .sort({ createdAt: -1 })
            .limit(2)

        const enriched = await Promise.all(consultations.map(async (c) => {
            let labAssignment = null
            if (c.appointmentId) {
                labAssignment = await labAssignmentModel.findOne({ appointmentId: c.appointmentId }).sort({ createdAt: -1 })
            }
            return {
                _id: c._id,
                appointmentId: c.appointmentId,
                createdAt: c.createdAt,
                condition: c.condition,
                notes: c.notes,
                labItems: c.labItems || [],
                pharmacyItems: c.pharmacyItems || [],
                labAssignment: labAssignment ? {
                    _id: labAssignment._id,
                    tests: labAssignment.tests || [],
                    items: labAssignment.items || [],
                    reportText: labAssignment.reportText || '',
                    reportGeneratedAt: labAssignment.reportGeneratedAt || null,
                    status: labAssignment.status || ''
                } : null
            }
        }))

        res.json({ success: true, consultations: enriched })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export {
    loginDoctor,
    appointmentsDoctor,
    appointmentCancel,
    appointmentAccept,
    doctorList,
    changeAvailablity,
    appointmentComplete,
    doctorDashboard,
    doctorTodayAppointments,
    doctorLabCatalog,
    doctorFeesCatalog,
    doctorMedicines,
    doctorCreateConsultation,
    doctorPatientPrescriptions,
    doctorPatientConsultations,
    doctorProfile,
    updateDoctorProfile
}