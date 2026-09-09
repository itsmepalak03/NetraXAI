import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UploadCloud, Image as ImageIcon, CheckCircle2, XCircle, Sparkles,
  Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw, Maximize2, ArrowRight, Brain, AlertTriangle
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import SeverityScale from '../components/SeverityScale.jsx'
import { ConfidenceMeter } from '../components/ConfidenceMeter.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import { Screenings } from '../services/api.js'
import { useToast } from '../components/Toast.jsx'

const STAGES = ['upload', 'quality', 'enhancement', 'structure', 'lesions', 'classification']
const STAGE_LABELS = {
  upload: 'Upload', quality: 'Quality', enhancement: 'Enhancement',
  structure: 'Retinal Analysis', lesions: 'Lesion Detection', classification: 'DR Classification',
}

export default function Screening() {
  const { screeningId } = useParams()
  const [screening, setScreening] = useState(null)
  const [stage, setStage] = useState('upload')
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [layers, setLayers] = useState({ vessels: true, disc: true, fovea: true, lesions: true, attention: false })
  const [sliderPos, setSliderPos] = useState(50)
  const [selectedFinding, setSelectedFinding] = useState(null)
  const fileInput = useRef(null)
  const navigate = useNavigate()
  const toast = useToast()

  const load = () => Screenings.get(screeningId).then((s) => {
    setScreening(s)
    if (s.ai_result) setStage('classification')
    else if (s.quality_score != null) setStage('quality')
  })

  useEffect(() => { load() }, [screeningId])

  async function handleUpload(file) {
    setUploading(true)
    try {
      const s = await Screenings.upload(screeningId, file)
      setScreening(s)
      setStage('quality')
      toast?.push('Image received. Quality assessment complete.', 'success')
    } catch (e) {
      toast?.push(e?.response?.data?.detail || 'Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function runAnalysis() {
    setAnalyzing(true)
    try {
      const s = await Screenings.analyze(screeningId)
      setScreening(s)
      setStage('classification')
      toast?.push('Analysis complete.', 'success')
    } catch (e) {
      toast?.push(e?.response?.data?.detail || 'Analysis failed', 'error')
    } finally {
      setAnalyzing(false)
    }
  }

  if (!screening) return <DashboardLayout><LoadingScreen label="Loading screening…" /></DashboardLayout>

  const findings = screening.ai_result?.findings || []

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-screenteal">Fundus Screening — {screening.patient?.patient_code}</h1>
          <p className="text-dashslate text-sm mt-1">{screening.patient?.name} · {screening.patient?.age}y · {screening.patient?.gender}</p>
        </div>
        <StatusBadge status={screening.status} />
      </div>

      {/* Stage timeline */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {STAGES.map((s, i) => {
          const idx = STAGES.indexOf(stage)
          const active = s === stage
          const done = STAGES.indexOf(s) < idx
          return (
            <React.Fragment key={s}>
              <button
                onClick={() => (done || active) && setStage(s)}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  active ? 'bg-screenteal text-white' : done ? 'bg-cyan-50 text-screenteal' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {STAGE_LABELS[s]}
              </button>
              {i < STAGES.length - 1 && <div className={`w-6 h-0.5 ${done ? 'bg-screenteal' : 'bg-slate-200'}`} />}
            </React.Fragment>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {stage === 'upload' && (
          <StageWrap key="upload">
            <UploadStage screening={screening} uploading={uploading} onUpload={handleUpload} fileInput={fileInput} />
          </StageWrap>
        )}

        {stage === 'quality' && (
          <StageWrap key="quality">
            <QualityStage screening={screening} onNext={() => setStage('enhancement')} />
          </StageWrap>
        )}

        {stage === 'enhancement' && (
          <StageWrap key="enhancement">
            <EnhancementStage screening={screening} sliderPos={sliderPos} setSliderPos={setSliderPos} onNext={() => setStage('structure')} />
          </StageWrap>
        )}

        {stage === 'structure' && (
          <StageWrap key="structure">
            <StructureStage screening={screening} layers={layers} setLayers={setLayers}
              findings={findings} selectedFinding={selectedFinding} setSelectedFinding={setSelectedFinding}
              onNext={() => setStage('lesions')} onAnalyze={runAnalysis} analyzing={analyzing} />
          </StageWrap>
        )}

        {stage === 'lesions' && (
          <StageWrap key="lesions">
            <LesionsStage screening={screening} findings={findings} onNext={() => setStage('classification')}
              onAnalyze={runAnalysis} analyzing={analyzing} />
          </StageWrap>
        )}

        {stage === 'classification' && (
          <StageWrap key="classification">
            <ClassificationStage screening={screening} navigate={navigate} />
          </StageWrap>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}

function StageWrap({ children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
      {children}
    </motion.div>
  )
}

// ---------------- UPLOAD ----------------
function UploadStage({ screening, uploading, onUpload, fileInput }) {
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState(screening.image_path)

  function onFiles(files) {
    const file = files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    onUpload(file)
  }

  return (
    <div className="card p-8 max-w-3xl mx-auto text-center">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files) }}
        onClick={() => fileInput.current?.click()}
        className={`rounded-2xl border-2 border-dashed cursor-pointer transition-colors p-10 flex flex-col items-center gap-4 ${
          dragOver ? 'border-screenteal bg-cyan-50' : 'border-slate-300 hover:border-screencyan'
        }`}
      >
        {preview ? (
          <img src={preview.startsWith('blob:') ? preview : preview} alt="preview" className="max-h-64 rounded-xl object-contain" />
        ) : (
          <>
            <UploadCloud size={40} className="text-screenteal" />
            <div>
              <p className="font-semibold text-dashnavy">Drag & drop a fundus image here</p>
              <p className="text-sm text-dashslate mt-1">or click to browse — JPG, PNG, BMP, TIFF supported</p>
            </div>
          </>
        )}
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => onFiles(e.target.files)} />
      </div>

      {uploading && (
        <div className="mt-6">
          <UploadTimeline />
        </div>
      )}

      {screening.image_width && !uploading && (
        <div className="grid grid-cols-3 gap-4 mt-6 text-sm">
          <Info label="Dimensions" value={`${screening.image_width} × ${screening.image_height}`} />
          <Info label="File Size" value={`${screening.file_size_kb} KB`} />
          <Info label="Status" value={<StatusBadge status={screening.quality_status || 'uploaded'} small />} />
        </div>
      )}
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <div className="text-xs text-dashslate mb-1">{label}</div>
      <div className="font-semibold text-dashnavy">{value}</div>
    </div>
  )
}

function UploadTimeline() {
  const steps = ['Image Received', 'Quality Check', 'Preprocessing', 'AI Analysis', 'XAI Generation']
  const [active, setActive] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setActive((a) => Math.min(a + 1, steps.length - 1)), 500)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex items-center justify-between max-w-lg mx-auto">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center gap-1.5">
            <motion.div
              className={`w-3 h-3 rounded-full ${i <= active ? 'bg-screenteal' : 'bg-slate-200'}`}
              animate={i === active ? { scale: [1, 1.4, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.8 }}
            />
            <span className="text-[10px] text-dashslate text-center max-w-[60px]">{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < active ? 'bg-screenteal' : 'bg-slate-200'}`} />}
        </React.Fragment>
      ))}
    </div>
  )
}

// ---------------- QUALITY ----------------
function QualityStage({ screening, onNext }) {
  const m = screening.quality_metrics || {}
  const metrics = [
    { label: 'Focus', value: m.focus },
    { label: 'Illumination', value: m.illumination },
    { label: 'Field of View', value: m.field_of_view },
    { label: 'Contrast', value: m.contrast },
    { label: 'Noise', value: m.noise },
  ]
  const statusColor = { GRADEABLE: '#10B981', BORDERLINE: '#F59E0B', UNGRADEABLE: '#EF4444' }[screening.quality_status] || '#64748B'

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="card p-4 flex items-center justify-center bg-black/90">
        <img src={screening.image_path} alt="fundus" className="max-h-[420px] rounded-lg object-contain" />
      </div>
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-dashnavy">Image Quality Assessment</h3>
          <StatusBadge status={screening.quality_status} />
        </div>
        <div className="flex items-end gap-3 mb-6">
          <span className="text-5xl font-extrabold" style={{ color: statusColor }}>{Math.round(screening.quality_score)}</span>
          <span className="text-dashslate mb-1">/ 100 overall quality</span>
        </div>
        <div className="space-y-3 mb-6">
          {metrics.map((mtr) => (
            <div key={mtr.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-dashslate font-medium">{mtr.label}</span>
                <span className="font-semibold text-dashnavy">{mtr.value}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${mtr.value}%` }}
                  className="h-full rounded-full" style={{ background: statusColor }} transition={{ duration: 0.8 }} />
              </div>
            </div>
          ))}
        </div>

        {screening.quality_status === 'UNGRADEABLE' ? (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700 flex gap-2">
            <AlertTriangle size={18} className="shrink-0" />
            <div>
              <p className="font-semibold mb-1">Recapture Recommended</p>
              <ul className="list-disc list-inside space-y-0.5">
                {(m.reasons || []).map((r) => <li key={r}>{r}</li>)}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm text-dashslate mb-4">Image quality is sufficient for prototype screening analysis.</p>
        )}

        <button onClick={onNext} disabled={screening.quality_status === 'UNGRADEABLE'}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-screenteal text-white font-semibold py-3 rounded-xl disabled:opacity-40">
          Continue to Enhancement <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ---------------- ENHANCEMENT ----------------
function EnhancementStage({ screening, sliderPos, setSliderPos, onNext }) {
  return (
    <div className="card p-6 max-w-4xl mx-auto">
      <h3 className="font-semibold text-dashnavy mb-1">Image Enhancement</h3>
      <p className="text-sm text-dashslate mb-5">CLAHE, illumination normalization, denoising, and contrast enhancement applied. Drag the slider to compare.</p>

      <div className="relative w-full rounded-xl overflow-hidden select-none" style={{ aspectRatio: '4/3' }}>
        <img src={screening.enhanced_path} alt="enhanced" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
          <img src={screening.image_path} alt="original" className="w-full h-full object-cover"
               style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: 'none' }} />
        </div>
        <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${sliderPos}%` }} />
        <input
          type="range" min={0} max={100} value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
        />
        <span className="absolute top-3 left-3 text-xs font-semibold bg-black/60 text-white px-2 py-1 rounded-full">Original</span>
        <span className="absolute top-3 right-3 text-xs font-semibold bg-black/60 text-white px-2 py-1 rounded-full">Enhanced</span>
      </div>

      <div className="flex flex-wrap gap-2 mt-5">
        {['CLAHE', 'Illumination Normalization', 'Denoising', 'Contrast Enhancement'].map((f) => (
          <span key={f} className="text-xs font-medium px-3 py-1.5 rounded-full bg-cyan-50 text-screenteal border border-cyan-100">{f}</span>
        ))}
      </div>

      <button onClick={onNext} className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-screenteal text-white font-semibold py-3 rounded-xl">
        Continue to Retinal Analysis <ArrowRight size={16} />
      </button>
    </div>
  )
}

// ---------------- STRUCTURE (retinal imaging workstation) ----------------
function StructureStage({ screening, layers, setLayers, findings, selectedFinding, setSelectedFinding, onNext, onAnalyze, analyzing }) {
  const hasResult = !!screening.ai_result
  const [zoom, setZoom] = useState(1)

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-5">
      <div className="card p-3 bg-graphite relative overflow-hidden" style={{ minHeight: 460 }}>
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg" style={{ minHeight: 440 }}>
          <img
            src={screening.enhanced_path}
            alt="retina"
            style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s' }}
            className="max-h-[440px] object-contain rounded-lg"
          />
          {hasResult && layers.lesions && findings.map((f, i) => (
            <motion.button
              key={i}
              onClick={() => setSelectedFinding(f)}
              className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-imgcyan"
              style={{ left: `${f.x * 100}%`, top: `${f.y * 100}%` }}
              animate={{ scale: selectedFinding === f ? [1, 1.5, 1] : 1 }}
              transition={{ repeat: selectedFinding === f ? Infinity : 0, duration: 1 }}
            />
          ))}
        </div>
        <div className="absolute bottom-4 right-4 flex gap-2">
          <IconBtn onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}><ZoomIn size={16} /></IconBtn>
          <IconBtn onClick={() => setZoom((z) => Math.max(z - 0.2, 0.6))}><ZoomOut size={16} /></IconBtn>
          <IconBtn onClick={() => setZoom(1)}><RotateCcw size={16} /></IconBtn>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card p-4">
          <h4 className="font-semibold text-imgviolet text-sm mb-3">Layers</h4>
          {Object.entries({ vessels: 'Blood Vessels', disc: 'Optic Disc', fovea: 'Fovea', lesions: 'Lesions', attention: 'AI Attention' }).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-dashnavy">{label}</span>
              <input type="checkbox" checked={layers[key]} onChange={(e) => setLayers({ ...layers, [key]: e.target.checked })} />
            </label>
          ))}
        </div>

        {selectedFinding && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-4 border-l-4 border-imgcyan">
            <h4 className="font-semibold text-dashnavy text-sm">{selectedFinding.type}</h4>
            <p className="text-xs text-dashslate mt-1">Location: {selectedFinding.location}</p>
            <p className="text-xs text-dashslate">Confidence: {selectedFinding.confidence}%</p>
          </motion.div>
        )}

        {!hasResult ? (
          <button onClick={onAnalyze} disabled={analyzing}
            className="w-full inline-flex items-center justify-center gap-2 bg-imgviolet text-white font-semibold py-3 rounded-xl disabled:opacity-60">
            <Brain size={16} /> {analyzing ? 'Running AI Analysis…' : 'Run AI Analysis'}
          </button>
        ) : (
          <button onClick={onNext} className="w-full inline-flex items-center justify-center gap-2 bg-imgviolet text-white font-semibold py-3 rounded-xl">
            View Lesion Detection <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

function IconBtn({ children, onClick }) {
  return (
    <button onClick={onClick} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur">
      {children}
    </button>
  )
}

// ---------------- LESIONS ----------------
const LESION_META = {
  'Microaneurysm': { icon: '●', color: '#0EA5E9' },
  'Haemorrhage': { icon: '◆', color: '#EF4444' },
  'Exudate': { icon: '✦', color: '#F59E0B' },
  'Cotton-Wool Spot': { icon: '☁', color: '#94A3B8' },
}

function LesionsStage({ screening, findings, onNext, onAnalyze, analyzing }) {
  if (!screening.ai_result) {
    return (
      <div className="card p-10 text-center max-w-lg mx-auto">
        <Brain size={32} className="mx-auto text-imgviolet mb-3" />
        <p className="text-dashnavy font-semibold mb-4">Run AI analysis to detect lesion candidates.</p>
        <button onClick={onAnalyze} disabled={analyzing} className="bg-imgviolet text-white font-semibold px-6 py-2.5 rounded-xl disabled:opacity-60">
          {analyzing ? 'Analyzing…' : 'Run AI Analysis'}
        </button>
      </div>
    )
  }

  const grouped = findings.reduce((acc, f) => {
    acc[f.type] = acc[f.type] || []
    acc[f.type].push(f)
    return acc
  }, {})

  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(LESION_META).map(([type, meta]) => {
          const items = grouped[type] || []
          return (
            <div key={type} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg" style={{ color: meta.color }}>{meta.icon}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${items.length ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                  {items.length ? 'Detected' : 'Not Detected'}
                </span>
              </div>
              <h4 className="font-semibold text-dashnavy text-sm">{type}s</h4>
              <p className="text-xs text-dashslate mt-1">Count: {items.length}</p>
              {items[0] && <p className="text-xs text-dashslate">Top confidence: {items[0].confidence}%</p>}
            </div>
          )
        })}
      </div>
      <button onClick={onNext} className="w-full max-w-md mx-auto flex items-center justify-center gap-2 bg-imgviolet text-white font-semibold py-3 rounded-xl">
        View DR Severity Classification <ArrowRight size={16} />
      </button>
    </div>
  )
}

// ---------------- CLASSIFICATION ----------------
function ClassificationStage({ screening, navigate }) {
  const r = screening.ai_result
  if (!r) return <LoadingScreen label="Waiting for AI analysis…" />

  return (
    <div className="max-w-3xl mx-auto card p-8 text-center">
      <span className="text-xs font-semibold text-imgviolet bg-violet-50 px-3 py-1 rounded-full">AI Screening Assessment · DEMO AI ENGINE</span>
      <h2 className="text-3xl font-extrabold text-dashnavy mt-4">{r.severity_label}</h2>
      <p className="text-dashslate mb-6">Level {r.dr_level}</p>

      <div className="mb-8">
        <SeverityScale level={r.dr_level} />
      </div>

      <div className="grid sm:grid-cols-2 gap-5 mb-8 text-left">
        <ConfidenceMeter value={r.confidence} color="#8B5CF6" />
        <div className={`rounded-xl p-4 flex items-center justify-between ${r.referable ? 'bg-rose-50' : 'bg-emerald-50'}`}>
          <span className={`font-semibold text-sm ${r.referable ? 'text-rose-700' : 'text-emerald-700'}`}>Referable DR</span>
          <span className={`font-extrabold ${r.referable ? 'text-rose-700' : 'text-emerald-700'}`}>{r.referable ? 'YES' : 'NO'}</span>
        </div>
      </div>

      <p className="text-xs text-dashslate mb-8 max-w-lg mx-auto">
        Demo Model Confidence is produced by a prototype classical-CV engine and has not been
        clinically calibrated. Doctor review is required before any clinical action.
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <button onClick={() => navigate(`/screening/${screening.id}/xai`)}
          className="inline-flex items-center gap-2 bg-xaiviolet text-white font-semibold px-6 py-3 rounded-xl">
          <Sparkles size={16} /> Why did the AI make this decision?
        </button>
        <button onClick={() => navigate(`/screening/${screening.id}/review`)}
          className="inline-flex items-center gap-2 border border-slate-300 text-dashnavy font-semibold px-6 py-3 rounded-xl">
          Continue to Doctor Review <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
