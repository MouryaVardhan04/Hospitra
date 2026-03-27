import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import LabsContextProvider from './context/LabsContext.jsx'
import AppContextProvider from './context/AppContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <LabsContextProvider>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </LabsContextProvider>
  </BrowserRouter>,
)
