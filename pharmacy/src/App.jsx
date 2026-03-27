import React, { useContext } from 'react'
import { PharmacyContext } from './context/PharmacyContext'
import { Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Admin/Dashboard'
import MedicineList from './pages/Admin/MedicineList'
import AddMedicine from './pages/Admin/AddMedicine'
import Orders from './pages/Admin/Orders'
import PharmacyBilling from './pages/Admin/PharmacyBilling'
import Login from './pages/Login'

const App = () => {
  const { pharmToken } = useContext(PharmacyContext)

  return pharmToken ? (
    <div className='bg-[#F7FAF9] min-h-screen'>
      <ToastContainer />
      <Navbar />
      <div className='flex items-start'>
        <Sidebar />
        <Routes>
          <Route path='/' element={<Dashboard />} />
          <Route path='/pharmacy-dashboard' element={<Dashboard />} />
          <Route path='/medicines' element={<MedicineList />} />
          <Route path='/add-medicine' element={<AddMedicine />} />
          <Route path='/pharmacy-billing' element={<PharmacyBilling />} />
          <Route path='/orders' element={<Orders />} />
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