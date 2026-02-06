'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface VoiceStatusProps {
  error: string | null
  breadcrumbs: string[]
  onDismissError?: () => void
}

export function VoiceStatus({ error, breadcrumbs, onDismissError }: VoiceStatusProps) {
  return (
    <div className="flex items-center justify-between px-6 py-2 text-xs">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-[var(--text-muted)]/40">/</span>}
            <span className={i === breadcrumbs.length - 1 ? 'text-[var(--neon-cyan-dim)]' : ''}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center gap-2 text-[var(--neon-pink)] cursor-pointer"
            onClick={onDismissError}
          >
            <span className="w-1.5 h-1.5 bg-[var(--neon-pink)]" />
            {error.length > 60 ? error.slice(0, 60) + '...' : error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
