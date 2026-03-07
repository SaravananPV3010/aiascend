"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useEffect, useState } from "react"
import { Activity, Command, BarChart3, Zap, Shield } from "lucide-react"

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
}

function SystemStatus() {
  const [dots, setDots] = useState([true, true, true, false, true])

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => prev.map(() => Math.random() > 0.2))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2">
      {dots.map((active, i) => (
        <motion.div
          key={i}
          className={`w-2 h-2 rounded-full ${active ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`}
          animate={active ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
        />
      ))}
    </div>
  )
}

function KeyboardCommand() {
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setPressed(true)
      setTimeout(() => setPressed(false), 200)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-1">
      <motion.kbd
        animate={pressed ? { scale: 0.95, y: 2 } : { scale: 1, y: 0 }}
        className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-600 dark:text-zinc-300 font-mono"
      >
        ⌘
      </motion.kbd>
      <motion.kbd
        animate={pressed ? { scale: 0.95, y: 2 } : { scale: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-600 dark:text-zinc-300 font-mono"
      >
        K
      </motion.kbd>
    </div>
  )
}

function AnimatedChart() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  const points = [
    { x: 0, y: 60 },
    { x: 20, y: 45 },
    { x: 40, y: 55 },
    { x: 60, y: 30 },
    { x: 80, y: 40 },
    { x: 100, y: 15 },
  ]

  const pathD = points.reduce((acc, point, i) => {
    return i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`
  }, "")

  return (
    <svg ref={ref} viewBox="0 0 100 70" className="w-full h-24">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {isInView && (
        <g className="text-zinc-900 dark:text-white">
          <path d={`${pathD} L 100 70 L 0 70 Z`} fill="url(#chartGradient)" className="opacity-50" />
          <path d={pathD} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="draw-line" />
        </g>
      )}
    </svg>
  )
}

export function BentoGrid() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-4"
            style={{ fontFamily: "var(--font-instrument-sans)" }}
          >
            Everything you need for your health
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Built for modern patients. Powerful features that help you extract, track, and manage your medications easily.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {/* Large card - System Status */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-2 group relative p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:scale-[1.02] transition-all duration-300 overflow-hidden"
          >
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 w-fit mb-4">
                  <Activity className="w-5 h-5 text-zinc-600 dark:text-zinc-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">Intelligent Extraction</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  Extract medication names, dosages, frequencies, and timings instantly from prescriptions.
                </p>
              </div>
              <SystemStatus />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Accuracy", value: "98%" },
                { label: "Speed", value: "~3s" },
                { label: "Extracted", value: "99%" },
                { label: "Confidence", value: "97%" },
              ].map((metric) => (
                <div key={metric.label} className="text-center">
                  <div className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">{metric.value}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500">{metric.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Command Palette */}
          <motion.div
            variants={itemVariants}
            className="group relative p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 w-fit mb-4">
              <Command className="w-5 h-5 text-zinc-600 dark:text-zinc-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Quick Uploads</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6">Upload images of your prescriptions instantly with high-speed processing.</p>
            <KeyboardCommand />
          </motion.div>

          {/* Analytics */}
          <motion.div
            variants={itemVariants}
            className="group relative p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 w-fit mb-4">
              <BarChart3 className="w-5 h-5 text-zinc-600 dark:text-zinc-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Digital Dashboard</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">Track dosages, frequencies, and food timing requirements.</p>
            <AnimatedChart />
          </motion.div>

          {/* Performance */}
          <motion.div
            variants={itemVariants}
            className="group relative p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 w-fit mb-4">
              <Zap className="w-5 h-5 text-zinc-600 dark:text-zinc-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Instant Insights</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">
              AI-optimized extraction for lightning-fast prescription analysis.
            </p>
            <div className="flex items-center gap-2 text-emerald-500 text-sm">
              <span className="font-mono">~3s</span>
              <span className="text-zinc-500">avg extraction</span>
            </div>
          </motion.div>

          {/* Security */}
          <motion.div
            variants={itemVariants}
            className="group relative p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 w-fit mb-4">
              <Shield className="w-5 h-5 text-zinc-600 dark:text-zinc-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Data Privacy</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">Secure processing with end-to-end encryption to protect your health records.</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs bg-zinc-200 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400">HIPAA</span>
              <span className="px-2 py-1 text-xs bg-zinc-200 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400">GDPR</span>
              <span className="px-2 py-1 text-xs bg-zinc-200 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400">Secured</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
