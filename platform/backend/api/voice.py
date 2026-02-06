"""Voice agent API — AG-UI protocol endpoint for the voice guide."""

import logging

from fastapi import APIRouter, HTTPException, Request
from starlette.responses import Response

from pydantic_ai.ui import StateDeps
from pydantic_ai.ui.ag_ui import AGUIAdapter

from agent import get_guide_agent
from agent.state import VoiceAgentState
from utils.errors import agent_error
from utils.rate_limit import limiter_auth

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/chat")
@limiter_auth.limit("20/minute")
async def voice_chat(request: Request) -> Response:
    """AG-UI streaming endpoint for the voice guide agent.

    Accepts AG-UI RunAgentInput and returns an SSE stream of AG-UI events
    including text messages, tool calls, and state snapshots.
    """
    try:
        return await AGUIAdapter.dispatch_request(
            request,
            agent=get_guide_agent(),
            deps=StateDeps(VoiceAgentState()),
        )
    except Exception as e:
        logger.exception("Voice agent failed")
        raise HTTPException(
            status_code=500,
            detail=agent_error(
                error="Voice agent failed",
                how_to_fix="Check server logs. Common causes: ANTHROPIC_API_KEY not set, database unreachable.",
                details=str(e),
            ),
        )
