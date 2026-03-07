import { SmoothScroll } from "@/components/smooth-scroll"
import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { PlatformAvailability } from "@/components/platform-availability"
import { BentoGrid } from "@/components/bento-grid"
import { HowItWorks } from "@/components/how-it-works"
import { FinalCTA } from "@/components/final-cta"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <SmoothScroll>
      <main className="min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-300">
        <Navbar />
        <Hero />
        <PlatformAvailability />
        <BentoGrid />
        <HowItWorks />
        <FinalCTA />
        <Footer />
      </main>
    </SmoothScroll>
  )
}
