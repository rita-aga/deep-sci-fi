'use client'

interface ResponsePanelProps {
  text: string
  isStreaming: boolean
  isToolRunning: boolean
}

export function ResponsePanel({ text, isStreaming, isToolRunning }: ResponsePanelProps) {
  const hasContent = !!(text || isToolRunning)

  if (!hasContent) return null

  return (
    <div className="border-t border-white/6 glass-light px-4 sm:px-6 py-3 max-h-[200px] overflow-y-auto shrink-0">
      {isToolRunning && !text ? (
        <div className="flex items-center gap-2 text-xs text-neon-purple">
          <span className="inline-block w-1.5 h-1.5 bg-neon-purple animate-pulse" />
          Searching...
        </div>
      ) : (
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {text}
          {isStreaming && (
            <span className="inline-block w-[2px] h-[14px] bg-neon-cyan ml-0.5 animate-pulse align-middle" />
          )}
        </p>
      )}
    </div>
  )
}
