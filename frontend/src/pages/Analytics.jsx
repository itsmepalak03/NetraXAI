import React, { useEffect, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
  BarChart, Bar, Legend
} from 'recharts'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import { CountUp } from '../components/ConfidenceMeter.jsx'
import { Analytics } from '../services/api.js'

const PALETTE = ['#16B8A6', '#6366F1', '#8B5CF6', '#F59E0B', '#F97316', '#06B6D4']
const DR_COLORS = ['#10B981', '#84CC16', '#F59E0B', '#F97316', '#EF4444']

export default function AnalyticsPage() {
  const [data, setData] = useState(null)
  useEffect(() => { Analytics.get().then(setData) }, [])

  if (!data) return <DashboardLayout><LoadingScreen label="Loading analytics…" /></DashboardLayout>

  const dr = data.dr_distribution.map((d, i) => ({ name: `Level ${d.level}`, value: d.count, color: DR_COLORS[i] }))
  const referableGauge = [
    { name: 'Referable', value: data.referable_cases },
    { name: 'Non-referable', value: Math.max(data.total_screenings - data.referable_cases, 0) },
  ]

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-dashnavy mb-1">Healthcare Analytics</h1>
      <p className="text-dashslate text-sm mb-6">Screening intelligence across patients, centres, and AI performance.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MiniStat label="Total Screenings" value={data.total_screenings} color={PALETTE[0]} />
        <MiniStat label="Referable Cases" value={data.referable_cases} color={PALETTE[4]} />
        <MiniStat label="Review Completion" value={data.review_completion_rate} suffix="%" color={PALETTE[1]} />
        <MiniStat label="Avg AI Time" value={data.avg_processing_time_ms} suffix=" ms" color={PALETTE[2]} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-dashnavy mb-4">Screening Volume (14 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.screening_volume_14d.map(v => ({ date: v.date.slice(5), count: v.count }))}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke={PALETTE[0]} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-dashnavy mb-4">DR Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={dr} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={3}>
                {dr.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <div className="card p-5">
          <h3 className="font-semibold text-dashnavy mb-4">Image Quality</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.quality_distribution}>
              <XAxis dataKey="status" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill={PALETTE[3]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-dashnavy mb-4">AI Confidence Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.confidence_distribution}>
              <XAxis dataKey="bucket" tick={{ fontSize: 9 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill={PALETTE[5]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-dashnavy mb-4">Screening Centre Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.centre_performance} layout="vertical">
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="centre" width={110} tick={{ fontSize: 9 }} />
              <Tooltip />
              <Bar dataKey="count" fill={PALETTE[2]} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  )
}

function MiniStat({ label, value, suffix = '', color }) {
  return (
    <div className="card p-5">
      <div className="text-2xl font-bold" style={{ color }}><CountUp value={value} decimals={0} suffix={suffix} /></div>
      <div className="text-xs text-dashslate mt-1">{label}</div>
    </div>
  )
}
