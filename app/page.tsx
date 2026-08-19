'use client'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import TransitionBand from '@/components/landing/TransitionBand'
import ProductIntro from '@/components/landing/ProductIntro'
import PlatformShowcase from '@/components/landing/PlatformShowcase'
import CoreSection from '@/components/landing/CoreSection'
import CtaSection from '@/components/landing/CtaSection'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <main style={{ background: '#ffffff', position: 'relative' }}>
      <Navbar />
      <Hero />
      <TransitionBand />
      <ProductIntro />
      <PlatformShowcase />
      <CoreSection />
      <CtaSection />
      <Footer />
    </main>
  )
}
