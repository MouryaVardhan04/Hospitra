import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import labTestModel from "../models/labsModel.js";
import labAssignmentModel from "../models/labAssignmentModel.js";
import userModel from "../models/userModel.js";
import appointmentModel from "../models/appointmentModel.js";

// API for labs admin login
const loginLabs = async (req, res) => {
    try {
        const { email, password } = req.body
        if (email === process.env.LABS_EMAIL && password === process.env.LABS_PASSWORD) {
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

// API to add a new lab test
const addLabTest = async (req, res) => {
    try {
        const { name, description, category, price, turnaroundTime, sampleType, homeCollection } = req.body

        if (!name || !description || !category || !price || !turnaroundTime) {
            return res.json({ success: false, message: "Missing required fields" })
        }

        const testData = {
            name,
            description,
            category,
            price: Number(price),
            turnaroundTime,
            sampleType: sampleType || 'Blood',
            available: true,
            homeCollection: homeCollection === 'true' || homeCollection === true,
            date: Date.now()
        }

        const newTest = new labTestModel(testData)
        await newTest.save()
        res.json({ success: true, message: 'Lab Test Added Successfully' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all lab tests
const getLabTests = async (req, res) => {
    try {
        const tests = await labTestModel.find({})
        res.json({ success: true, tests })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update lab test availability / details
const updateLabTest = async (req, res) => {
    try {
        const { testId, available, price, homeCollection } = req.body
        const updateData = {}
        if (available !== undefined) updateData.available = available
        if (price !== undefined) updateData.price = Number(price)
        if (homeCollection !== undefined) updateData.homeCollection = homeCollection

        await labTestModel.findByIdAndUpdate(testId, updateData)
        res.json({ success: true, message: 'Lab Test Updated' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to delete a lab test
const deleteLabTest = async (req, res) => {
    try {
        const { testId } = req.body
        await labTestModel.findByIdAndDelete(testId)
        res.json({ success: true, message: 'Lab Test Deleted' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get labs dashboard data
const labsDashboard = async (req, res) => {
    try {
        const tests = await labTestModel.find({})
        const totalTests = tests.length
        const availableTests = tests.filter(t => t.available).length
        const homeCollectionTests = tests.filter(t => t.homeCollection).length

        // Group by category
        const categoryMap = {}
        tests.forEach(t => {
            categoryMap[t.category] = (categoryMap[t.category] || 0) + 1
        })

        const assignments = await labAssignmentModel.find({})
        const pendingSamples = assignments.filter(a => a.status === 'Pending Sample').length
        const inProcessSamples = assignments.filter(a => a.status === 'Sample Collected').length
        const completedReports = assignments.filter(a => a.status === 'Reported').length
        const collectedReports = assignments.filter(a => a.status === 'Closed').length

        const dashData = {
            totalTests,
            availableTests,
            homeCollectionTests,
            categories: Object.keys(categoryMap).length,
            recentTests: tests.slice(-5).reverse(),
            pendingSamples,
            inProcessSamples,
            completedReports,
            collectedReports
        }

        res.json({ success: true, dashData })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get lab assignments
const getLabAssignments = async (req, res) => {
    try {
        const assignments = await labAssignmentModel.find({}).sort({ createdAt: -1 })
        res.json({ success: true, assignments })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update lab assignment status/sample/report
const updateLabAssignment = async (req, res) => {
    try {
        const { assignmentId, status, sampleCollected, sampleCollectedAt, sampleId, reportText } = req.body

        if (!assignmentId) {
            return res.json({ success: false, message: 'Assignment ID is required' })
        }

        const updateData = {}
        if (status) updateData.status = status
        if (sampleCollected !== undefined) {
            updateData.sampleCollected = sampleCollected
            updateData.sampleCollectedAt = sampleCollected ? (sampleCollectedAt || Date.now()) : null
        }
        if (sampleId !== undefined) {
            updateData.sampleId = sampleId
        }
        if (reportText !== undefined) {
            updateData.reportText = reportText
            updateData.reportGeneratedAt = reportText ? Date.now() : null
            if (reportText) updateData.status = 'Reported'
        }

        const updatedAssignment = await labAssignmentModel.findByIdAndUpdate(assignmentId, updateData, { new: true })

        res.json({ success: true, message: 'Assignment updated' })
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

export {
    loginLabs,
    addLabTest,
    getLabTests,
    updateLabTest,
    deleteLabTest,
    labsDashboard,
    lookupPatient,
    getLabAssignments,
    updateLabAssignment
}
