import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AuthProvider from './context/AuthContext.jsx'

import './index.css'
import App from './App.jsx'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(  // BrowserRouter is used only for web browsers
  <AuthProvider>
      <BrowserRouter>    
          <App />
      </BrowserRouter>
  </AuthProvider>
)
