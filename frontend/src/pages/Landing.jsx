import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Eye, ArrowRight, ScanLine, Brain, Microscope, LineChart as LineChartIcon,
  Sparkles, Users, Radio, Github, Mail, ShieldAlert
} from 'lucide-react'

const NAV_LINKS = ['Platform', 'How It Works', 'Explainability', 'Rural Impact', 'Technology', 'About']

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-dark shadow-lg py-3' : 'py-5 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal to-violet flex items-center justify-center">
            <Eye size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">NETRA XAI</span>
        </div>
        <div className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}
               className="text-sm text-slate-300 hover:text-white transition-colors">{l}</a>
          ))}
        </div>
        <Link
          to="/dashboard"
          className="text-sm font-semibold text-midnight bg-gradient-to-r from-teal to-lavender px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
        >
          Launch Screening
        </Link>
      </div>
    </motion.nav>
  )
}

function HeroVisual() {
  return (
    <div className="relative w-full aspect-square max-w-lg mx-auto">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(circle at 35% 30%, #DB935A 0%, #7A2E1E 45%, #2B0E12 80%)' }}
        animate={{ scale: [1, 1.015, 1] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      />
      {/* vessel lines */}
      <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full opacity-70">
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <motion.path
            key={i}
            d={`M200,200 Q${200 + 90 * Math.cos((angle * Math.PI) / 180)},${200 + 60 * Math.sin((angle * Math.PI) / 180)} ${200 + 170 * Math.cos((angle * Math.PI) / 180)},${200 + 170 * Math.sin((angle * Math.PI) / 180)}`}
            stroke="#5B1A18"
            strokeWidth="3"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.15 * i }}
          />
        ))}
      </svg>
      {/* optic disc */}
      <div className="absolute left-[38%] top-[42%] w-16 h-16 rounded-full bg-amber-200/80 blur-[1px]" />

      {/* scan beam */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-teal/40 to-transparent"
          animate={{ y: ['-40%', '140%'] }}
          transition={{ repeat: Infinity, duration: 2.6, ease: 'linear' }}
        />
      </div>

      {/* detection markers */}
      {[[30, 55], [62, 38], [48, 70], [70, 62]].map(([x, y], i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full border-2 border-teal"
          style={{ left: `${x}%`, top: `${y}%` }}
          animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
        />
      ))}

      {/* floating AI status card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute -bottom-4 -right-4 glass-dark rounded-2xl px-4 py-3 border border-white/10 shadow-elevated"
      >
        <div className="flex items-center gap-2 text-teal text-xs font-semibold mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" /> ANALYZING
        </div>
        <div className="text-white text-sm font-semibold">Moderate NPDR · Level 2</div>
        <div className="text-slate-400 text-xs mt-0.5">Demo confidence: 93.7%</div>
      </motion.div>
    </div>
  )
}

const WORKFLOW_STEPS = [
  { icon: ScanLine, title: 'Upload & Quality Check', desc: 'Fundus image is validated for focus, illumination, and field of view.' },
  { icon: Sparkles, title: 'Enhancement', desc: 'CLAHE and illumination normalization improve visibility of retinal structures.' },
  { icon: Microscope, title: 'Structure & Lesion Detection', desc: 'Vessels, optic disc, and candidate lesions are identified.' },
  { icon: Brain, title: 'DR Severity Grading', desc: 'The demo AI engine grades severity across 5 clinical levels.' },
  { icon: Eye, title: 'Explainable AI', desc: 'Grad-CAM-style visualization shows which regions influenced the result.' },
  { icon: Users, title: 'Doctor Review', desc: 'A qualified doctor confirms, modifies, or overrides the AI assessment.' },
]

const TECH_CARDS = [
  { icon: Microscope, title: 'Computer Vision', desc: 'Classical & deep-learning-ready retinal image analysis.' },
  { icon: Brain, title: 'Deep Learning', desc: 'Modular architecture ready for a trained EfficientNet classifier.' },
  { icon: Sparkles, title: 'Explainable AI', desc: 'Grad-CAM-style attention maps for every prediction.' },
  { icon: ScanLine, title: 'Medical Imaging', desc: 'Quality assessment and enhancement pipelines for fundus photography.' },
  { icon: LineChartIcon, title: 'Analytics', desc: 'District and centre-level screening intelligence.' },
]

export default function Landing() {
  return (
    <div className="bg-midnight text-white overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-40 pb-28 px-6">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(600px circle at 15% 20%, rgba(124,92,252,0.18), transparent 60%), radial-gradient(600px circle at 85% 10%, rgba(34,211,197,0.15), transparent 60%)'
        }} />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-teal bg-teal/10 border border-teal/30 rounded-full px-3 py-1 mb-6"
            >
              <Sparkles size={13} /> Explainable AI Screening Prototype
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-extrabold leading-[1.08] mb-6"
            >
              AI That Doesn't Just <span className="gradient-text">Detect.</span><br />It <span className="gradient-text">Explains.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="text-slate-300 text-lg max-w-xl mb-9"
            >
              An explainable AI platform designed to support faster, transparent diabetic
              retinopathy screening — from retinal image to doctor-reviewed decision.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link to="/patients/new" className="inline-flex items-center gap-2 bg-gradient-to-r from-teal to-violet text-midnight font-semibold px-6 py-3.5 rounded-full hover:opacity-90 transition-opacity">
                Start Screening <ArrowRight size={17} />
              </Link>
              <a href="#explainability" className="inline-flex items-center gap-2 border border-white/20 text-white font-semibold px-6 py-3.5 rounded-full hover:bg-white/5 transition-colors">
                Explore the AI
              </a>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}>
            <HeroVisual />
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-6 bg-indigo/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">How It Works</h2>
            <p className="text-slate-400 max-w-xl mx-auto">A six-step pipeline connecting a retinal photograph to a doctor-reviewed clinical decision.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {WORKFLOW_STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="glass-dark rounded-2xl p-6 border border-white/10"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal/20 to-violet/20 flex items-center justify-center mb-4">
                  <s.icon size={20} className="text-teal" />
                </div>
                <div className="text-xs text-slate-500 font-semibold mb-1">STEP {i + 1}</div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI + HUMAN */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">AI + Human</h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-14">
            NETRA XAI never makes the final call. The AI proposes; the doctor decides.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            {['AI Analysis', 'Doctor Review', 'Final Decision'].map((step, i) => (
              <React.Fragment key={step}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="glass-dark rounded-2xl px-8 py-6 border border-white/10 min-w-[200px]"
                >
                  <div className="text-teal font-bold text-sm mb-1">0{i + 1}</div>
                  <div className="font-semibold">{step}</div>
                </motion.div>
                {i < 2 && <ArrowRight className="text-slate-600 hidden md:block" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* EXPLAINABILITY */}
      <section id="explainability" className="py-24 px-6 bg-gradient-to-b from-xaipurple/20 to-transparent border-y border-white/5">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why did the AI make this decision?</h2>
            <p className="text-slate-400 mb-6">
              Every prediction is paired with a visual explanation — highlighting the retinal
              regions, lesion candidates, and evidence that contributed to the AI's assessment.
              Doctor review is always required before any clinical action.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Original Retina', 'AI Attention', 'Lesion Evidence', 'DR Severity', 'Recommendation'].map((c) => (
                <span key={c} className="text-xs font-medium px-3 py-1.5 rounded-full bg-xaiviolet/20 border border-xaiviolet/30 text-xaipink">{c}</span>
              ))}
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video bg-gradient-to-br from-xaipurple to-black flex items-center justify-center">
            <motion.div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(circle at 55% 45%, rgba(219,39,119,0.55), transparent 55%)' }}
              animate={{ opacity: [0.5, 0.9, 0.5] }}
              transition={{ repeat: Infinity, duration: 3 }}
            />
            <span className="relative text-xs font-semibold text-white/80 bg-black/40 px-3 py-1.5 rounded-full">Prototype Grad-CAM visualization</span>
          </div>
        </div>
      </section>

      {/* RURAL SCREENING */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Rural Screening, At Scale</h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-12">
            A capacity simulator to explore how AI-assisted screening could influence
            district-level throughput, doctor workload, and screening backlog.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { label: 'Patients / Day (demo)', value: '350' },
              { label: 'Doctors (demo)', value: '5' },
              { label: 'Target Patients / Year', value: '100,000' },
            ].map((s) => (
              <div key={s.label} className="glass-dark rounded-2xl p-6 border border-white/10">
                <div className="text-3xl font-bold text-simcyan mb-1">{s.value}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
          <Link to="/simulator" className="inline-flex items-center gap-2 mt-10 text-sm font-semibold text-simcyan hover:underline">
            Open Rural Screening Simulator <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* TECHNOLOGY */}
      <section id="technology" className="py-24 px-6 bg-indigo/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-14">Technology</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {TECH_CARDS.map((c) => (
              <div key={c.title} className="glass-dark rounded-2xl p-5 border border-white/10">
                <c.icon size={20} className="text-lavender mb-3" />
                <h3 className="font-semibold mb-1.5 text-sm">{c.title}</h3>
                <p className="text-xs text-slate-400">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-28 px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold max-w-3xl mx-auto mb-8">
          Turn retinal images into <span className="gradient-text">understandable decisions.</span>
        </h2>
        <Link to="/patients/new" className="inline-flex items-center gap-2 bg-gradient-to-r from-teal to-violet text-midnight font-semibold px-8 py-4 rounded-full hover:opacity-90 transition-opacity">
          Start Screening <ArrowRight size={18} />
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-14 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye size={18} className="text-teal" />
              <span className="font-bold">NETRA XAI</span>
            </div>
            <p className="text-sm text-slate-400">Explainable AI for diabetic retinopathy screening, built for rural healthcare scale.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Navigation</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              {NAV_LINKS.map((l) => <li key={l}><a href={`#${l.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-white">{l}</a></li>)}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Technology</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>FastAPI + React</li>
              <li>OpenCV Image Processing</li>
              <li>Demo AI Engine</li>
              <li>Grad-CAM Prototype XAI</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Links</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2"><Github size={14} /> GitHub (placeholder)</li>
              <li className="flex items-center gap-2"><Mail size={14} /> Contact (placeholder)</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/10 pt-6 flex flex-col md:flex-row gap-4 justify-between text-xs text-slate-500">
          <div className="flex items-start gap-2 max-w-2xl">
            <ShieldAlert size={14} className="shrink-0 mt-0.5" />
            <span>Medical Disclaimer: NETRA XAI is an early-stage research prototype for screening
              support only. It does not provide a medical diagnosis and does not replace clinical
              judgement or a qualified healthcare professional.</span>
          </div>
          <span>© 2026 NETRA XAI. Prototype build.</span>
        </div>
      </footer>
    </div>
  )
}
