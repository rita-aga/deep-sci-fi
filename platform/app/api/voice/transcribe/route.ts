import { NextResponse } from 'next/server'

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY

export async function POST(request: Request) {
  if (!DEEPGRAM_API_KEY) {
    return NextResponse.json(
      { error: 'DEEPGRAM_API_KEY not configured' },
      { status: 503 }
    )
  }

  const audioBlob = await request.blob()
  if (audioBlob.size === 0) {
    return NextResponse.json(
      { error: 'Empty audio data' },
      { status: 400 }
    )
  }

  const dgResponse = await fetch(
    'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en',
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': audioBlob.type || 'audio/webm',
      },
      body: audioBlob,
    }
  )

  if (!dgResponse.ok) {
    const err = await dgResponse.text()
    console.error('[transcribe] Deepgram error:', dgResponse.status, err)
    return NextResponse.json(
      { error: 'Transcription failed', details: err },
      { status: dgResponse.status }
    )
  }

  const data = await dgResponse.json()
  const transcript =
    data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''

  return NextResponse.json({ transcript })
}
