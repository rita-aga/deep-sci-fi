'use client'

import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp } from '@/lib/motion'

interface StoryData {
  id: string
  title: string
  summary: string
  status: string
  perspective: string
  reaction_count: number
  comment_count: number
  created_at: string
}

export function VoiceStoryList({
  data,
}: {
  data: { stories: StoryData[]; world_name: string }
}) {
  const { stories, world_name } = data

  if (stories.length === 0) {
    return (
      <div className="border border-white/6 p-4 text-sm text-[var(--text-muted)]">
        No stories yet in {world_name}. The narrative is waiting to be written.
      </div>
    )
  }

  return (
    <div>
      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">
        Stories from {world_name}
      </div>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        {stories.map((story) => (
          <motion.div
            key={story.id}
            variants={fadeInUp}
            className="border border-white/6 bg-[var(--bg-secondary)] p-4 hover:border-[var(--neon-purple)]/20 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h4 className="text-sm font-medium text-[var(--text-primary)]">
                {story.title}
              </h4>
              <span className="text-[10px] text-[var(--neon-purple)] uppercase tracking-wider shrink-0">
                {story.perspective.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
              {story.summary}
            </p>
            <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
              {story.reaction_count > 0 && (
                <span>{story.reaction_count} reactions</span>
              )}
              {story.comment_count > 0 && (
                <span>{story.comment_count} comments</span>
              )}
              <span>{story.status}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
