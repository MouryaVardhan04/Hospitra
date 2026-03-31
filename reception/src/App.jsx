import React, { useContext } from 'react'
import { AdminContext } from './context/AdminContext'
import { Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import ReceptionDashboard from './pages/Reception/Dashboard'
import PatientRegistration from './pages/Reception/PatientRegistration'
import AppointmentBooking from './pages/Reception/AppointmentBooking'
import LabAssignment from './pages/Reception/LabAssignment'
import BillingInitiation from './pages/Reception/BillingInitiation'
import QueueManagement from './pages/Reception/QueueManagement'
import ConsultationOrders from './pages/Reception/ConsultationOrders'

const App = () => {

  const { aToken } = useContext(AdminContext)

  return aToken ? (
    <div className='bg-[#F8F9FD] min-h-screen'>
      <ToastContainer />
      <Navbar />
      <div className='flex items-start'>
        <Sidebar />
        <Routes>
          <Route path='/' element={<ReceptionDashboard />} />
          <Route path='/reception-dashboard' element={<ReceptionDashboard />} />
          <Route path='/patient-registration' element={<PatientRegistration />} />
          <Route path='/appointment-booking' element={<AppointmentBooking />} />
          <Route path='/lab-assignment' element={<LabAssignment />} />
          <Route path='/billing-initiation' element={<BillingInitiation />} />
          <Route path='/consultation-orders' element={<ConsultationOrders />} />
          <Route path='/queue-management' element={<QueueManagement />} />
        </Routes>
      </div>
    </div>
  ) : (
    <>
      <ToastContainer />
      <Login />
    </>
  )
}

export default App