import axios from "axios";
import { createContext, useState } from "react";
import { toast } from "react-toastify";


export const AdminContext = createContext()

const AdminContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [aToken, setAToken] = useState(localStorage.getItem('aToken') ? localStorage.getItem('aToken') : '')

    const [appointments, setAppointments] = useState([])
    const [doctors, setDoctors] = useState([])
    const [dashData, setDashData] = useState(false)
    const [labCatalog, setLabCatalog] = useState([])
    const [feesCatalog, setFeesCatalog] = useState([])

    // Getting all Doctors data from Database using API
    const getAllDoctors = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/all-doctors', { headers: { aToken } })
            if (data.success) {
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }

    }

    // Function to change doctor availablity using API
    const changeAvailability = async (docId) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/admin/change-availability', { docId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }


    // Getting all appointment data from Database using API
    const getAllAppointments = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/appointments', { headers: { aToken } })
            if (data.success) {
                setAppointments(data.appointments.reverse())
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    // Function to cancel appointment using API
    const cancelAppointment = async (appointmentId) => {

        try {

            const { data } = await axios.post(backendUrl + '/api/admin/cancel-appointment', { appointmentId }, { headers: { aToken } })

            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    // Getting Admin Dashboard data from Database using API
    const getDashData = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/admin/dashboard', { headers: { aToken } })

            if (data.success) {
                setDashData(data.dashData)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    // Lookup patient details and consulted doctors
    const lookupPatient = async ({ patientId, patientName }) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/patient-lookup', { patientId, patientName }, { headers: { aToken } })
            return data
        } catch (error) {
            return { success: false, message: error.message }
        }
    }

    // Book appointment for patient from reception
    const bookAppointmentReception = async ({ patientId, docId, slotDate, slotTime }) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/book-appointment', { patientId, docId, slotDate, slotTime }, { headers: { aToken } })
            return data
        } catch (error) {
            return { success: false, message: error.message }
        }
    }

    // Get lab catalog
    const getLabCatalog = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/lab-catalog', { headers: { aToken } })
            if (data.success) {
                const categories = data.catalog?.categories || []
                setLabCatalog(categories)
                return { success: true, categories }
            }
            return { success: false, message: data.message }
        } catch (error) {
            return { success: false, message: error.message }
        }
    }

    // Get fees catalog
    const getFeesCatalog = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/fees-catalog', { headers: { aToken } })
            if (data.success) {
                const categories = data.catalog?.categories || []
                setFeesCatalog(categories)
                return { success: true, categories }
            }
            return { success: false, message: data.message }
        } catch (error) {
            return { success: false, message: error.message }
        }
    }

    // Create billing invoice (fees/room charges)
    const createBillingInvoice = async ({ patientId, patientName, department, notes, items, total }) => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/admin/billing-invoice',
                { patientId, patientName, department, notes, items, total },
                { headers: { aToken } }
            )
            return data
        } catch (error) {
            return { success: false, message: error.message }
        }
    }

    const value = {
        aToken, setAToken,
        doctors,
        getAllDoctors,
        changeAvailability,
        appointments,
        getAllAppointments,
        getDashData,
        cancelAppointment,
        dashData,
        lookupPatient,
        bookAppointmentReception,
        labCatalog,
        getLabCatalog,
        feesCatalog,
        getFeesCatalog,
        createBillingInvoice
    }

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )

}

export default AdminContextProvider