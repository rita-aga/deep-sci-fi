'use client'

import { useState, useCallback, useRef } from 'react'

/** AG-UI event types we care about */
type AGUIEventType =
  | 'RUN_STARTED'
  | 'RUN_FINISHED'
  | 'TEXT_MESSAGE_START'
  | 'TEXT_MESSAGE_CONTENT'
  | 'TEXT_MESSAGE_END'
  | 'TOOL_CALL_START'
  | 'TOOL_CALL_END'
  | 'STATE_SNAPSHOT'
  | 'STATE_DELTA'
  | 'RUN_ERROR'

interface AGUIEvent {
  type: AGUIEventType
  [key: string]: unknown
}

export interface UIPanel {
  type: string
  data: Record<string, unknown>
}

export interface VoiceAgentState {
  response_text: string
  panels: UIPanel[]
  current_world_id: string | null
  current_world_name: string | null
  status: 'idle' | 'thinking' | 'speaking'
  breadcrumbs: string[]
}

const INITIAL_STATE: VoiceAgentState = {
  response_text: '',
  panels: [],
  current_world_id: null,
  current_world_name: null,
  status: 'idle',
  breadcrumbs: [],
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function useVoiceAgent() {
  const [state, setState] = useState<VoiceAgentState>(INITIAL_STATE)
  const [responseText, setResponseText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isToolRunning, setIsToolRunning] = useState(false)
  const messagesRef = useRef<Message[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (text: string) => {
    // Abort any existing stream
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsStreaming(true)
    setResponseText('')
    setError(null)
    setState((prev: VoiceAgentState) => ({ ...prev, status: 'thinking' as const }))

    // Add user message to history
    messagesRef.current = [
      ...messagesRef.current,
      { role: 'user', content: text },
    ]

    try {
      const response = await fetch('/api/voice/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesRef.current.map((m: Message) => ({
            id: crypto.randomUUID(),
            role: m.role,
            content: m.content,
          })),
          run_id: crypto.randomUUID(),
          state: state,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const err = await response.text()
        throw new Error(`Agent error: ${response.status} — ${err}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE events from buffer
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        let eventType = ''
        let eventData = ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            eventData = line.slice(6)
          } else if (line === '' && eventData) {
            // Empty line = end of event
            try {
              const event: AGUIEvent = JSON.parse(eventData)
              // Use the event type from the 'event:' field if present, otherwise from data
              const type = eventType || event.type

              switch (type) {
                case 'TEXT_MESSAGE_CONTENT': {
                  const delta = (event.delta as string) || ''
                  accumulatedText += delta
                  setResponseText(accumulatedText)
                  break
                }
                case 'STATE_SNAPSHOT': {
                  const snapshot = event.snapshot as VoiceAgentState
                  if (snapshot) {
                    setState(snapshot)
                  }
                  break
                }
                case 'STATE_DELTA': {
                  // JSON patch deltas not yet implemented — log so we notice if triggered
                  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
                    console.warn('[useVoiceAgent] STATE_DELTA received but not implemented — state may be stale')
                  }
                  break
                }
                case 'TOOL_CALL_START': {
                  setIsToolRunning(true)
                  break
                }
                case 'TOOL_CALL_END': {
                  setIsToolRunning(false)
                  break
                }
                case 'RUN_FINISHED': {
                  setState((prev: VoiceAgentState) => ({ ...prev, status: 'idle' as const }))
                  break
                }
                case 'RUN_ERROR': {
                  setError((event.message as string) || 'Agent error')
                  setState((prev: VoiceAgentState) => ({ ...prev, status: 'idle' as const }))
                  break
                }
              }
            } catch {
              // Skip malformed JSON lines
            }
            eventType = ''
            eventData = ''
          }
        }
      }

      // Store assistant response in history
      if (accumulatedText) {
        messagesRef.current = [
          ...messagesRef.current,
          { role: 'assistant', content: accumulatedText },
        ]
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message)
        setState((prev: VoiceAgentState) => ({ ...prev, status: 'idle' as const }))
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [state])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setState(INITIAL_STATE)
    setResponseText('')
    setError(null)
    setIsStreaming(false)
    setIsToolRunning(false)
    messagesRef.current = []
  }, [])

  return {
    state,
    responseText,
    isStreaming,
    isToolRunning,
    error,
    sendMessage,
    reset,
  }
}
