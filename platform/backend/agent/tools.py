"""Agent tools — reuse existing SQLAlchemy queries to power the voice guide."""

from __future__ import annotations

from uuid import UUID

from ag_ui.core import EventType, StateSnapshotEvent
from pydantic_ai import RunContext, ToolReturn
from pydantic_ai.ui import StateDeps
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from db import World, Dweller, Story
from .state import VoiceAgentState, UIPanel


async def _get_db() -> AsyncSession:
    """Get a fresh async database session."""
    from db import SessionLocal

    return SessionLocal()


def _world_to_dict(w: World) -> dict:
    return {
        "id": str(w.id),
        "name": w.name,
        "premise": w.premise,
        "canon_summary": w.canon_summary or w.premise,
        "year_setting": w.year_setting,
        "causal_chain": w.causal_chain,
        "scientific_basis": w.scientific_basis,
        "regions": w.regions,
        "created_at": w.created_at.isoformat(),
        "dweller_count": w.dweller_count,
        "follower_count": w.follower_count,
        "comment_count": w.comment_count,
        "reaction_counts": w.reaction_counts or {},
    }


def _emit_state(state: VoiceAgentState) -> list[StateSnapshotEvent]:
    """Create a state snapshot event for the frontend."""
    return [
        StateSnapshotEvent(
            type=EventType.STATE_SNAPSHOT,
            snapshot=state.model_dump(),
        )
    ]


async def search_worlds(
    ctx: RunContext[StateDeps[VoiceAgentState]],
    query: str,
    limit: int = 6,
) -> ToolReturn:
    """Search for sci-fi worlds by keyword. Returns a list of matching worlds.

    Use this when the user asks to browse, discover, or find worlds.
    """
    db = await _get_db()
    try:
        # Text search on name and premise
        search_filter = func.lower(World.name).contains(query.lower()) | func.lower(
            World.premise
        ).contains(query.lower())

        stmt = (
            select(World)
            .where(World.is_active == True, search_filter)  # noqa: E712
            .order_by(World.follower_count.desc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        worlds = result.scalars().all()

        if not worlds:
            # Fallback: return most popular worlds
            stmt = (
                select(World)
                .where(World.is_active == True)  # noqa: E712
                .order_by(World.follower_count.desc())
                .limit(limit)
            )
            result = await db.execute(stmt)
            worlds = result.scalars().all()

        world_dicts = [_world_to_dict(w) for w in worlds]

        # Update state with world list panel
        state = ctx.deps.state
        state.panels = [UIPanel(type="world_list", data={"worlds": world_dicts})]
        state.breadcrumbs = ["Worlds"]
        state.current_world_id = None
        state.current_world_name = None

        return ToolReturn(
            return_value=f"Found {len(world_dicts)} worlds matching '{query}'.",
            metadata=_emit_state(state),
        )
    finally:
        await db.close()


async def get_world_detail(
    ctx: RunContext[StateDeps[VoiceAgentState]],
    world_id: str,
) -> ToolReturn:
    """Get detailed information about a specific world including its causal chain.

    Use this when the user asks about a specific world or wants to explore one in depth.
    """
    db = await _get_db()
    try:
        stmt = select(World).where(World.id == UUID(world_id))
        result = await db.execute(stmt)
        world = result.scalar_one_or_none()

        if not world:
            return ToolReturn(
                return_value=f"World with ID {world_id} not found. Try searching for worlds instead.",
                metadata=[],
            )

        world_dict = _world_to_dict(world)

        # Also fetch dweller count and recent stories
        dweller_stmt = (
            select(Dweller)
            .where(Dweller.world_id == world.id, Dweller.is_active == True)  # noqa: E712
            .limit(5)
        )
        dweller_result = await db.execute(dweller_stmt)
        dwellers = dweller_result.scalars().all()
        dweller_dicts = [
            {
                "id": str(d.id),
                "name": d.persona.get("name", "Unknown") if d.persona else "Unknown",
                "role": d.persona.get("role", "") if d.persona else "",
                "is_active": d.is_active,
            }
            for d in dwellers
        ]

        story_stmt = (
            select(Story)
            .where(Story.world_id == world.id)
            .order_by(Story.created_at.desc())
            .limit(3)
        )
        story_result = await db.execute(story_stmt)
        stories = story_result.scalars().all()
        story_dicts = [
            {
                "id": str(s.id),
                "title": s.title,
                "summary": s.summary,
                "status": s.status.name if s.status else "published",
                "reaction_count": s.reaction_count,
            }
            for s in stories
        ]

        # Update state
        state = ctx.deps.state
        state.panels = [
            UIPanel(type="world_card", data={**world_dict, "dwellers": dweller_dicts, "stories": story_dicts}),
        ]
        if world.causal_chain:
            state.panels.append(UIPanel(type="causal_chain", data={"events": world.causal_chain}))

        state.current_world_id = str(world.id)
        state.current_world_name = world.name
        state.breadcrumbs = ["Worlds", world.name]

        return ToolReturn(
            return_value=(
                f"World: {world.name} (set in {world.year_setting}). "
                f"{world.dweller_count} dwellers, {len(stories)} recent stories. "
                f"Premise: {world.premise[:200]}"
            ),
            metadata=_emit_state(state),
        )
    finally:
        await db.close()


async def list_worlds(
    ctx: RunContext[StateDeps[VoiceAgentState]],
    sort: str = "popular",
    limit: int = 8,
) -> ToolReturn:
    """List worlds sorted by popularity, recency, or activity.

    Use this when the user asks to see all worlds or browse what's available.
    sort can be: 'popular', 'recent', or 'active'.
    """
    db = await _get_db()
    try:
        stmt = select(World).where(World.is_active == True)  # noqa: E712

        if sort == "popular":
            stmt = stmt.order_by(World.follower_count.desc())
        elif sort == "active":
            stmt = stmt.order_by(World.updated_at.desc())
        else:
            stmt = stmt.order_by(World.created_at.desc())

        stmt = stmt.limit(limit)
        result = await db.execute(stmt)
        worlds = result.scalars().all()

        world_dicts = [_world_to_dict(w) for w in worlds]

        state = ctx.deps.state
        state.panels = [UIPanel(type="world_list", data={"worlds": world_dicts})]
        state.breadcrumbs = ["Worlds"]
        state.current_world_id = None
        state.current_world_name = None

        return ToolReturn(
            return_value=f"Found {len(world_dicts)} worlds sorted by {sort}.",
            metadata=_emit_state(state),
        )
    finally:
        await db.close()
