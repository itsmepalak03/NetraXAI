import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ScanEye, AlertTriangle, ClipboardList, ImageOff, Timer, ArrowRight
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell
} from 'recharts'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import StatCard from '../components/StatCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { CountUp } from '../components/ConfidenceMeter.jsx'
import { Skeleton } from '../components/LoadingScreen.jsx'
import { Analytics, Screenings } from '../services/api.js'

const PIE_COLORS = ['#10B981', '#84CC16', '#F59E0B', '#F97316', '#EF4444']

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [screenings, setScreenings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([Analytics.get(), Screenings.list()])
      .then(([a, s]) => { setAnalytics(a); setScreenings(s.slice(0, 6)) })
      .finally(() => setLoading(false))
  }, [])

  const donutData = analytics?.dr_distribution?.map((d, i) => ({
    name: `Level ${d.level}`, value: d.count, color: PIE_COLORS[i]
  })) || []

  const volumeData = analytics?.screening_volume_14d?.map(v => ({
    date: v.date.slice(5), count: v.count
  })) || []

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dashnavy">Good Morning, Doctor</h1>
          <p className="text-dashslate text-sm mt-1">Here is today's screening overview.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
          <motion.span className="w-1.5 h-1.5 rounded-full bg-emerald-500"
            animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.6 }} />
          AI Engine Online
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard icon={ScanEye} label="Today's Screenings" value={<CountUp value={analytics?.total_screenings || 0} />} accent="#16B8A6" />
        <StatCard icon={AlertTriangle} label="Referable Cases" value={<CountUp value={analytics?.referable_cases || 0} />} accent="#EF4444" />
        <StatCard icon={ClipboardList} label="Pending Reviews" value={<CountUp value={analytics?.pending_reviews || 0} />} accent="#3B82F6" />
        <StatCard icon={ImageOff} label="Ungradeable Images" value={<CountUp value={analytics?.ungradeable_images || 0} />} accent="#F59E0B" />
        <StatCard icon={Timer} label="Avg AI Processing" value={<CountUp value={analytics?.avg_processing_time_ms || 0} decimals={0} />} suffix=" ms" accent="#8B5CF6" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-8">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-dashnavy mb-4">Screening Volume (14 days)</h3>
          {loading ? <Skeleton className="h-56 w-full" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={volumeData}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#16B8A6" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-dashnavy mb-4">DR Distribution</h3>
          {loading ? <Skeleton className="h-56 w-full" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3}>
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-dashnavy">Recent Screenings</h3>
          <Link to="/patients/new" className="text-xs font-semibold text-dashteal hover:underline">+ New Screening</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-dashslate uppercase border-b border-slate-100">
                <th className="pb-2 font-semibold">Patient ID</th>
                <th className="pb-2 font-semibold">Date</th>
                <th className="pb-2 font-semibold">DR Level</th>
                <th className="pb-2 font-semibold">Confidence</th>
                <th className="pb-2 font-semibold">Quality</th>
                <th className="pb-2 font-semibold">Review</th>
                <th className="pb-2 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {screenings.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 font-medium text-dashnavy">{s.patient?.patient_code}</td>
                  <td className="py-3 text-dashslate">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="py-3">{s.ai_result ? `Level ${s.ai_result.dr_level}` : '—'}</td>
                  <td className="py-3">{s.ai_result ? `${s.ai_result.confidence}%` : '—'}</td>
                  <td className="py-3">{s.quality_status ? <StatusBadge status={s.quality_status} small /> : '—'}</td>
                  <td className="py-3">{s.doctor_review ? <StatusBadge status="reviewed" small /> : <StatusBadge status="pending" small />}</td>
                  <td className="py-3 text-right">
                    <Link to={`/screening/${s.id}`} className="text-xs font-semibold text-dashteal inline-flex items-center gap-1 hover:underline">
                      View <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
              {!loading && screenings.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-dashslate text-sm">No screenings yet. Start by registering a patient.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
