/**
 * Proxy to FastAPI AG-UI endpoint.
 * Streams SSE events from the backend voice agent to the frontend.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export async function POST(request: Request) {
  const body = await request.text()

  const backendResponse = await fetch(`${BACKEND_URL}/voice/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body,
  })

  if (!backendResponse.ok) {
    return new Response(await backendResponse.text(), {
      status: backendResponse.status,
    })
  }

  // Stream SSE events through to the frontend
  return new Response(backendResponse.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
