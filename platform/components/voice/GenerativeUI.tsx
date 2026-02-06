'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { fadeIn, staggerContainer } from '@/lib/motion'
import type { UIPanel } from '@/hooks/useVoiceAgent'
import { VoiceWorldCard } from './panels/VoiceWorldCard'
import { VoiceWorldList } from './panels/VoiceWorldList'
import { VoiceCausalChain } from './panels/VoiceCausalChain'
import { VoiceStoryList } from './panels/VoiceStoryList'
import { VoiceStoryFull } from './panels/VoiceStoryFull'
import { VoiceDwellerCard } from './panels/VoiceDwellerCard'
import { VoiceDwellerList } from './panels/VoiceDwellerList'
import { VoiceActivityFeed } from './panels/VoiceActivityFeed'
import { VoicePlatformStats } from './panels/VoicePlatformStats'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PanelComponent = React.ComponentType<{ data: any }>

/** Map panel types to components */
const PANEL_COMPONENTS: Record<string, PanelComponent> = {
  world_card: VoiceWorldCard,
  world_list: VoiceWorldList,
  causal_chain: VoiceCausalChain,
  story_list: VoiceStoryList,
  story_full: VoiceStoryFull,
  dweller_card: VoiceDwellerCard,
  dweller_list: VoiceDwellerList,
  activity_feed: VoiceActivityFeed,
  platform_stats: VoicePlatformStats,
}

const SUGGESTIONS = [
  'What worlds are out there?',
  'Show me the most popular world',
  'Tell me a story from a sci-fi world',
  'Who are the dwellers?',
]

interface GenerativeUIProps {
  panels: UIPanel[]
  onSuggestion?: (text: string) => void
}

export function GenerativeUI({ panels, onSuggestion }: GenerativeUIProps) {
  if (panels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 gap-6">
        {/* Decorative icon */}
        <div className="relative">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--neon-cyan)"
            strokeWidth="1"
            strokeLinecap="square"
            className="opacity-40"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm text-[var(--text-secondary)]">Voice Guide</p>
          <p className="text-xs text-[var(--text-muted)] opacity-60">
            Explore AI-generated sci-fi worlds through conversation
          </p>
        </div>

        {/* Suggestion chips */}
        {onSuggestion && (
          <div className="flex flex-wrap justify-center gap-2 max-w-md">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onSuggestion(s)}
                className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--neon-cyan)] border border-white/8 hover:border-[var(--neon-cyan)]/30 px-3 py-1.5 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-4 p-4 overflow-y-auto max-h-full"
    >
      <AnimatePresence mode="wait">
        {panels.map((panel, index) => {
          const Component = PANEL_COMPONENTS[panel.type]
          if (!Component) {
            return (
              <motion.div
                key={`${panel.type}-${index}`}
                variants={fadeIn}
                className="text-xs text-[var(--text-muted)] border border-white/5 p-3"
              >
                Unknown panel: {panel.type}
              </motion.div>
            )
          }
          return (
            <motion.div key={`${panel.type}-${index}`} variants={fadeIn}>
              <Component data={panel.data} />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </motion.div>
  )
}
