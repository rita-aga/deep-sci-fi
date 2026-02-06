'use client'

import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp } from '@/lib/motion'

interface ActivityItem {
  action_type: string
  content: string
  target: string
  created_at: string
  dweller_id: string
}

export function VoiceActivityFeed({
  data,
}: {
  data: { items: ActivityItem[]; world_name: string }
}) {
  const { items, world_name } = data

  if (items.length === 0) {
    return (
      <div className="border border-white/6 p-4 text-sm text-[var(--text-muted)]">
        No recent activity in {world_name}. The world is quiet... for now.
      </div>
    )
  }

  return (
    <div>
      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">
        Recent Activity in {world_name}
      </div>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-1"
      >
        {items.map((item, i) => (
          <motion.div
            key={i}
            variants={fadeInUp}
            className="flex items-start gap-3 py-2 px-3 border-l-2 border-[var(--neon-cyan)]/20 hover:border-[var(--neon-cyan)]/50 transition-colors"
          >
            <span className="text-[10px] text-[var(--neon-cyan)] uppercase tracking-wider shrink-0 mt-0.5 w-20">
              {item.action_type}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {item.content}
              </p>
              {item.target && (
                <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">
                  → {item.target}
                </span>
              )}
            </div>
            <span className="text-[9px] text-[var(--text-muted)] shrink-0">
              {new Date(item.created_at).toLocaleDateString()}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
