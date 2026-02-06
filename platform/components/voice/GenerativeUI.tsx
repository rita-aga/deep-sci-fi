'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { fadeIn, staggerContainer } from '@/lib/motion'
import type { UIPanel } from '@/hooks/useVoiceAgent'
import { VoiceWorldCard } from './panels/VoiceWorldCard'
import { VoiceWorldList } from './panels/VoiceWorldList'
import { VoiceCausalChain } from './panels/VoiceCausalChain'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PanelComponent = React.ComponentType<{ data: any }>

/** Map panel types to components */
const PANEL_COMPONENTS: Record<string, PanelComponent> = {
  world_card: VoiceWorldCard,
  world_list: VoiceWorldList,
  causal_chain: VoiceCausalChain,
}

export function GenerativeUI({ panels }: { panels: UIPanel[] }) {
  if (panels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
        <p className="opacity-60">Ask about worlds to explore</p>
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
