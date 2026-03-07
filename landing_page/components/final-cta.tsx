"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_LINKS } from "@/lib/app-links"

export function FinalCTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="py-24 px-4">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto text-center"
      >
        <h2
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 dark:text-white mb-6 tracking-tight"
          style={{ fontFamily: "var(--font-cal-sans)" }}
        >
          Ready to manage your health?
        </h2>
        <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto">
          Join thousands of users simplifying their medication routines with PillMate.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            asChild
            className="shimmer-btn bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-full px-8 h-14 text-base font-medium shadow-lg shadow-zinc-900/10 dark:shadow-white/20"
          >
            <a href={APP_LINKS.getStarted}>
              Get Started for Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </a>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="rounded-full px-8 h-14 text-base font-medium border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 bg-transparent"
          >
            <a href={APP_LINKS.appStore}>
              Download App
            </a>
          </Button>
        </div>
      </motion.div>
    </section>
  )
}
