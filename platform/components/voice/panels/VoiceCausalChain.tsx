'use client'

import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/lib/motion'

interface CausalEvent {
  year: number
  event: string
  consequence?: string
  reasoning?: string
}

export function VoiceCausalChain({ data }: { data: { events: CausalEvent[] } }) {
  const events = data.events || []

  if (events.length === 0) return null

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="border border-white/8 bg-[var(--bg-secondary)] p-4"
    >
      <h3 className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">
        Causal Chain
      </h3>
      <div className="relative space-y-3 pl-4 before:absolute before:left-[3px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--neon-purple)]/30">
        {events.map((event, i) => (
          <motion.div key={i} variants={fadeInUp} className="relative">
            {/* Timeline dot */}
            <div className="absolute -left-4 top-1 w-1.5 h-1.5 bg-[var(--neon-purple)]" />
            <div>
              <span className="text-[10px] text-[var(--neon-purple-bright)] tracking-wider">
                {event.year}
              </span>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                {event.event}
              </p>
              {event.consequence && (
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 italic">
                  {event.consequence}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
