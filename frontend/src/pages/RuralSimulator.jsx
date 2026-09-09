import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { Radio, Users, Wifi, Clock, ToggleLeft, ToggleRight } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import { Simulation } from '../services/api.js'

const DEFAULTS = {
  patients_per_day: 350, num_centres: 1, num_doctors: 5, bandwidth_mbps: 10,
  image_size_mb: 2.5, ai_processing_sec: 3, doctor_review_sec: 30,
  working_days: 299, target_annual_patients: 100000,
}

const STATE_COLOR = { 'UNDER CAPACITY': '#22D3EE', 'OPTIMAL': '#84CC16', 'OVERLOADED': '#F59E0B' }

export default function RuralSimulator() {
  const [inputs, setInputs] = useState(DEFAULTS)
  const [aiAssisted, setAiAssisted] = useState(true)
  const [resultAI, setResultAI] = useState(null)
  const [resultManual, setResultManual] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setInputs((i) => ({ ...i, [k]: v }))

  const runSim = useCallback(async () => {
    setLoading(true)
    try {
      const [ai, manual] = await Promise.all([
        Simulation.run({ ...inputs, ai_assisted: true }),
        Simulation.run({ ...inputs, ai_assisted: false }),
      ])
      setResultAI(ai)
      setResultManual(manual)
    } finally {
      setLoading(false)
    }
  }, [inputs])

  useEffect(() => { const t = setTimeout(runSim, 300); return () => clearTimeout(t) }, [runSim])

  const active = aiAssisted ? resultAI : resultManual

  return (
    <div className="min-h-screen bg-simnavy text-white">
      <DashboardLayout>
        <div className="-m-6 p-8 bg-gradient-to-b from-[#0B1020] to-[#0A1730] min-h-[calc(100vh-64px)] rounded-2xl">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold text-simcyan bg-white/5 px-3 py-1 rounded-full inline-flex items-center gap-1"><Radio size={12} /> MISSION CONTROL</span>
            <h1 className="text-3xl md:text-4xl font-extrabold mt-4">RURAL SCREENING CAPACITY SIMULATOR</h1>
            <p className="text-slate-400 mt-2 text-sm max-w-xl mx-auto">Explore how AI-assisted screening can influence district-level screening capacity.</p>
          </div>

          <div className="flex justify-center mb-8">
            <button onClick={() => setAiAssisted((a) => !a)} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-2.5">
              <span className={`text-sm font-semibold ${!aiAssisted ? 'text-white' : 'text-slate-500'}`}>Manual Workflow</span>
              {aiAssisted ? <ToggleRight size={26} className="text-simlime" /> : <ToggleLeft size={26} className="text-slate-500" />}
              <span className={`text-sm font-semibold ${aiAssisted ? 'text-white' : 'text-slate-500'}`}>AI-Assisted Workflow</span>
            </button>
          </div>

          <div className="grid lg:grid-cols-[320px_1fr] gap-6">
            {/* Controls */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-5 h-fit">
              <SimSlider icon={Users} label="Patients / Day" value={inputs.patients_per_day} min={50} max={1000} step={10}
                onChange={(v) => set('patients_per_day', v)} />
              <SimSlider icon={Radio} label="Screening Centres" value={inputs.num_centres} min={1} max={20} step={1}
                onChange={(v) => set('num_centres', v)} />
              <SimSlider icon={Users} label="Doctors" value={inputs.num_doctors} min={1} max={50} step={1}
                onChange={(v) => set('num_doctors', v)} />
              <SimSlider icon={Wifi} label="Bandwidth (Mbps)" value={inputs.bandwidth_mbps} min={1} max={100} step={1}
                onChange={(v) => set('bandwidth_mbps', v)} />
              <SimSlider icon={Radio} label="Image Size (MB)" value={inputs.image_size_mb} min={0.5} max={10} step={0.1}
                onChange={(v) => set('image_size_mb', v)} />
              <SimSlider icon={Clock} label="AI Processing (sec)" value={inputs.ai_processing_sec} min={0.5} max={20} step={0.5}
                onChange={(v) => set('ai_processing_sec', v)} />
              <SimSlider icon={Clock} label="Doctor Review (sec)" value={inputs.doctor_review_sec} min={5} max={180} step={5}
                onChange={(v) => set('doctor_review_sec', v)} />
              <SimSlider icon={Clock} label="Working Days / Year" value={inputs.working_days} min={200} max={365} step={1}
                onChange={(v) => set('working_days', v)} />
              <button onClick={() => setInputs(DEFAULTS)} className="w-full text-xs font-semibold text-slate-400 hover:text-white py-2">Reset to Demo Scenario</button>
            </div>

            {/* Live results */}
            <div className="space-y-6">
              {active && (
                <>
                  <div className={`rounded-2xl p-5 border flex items-center justify-between`}
                       style={{ borderColor: STATE_COLOR[active.state], background: `${STATE_COLOR[active.state]}15` }}>
                    <div>
                      <div className="text-xs text-slate-400 font-semibold mb-1">SYSTEM STATE</div>
                      <div className="text-2xl font-extrabold" style={{ color: STATE_COLOR[active.state] }}>{active.state}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-semibold mb-1">BOTTLENECK</div>
                      <div className="text-lg font-bold">{active.bottleneck}</div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-4 gap-4">
                    <Metric label="Daily Capacity" value={active.daily_capacity} />
                    <Metric label="Monthly Capacity" value={active.monthly_capacity} />
                    <Metric label="Annual Capacity" value={active.annual_capacity} />
                    <Metric label="Queue / Day" value={active.queue_per_day} accent="#F59E0B" />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <UtilGauge label="Doctor Utilization" value={active.doctor_utilization} />
                    <UtilGauge label="AI Utilization" value={active.ai_utilization} />
                    <UtilGauge label="Bandwidth Utilization" value={active.bandwidth_utilization} />
                  </div>

                  {resultAI && resultManual && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                      <h3 className="font-semibold mb-4 text-sm">AI Impact Comparison</h3>
                      <div className="grid sm:grid-cols-2 gap-6">
                        <CompareRow label="Daily Capacity" a={resultManual.daily_capacity} b={resultAI.daily_capacity} />
                        <CompareRow label="Annual Capacity" a={resultManual.annual_capacity} b={resultAI.annual_capacity} />
                        <CompareRow label="Doctor Utilization %" a={resultManual.doctor_utilization} b={resultAI.doctor_utilization} invert />
                        <CompareRow label="Queue / Day" a={resultManual.queue_per_day} b={resultAI.queue_per_day} invert />
                      </div>
                    </div>
                  )}

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <h3 className="font-semibold mb-4 text-sm">Demand vs Capacity</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={[
                        { name: 'Manual', demand: inputs.patients_per_day, capacity: resultManual?.daily_capacity || 0 },
                        { name: 'AI-Assisted', demand: inputs.patients_per_day, capacity: resultAI?.daily_capacity || 0 },
                      ]}>
                        <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="demand" stroke="#F59E0B" strokeWidth={2.5} />
                        <Line type="monotone" dataKey="capacity" stroke="#22D3EE" strokeWidth={2.5} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="text-xs text-slate-500 text-center">
                    Target: {DEFAULTS.target_annual_patients.toLocaleString()} patients/year · Capacity gap: {active.capacity_gap.toLocaleString()}
                  </div>
                </>
              )}
              {loading && !active && <p className="text-slate-400 text-sm text-center py-10">Calculating…</p>}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </div>
  )
}

function SimSlider({ icon: Icon, label, value, min, max, step, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="flex items-center gap-1.5 text-slate-300 font-medium"><Icon size={13} /> {label}</span>
        <span className="text-simcyan font-bold">{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-simcyan" />
    </div>
  )
}

function Metric({ label, value, accent = '#22D3EE' }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="text-xl font-extrabold" style={{ color: accent }}>{Math.round(value).toLocaleString()}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  )
}

function UtilGauge({ label, value }) {
  const color = value >= 100 ? '#EF4444' : value >= 80 ? '#F59E0B' : '#84CC16'
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="text-xs text-slate-400 mb-2">{label}</div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-1.5">
        <motion.div className="h-full rounded-full" style={{ background: color }}
          animate={{ width: `${Math.min(value, 100)}%` }} transition={{ duration: 0.6 }} />
      </div>
      <div className="text-sm font-bold" style={{ color }}>{value.toFixed(1)}%</div>
    </div>
  )
}

function CompareRow({ label, a, b, invert }) {
  const better = invert ? b < a : b > a
  return (
    <div>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-slate-400">{Math.round(a).toLocaleString()}</span>
        <span>→</span>
        <span className={`font-bold ${better ? 'text-simlime' : 'text-rose-400'}`}>{Math.round(b).toLocaleString()}</span>
      </div>
    </div>
  )
}
