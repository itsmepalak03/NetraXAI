import React from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Header from '../components/Header.jsx'
import { motion } from 'framer-motion'

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-dashbg">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Header />
        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="p-6 max-w-[1500px] mx-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
