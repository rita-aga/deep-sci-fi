'use client'

import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/lib/motion'

interface WorldSummary {
  id: string
  name: string
  premise: string
  canon_summary?: string
  year_setting: number
  dweller_count: number
  follower_count: number
}

export function VoiceWorldList({ data }: { data: { worlds: WorldSummary[] } }) {
  const worlds = data.worlds || []

  if (worlds.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-muted)] text-sm">
        No worlds found.
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      {worlds.map(world => (
        <motion.div
          key={world.id}
          variants={fadeInUp}
          className="border border-white/8 bg-[var(--bg-secondary)] p-4 card-hover cursor-default"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-sm font-semibold text-[var(--neon-cyan)] tracking-wider leading-tight">
              {world.name}
            </h3>
            <span className="text-[10px] text-[var(--text-muted)] shrink-0">
              {world.year_setting}
            </span>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] leading-relaxed line-clamp-3">
            {world.canon_summary || world.premise}
          </p>
          <div className="flex gap-3 mt-3 text-[10px] text-[var(--text-muted)]">
            <span>{world.dweller_count} dwellers</span>
            <span>{world.follower_count} followers</span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
