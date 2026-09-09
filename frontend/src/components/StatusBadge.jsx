import React from 'react'

const CONFIG = {
  GRADEABLE: { bg: '#DCFCE7', fg: '#15803D', label: 'Gradeable' },
  BORDERLINE: { bg: '#FEF3C7', fg: '#B45309', label: 'Borderline' },
  UNGRADEABLE: { bg: '#FEE2E2', fg: '#B91C1C', label: 'Ungradeable' },
  referred: { bg: '#FEE2E2', fg: '#B91C1C', label: 'Referred' },
  confirmed: { bg: '#DCFCE7', fg: '#15803D', label: 'Confirmed' },
  modified: { bg: '#DBEAFE', fg: '#1D4ED8', label: 'Modified' },
  recapture_requested: { bg: '#FEF3C7', fg: '#B45309', label: 'Recapture Requested' },
  ungradeable: { bg: '#FEE2E2', fg: '#B91C1C', label: 'Ungradeable' },
  pending: { bg: '#F1F5F9', fg: '#475569', label: 'Pending Review' },
  registered: { bg: '#F1F5F9', fg: '#475569', label: 'Registered' },
  uploaded: { bg: '#DBEAFE', fg: '#1D4ED8', label: 'Uploaded' },
  quality_checked: { bg: '#E0F2FE', fg: '#0369A1', label: 'Quality Checked' },
  analyzed: { bg: '#EDE9FE', fg: '#6D28D9', label: 'AI Analyzed' },
  reviewed: { bg: '#DCFCE7', fg: '#15803D', label: 'Reviewed' },
  reported: { bg: '#DCFCE7', fg: '#15803D', label: 'Reported' },
}

export default function StatusBadge({ status, small }) {
  const cfg = CONFIG[status] || { bg: '#F1F5F9', fg: '#475569', label: status || 'Unknown' }
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${small ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}
      style={{ background: cfg.bg, color: cfg.fg }}
    >
      {cfg.label}
    </span>
  )
}
