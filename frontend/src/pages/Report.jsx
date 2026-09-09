import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Download, FileCheck2 } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { Screenings } from '../services/api.js'
import { useToast } from '../components/Toast.jsx'

export default function Report() {
  const { screeningId } = useParams()
  const [screening, setScreening] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const toast = useToast()

  useEffect(() => { Screenings.get(screeningId).then(setScreening) }, [screeningId])

  if (!screening) return <DashboardLayout><LoadingScreen label="Loading report…" /></DashboardLayout>
  const r = screening.ai_result
  const p = screening.patient
  const rv = screening.doctor_review

  async function download() {
    setDownloading(true)
    try {
      const res = await fetch(Screenings.reportUrl(screeningId))
      if (!res.ok) throw new Error('Report generation failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `NETRA_XAI_Report_${p.patient_code}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast?.push('Report downloaded.', 'success')
    } catch (e) {
      toast?.push('Could not generate report', 'error')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-dashnavy">Screening Report Preview</h1>
          <button onClick={download} disabled={downloading}
            className="inline-flex items-center gap-2 bg-dashnavy text-white font-semibold px-5 py-2.5 rounded-xl disabled:opacity-60">
            <Download size={16} /> {downloading ? 'Generating…' : 'Generate & Download PDF'}
          </button>
        </div>

        <div className="card p-8 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="font-bold text-lg text-dashnavy">NETRA XAI — Screening Report</h2>
              <p className="text-xs text-dashslate">Report ID: NXAI-{String(screening.id).padStart(6, '0')}</p>
            </div>
            <FileCheck2 className="text-dashteal" size={26} />
          </div>

          <Section title="Patient">
            <Row label="Patient ID" value={p.patient_code} /><Row label="Name" value={p.name} />
            <Row label="Age / Gender" value={`${p.age} / ${p.gender}`} />
            <Row label="Diabetes Duration" value={`${p.diabetes_duration} yrs`} />
            <Row label="HbA1c" value={`${p.hba1c ?? '—'}%`} />
          </Section>

          <Section title="Image Quality">
            <Row label="Quality Score" value={`${screening.quality_score} / 100`} />
            <Row label="Status" value={<StatusBadge status={screening.quality_status} small />} />
          </Section>

          <Section title="AI Result (Demo AI Engine)">
            <Row label="Severity" value={r?.severity_label} /><Row label="Level" value={r?.dr_level} />
            <Row label="Demo Confidence" value={`${r?.confidence}%`} />
            <Row label="Referable DR" value={r?.referable ? 'YES' : 'NO'} />
          </Section>

          {rv && (
            <Section title="Doctor Review">
              <Row label="Decision" value={<StatusBadge status={rv.decision} small />} />
              <Row label="Final Level" value={rv.final_level} />
              <Row label="Referral" value={rv.referral ? 'YES' : 'NO'} />
              <Row label="Reviewing Doctor" value={rv.doctor_name} />
              {rv.notes && <Row label="Notes" value={rv.notes} />}
            </Section>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-dashslate">
            Medical Disclaimer: This is an early-stage research prototype for screening support
            only. It does not constitute a medical diagnosis and requires confirmation by a
            qualified medical professional.
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <Link to={`/patients/${p.id}/history`} className="text-sm font-semibold text-dashteal hover:underline">View Patient History →</Link>
          <Link to="/analytics" className="text-sm font-semibold text-dashteal hover:underline">Go to Analytics →</Link>
        </div>
      </div>
    </DashboardLayout>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <h4 className="text-xs font-bold uppercase text-dashteal mb-2 tracking-wide">{title}</h4>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">{children}</div>
    </div>
  )
}
function Row({ label, value }) {
  return <div className="flex justify-between border-b border-slate-50 py-1"><span className="text-dashslate">{label}</span><span className="font-medium text-dashnavy text-right max-w-[60%]">{value}</span></div>
}
