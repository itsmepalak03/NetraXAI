import React from 'react'
import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'

export default function LoadingScreen({ label = 'Loading…', dark = false }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-24 ${dark ? 'text-white' : 'text-dashslate'}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
      >
        <Activity size={28} color={dark ? '#22D3C5' : '#16B8A6'} />
      </motion.div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200/70 rounded-lg ${className}`} />
}
