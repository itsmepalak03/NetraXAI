import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/Toast.jsx'

import Landing from './pages/Landing.jsx'
import Dashboard from './pages/Dashboard.jsx'
import PatientsList from './pages/PatientsList.jsx'
import PatientRegistration from './pages/PatientRegistration.jsx'
import Screening from './pages/Screening.jsx'
import XAI from './pages/XAI.jsx'
import DoctorReview from './pages/DoctorReview.jsx'
import Report from './pages/Report.jsx'
import PatientHistory from './pages/PatientHistory.jsx'
import AnalyticsPage from './pages/Analytics.jsx'
import RuralSimulator from './pages/RuralSimulator.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<PatientsList />} />
        <Route path="/patients/new" element={<PatientRegistration />} />
        <Route path="/patients/:patientId/history" element={<PatientHistory />} />
        <Route path="/screening/:screeningId" element={<Screening />} />
        <Route path="/screening/:screeningId/xai" element={<XAI />} />
        <Route path="/screening/:screeningId/review" element={<DoctorReview />} />
        <Route path="/screening/:screeningId/report" element={<Report />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/simulator" element={<RuralSimulator />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </ToastProvider>
  )
}
