"""Voice agent API — AG-UI protocol endpoint for the voice guide."""

from fastapi import APIRouter
from starlette.requests import Request
from starlette.responses import Response

from pydantic_ai.ui import StateDeps
from pydantic_ai.ui.ag_ui import AGUIAdapter

from agent import get_guide_agent
from agent.state import VoiceAgentState

router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/chat")
async def voice_chat(request: Request) -> Response:
    """AG-UI streaming endpoint for the voice guide agent.

    Accepts AG-UI RunAgentInput and returns an SSE stream of AG-UI events
    including text messages, tool calls, and state snapshots.
    """
    return await AGUIAdapter.dispatch_request(
        request,
        agent=get_guide_agent(),
        deps=StateDeps(VoiceAgentState()),
    )
