const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
// Default to "Rachel" — a clear, narrating voice. Override with ELEVENLABS_VOICE_ID.
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'

export async function POST(request: Request) {
  if (!ELEVENLABS_API_KEY) {
    return new Response(JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { text } = await request.json()
  if (!text || typeof text !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing text field' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const elResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
        },
      }),
    }
  )

  if (!elResponse.ok) {
    const err = await elResponse.text()
    console.error('[tts] ElevenLabs error:', elResponse.status, err)
    return new Response(JSON.stringify({ error: 'TTS failed', details: err }), {
      status: elResponse.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(elResponse.body, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-cache',
    },
  })
}
