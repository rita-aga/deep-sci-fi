'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface VoiceStatusProps {
  error: string | null
  breadcrumbs: string[]
  onDismissError?: () => void
}

export function VoiceStatus({ error, breadcrumbs, onDismissError }: VoiceStatusProps) {
  if (!error && breadcrumbs.length === 0) return null

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-2 text-xs border-b border-white/4 shrink-0">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[var(--text-muted)] min-w-0 truncate">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-[var(--text-muted)]/40">/</span>}
            <span className={i === breadcrumbs.length - 1 ? 'text-neon-cyan-dim' : ''}>
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
            className="flex items-center gap-2 text-neon-pink cursor-pointer shrink-0 ml-4"
            onClick={onDismissError}
          >
            <span className="w-1.5 h-1.5 bg-neon-pink" />
            {error.length > 50 ? error.slice(0, 50) + '...' : error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
