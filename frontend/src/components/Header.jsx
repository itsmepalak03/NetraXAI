import React from 'react'
import { Search, Bell, Wifi } from 'lucide-react'

export default function Header() {
  return (
    <header className="h-16 sticky top-0 z-10 bg-dashbg/90 backdrop-blur border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-slate-200 w-80 max-w-[40vw]">
        <Search size={16} className="text-dashslate" />
        <input
          placeholder="Search patients, screenings…"
          className="bg-transparent outline-none text-sm w-full placeholder:text-slate-400"
        />
      </div>

      <div className="flex items-center gap-5">
        <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
          <Wifi size={13} /> AI Engine Online
        </div>
        <button className="relative text-dashslate hover:text-dashnavy">
          <Bell size={19} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-dashteal to-sky-500 flex items-center justify-center text-white text-sm font-semibold">
            DR
          </div>
          <div className="hidden lg:block text-xs">
            <div className="font-semibold text-dashnavy">Dr. Demo Reviewer</div>
            <div className="text-dashslate">Rural Screening Centre — Demo</div>
          </div>
        </div>
      </div>
    </header>
  )
}
