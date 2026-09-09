import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, ScanEye, Users, BrainCircuit, Sparkles,
  FileText, BarChart3, Radio, Settings as SettingsIcon, ChevronsLeft, ChevronsRight
} from 'lucide-react'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/patients/new', label: 'Screening', icon: ScanEye },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/analytics', label: 'AI Analysis', icon: BrainCircuit },
  { to: '/analytics', label: 'Explainability', icon: Sparkles },
  { to: '/analytics', label: 'Reports', icon: FileText },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/simulator', label: 'Rural Simulator', icon: Radio },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 236 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className="h-screen sticky top-0 bg-dashnavy text-slate-300 flex flex-col shrink-0 z-20"
    >
      <div className="flex items-center gap-2 px-4 h-16 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal to-violet flex items-center justify-center text-white font-bold text-sm shrink-0">
          D
        </div>
        {!collapsed && <span className="font-bold text-white tracking-tight">NETRA XAI</span>}
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
        {NAV.map((item, i) => (
          <NavLink
            key={item.label + i}
            to={item.to}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icon size={18} className="shrink-0" />
            {!collapsed && <span>{item.label}</span>}
            {collapsed && (
              <span className="absolute left-full ml-2 whitespace-nowrap bg-dashnavy text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-elevated">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => setCollapsed((c) => !c)}
        className="m-3 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300"
      >
        {collapsed ? <ChevronsRight size={16} /> : <><ChevronsLeft size={16} /> Collapse</>}
      </button>
    </motion.aside>
  )
}
