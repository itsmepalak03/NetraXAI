import React from 'react'
import { ShieldAlert, Cpu, Bell, Palette, Info, Building2, User } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout.jsx'

export default function Settings() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-dashnavy mb-6">Settings</h1>
      <div className="grid md:grid-cols-2 gap-5">
        <SettingsCard icon={User} title="Profile">
          <Row label="Name" value="Dr. Demo Reviewer" />
          <Row label="Role" value="Ophthalmologist (Demo)" />
        </SettingsCard>
        <SettingsCard icon={Building2} title="Screening Centre">
          <Row label="Centre" value="Rural Screening Centre — Demo" />
          <Row label="Region" value="Demo District, India" />
        </SettingsCard>
        <SettingsCard icon={Cpu} title="AI Engine">
          <Row label="Mode" value="DEMO AI ENGINE" />
          <Row label="Backbone (real mode)" value="EfficientNet-B0 (not loaded)" />
          <Row label="Explainability" value="Prototype Grad-CAM-style" />
        </SettingsCard>
        <SettingsCard icon={Bell} title="Notifications">
          <Row label="New referable case alerts" value="Enabled" />
          <Row label="Daily summary email" value="Disabled" />
        </SettingsCard>
        <SettingsCard icon={Palette} title="Appearance">
          <Row label="Theme" value="Light (Clinical)" />
        </SettingsCard>
        <SettingsCard icon={Info} title="System Information">
          <Row label="Version" value="1.0.0 (Prototype)" />
          <Row label="Database" value="SQLite" />
        </SettingsCard>
      </div>

      <div className="card p-5 mt-5 border-l-4 border-rose-400 flex gap-3">
        <ShieldAlert className="text-rose-500 shrink-0" size={20} />
        <div>
          <h4 className="font-semibold text-dashnavy text-sm mb-1">Medical Disclaimer</h4>
          <p className="text-xs text-dashslate">
            NETRA XAI is an early-stage research prototype for screening support only. It does
            not constitute a medical diagnosis and does not replace clinical judgement. All
            AI-assisted findings require confirmation by a qualified, licensed medical
            professional before any clinical action is taken.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

function SettingsCard({ icon: Icon, title, children }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={17} className="text-dashteal" />
        <h3 className="font-semibold text-dashnavy text-sm">{title}</h3>
      </div>
      <div className="space-y-1.5 text-sm">{children}</div>
    </div>
  )
}
function Row({ label, value }) {
  return <div className="flex justify-between border-b border-slate-50 py-1.5"><span className="text-dashslate">{label}</span><span className="font-medium text-dashnavy">{value}</span></div>
}
