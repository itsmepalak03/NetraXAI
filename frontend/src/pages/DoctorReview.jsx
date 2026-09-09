import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Edit3, RotateCcw, ImageOff, ShieldAlert, FileText } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import SeverityScale from '../components/SeverityScale.jsx'
import { ConfidenceMeter } from '../components/ConfidenceMeter.jsx'
import { Screenings } from '../services/api.js'
import { useToast } from '../components/Toast.jsx'

const DECISIONS = [
  { key: 'confirmed', label: 'Confirm AI Assessment', icon: CheckCircle2, color: '#14B8A6' },
  { key: 'modified', label: 'Modify Assessment', icon: Edit3, color: '#3B82F6' },
  { key: 'recapture_requested', label: 'Request Recapture', icon: RotateCcw, color: '#EAB308' },
  { key: 'ungradeable', label: 'Mark Ungradeable', icon: ImageOff, color: '#64748B' },
  { key: 'referred', label: 'Refer Patient', icon: ShieldAlert, color: '#EF4444' },
]

export default function DoctorReview() {
  const { screeningId } = useParams()
  const [screening, setScreening] = useState(null)
  const [decision, setDecision] = useState('confirmed')
  const [modifiedLevel, setModifiedLevel] = useState(0)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => { Screenings.get(screeningId).then((s) => { setScreening(s); if (s.ai_result) setModifiedLevel(s.ai_result.dr_level) }) }, [screeningId])

  if (!screening) return <DashboardLayout><LoadingScreen label="Loading case…" /></DashboardLayout>
  const r = screening.ai_result

  async function submit() {
    setSubmitting(true)
    try {
      const payload = {
        decision,
        doctor_assessment_level: decision === 'modified' ? modifiedLevel : null,
        notes,
        referral: decision === 'referred' || (decision === 'confirmed' && r.referable),
        doctor_name: 'Dr. Demo Reviewer',
      }
      const updated = await Screenings.review(screeningId, payload)
      setScreening(updated)
      toast?.push('Review submitted.', 'success')
      navigate(`/screening/${screeningId}/report`)
    } catch (e) {
      toast?.push(e?.response?.data?.detail || 'Could not submit review', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const finalLevel = decision === 'modified' ? modifiedLevel : r?.dr_level

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-revnavy mb-1">AI + Doctor Review</h1>
      <p className="text-dashslate text-sm mb-6">The final doctor decision always overrides the AI assessment when they differ.</p>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left: image */}
        <div className="card p-3 bg-black/90 flex items-center justify-center" style={{ minHeight: 380 }}>
          <img src={screening.enhanced_path} className="max-h-[380px] rounded-lg object-contain" />
        </div>

        {/* Centre: AI assessment */}
        <div className="card p-5">
          <h3 className="font-semibold text-revteal text-sm mb-4">AI Assessment</h3>
          <div className="mb-4">
            <div className="text-xl font-bold text-dashnavy">{r?.severity_label}</div>
            <div className="text-xs text-dashslate">Level {r?.dr_level} · {r?.ai_mode}</div>
          </div>
          <div className="mb-5"><SeverityScale level={r?.dr_level || 0} /></div>
          <ConfidenceMeter value={r?.confidence || 0} color="#14B8A6" />
          <div className="mt-5 space-y-1.5 text-sm">
            <p className="text-dashslate font-semibold text-xs uppercase mb-1">Detected Findings</p>
            {(r?.findings || []).slice(0, 5).map((f, i) => (
              <div key={i} className="flex justify-between text-xs text-dashnavy">
                <span>{f.type}</span><span className="text-dashslate">{f.confidence}%</span>
              </div>
            ))}
            {(!r?.findings || r.findings.length === 0) && <p className="text-xs text-dashslate">No lesion candidates detected.</p>}
          </div>
        </div>

        {/* Right: doctor decision panel */}
        <div className="card p-5">
          <h3 className="font-semibold text-revblue text-sm mb-4">Doctor Decision</h3>
          <div className="space-y-2 mb-5">
            {DECISIONS.map((d) => (
              <button
                key={d.key}
                onClick={() => setDecision(d.key)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  decision === d.key ? 'text-white' : 'text-dashnavy border-slate-200 hover:bg-slate-50'
                }`}
                style={decision === d.key ? { background: d.color, borderColor: d.color } : {}}
              >
                <d.icon size={16} /> {d.label}
              </button>
            ))}
          </div>

          {decision === 'modified' && (
            <div className="mb-5">
              <label className="text-xs font-semibold text-dashslate mb-2 block">Doctor-Assessed DR Level</label>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4].map((lvl) => (
                  <button key={lvl} onClick={() => setModifiedLevel(lvl)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold ${modifiedLevel === lvl ? 'bg-revblue text-white' : 'bg-slate-100 text-dashnavy'}`}>
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="text-xs font-semibold text-dashslate mb-2 block">Clinical Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
            placeholder="Add clinical observations…"
            className="w-full border border-slate-200 rounded-xl p-3 text-sm mb-5 focus-ring" />

          <button onClick={submit} disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-revnavy text-white font-semibold py-3 rounded-xl disabled:opacity-60">
            <FileText size={16} /> {submitting ? 'Submitting…' : 'Submit Review & Generate Report'}
          </button>
        </div>
      </div>

      {/* Final decision strip */}
      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        <DecisionCard label="AI Prediction" value={`Level ${r?.dr_level}`} sub={r?.severity_label} color="#14B8A6" />
        <DecisionCard label="Doctor Assessment" value={decision === 'modified' ? `Level ${modifiedLevel}` : '—'} sub={DECISIONS.find(d => d.key === decision)?.label} color="#3B82F6" />
        <DecisionCard label="Final Decision" value={`Level ${finalLevel}`} sub={finalLevel >= 2 ? 'Referable' : 'Routine'} color="#EAB308" />
      </div>
    </DashboardLayout>
  )
}

function DecisionCard({ label, value, sub, color }) {
  return (
    <div className="card p-4 border-l-4" style={{ borderColor: color }}>
      <div className="text-xs text-dashslate font-semibold uppercase mb-1">{label}</div>
      <div className="text-xl font-bold text-dashnavy">{value}</div>
      <div className="text-xs text-dashslate mt-0.5">{sub}</div>
    </div>
  )
}
