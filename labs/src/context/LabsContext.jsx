import axios from "axios";
import { createContext, useState } from "react";
import { toast } from "react-toastify";

export const LabsContext = createContext()

const LabsContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [labsToken, setLabsToken] = useState(localStorage.getItem('labsToken') || '')
    const [tests, setTests] = useState([])
    const [dashData, setDashData] = useState(false)

    // Get all lab tests
    const getTests = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/labs/tests', { headers: { labstoken: labsToken } })
            if (data.success) {
                setTests(data.tests)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Toggle test availability
    const toggleAvailability = async (testId, available) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/labs/update-test', { testId, available: !available }, { headers: { labstoken: labsToken } })
            if (data.success) {
                toast.success(data.message)
                getTests()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Delete a lab test
    const deleteTest = async (testId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/labs/delete-test', { testId }, { headers: { labstoken: labsToken } })
            if (data.success) {
                toast.success(data.message)
                getTests()
                getDashData()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Get labs dashboard data
    const getDashData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/labs/dashboard', { headers: { labstoken: labsToken } })
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
            const { data } = await axios.post(backendUrl + '/api/labs/patient-lookup', { patientId, patientName }, { headers: { labstoken: labsToken } })
            return data
        } catch (error) {
            return { success: false, message: error.message }
        }
    }

    // Get lab assignments
    const getLabAssignments = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/labs/assignments', { headers: { labstoken: labsToken } })
            return data
        } catch (error) {
            return { success: false, message: error.message }
        }
    }

    // Update lab assignment status/sample/report
    const updateLabAssignment = async ({ assignmentId, status, sampleCollected, sampleCollectedAt, sampleId, reportText }) => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/labs/assignment-update',
                { assignmentId, status, sampleCollected, sampleCollectedAt, sampleId, reportText },
                { headers: { labstoken: labsToken } }
            )
            return data
        } catch (error) {
            return { success: false, message: error.message }
        }
    }

    const value = {
        labsToken, setLabsToken,
        backendUrl,
        tests, getTests,
        toggleAvailability,
        deleteTest,
        dashData, getDashData,
        lookupPatient,
        getLabAssignments,
        updateLabAssignment,
    }

    return (
        <LabsContext.Provider value={value}>
            {props.children}
        </LabsContext.Provider>
    )
}

export default LabsContextProvider
