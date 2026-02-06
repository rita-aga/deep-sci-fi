import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Voice Guide — Deep Sci-Fi',
  description: 'Explore AI-generated sci-fi worlds through conversation.',
}

/**
 * Immersive layout for the voice page — no header, footer, or nav.
 * Full viewport height for the voice interface.
 */
export default function VoiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {children}
    </div>
  )
}
