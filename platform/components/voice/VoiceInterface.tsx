'use client'

import { useState, useCallback, useEffect, useRef, type FormEvent } from 'react'
import { useVoiceAgent } from '@/hooks/useVoiceAgent'
import { useMediaRecorder } from '@/hooks/useMediaRecorder'
import { useTTS } from '@/hooks/useTTS'
import { GenerativeUI } from './GenerativeUI'
import { ResponsePanel } from './ResponsePanel'
import { VoiceStatus } from './VoiceStatus'
import { PushToTalk } from './PushToTalk'

type PTTStatus = 'idle' | 'recording' | 'processing' | 'speaking'

export function VoiceInterface() {
  const {
    state,
    responseText,
    isStreaming,
    isToolRunning,
    error: agentError,
    sendMessage,
    reset,
  } = useVoiceAgent()

  const { isSpeaking, speak, stop: stopTTS, error: ttsError } = useTTS()

  const [pttStatus, setPttStatus] = useState<PTTStatus>('idle')
  const [showTextInput, setShowTextInput] = useState(false)
  const [input, setInput] = useState('')
  const prevStreamingRef = useRef(false)

  // Auto-speak when agent finishes streaming response
  useEffect(() => {
    const wasStreaming = prevStreamingRef.current
    prevStreamingRef.current = isStreaming

    // Transition from streaming → not streaming means response is complete
    if (wasStreaming && !isStreaming && responseText.trim()) {
      speak(responseText.trim())
    }
  }, [isStreaming, responseText, speak])

  const handleRecordingComplete = useCallback(
    async (blob: Blob) => {
      setPttStatus('processing')
      try {
        const res = await fetch('/api/voice/transcribe', {
          method: 'POST',
          body: blob,
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Transcription failed')
        }
        const { transcript } = await res.json()
        if (transcript && transcript.trim()) {
          sendMessage(transcript.trim())
        }
      } catch {
        // Transcription failed — fall back gracefully
      } finally {
        setPttStatus('idle')
      }
    },
    [sendMessage]
  )

  const {
    isRecording,
    startRecording,
    stopRecording,
    analyserNode,
    error: micError,
  } = useMediaRecorder(handleRecordingComplete)

  const handleStartRecording = useCallback(() => {
    // Interrupt TTS if agent is speaking
    if (isSpeaking) {
      stopTTS()
    }
    setPttStatus('recording')
    startRecording()
  }, [startRecording, isSpeaking, stopTTS])

  const handleStopRecording = useCallback(() => {
    stopRecording()
  }, [stopRecording])

  // Derive the effective PTT status
  const effectiveStatus: PTTStatus = isRecording
    ? 'recording'
    : pttStatus === 'processing'
      ? 'processing'
      : isSpeaking
        ? 'speaking'
        : isStreaming
          ? 'processing'
          : 'idle'

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      const text = input.trim()
      if (!text || isStreaming) return
      setInput('')
      if (isSpeaking) stopTTS()
      sendMessage(text)
    },
    [input, isStreaming, sendMessage, isSpeaking, stopTTS]
  )

  const combinedError = agentError || micError || ttsError

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
          {isSpeaking && (
            <button
              onClick={stopTTS}
              className="text-[10px] text-[var(--neon-purple)] hover:text-[var(--neon-purple-bright)] transition-colors px-2 py-1 border border-[var(--neon-purple)]/20"
            >
              Stop
            </button>
          )}
          <button
            onClick={() => setShowTextInput(!showTextInput)}
            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-tertiary)] transition-colors px-2 py-1 border border-white/6"
            title="Toggle text input"
          >
            {showTextInput ? 'Voice' : 'Text'}
          </button>
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
        error={combinedError}
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

      {/* Input area — push-to-talk or text fallback */}
      <div className="border-t border-white/8 bg-[var(--bg-primary)]">
        {showTextInput ? (
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-3 px-6 py-4"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
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
        ) : (
          <PushToTalk
            status={effectiveStatus}
            analyserNode={analyserNode}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            disabled={isStreaming}
          />
        )}
      </div>
    </div>
  )
}
