import React, { useContext } from 'react'
import { LabsContext } from './context/LabsContext'
import { Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Admin/Dashboard'
import TestsList from './pages/Admin/TestsList'
import Bookings from './pages/Admin/Bookings'
import SamplesCollected from './pages/Admin/SamplesCollected'
import Reports from './pages/Admin/Reports'
import GenerateReport from './pages/Admin/GenerateReport'
import AllReports from './pages/Admin/AllReports'
import Login from './pages/Login'

const App = () => {
  const { labsToken } = useContext(LabsContext)

  return labsToken ? (
    <div className='bg-[#F7FAF9] min-h-screen'>
      <ToastContainer />
      <Navbar />
      <div className='flex items-start'>
        <Sidebar />
        <Routes>
          <Route path='/' element={<Dashboard />} />
          <Route path='/labs-dashboard' element={<Dashboard />} />
          <Route path='/tests' element={<TestsList />} />
          <Route path='/bookings' element={<Bookings />} />
          <Route path='/samples-collected' element={<SamplesCollected />} />
          <Route path='/reports' element={<Reports />} />
          <Route path='/all-reports' element={<AllReports />} />
          <Route path='/generate-report' element={<GenerateReport />} />
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