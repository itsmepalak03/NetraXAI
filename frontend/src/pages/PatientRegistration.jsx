import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, ChevronLeft, User, Activity, Building2, ScanEye } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import { Patients, Screenings } from '../services/api.js'
import { useToast } from '../components/Toast.jsx'

const STEPS = [
  { key: 'patient', label: 'Patient Information', icon: User },
  { key: 'diabetes', label: 'Diabetes Information', icon: Activity },
  { key: 'screening', label: 'Screening Information', icon: Building2 },
  { key: 'image', label: 'Fundus Image', icon: ScanEye },
]

const DEMO_PATIENT = {
  name: 'Demo Patient', age: 54, gender: 'Male', diabetes_duration: 9, hba1c: 7.8,
  previous_dr_status: 'Unknown', previous_screening_date: '', screening_centre: 'Rural Screening Centre - Demo',
}

export default function PatientRegistration() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ name: '', age: '', gender: 'Female', diabetes_duration: '', hba1c: '',
    previous_dr_status: 'Unknown', previous_screening_date: '', screening_centre: 'Rural Screening Centre - Demo' })
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const canNext = () => {
    if (step === 0) return form.name && form.age && form.gender
    return true
  }

  async function finish() {
    setSubmitting(true)
    try {
      const patient = await Patients.create({
        ...form,
        age: Number(form.age),
        diabetes_duration: Number(form.diabetes_duration || 0),
        hba1c: form.hba1c ? Number(form.hba1c) : null,
        is_demo: form.name === 'Demo Patient',
      })
      const screening = await Screenings.create(patient.id)
      toast?.push('Patient registered. Continue to fundus image upload.', 'success')
      navigate(`/screening/${screening.id}`)
    } catch (e) {
      toast?.push(e?.response?.data?.detail || 'Could not register patient', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-dashnavy">Patient Registration</h1>
          <button
            className="text-xs font-semibold text-dashteal hover:underline"
            onClick={() => setForm({ ...form, ...DEMO_PATIENT })}
          >
            Fill Demo Patient
          </button>
        </div>
        <p className="text-dashslate text-sm mb-8">Register a patient before beginning fundus image screening.</p>

        {/* progress indicator */}
        <div className="flex items-center mb-10">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.key}>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  i < step ? 'bg-dashteal border-dashteal text-white' :
                  i === step ? 'border-dashteal text-dashteal' : 'border-slate-200 text-slate-300'
                }`}>
                  {i < step ? <Check size={16} /> : <s.icon size={16} />}
                </div>
                <span className={`text-[11px] font-medium text-center max-w-[90px] ${i <= step ? 'text-dashnavy' : 'text-slate-400'}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mb-6 ${i < step ? 'bg-dashteal' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="card p-8 min-h-[320px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Full Name *"><input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Demo Patient" /></Field>
                  <Field label="Age *"><input type="number" className="input" value={form.age} onChange={e => set('age', e.target.value)} placeholder="e.g. 54" /></Field>
                  <Field label="Gender *">
                    <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                      <option>Female</option><option>Male</option><option>Other</option>
                    </select>
                  </Field>
                </div>
              )}
              {step === 1 && (
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Diabetes Duration (years)"><input type="number" className="input" value={form.diabetes_duration} onChange={e => set('diabetes_duration', e.target.value)} /></Field>
                  <Field label="HbA1c (%)"><input type="number" step="0.1" className="input" value={form.hba1c} onChange={e => set('hba1c', e.target.value)} /></Field>
                  <Field label="Previous DR Status">
                    <select className="input" value={form.previous_dr_status} onChange={e => set('previous_dr_status', e.target.value)}>
                      <option>Unknown</option><option>None</option><option>Mild NPDR</option><option>Moderate NPDR</option><option>Severe NPDR</option><option>PDR</option>
                    </select>
                  </Field>
                  <Field label="Previous Screening Date"><input type="date" className="input" value={form.previous_screening_date} onChange={e => set('previous_screening_date', e.target.value)} /></Field>
                </div>
              )}
              {step === 2 && (
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Screening Centre"><input className="input" value={form.screening_centre} onChange={e => set('screening_centre', e.target.value)} /></Field>
                </div>
              )}
              {step === 3 && (
                <div className="text-center py-10">
                  <ScanEye size={40} className="mx-auto text-dashteal mb-4" />
                  <p className="text-dashnavy font-semibold mb-1">Patient details are ready.</p>
                  <p className="text-dashslate text-sm">Click Finish to create the screening record — you'll upload the fundus image on the next screen.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-between mt-6">
          <button
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="inline-flex items-center gap-1 px-5 py-2.5 rounded-xl text-sm font-semibold text-dashslate disabled:opacity-30"
          >
            <ChevronLeft size={16} /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-1 bg-dashnavy text-white px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              disabled={submitting}
              onClick={finish}
              className="inline-flex items-center gap-1 bg-dashteal text-white px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              {submitting ? 'Creating…' : 'Finish & Continue'}
            </button>
          )}
        </div>
      </div>

      <style>{`.input { border:1px solid #E2E8F0; border-radius:10px; padding:10px 12px; font-size:14px; width:100%; background:white; } .input:focus { outline:2px solid #16B8A6; }`}</style>
    </DashboardLayout>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-dashslate mb-1.5">{label}</span>
      {children}
    </label>
  )
}
