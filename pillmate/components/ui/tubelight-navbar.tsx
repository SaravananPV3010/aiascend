"use client"

import React, { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
  /** Optional slot rendered to the right of the nav tabs (e.g. auth buttons / avatar) */
  rightSlot?: React.ReactNode
}

// Sage green (#4A6C58) as RGB — required for reliable opacity in Tailwind v4
const PRIMARY_RGB = "74, 108, 88"

// Spring physics: snappy enough to feel instant, smooth enough to look polished
const SPRING = { type: "spring" as const, stiffness: 400, damping: 34, mass: 0.8 }

export function NavBar({ items, className, rightSlot }: NavBarProps) {
  const pathname = usePathname()

  // Derive active tab from current URL — exact first, then longest-prefix
  const activeTab = useMemo(() => {
    const exact = items.find((i) => i.url === pathname)
    if (exact) return exact.name
    const prefix = [...items]
      .sort((a, b) => b.url.length - a.url.length)
      .find((i) => i.url !== "/" && pathname.startsWith(i.url))
    return prefix?.name ?? items[0].name
  }, [pathname, items])

  return (
    // overflow-visible keeps the tubelight glow visible; pointer-events-none on the
    // outer wrapper prevents the transparent fixed container from eating page clicks.
    <div
      className={cn(
        "fixed bottom-0 sm:top-0 left-1/2 -translate-x-1/2 z-50 mb-6 sm:pt-6 overflow-visible w-fit pointer-events-none",
        className,
      )}
    >
      <div
        className="flex items-center gap-1 overflow-visible border border-stone-200/70 backdrop-blur-xl py-1 px-1 rounded-full shadow-lg pointer-events-auto"
        style={{ background: "rgba(253, 252, 248, 0.72)" }}
      >
        {/* ── Nav tabs ──
            Single AnimatePresence wraps ALL items so framer-motion can track
            the shared layoutId="lamp" sliding from one tab to another.         */}
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.name

            return (
              <Link
                key={item.name}
                href={item.url}
                className={cn(
                  "relative cursor-pointer text-sm font-semibold px-5 py-2 rounded-full overflow-visible",
                  // CSS colour transition on the text itself
                  "transition-colors duration-300",
                  isActive ? "text-sage" : "text-stone-500 hover:text-sage",
                )}
              >
                {/* Desktop label */}
                <span className="hidden md:inline relative z-10">{item.name}</span>
                {/* Mobile icon */}
                <span className="md:hidden relative z-10">
                  <Icon size={18} strokeWidth={2.5} />
                </span>

                {/* Sliding background pill — ONE shared layoutId across all tabs.
                    framer-motion animates this element from the old tab's bounding
                    box to the new one, giving the smooth sliding "pill" effect.    */}
                {isActive && (
                  <motion.div
                    layoutId="lamp"
                    initial={false}
                    className="absolute inset-0 rounded-full -z-10 overflow-visible pointer-events-none"
                    style={{ background: `rgba(${PRIMARY_RGB}, 0.08)` }}
                    transition={SPRING}
                  >
                    <motion.div
                      className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-t-full pointer-events-none"
                      style={{ background: `rgb(${PRIMARY_RGB})` }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.18, delay: 0.08 }}
                    >
                      {/* Wide outer glow */}
                      <div
                        className="absolute rounded-full blur-lg pointer-events-none"
                        style={{
                          width: "56px", height: "28px",
                          background: `rgba(${PRIMARY_RGB}, 0.22)`,
                          top: "-10px", left: "-12px",
                        }}
                      />
                      {/* Mid glow */}
                      <div
                        className="absolute rounded-full blur-md pointer-events-none"
                        style={{
                          width: "36px", height: "20px",
                          background: `rgba(${PRIMARY_RGB}, 0.32)`,
                          top: "-6px", left: "-4px",
                        }}
                      />
                      {/* Bright core */}
                      <div
                        className="absolute rounded-full blur-sm pointer-events-none"
                        style={{
                          width: "20px", height: "12px",
                          background: `rgba(${PRIMARY_RGB}, 0.50)`,
                          top: "-3px", left: "6px",
                        }}
                      />
                    </motion.div>
                  </motion.div>
                )}
              </Link>
            )
          })}
        </AnimatePresence>

        {/* ── Right slot (auth controls) ── */}
        {rightSlot && (
          <>
            <div className="w-px h-5 bg-stone-200 mx-1 shrink-0" />
            {rightSlot}
          </>
        )}
      </div>
    </div>
  )
}
