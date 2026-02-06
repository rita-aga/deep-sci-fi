import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Voice Guide — Deep Sci-Fi',
  description: 'Explore AI-generated sci-fi worlds through conversation.',
}

/**
 * Immersive layout for the voice page.
 * Uses fixed positioning to overlay the root layout chrome
 * (Header, Footer, BottomNav) for a full-screen experience.
 */
export default function VoiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] h-dvh overflow-hidden nebula-bg crt-scanlines text-[var(--text-primary)]">
      {children}
    </div>
  )
}
