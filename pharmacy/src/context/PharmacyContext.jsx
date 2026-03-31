import axios from "axios";
import { createContext, useState } from "react";
import { toast } from "react-toastify";

export const PharmacyContext = createContext()

const PharmacyContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [pharmToken, setPharmToken] = useState(localStorage.getItem('pharmToken') || '')
    const [medicines, setMedicines] = useState([])
    const [dashData, setDashData] = useState(false)

    // Get all medicines from backend
    const getMedicines = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/pharmacy/medicines', { headers: { pharmtoken: pharmToken } })
            if (data.success) {
                setMedicines(data.medicines)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Toggle medicine availability
    const toggleAvailability = async (medicineId, available) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/pharmacy/update-medicine', { medicineId, available: !available }, { headers: { pharmtoken: pharmToken } })
            if (data.success) {
                toast.success(data.message)
                getMedicines()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Update medicine details
    const updateMedicine = async (payload) => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/pharmacy/update-medicine',
                payload,
                { headers: { pharmtoken: pharmToken } }
            )
            if (data.success) {
                toast.success(data.message)
                getMedicines()
                getDashData()
            } else {
                toast.error(data.message)
            }
            return data
        } catch (error) {
            toast.error(error.message)
            return { success: false, message: error.message }
        }
    }

    // Delete a medicine
    const deleteMedicine = async (medicineId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/pharmacy/delete-medicine', { medicineId }, { headers: { pharmtoken: pharmToken } })
            if (data.success) {
                toast.success(data.message)
                getMedicines()
                getDashData()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Get pharmacy dashboard data
    const getDashData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/pharmacy/dashboard', { headers: { pharmtoken: pharmToken } })
            if (data.success) {
                setDashData(data.dashData)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Lookup patient details and consulted doctors
    const lookupPatient = async ({ patientId, patientName }) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/pharmacy/patient-lookup', { patientId, patientName }, { headers: { pharmtoken: pharmToken } })
            return data
        } catch (error) {
            return { success: false, message: error.message }
        }
    }

    // Get pharmacy invoices
    const getPharmacyInvoices = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/pharmacy/invoices', { headers: { pharmtoken: pharmToken } })
            return data
        } catch (error) {
            return { success: false, message: error.message }
        }
    }

    const value = {
        pharmToken, setPharmToken,
        backendUrl,
        medicines, getMedicines,
        toggleAvailability,
        updateMedicine,
        deleteMedicine,
        dashData, getDashData,
        lookupPatient,
        getPharmacyInvoices,
    }

    return (
        <PharmacyContext.Provider value={value}>
            {props.children}
        </PharmacyContext.Provider>
    )
}

export default PharmacyContextProvider
