import React from 'react'
import { motion } from 'framer-motion'

const LEVELS = [
  { level: 0, label: 'Normal', color: '#10B981' },
  { level: 1, label: 'Mild', color: '#84CC16' },
  { level: 2, label: 'Moderate', color: '#F59E0B' },
  { level: 3, label: 'Severe', color: '#F97316' },
  { level: 4, label: 'PDR', color: '#EF4444' },
]

export default function SeverityScale({ level = 0 }) {
  const pct = (level / 4) * 100
  const activeColor = LEVELS[level]?.color || '#64748B'

  return (
    <div className="w-full">
      <div className="relative h-2 rounded-full bg-slate-200 mb-3">
        <div className="absolute inset-0 rounded-full overflow-hidden flex">
          {LEVELS.map((l) => (
            <div key={l.level} className="flex-1" style={{ background: l.color, opacity: 0.18 }} />
          ))}
        </div>
        <motion.div
          className="absolute -top-2 w-6 h-6 rounded-full border-4 border-white shadow-md"
          style={{ background: activeColor }}
          initial={{ left: '0%' }}
          animate={{ left: `calc(${pct}% - 12px)` }}
          transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        />
      </div>
      <div className="flex justify-between text-xs font-medium text-stext">
        {LEVELS.map((l) => (
          <div key={l.level} className={`flex flex-col items-center ${l.level === level ? 'font-bold' : ''}`}
               style={{ color: l.level === level ? activeColor : undefined }}>
            <span>{l.level}</span>
            <span>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
