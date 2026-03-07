"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Smartphone, Monitor } from "lucide-react"
import { APP_LINKS } from "@/lib/app-links"

const platforms = [
  {
    id: "ios",
    label: "Download on the",
    title: "App Store",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
    sub: "iOS 15.0 or later",
    href: APP_LINKS.appStore,
    badge: null,
  },
  {
    id: "android",
    label: "Get it on",
    title: "Google Play",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M3.18 23.76c.3.17.64.24.99.2l12.6-7.27-2.75-2.75-10.84 9.82zm-1.7-20.3A1.99 1.99 0 001 5v14c0 .59.26 1.12.68 1.49l.09.08 7.84-7.84v-.18L1.48 3.46zm17.12 8.5l-2.25-1.3-3.1 3.1 3.1 3.07 2.27-1.31a2 2 0 000-3.46zM4.17.52L16.78 7.8 14.03 10.54 3.18.72C3.54.3 4.04.07 4.17.52z" />
      </svg>
    ),
    sub: "Android 8.0 or later",
    href: APP_LINKS.googlePlay,
    badge: null,
  },
  {
    id: "web",
    label: "Use it on",
    title: "Web Browser",
    icon: <Monitor className="w-7 h-7" />,
    sub: "No install required",
    href: APP_LINKS.getStarted,
    badge: "Available Now",
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function PlatformAvailability() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section ref={ref} className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mb-5">
            <Smartphone className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              Available everywhere
            </span>
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-3"
            style={{ fontFamily: "var(--font-instrument-sans)" }}
          >
            PillMate on your terms
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Access your medication dashboard from any device. Start on one, pick up on another — your data syncs
            seamlessly.
          </p>
        </motion.div>

        {/* Platform Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-3 gap-5"
        >
          {platforms.map((platform) => (
            <motion.a
              key={platform.id}
              href={platform.href}
              variants={cardVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="group relative flex flex-col items-start p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-lg dark:hover:shadow-zinc-900 transition-all duration-300 text-left w-full cursor-pointer"
            >
              {/* "Available Now" badge for web */}
              {platform.badge && (
                <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {platform.badge}
                </span>
              )}

              {/* Icon */}
              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 mb-5 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
                {platform.icon}
              </div>

              {/* Labels */}
              <span className="text-xs text-zinc-500 dark:text-zinc-500 mb-0.5">{platform.label}</span>
              <span className="text-xl font-bold text-zinc-900 dark:text-white mb-1">{platform.title}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-500">{platform.sub}</span>
            </motion.a>
          ))}
        </motion.div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-8"
        >
          Free to download · No credit card required · Data syncs across all devices
        </motion.p>
      </div>
    </section>
  )
}
