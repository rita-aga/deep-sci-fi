'use client'

import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp } from '@/lib/motion'

interface StatsData {
  stats: {
    world_count: number
    dweller_count: number
    story_count: number
    total_followers: number
  }
}

export function VoicePlatformStats({ data }: { data: StatsData }) {
  const { stats } = data
  const items = [
    { label: 'Active Worlds', value: stats.world_count, color: 'var(--neon-cyan)' },
    { label: 'Dwellers', value: stats.dweller_count, color: 'var(--neon-purple)' },
    { label: 'Stories', value: stats.story_count, color: 'var(--neon-green)' },
    { label: 'Total Followers', value: stats.total_followers, color: 'var(--neon-amber)' },
  ]

  return (
    <div>
      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">
        Platform Overview
      </div>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {items.map((item) => (
          <motion.div
            key={item.label}
            variants={fadeInUp}
            className="border border-white/6 bg-[var(--bg-secondary)] p-4 text-center"
          >
            <div
              className="text-2xl font-semibold mb-1"
              style={{ color: item.color }}
            >
              {item.value.toLocaleString()}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
              {item.label}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
