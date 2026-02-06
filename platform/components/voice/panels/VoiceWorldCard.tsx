'use client'

import { motion } from 'framer-motion'
import { fadeInUp } from '@/lib/motion'

interface CausalEvent {
  year: number
  event: string
  consequence?: string
  reasoning?: string
}

interface WorldCardData {
  id: string
  name: string
  premise: string
  canon_summary?: string
  year_setting: number
  causal_chain?: CausalEvent[]
  scientific_basis?: string
  regions?: { name: string; location?: string }[]
  dweller_count: number
  follower_count: number
  comment_count?: number
  dwellers?: { id: string; name: string; role: string; is_active: boolean }[]
  stories?: { id: string; title: string; summary?: string | null; status: string; reaction_count: number }[]
}

export function VoiceWorldCard({ data }: { data: WorldCardData }) {
  return (
    <motion.div
      variants={fadeInUp}
      className="border border-white/10 bg-[var(--bg-secondary)] p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--neon-cyan)] tracking-wider">
            {data.name}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1 tracking-wide">
            YEAR {data.year_setting}
          </p>
        </div>
        <div className="flex gap-3 text-xs text-[var(--text-tertiary)]">
          <span>{data.dweller_count} dwellers</span>
          <span>{data.follower_count} followers</span>
        </div>
      </div>

      {/* Premise */}
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
        {data.canon_summary || data.premise}
      </p>

      {/* Scientific basis */}
      {data.scientific_basis && (
        <div className="border-l-2 border-[var(--neon-purple)]/40 pl-3">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
            Scientific Basis
          </p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {data.scientific_basis.slice(0, 200)}
            {data.scientific_basis.length > 200 && '...'}
          </p>
        </div>
      )}

      {/* Regions */}
      {data.regions && data.regions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.regions.map((r, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 border border-[var(--neon-cyan)]/20 text-[var(--neon-cyan-dim)]"
            >
              {r.name}
            </span>
          ))}
        </div>
      )}

      {/* Dwellers */}
      {data.dwellers && data.dwellers.length > 0 && (
        <div>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Active Dwellers
          </p>
          <div className="grid grid-cols-2 gap-2">
            {data.dwellers.map(d => (
              <div
                key={d.id}
                className="text-xs border border-white/5 bg-[var(--bg-tertiary)] p-2"
              >
                <span className="text-[var(--text-primary)]">{d.name}</span>
                {d.role && (
                  <span className="text-[var(--text-muted)] ml-1">— {d.role}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stories */}
      {data.stories && data.stories.length > 0 && (
        <div>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Recent Stories
          </p>
          <div className="space-y-1">
            {data.stories.map(s => (
              <div
                key={s.id}
                className="text-xs flex items-center justify-between border border-white/5 bg-[var(--bg-tertiary)] px-2 py-1.5"
              >
                <span className="text-[var(--text-secondary)] truncate">{s.title}</span>
                {s.reaction_count > 0 && (
                  <span className="text-[var(--neon-amber)] ml-2 shrink-0">
                    {s.reaction_count}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
