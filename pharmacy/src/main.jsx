import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import PharmacyContextProvider from './context/PharmacyContext.jsx'
import AppContextProvider from './context/AppContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <PharmacyContextProvider>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </PharmacyContextProvider>
  </BrowserRouter>,
)
