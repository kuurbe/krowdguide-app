import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import MobileApp from './mobile/MobileApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MobileApp />} />
        <Route path="/landing" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
