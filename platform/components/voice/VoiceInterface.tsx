'use client'

import { useState, useCallback, type FormEvent } from 'react'
import { useVoiceAgent } from '@/hooks/useVoiceAgent'
import { GenerativeUI } from './GenerativeUI'
import { ResponsePanel } from './ResponsePanel'
import { VoiceStatus } from './VoiceStatus'

export function VoiceInterface() {
  const {
    state,
    responseText,
    isStreaming,
    isToolRunning,
    error,
    sendMessage,
    reset,
  } = useVoiceAgent()

  const [input, setInput] = useState('')

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      const text = input.trim()
      if (!text || isStreaming) return
      setInput('')
      sendMessage(text)
    },
    [input, isStreaming, sendMessage]
  )

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/6">
        <div className="flex items-center gap-3">
          <span className="text-[var(--neon-cyan)] text-sm font-semibold tracking-widest">
            DSF
          </span>
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
            Voice Guide
          </span>
        </div>
        <div className="flex items-center gap-3">
          {state.status === 'thinking' && (
            <span className="text-[10px] text-[var(--neon-purple)] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1 h-1 bg-[var(--neon-purple)] animate-pulse" />
              Thinking
            </span>
          )}
          <a
            href="/"
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-2 py-1 border border-white/8"
          >
            Exit
          </a>
        </div>
      </div>

      {/* Status / breadcrumbs */}
      <VoiceStatus
        error={error}
        breadcrumbs={state.breadcrumbs}
        onDismissError={reset}
      />

      {/* Generative UI panels — main area */}
      <div className="flex-1 min-h-0 overflow-auto">
        <GenerativeUI panels={state.panels} />
      </div>

      {/* Agent response text */}
      <ResponsePanel
        text={responseText}
        isStreaming={isStreaming}
        isToolRunning={isToolRunning}
      />

      {/* Text input (temporary — replaced by push-to-talk in Phase 2) */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 px-6 py-4 border-t border-white/8 bg-[var(--bg-primary)]"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about worlds..."
          disabled={isStreaming}
          className="flex-1 bg-[var(--bg-tertiary)] border border-white/10 px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--neon-cyan)]/40 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="px-5 py-2.5 text-xs uppercase tracking-wider bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/30 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isStreaming ? 'Streaming...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
