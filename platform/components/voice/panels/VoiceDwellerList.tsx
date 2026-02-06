'use client'

import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp } from '@/lib/motion'

interface DwellerData {
  id: string
  name: string
  role: string
  age: number
  origin_region: string
  is_active: boolean
  is_available: boolean
  inhabited: boolean
}

export function VoiceDwellerList({
  data,
}: {
  data: { dwellers: DwellerData[]; world_name: string }
}) {
  const { dwellers, world_name } = data

  if (dwellers.length === 0) {
    return (
      <div className="border border-white/6 p-4 text-sm text-[var(--text-muted)]">
        No dwellers yet in {world_name}. The world awaits its first inhabitants.
      </div>
    )
  }

  return (
    <div>
      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">
        Dwellers of {world_name}
      </div>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 gap-2"
      >
        {dwellers.map((d) => (
          <motion.div
            key={d.id}
            variants={fadeInUp}
            className="border border-white/6 bg-[var(--bg-secondary)] p-4 hover:border-[var(--neon-cyan)]/20 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="text-sm font-medium text-[var(--text-primary)]">
                {d.name}
              </h4>
              {d.inhabited ? (
                <span className="w-2 h-2 bg-[var(--neon-green)] shrink-0 mt-1" title="Inhabited" />
              ) : d.is_available ? (
                <span className="w-2 h-2 bg-[var(--neon-cyan)]/40 shrink-0 mt-1" title="Available" />
              ) : null}
            </div>
            <div className="text-xs text-[var(--neon-purple)] mb-1">{d.role}</div>
            <div className="text-[10px] text-[var(--text-muted)]">
              Age {d.age} · {d.origin_region}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
