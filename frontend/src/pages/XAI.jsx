import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Info } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import { Screenings } from '../services/api.js'

const CHAIN = ['Retinal Image', 'AI Attention', 'Suspicious Region', 'Lesion Evidence', 'DR Severity', 'Recommendation']

export default function XAI() {
  const { screeningId } = useParams()
  const [data, setData] = useState(null)
  const [heatmapOpacity, setHeatmapOpacity] = useState(70)
  const [selectedEvidence, setSelectedEvidence] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { Screenings.explainability(screeningId).then(setData) }, [screeningId])

  if (!data) return <DashboardLayout><LoadingScreen label="Loading explainability data…" /></DashboardLayout>

  return (
    <div className="min-h-screen bg-xaipurple bg-gradient-to-b from-[#2A0A4F] to-[#120524] text-white">
      <DashboardLayout>
        <div className="-m-6 p-8 bg-gradient-to-b from-xaipurple/95 to-[#160530] min-h-[calc(100vh-64px)] rounded-2xl">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <span className="text-xs font-semibold text-xaipink bg-white/10 px-3 py-1 rounded-full">EXPLAINABLE AI</span>
              <h1 className="text-3xl md:text-4xl font-extrabold mt-4">WHY DID THE AI MAKE THIS DECISION?</h1>
              <p className="text-slate-300 mt-2 max-w-xl mx-auto text-sm">{data.disclaimer}</p>
            </div>

            {/* Explanation chain */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              {CHAIN.map((c, i) => (
                <React.Fragment key={c}>
                  <span className="text-xs font-semibold bg-white/10 border border-white/20 px-3 py-1.5 rounded-full">{c}</span>
                  {i < CHAIN.length - 1 && <ArrowRight size={14} className="text-slate-500" />}
                </React.Fragment>
              ))}
            </div>

            {/* Three panel view */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Panel title="Original Retina">
                <img src={data.original_image} className="w-full h-56 object-cover rounded-lg" />
              </Panel>
              <Panel title="Grad-CAM (Prototype)">
                <img src={data.heatmap} className="w-full h-56 object-cover rounded-lg" />
              </Panel>
              <Panel title="AI Attention Overlay">
                <div className="relative">
                  <img src={data.original_image} className="w-full h-56 object-cover rounded-lg" />
                  <img src={data.heatmap} className="absolute inset-0 w-full h-full object-cover rounded-lg mix-blend-screen"
                       style={{ opacity: heatmapOpacity / 100 }} />
                </div>
              </Panel>
            </div>

            {/* Controls */}
            <div className="bg-white/5 rounded-2xl p-5 mb-10 grid sm:grid-cols-3 gap-6">
              <SliderControl label="Heatmap Opacity" value={heatmapOpacity} onChange={setHeatmapOpacity} />
              <SliderControl label="Attention Intensity" value={70} onChange={() => {}} />
              <SliderControl label="Evidence Strength" value={80} onChange={() => {}} />
            </div>

            {/* Evidence */}
            <h3 className="font-semibold text-lg mb-4">AI Evidence</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {(data.evidence || []).map((e, i) => (
                <motion.button
                  key={i}
                  onClick={() => setSelectedEvidence(e)}
                  whileHover={{ y: -3 }}
                  className={`text-left bg-white/5 border rounded-xl p-4 transition-colors ${
                    selectedEvidence === e ? 'border-xaipink bg-white/10' : 'border-white/10'
                  }`}
                >
                  <div className="text-xs text-slate-400 mb-1">Evidence {String(i + 1).padStart(2, '0')}</div>
                  <div className="font-semibold text-sm mb-1">{e.title}</div>
                  <div className="text-xs text-slate-400 mb-2">{e.location}</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    e.contribution === 'High' ? 'bg-rose-500/20 text-rose-300' :
                    e.contribution === 'Moderate' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-500/20 text-slate-300'
                  }`}>{e.contribution} contribution</span>
                </motion.button>
              ))}
              {(!data.evidence || data.evidence.length === 0) && (
                <div className="col-span-full flex items-center gap-2 text-slate-400 text-sm">
                  <Info size={16} /> No significant lesion evidence was detected for this image.
                </div>
              )}
            </div>

            <div className="text-center">
              <button onClick={() => navigate(`/screening/${screeningId}/review`)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-xaiviolet to-xaimagenta text-white font-semibold px-7 py-3.5 rounded-full">
                <Sparkles size={16} /> Continue to Doctor Review
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
      <h4 className="text-xs font-semibold text-slate-300 mb-2 px-1">{title}</h4>
      {children}
    </div>
  )
}

function SliderControl({ label, value, onChange }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-2">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="text-xaipink font-semibold">{value}%</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-xaimagenta" />
    </div>
  )
}
