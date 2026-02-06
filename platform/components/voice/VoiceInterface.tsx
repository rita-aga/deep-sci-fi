'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useVoiceAgent } from '@/hooks/useVoiceAgent'
import { useMediaRecorder } from '@/hooks/useMediaRecorder'
import { useTTS } from '@/hooks/useTTS'
import { GenerativeUI } from './GenerativeUI'
import { ResponsePanel } from './ResponsePanel'
import { VoiceStatus } from './VoiceStatus'
import { VoiceInputBar } from './VoiceInputBar'

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
  const [transcribeError, setTranscribeError] = useState<string | null>(null)
  const prevStreamingRef = useRef(false)
  const speakRef = useRef(speak)
  speakRef.current = speak

  // Auto-speak when agent finishes streaming
  useEffect(() => {
    const wasStreaming = prevStreamingRef.current
    prevStreamingRef.current = isStreaming

    if (wasStreaming && !isStreaming && responseText.trim()) {
      speakRef.current(responseText.trim())
    }
  }, [isStreaming, responseText])

  const handleRecordingComplete = useCallback(
    async (blob: Blob) => {
      setPttStatus('processing')
      setTranscribeError(null)
      try {
        const res = await fetch('/api/voice/transcribe', {
          method: 'POST',
          body: blob,
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(data?.error || 'Transcription failed')
        }
        if (data?.transcript?.trim()) {
          sendMessage(data.transcript.trim())
        }
      } catch (err) {
        setTranscribeError((err as Error).message || 'Transcription failed')
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
    if (isSpeaking) stopTTS()
    setPttStatus('recording')
    startRecording()
  }, [startRecording, isSpeaking, stopTTS])

  const handleStopRecording = useCallback(() => {
    stopRecording()
  }, [stopRecording])

  const handleSendMessage = useCallback(
    (text: string) => {
      if (isSpeaking) stopTTS()
      sendMessage(text)
    },
    [sendMessage, isSpeaking, stopTTS]
  )

  // Derive effective status
  const effectiveStatus: PTTStatus = isRecording
    ? 'recording'
    : pttStatus === 'processing'
      ? 'processing'
      : isSpeaking
        ? 'speaking'
        : isStreaming
          ? 'processing'
          : 'idle'

  const combinedError = agentError || micError || ttsError || transcribeError

  return (
    <div className="flex flex-col h-full">
      {/* ── Top bar ── */}
      <header className="glass flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-display text-sm text-neon-cyan tracking-widest text-glow">
            DSF
          </span>
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.12em]">
            Voice Guide
          </span>
        </div>
        <div className="flex items-center gap-2">
          {state.status === 'thinking' && (
            <span className="text-[10px] text-neon-purple uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1 h-1 bg-neon-purple animate-pulse" />
              Thinking
            </span>
          )}
          {isSpeaking && (
            <button
              onClick={stopTTS}
              className="text-[10px] text-neon-purple hover:text-neon-purple-bright transition-all px-2 py-1 border border-neon-purple/20 hover:border-neon-purple/40 hover:shadow-neon-purple"
            >
              Stop
            </button>
          )}
          <a
            href="/"
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all px-2 py-1 border border-white/8 hover:border-white/15"
          >
            Exit
          </a>
        </div>
      </header>

      {/* ── Breadcrumbs / errors ── */}
      <VoiceStatus
        error={combinedError}
        breadcrumbs={state.breadcrumbs}
        onDismissError={reset}
      />

      {/* ── Main content — panels ── */}
      <div className="flex-1 min-h-0 overflow-auto">
        <GenerativeUI panels={state.panels} onSuggestion={handleSendMessage} />
      </div>

      {/* ── Agent response ── */}
      <ResponsePanel
        text={responseText}
        isStreaming={isStreaming}
        isToolRunning={isToolRunning}
      />

      {/* ── Unified input bar ── */}
      <div className="glass border-t border-white/8 safe-bottom shrink-0">
        <VoiceInputBar
          status={effectiveStatus}
          analyserNode={analyserNode}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  )
}
