"""Voice agent state model — synced to frontend via AG-UI state snapshots."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class UIPanel(BaseModel):
    """A generative UI panel rendered by the frontend."""

    type: Literal[
        "world_card",
        "world_list",
        "story_preview",
        "story_full",
        "dweller_card",
        "dweller_list",
        "causal_chain",
        "activity_feed",
        "search_results",
        "empty",
    ]
    data: dict


class VoiceAgentState(BaseModel):
    """State shared between agent and frontend via AG-UI protocol."""

    response_text: str = ""
    panels: list[UIPanel] = []
    current_world_id: str | None = None
    current_world_name: str | None = None
    status: Literal["idle", "thinking", "speaking"] = "idle"
    breadcrumbs: list[str] = []
