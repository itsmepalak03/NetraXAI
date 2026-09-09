import React from 'react'
import { motion } from 'framer-motion'

export default function StatCard({ icon: Icon, label, value, trend, trendUp, accent = '#16B8A6', suffix = '' }) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(16,24,40,0.12)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="card p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
             style={{ background: `${accent}1A` }}>
          {Icon && <Icon size={20} color={accent} />}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold ${trendUp ? 'text-emerald-600' : 'text-rose-500'}`}>
            {trendUp ? '▲' : '▼'} {trend}
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-dashnavy">{value}{suffix}</div>
        <div className="text-sm text-dashslate mt-0.5">{label}</div>
      </div>
    </motion.div>
  )
}
