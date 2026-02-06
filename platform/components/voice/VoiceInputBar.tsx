'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { AudioVisualizer } from './AudioVisualizer'

type InputStatus = 'idle' | 'recording' | 'processing' | 'speaking'

interface VoiceInputBarProps {
  status: InputStatus
  analyserNode: AnalyserNode | null
  onStartRecording: () => void
  onStopRecording: () => void
  onSendMessage: (text: string) => void
  disabled?: boolean
}

export function VoiceInputBar({
  status,
  analyserNode,
  onStartRecording,
  onStopRecording,
  onSendMessage,
  disabled = false,
}: VoiceInputBarProps) {
  const [input, setInput] = useState('')
  const isHoldingRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const canInteract = (status === 'idle' || status === 'speaking') && !disabled
  const isRecording = status === 'recording'
  const hasText = input.trim().length > 0

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      const text = input.trim()
      if (!text) return
      if (status !== 'idle' && status !== 'speaking') return
      setInput('')
      onSendMessage(text)
    },
    [input, status, onSendMessage]
  )

  const handleMicDown = useCallback(() => {
    if (isRecording || status === 'processing') return
    if (!canInteract) return
    isHoldingRef.current = true
    onStartRecording()
  }, [canInteract, isRecording, status, onStartRecording])

  const handleMicUp = useCallback(() => {
    if (!isHoldingRef.current) return
    isHoldingRef.current = false
    onStopRecording()
  }, [onStopRecording])

  // Space bar shortcut (when not focused on text input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code !== 'Space' ||
        e.repeat ||
        !canInteract ||
        (e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA' ||
        (e.target as HTMLElement).isContentEditable
      )
        return
      e.preventDefault()
      isHoldingRef.current = true
      onStartRecording()
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || !isHoldingRef.current) return
      e.preventDefault()
      isHoldingRef.current = false
      onStopRecording()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [canInteract, onStartRecording, onStopRecording])

  // Safety: release on global pointer up / cancel
  useEffect(() => {
    const handlePointerCancel = () => {
      if (isHoldingRef.current) {
        isHoldingRef.current = false
        onStopRecording()
      }
    }
    window.addEventListener('pointerup', handlePointerCancel)
    window.addEventListener('pointercancel', handlePointerCancel)
    return () => {
      window.removeEventListener('pointerup', handlePointerCancel)
      window.removeEventListener('pointercancel', handlePointerCancel)
    }
  }, [onStopRecording])

  return (
    <div className="px-4 sm:px-6 py-3">
      {isRecording ? (
        /* ── Recording state ── */
        <div className="flex items-center gap-3">
          <div className="flex-1 glass-cyan px-4 py-2 min-h-[48px] flex items-center">
            <AudioVisualizer
              analyser={analyserNode}
              isActive
              color="var(--neon-cyan)"
              height={32}
            />
          </div>

          <button
            onPointerUp={handleMicUp}
            onContextMenu={(e) => e.preventDefault()}
            className="shrink-0 w-12 h-12 flex items-center justify-center border border-neon-cyan bg-neon-cyan/15 shadow-neon-cyan transition-all select-none touch-none"
            style={{ WebkitTouchCallout: 'none' }}
          >
            <span className="w-3 h-3 bg-neon-cyan animate-pulse" />
          </button>
        </div>
      ) : (
        /* ── Text input + mic ── */
        <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              status === 'processing'
                ? 'Processing...'
                : status === 'speaking'
                  ? 'Type to interrupt...'
                  : 'Ask about worlds...'
            }
            disabled={status === 'processing' || disabled}
            className="flex-1 bg-[var(--bg-tertiary)] border border-white/10 px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--neon-cyan)]/40 focus:shadow-[0_0_8px_var(--shadow-cyan-soft)] transition-all disabled:opacity-40 min-h-[48px]"
          />

          {/* Mic button */}
          <button
            type="button"
            onPointerDown={handleMicDown}
            onPointerUp={handleMicUp}
            onContextMenu={(e) => e.preventDefault()}
            disabled={!canInteract}
            className={`shrink-0 w-12 h-12 flex items-center justify-center border transition-all select-none touch-none ${
              canInteract
                ? 'border-neon-cyan/40 hover:border-neon-cyan hover:shadow-neon-cyan bg-neon-cyan/5 hover:bg-neon-cyan/10'
                : status === 'processing'
                  ? 'border-neon-purple/30 bg-neon-purple/5'
                  : 'border-white/10 bg-white/5 opacity-30'
            } disabled:cursor-not-allowed`}
            style={{ WebkitTouchCallout: 'none' }}
          >
            {status === 'processing' ? (
              <span className="w-4 h-4 border border-neon-purple border-t-transparent animate-spin" />
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={canInteract ? 'var(--neon-cyan)' : 'var(--text-muted)'}
                strokeWidth="2"
                strokeLinecap="square"
              >
                <rect x="9" y="1" width="6" height="14" rx="0" />
                <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>

          {/* Send button — appears when there's text */}
          {hasText && status !== 'processing' && (
            <button
              type="submit"
              className="shrink-0 w-12 h-12 flex items-center justify-center border border-neon-cyan/40 bg-neon-cyan/10 hover:bg-neon-cyan/20 hover:border-neon-cyan hover:shadow-neon-cyan transition-all"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--neon-cyan)"
                strokeWidth="2"
                strokeLinecap="square"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          )}
        </form>
      )}

      {/* Hint text */}
      <div className="mt-2 h-4 flex items-center justify-center">
        {isRecording ? (
          <span className="text-[10px] text-neon-cyan/60 tracking-wider uppercase">
            Release to send
          </span>
        ) : (
          status === 'idle' &&
          !hasText && (
            <span className="hidden sm:inline text-[10px] text-[var(--text-muted)]/40 tracking-wider">
              Hold{' '}
              <kbd className="px-1 py-0.5 border border-white/8 text-[var(--text-tertiary)]/60 mx-0.5">
                Space
              </kbd>{' '}
              to record
            </span>
          )
        )}
      </div>
    </div>
  )
}
