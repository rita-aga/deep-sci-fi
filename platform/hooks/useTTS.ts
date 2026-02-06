'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface UseTTSReturn {
  isSpeaking: boolean
  speak: (text: string) => Promise<void>
  stop: () => void
  error: string | null
}

export function useTTS(): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const urlRef = useRef<string | null>(null)

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
    setIsSpeaking(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
      }
    }
  }, [])

  const speak = useCallback(
    async (text: string) => {
      // Stop any current playback
      stop()
      setError(null)

      if (!text.trim()) return

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch('/api/voice/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'TTS failed' }))
          throw new Error(err.error || `TTS error: ${res.status}`)
        }

        const blob = await res.blob()
        if (controller.signal.aborted) return

        const url = URL.createObjectURL(blob)
        urlRef.current = url
        const audio = new Audio(url)
        audioRef.current = audio

        setIsSpeaking(true)

        audio.onended = () => {
          if (urlRef.current) {
            URL.revokeObjectURL(urlRef.current)
            urlRef.current = null
          }
          audioRef.current = null
          setIsSpeaking(false)
        }

        audio.onerror = () => {
          if (urlRef.current) {
            URL.revokeObjectURL(urlRef.current)
            urlRef.current = null
          }
          audioRef.current = null
          setIsSpeaking(false)
          setError('Audio playback failed')
        }

        await audio.play()
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError((err as Error).message)
          setIsSpeaking(false)
        }
      }
    },
    [stop]
  )

  return { isSpeaking, speak, stop, error }
}
