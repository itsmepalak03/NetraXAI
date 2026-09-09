import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import { Patients } from '../services/api.js'

export default function PatientsList() {
  const [patients, setPatients] = useState([])
  useEffect(() => { Patients.list().then(setPatients) }, [])

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dashnavy">Patients</h1>
        <Link to="/patients/new" className="inline-flex items-center gap-2 bg-dashteal text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90">
          <Plus size={16} /> Register Patient
        </Link>
      </div>
      <div className="card p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-dashslate uppercase border-b border-slate-100">
              <th className="pb-2 font-semibold">Patient ID</th>
              <th className="pb-2 font-semibold">Name</th>
              <th className="pb-2 font-semibold">Age / Gender</th>
              <th className="pb-2 font-semibold">Diabetes Duration</th>
              <th className="pb-2 font-semibold">HbA1c</th>
              <th className="pb-2 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 last:border-0">
                <td className="py-3 font-medium text-dashnavy">{p.patient_code}</td>
                <td className="py-3">{p.name} {p.is_demo && <span className="text-[10px] ml-1 px-1.5 py-0.5 bg-slate-100 rounded-full text-dashslate">DEMO</span>}</td>
                <td className="py-3">{p.age} / {p.gender}</td>
                <td className="py-3">{p.diabetes_duration} yrs</td>
                <td className="py-3">{p.hba1c ?? '—'}%</td>
                <td className="py-3 text-right">
                  <Link to={`/patients/${p.id}/history`} className="text-xs font-semibold text-dashteal hover:underline">View History</Link>
                </td>
              </tr>
            ))}
            {patients.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-dashslate text-sm">No patients registered yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
