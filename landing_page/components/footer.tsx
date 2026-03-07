"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { APP_LINKS } from "@/lib/app-links"

export function Footer() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <footer ref={ref} className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          {/* Brand → home */}
          <a href={APP_LINKS.home} className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center overflow-hidden rounded-md">
              <img src="/logo.png" alt="PillMate Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-semibold text-zinc-900 dark:text-white">PillMate</span>
          </a>

          {/* Copyright */}
          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} PillMate, Inc. All rights reserved.
          </p>

          {/* Links */}
          <div className="flex items-center gap-5">
            <a
              href={APP_LINKS.getStarted}
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors font-medium"
            >
              Open App
            </a>
            <a href="#" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
              Twitter
            </a>
            <a href="#" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
              GitHub
            </a>
            <a href="#" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
              Discord
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
