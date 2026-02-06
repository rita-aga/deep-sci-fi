'use client'

import { motion } from 'framer-motion'
import { fadeIn } from '@/lib/motion'

interface ResponsePanelProps {
  text: string
  isStreaming: boolean
  isToolRunning: boolean
}

export function ResponsePanel({ text, isStreaming, isToolRunning }: ResponsePanelProps) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="border-t border-white/8 bg-[var(--bg-secondary)]/80 backdrop-blur-sm px-6 py-4 min-h-[60px]"
    >
      {isToolRunning && !text && (
        <div className="flex items-center gap-2 text-xs text-[var(--neon-purple)]">
          <span className="inline-block w-1.5 h-1.5 bg-[var(--neon-purple)] animate-pulse" />
          Searching...
        </div>
      )}

      {text ? (
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {text}
          {isStreaming && (
            <span className="inline-block w-[2px] h-[14px] bg-[var(--neon-cyan)] ml-0.5 animate-pulse align-middle" />
          )}
        </p>
      ) : (
        !isToolRunning && (
          <p className="text-sm text-[var(--text-muted)] opacity-50 italic">
            The Guide awaits your query...
          </p>
        )
      )}
    </motion.div>
  )
}
