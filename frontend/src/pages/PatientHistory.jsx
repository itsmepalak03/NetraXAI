import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { Patients, Screenings } from '../services/api.js'

export default function PatientHistory() {
  const { patientId } = useParams()
  const [patient, setPatient] = useState(null)
  const [screenings, setScreenings] = useState([])

  useEffect(() => {
    Patients.get(patientId).then(setPatient)
    Screenings.list().then((all) => setScreenings(all.filter(s => s.patient_id === Number(patientId)).reverse()))
  }, [patientId])

  if (!patient) return <DashboardLayout><LoadingScreen label="Loading patient history…" /></DashboardLayout>

  const chartData = screenings.filter(s => s.ai_result).map((s) => ({
    date: new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
    level: s.ai_result.dr_level,
  }))

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dashnavy">{patient.name}</h1>
          <p className="text-dashslate text-sm">{patient.patient_code} · {patient.age}y · {patient.gender}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-8">
        <div className="card p-5">
          <h3 className="font-semibold text-dashnavy mb-4">Severity Progression</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 4]} allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="level" stroke="#7C5CFC" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-dashnavy mb-4">Patient Summary</h3>
          <div className="space-y-2 text-sm">
            <Row label="Diabetes Duration" value={`${patient.diabetes_duration} yrs`} />
            <Row label="HbA1c" value={`${patient.hba1c ?? '—'}%`} />
            <Row label="Previous DR Status" value={patient.previous_dr_status} />
            <Row label="Screening Centre" value={patient.screening_centre} />
            <Row label="Total Screenings" value={screenings.length} />
          </div>
        </div>
      </div>

      <h3 className="font-semibold text-dashnavy mb-4">Screening Timeline</h3>
      <div className="space-y-4">
        {screenings.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            className="card p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center font-bold text-violet-600 shrink-0">
              {s.ai_result ? s.ai_result.dr_level : '—'}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-dashnavy text-sm">{s.ai_result?.severity_label || 'Analysis pending'}</div>
              <div className="text-xs text-dashslate">{new Date(s.created_at).toLocaleString()}</div>
            </div>
            <StatusBadge status={s.quality_status || 'registered'} small />
            {s.doctor_review && <StatusBadge status={s.doctor_review.decision} small />}
          </motion.div>
        ))}
        {screenings.length === 0 && <p className="text-dashslate text-sm">No screening history yet for this patient.</p>}
      </div>
    </DashboardLayout>
  )
}

function Row({ label, value }) {
  return <div className="flex justify-between border-b border-slate-50 py-1.5"><span className="text-dashslate">{label}</span><span className="font-medium text-dashnavy">{value}</span></div>
}
