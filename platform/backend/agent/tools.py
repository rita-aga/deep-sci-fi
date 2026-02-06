"""Agent tools — reuse existing SQLAlchemy queries to power the voice guide."""

from __future__ import annotations

from uuid import UUID

from ag_ui.core import EventType, StateSnapshotEvent
from pydantic_ai import RunContext, ToolReturn
from pydantic_ai.ui import StateDeps
from sqlalchemy import select, func

from db import World, Dweller, DwellerAction, Story, SessionLocal
from .state import VoiceAgentState, UIPanel


def _world_to_dict(w: World) -> dict:
    return {
        "id": str(w.id),
        "name": w.name,
        "premise": w.premise,
        "canon_summary": w.canon_summary if w.canon_summary else w.premise,
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


def _dweller_to_dict(d: Dweller) -> dict:
    return {
        "id": str(d.id),
        "name": d.name,
        "role": d.role,
        "age": d.age,
        "origin_region": d.origin_region,
        "personality": d.personality[:200] if d.personality else "",
        "background": d.background[:300] if d.background else "",
        "is_active": d.is_active,
        "is_available": d.is_available,
        "inhabited": d.inhabited_by is not None,
    }


def _dweller_summary(d: Dweller) -> dict:
    return {
        "id": str(d.id),
        "name": d.name,
        "role": d.role,
        "is_active": d.is_active,
    }


def _story_to_dict(s: Story) -> dict:
    return {
        "id": str(s.id),
        "title": s.title,
        "summary": s.summary or s.content[:200],
        "status": s.status.name if s.status else "PUBLISHED",
        "perspective": s.perspective.name if s.perspective else "FIRST_PERSON_AGENT",
        "reaction_count": s.reaction_count,
        "comment_count": s.comment_count,
        "created_at": s.created_at.isoformat(),
    }


def _story_full_dict(s: Story) -> dict:
    base = _story_to_dict(s)
    base["content"] = s.content
    base["time_period_start"] = s.time_period_start
    base["time_period_end"] = s.time_period_end
    return base


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
    async with SessionLocal() as db:
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


async def get_world_detail(
    ctx: RunContext[StateDeps[VoiceAgentState]],
    world_id: str,
) -> ToolReturn:
    """Get detailed information about a specific world including its causal chain.

    Use this when the user asks about a specific world or wants to explore one in depth.
    """
    async with SessionLocal() as db:
        stmt = select(World).where(World.id == UUID(world_id))
        result = await db.execute(stmt)
        world = result.scalar_one_or_none()

        if not world:
            return ToolReturn(
                return_value=f"World with ID {world_id} not found. Try searching for worlds instead.",
                metadata=[],
            )

        world_dict = _world_to_dict(world)

        # Also fetch dwellers and recent stories
        dweller_stmt = (
            select(Dweller)
            .where(Dweller.world_id == world.id, Dweller.is_active == True)  # noqa: E712
            .limit(5)
        )
        dweller_result = await db.execute(dweller_stmt)
        dwellers = dweller_result.scalars().all()
        dweller_dicts = [_dweller_summary(d) for d in dwellers]

        story_stmt = (
            select(Story)
            .where(Story.world_id == world.id)
            .order_by(Story.created_at.desc())
            .limit(3)
        )
        story_result = await db.execute(story_stmt)
        stories = story_result.scalars().all()
        story_dicts = [_story_to_dict(s) for s in stories]

        causal_chain = world.causal_chain
        world_name = world.name
        world_year = world.year_setting
        world_dweller_count = world.dweller_count
        world_premise = world.premise[:200]
        world_id_str = str(world.id)

    # Update state (outside the session context)
    state = ctx.deps.state
    state.panels = [
        UIPanel(type="world_card", data={**world_dict, "dwellers": dweller_dicts, "stories": story_dicts}),
    ]
    if causal_chain:
        state.panels.append(UIPanel(type="causal_chain", data={"events": causal_chain}))

    state.current_world_id = world_id_str
    state.current_world_name = world_name
    state.breadcrumbs = ["Worlds", world_name]

    return ToolReturn(
        return_value=(
            f"World: {world_name} (set in {world_year}). "
            f"{world_dweller_count} dwellers, {len(story_dicts)} recent stories. "
            f"Premise: {world_premise}"
        ),
        metadata=_emit_state(state),
    )


async def list_worlds(
    ctx: RunContext[StateDeps[VoiceAgentState]],
    sort: str = "popular",
    limit: int = 8,
) -> ToolReturn:
    """List worlds sorted by popularity, recency, or activity.

    Use this when the user asks to see all worlds or browse what's available.
    sort can be: 'popular', 'recent', or 'active'.
    """
    async with SessionLocal() as db:
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


async def get_stories(
    ctx: RunContext[StateDeps[VoiceAgentState]],
    world_id: str,
    limit: int = 6,
) -> ToolReturn:
    """Get stories from a specific world.

    Use this when the user asks about stories in a world, or wants to see what's been written.
    """
    async with SessionLocal() as db:
        stmt = (
            select(Story)
            .where(Story.world_id == UUID(world_id))
            .order_by(Story.reaction_count.desc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        stories = result.scalars().all()
        story_dicts = [_story_to_dict(s) for s in stories]

        # Get world name for breadcrumbs
        world_stmt = select(World.name).where(World.id == UUID(world_id))
        world_result = await db.execute(world_stmt)
        world_name = world_result.scalar_one_or_none() or "Unknown World"

    state = ctx.deps.state
    state.panels = [UIPanel(type="story_list", data={"stories": story_dicts, "world_name": world_name})]
    state.breadcrumbs = ["Worlds", world_name, "Stories"]

    return ToolReturn(
        return_value=f"Found {len(story_dicts)} stories in {world_name}.",
        metadata=_emit_state(state),
    )


async def get_story_detail(
    ctx: RunContext[StateDeps[VoiceAgentState]],
    story_id: str,
) -> ToolReturn:
    """Get the full content of a specific story.

    Use this when the user wants to read or hear a particular story.
    """
    async with SessionLocal() as db:
        stmt = select(Story).where(Story.id == UUID(story_id))
        result = await db.execute(stmt)
        story = result.scalar_one_or_none()

        if not story:
            return ToolReturn(
                return_value=f"Story with ID {story_id} not found.",
                metadata=[],
            )

        story_dict = _story_full_dict(story)

        # Get world name for breadcrumbs
        world_stmt = select(World.name).where(World.id == story.world_id)
        world_result = await db.execute(world_stmt)
        world_name = world_result.scalar_one_or_none() or "Unknown World"

        story_title = story.title
        story_summary = story.summary or story.content[:200]

    state = ctx.deps.state
    state.panels = [UIPanel(type="story_full", data=story_dict)]
    state.breadcrumbs = ["Worlds", world_name, "Stories", story_title]

    return ToolReturn(
        return_value=f"Story: \"{story_title}\". {story_summary}",
        metadata=_emit_state(state),
    )


async def get_dwellers(
    ctx: RunContext[StateDeps[VoiceAgentState]],
    world_id: str,
    limit: int = 8,
) -> ToolReturn:
    """List dwellers (characters) inhabiting a specific world.

    Use this when the user asks about who lives in a world, or wants to see the characters.
    """
    async with SessionLocal() as db:
        stmt = (
            select(Dweller)
            .where(Dweller.world_id == UUID(world_id), Dweller.is_active == True)  # noqa: E712
            .order_by(Dweller.last_action_at.desc().nullslast())
            .limit(limit)
        )
        result = await db.execute(stmt)
        dwellers = result.scalars().all()
        dweller_dicts = [_dweller_to_dict(d) for d in dwellers]

        # Get world name for breadcrumbs
        world_stmt = select(World.name).where(World.id == UUID(world_id))
        world_result = await db.execute(world_stmt)
        world_name = world_result.scalar_one_or_none() or "Unknown World"

    state = ctx.deps.state
    state.panels = [UIPanel(type="dweller_list", data={"dwellers": dweller_dicts, "world_name": world_name})]
    state.breadcrumbs = ["Worlds", world_name, "Dwellers"]

    return ToolReturn(
        return_value=f"Found {len(dweller_dicts)} dwellers in {world_name}.",
        metadata=_emit_state(state),
    )


async def get_dweller_detail(
    ctx: RunContext[StateDeps[VoiceAgentState]],
    dweller_id: str,
) -> ToolReturn:
    """Get detailed information about a specific dweller (character).

    Use this when the user asks about a specific character or wants to know more about them.
    """
    async with SessionLocal() as db:
        stmt = select(Dweller).where(Dweller.id == UUID(dweller_id))
        result = await db.execute(stmt)
        dweller = result.scalar_one_or_none()

        if not dweller:
            return ToolReturn(
                return_value=f"Dweller with ID {dweller_id} not found.",
                metadata=[],
            )

        dweller_dict = _dweller_to_dict(dweller)

        # Get recent actions
        action_stmt = (
            select(DwellerAction)
            .where(DwellerAction.dweller_id == dweller.id)
            .order_by(DwellerAction.created_at.desc())
            .limit(5)
        )
        action_result = await db.execute(action_stmt)
        actions = action_result.scalars().all()
        action_dicts = [
            {
                "action_type": a.action_type,
                "content": a.content[:200] if a.content else "",
                "created_at": a.created_at.isoformat(),
            }
            for a in actions
        ]

        # Get world name
        world_stmt = select(World.name).where(World.id == dweller.world_id)
        world_result = await db.execute(world_stmt)
        world_name = world_result.scalar_one_or_none() or "Unknown World"

        dweller_name = dweller.name

    state = ctx.deps.state
    state.panels = [
        UIPanel(type="dweller_card", data={**dweller_dict, "recent_actions": action_dicts}),
    ]
    state.breadcrumbs = ["Worlds", world_name, "Dwellers", dweller_name]

    return ToolReturn(
        return_value=(
            f"Dweller: {dweller_name}, {dweller_dict['role']}. "
            f"Age {dweller_dict['age']}, from {dweller_dict['origin_region']}. "
            f"{len(action_dicts)} recent actions."
        ),
        metadata=_emit_state(state),
    )


async def get_activity(
    ctx: RunContext[StateDeps[VoiceAgentState]],
    world_id: str,
    limit: int = 10,
) -> ToolReturn:
    """Get recent activity in a world — actions taken by dwellers.

    Use this when the user asks what's happening in a world or wants to see recent events.
    """
    async with SessionLocal() as db:
        stmt = (
            select(DwellerAction)
            .join(Dweller, DwellerAction.dweller_id == Dweller.id)
            .where(Dweller.world_id == UUID(world_id))
            .order_by(DwellerAction.created_at.desc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        actions = result.scalars().all()

        activity_items = []
        for a in actions:
            activity_items.append({
                "action_type": a.action_type,
                "content": a.content[:200] if a.content else "",
                "target": a.target or "",
                "created_at": a.created_at.isoformat(),
                "dweller_id": str(a.dweller_id),
            })

        # Get world name
        world_stmt = select(World.name).where(World.id == UUID(world_id))
        world_result = await db.execute(world_stmt)
        world_name = world_result.scalar_one_or_none() or "Unknown World"

    state = ctx.deps.state
    state.panels = [UIPanel(type="activity_feed", data={"items": activity_items, "world_name": world_name})]
    state.breadcrumbs = ["Worlds", world_name, "Activity"]

    return ToolReturn(
        return_value=f"{len(activity_items)} recent activities in {world_name}.",
        metadata=_emit_state(state),
    )


async def get_platform_stats(
    ctx: RunContext[StateDeps[VoiceAgentState]],
) -> ToolReturn:
    """Get overall platform statistics — total worlds, dwellers, stories.

    Use this when the user asks about the platform's scale or overall activity.
    """
    async with SessionLocal() as db:
        world_count = (await db.execute(
            select(func.count()).select_from(World).where(World.is_active == True)  # noqa: E712
        )).scalar_one()

        dweller_count = (await db.execute(
            select(func.count()).select_from(Dweller).where(Dweller.is_active == True)  # noqa: E712
        )).scalar_one()

        story_count = (await db.execute(
            select(func.count()).select_from(Story)
        )).scalar_one()

        total_followers = (await db.execute(
            select(func.sum(World.follower_count))
        )).scalar_one() or 0

    stats = {
        "world_count": world_count,
        "dweller_count": dweller_count,
        "story_count": story_count,
        "total_followers": total_followers,
    }

    state = ctx.deps.state
    state.panels = [UIPanel(type="search_results", data={"stats": stats})]
    state.breadcrumbs = ["Platform Stats"]

    return ToolReturn(
        return_value=(
            f"Platform has {world_count} active worlds, "
            f"{dweller_count} dwellers, {story_count} stories, "
            f"and {total_followers} total followers."
        ),
        metadata=_emit_state(state),
    )
