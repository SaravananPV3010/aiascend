"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Camera, Cpu, LayoutDashboard } from "lucide-react"

const steps = [
  {
    number: "1",
    icon: <Camera className="w-5 h-5" />,
    title: "Upload Image",
    description:
      "Simply snap a clear photo of your paper prescription or upload a digital copy directly to our secure platform.",
  },
  {
    number: "2",
    icon: <Cpu className="w-5 h-5" />,
    title: "AI Analysis",
    description:
      "Our AI engine parses the text instantly, identifying medications, dosages, and specific instructions from your doctor.",
  },
  {
    number: "3",
    icon: <LayoutDashboard className="w-5 h-5" />,
    title: "Get Clarity",
    description:
      "Your digital dashboard is ready. View your schedule, set food-timed reminders, and track your progress in real-time.",
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18 } },
}

const stepVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const lineVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const, delay: 0.3 },
  },
}

export function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section id="how-it-works" ref={ref} className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2
            className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-4"
            style={{ fontFamily: "var(--font-cal-sans)" }}
          >
            How it Works
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
            Three simple steps to clarify your medication routine. No more guesswork, just smart management.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="relative grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-6"
        >
          {/* Connecting lines (desktop only) */}
          <div className="hidden sm:block absolute top-6 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)]">
            <div className="flex">
              {/* Line 1 */}
              <motion.div
                variants={lineVariants}
                className="flex-1 h-px bg-gradient-to-r from-zinc-300 dark:from-zinc-700 to-zinc-300 dark:to-zinc-700 origin-left"
                style={{ marginRight: "2px" }}
              />
              {/* Line 2 */}
              <motion.div
                variants={lineVariants}
                className="flex-1 h-px bg-gradient-to-r from-zinc-300 dark:from-zinc-700 to-zinc-300 dark:to-zinc-700 origin-left"
                style={{ transitionDelay: "0.15s" }}
              />
            </div>
          </div>

          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              variants={stepVariants}
              className="flex flex-col items-center text-center"
            >
              {/* Number bubble */}
              <div className="relative mb-8">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="w-12 h-12 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center shadow-lg shadow-zinc-900/20 dark:shadow-white/10"
                >
                  <span className="text-base font-bold text-white dark:text-zinc-950">{step.number}</span>
                </motion.div>
                {/* Icon chip */}
                <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                  <span className="text-white" style={{ transform: "scale(0.65)" }}>{step.icon}</span>
                </div>
              </div>

              {/* Text */}
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-3">{step.title}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[220px]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
