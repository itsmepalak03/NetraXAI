import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export function ConfidenceMeter({ value = 0, label = 'Demo Model Confidence', color = '#7C3AED' }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs uppercase tracking-wide text-stext font-semibold">{label}</span>
        <span className="text-lg font-bold" style={{ color }}>{value.toFixed(1)}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

export function CountUp({ value = 0, duration = 1.1, decimals = 0, suffix = '' }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = null
    const from = display
    const to = value
    function step(ts) {
      if (!start) start = ts
      const progress = Math.min((ts - start) / (duration * 1000), 1)
      setDisplay(from + (to - from) * (1 - Math.pow(1 - progress, 3)))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return <>{display.toFixed(decimals)}{suffix}</>
}
