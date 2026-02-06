'use client'

interface StoryFullData {
  title: string
  content: string
  summary: string
  status: string
  perspective: string
  reaction_count: number
  comment_count: number
  time_period_start: string | null
  time_period_end: string | null
}

export function VoiceStoryFull({ data }: { data: StoryFullData }) {
  return (
    <div className="border border-white/6 bg-[var(--bg-secondary)]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-base font-medium text-[var(--text-primary)]">
            {data.title}
          </h3>
          <span className="text-[10px] text-[var(--neon-purple)] uppercase tracking-wider shrink-0">
            {data.perspective.replace(/_/g, ' ')}
          </span>
        </div>
        {(data.time_period_start || data.time_period_end) && (
          <div className="text-[10px] text-[var(--text-muted)] tracking-wider">
            {data.time_period_start}
            {data.time_period_end && ` — ${data.time_period_end}`}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        <div className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
          {data.content}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/6 flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
        {data.reaction_count > 0 && (
          <span>{data.reaction_count} reactions</span>
        )}
        {data.comment_count > 0 && (
          <span>{data.comment_count} comments</span>
        )}
        <span>{data.status}</span>
      </div>
    </div>
  )
}
