# Design: Level 20 Final Boss Encounter & Endless Mode Protocol

## Context

ChronoShot's combat architecture is built on deterministic 60 Hz physics quanta (`FixedStepSimulator`), time dilation proportional to player movement (`TimeGovernor`), continuous collision detection ballistics, and declarative modular state machines (`BossBlueprint`, `BossPhaseController`). The current campaign finishes at Room 19 without a climactic Sector 4 boss, and endless mode operates as room-to-room procedural template stitching.

This design introduces a modular 4-phase final boss (`CHRONO-ZENITH: ZERO SOVEREIGN`), a cover-based Cataclysm Overload mechanic, a seamless portal transition granting all 7 upgrades and full shield replenishment, and a decoupled `EndlessDirector` driving in-arena dynamic wave survival with distance-guaranteed safe spawning.

See `proposal.md` for motivation and `specs/` for behavioral requirements.

## Goals / Non-Goals

**Goals:**
- **Modular Boss State Machine**: Introduce `CHRONO-ZENITH` using the declarative `BossBlueprint` system without hardcoding boss logic in the simulation loop.
- **Fair, Telegraphed AOE (Cataclysm Pulse)**: Implement an overload channel state ($75\text{ ticks}$) with temporary bullet invulnerability and raycast line-of-sight obstacle occlusion, rewarding players who seek cover or time shots post-detonation.
- **Dedicated Tactical Arena Templates**:
  - `ApexRedoubtTemplate` for Room 20: ensures cover is always within $\le 140\text{px}$ from any engagement spot.
  - `ApexColosseumTemplate` for Endless Mode: provides high-mobility kiting corridors and central defensive bastions suited for a fully upgraded player.
- **Decoupled Endless Director**: Encapsulate threat budget scaling, wave replenishment, safe spatial candidate sampling ($\ge 350\text{px}$ from player), and 30-tick materialization telegraphs in a clean, isolated `EndlessDirector`.
- **Seamless Option A Transition**: Slaying Room 20 and entering the portal immediately injects all 7 upgrades, restores shields to max, and boots Endless Mode without interrupting the run.

**Non-Goals:**
- External audio assets (all audio remains synthesized procedurally via `SoundSynthesizer`).
- Online global leaderboards (survival telemetry is rendered locally in-canvas).
- Destructible cover obstacles (obstacles remain deterministic static geometry).

## Decisions

### 1. Boss Overload Channel & Invulnerability Model
- **Decision**: Add an `overloadChannelTicks` configuration to `BossPhaseConfig` and track `overloadTicksRemaining` in `Enemy`. While `overloadTicksRemaining > 0`, the boss is anchored (`speed = 0`), `isInvulnerable = true`, and renders an expanding hazard warning ring.
- **Why**: Keeps the mechanic declarative and data-driven. When `takeDamage` is called on the boss during this window, it returns a deflected result without damaging shields.
- **Alternative Considered**: Triggering an instant shockwave on shield break. Rejected because instant shockwaves in a 1-hit lethality game are unfair and disorienting.
- **Alternative Considered**: Freezing all simulation during the charge. Rejected because the player needs simulation ticks (driven by their own movement) to run behind cover.

### 2. Line-of-Sight Occlusion Ballistics
- **Decision**: When the channel expires, cast raycast line segments from the boss center to the player's circle hitbox against all `Obstacle` AABBs.
- **Why**: Reuses the deterministic `testSegmentAABB` math already proven in projectile Continuous Collision Detection. If an obstacle intersects the segment, the obstacle absorbs the energy pulse with visual deflection sparks and the player takes zero damage.
- **Alternative Considered**: Distance-based falloff. Rejected because distance falloff does not reward tactical cover positioning.

### 3. Decoupled `EndlessDirector` Module
- **Decision**: Create `src/levels/EndlessDirector.ts` separate from `LevelDirector` and `EncounterDirector`.
- **Why**: `LevelDirector` handles macro room generation (generating static `RoomConfig`s). An ongoing survival arena requires stateful simulation tracking: active threat budget, elapsed active ticks, kill tracking, and materialization queues. Isolating this in `EndlessDirector` preserves the single-responsibility principle.
- **Alternative Considered**: Embedding continuous wave spawning directly inside `Arena.ts`. Rejected to prevent bloating `Arena.ts` and to keep survival simulation unit-testable in isolation.

### 4. Fair Dynamic Spawner with 30-Tick Materialization Telegraph
- **Decision**: Reinforcement candidates must satisfy three strict filters:
  1. Euclidean distance to player $\ge 350\text{px}$.
  2. Euclidean distance to other active units $\ge 48\text{px}$.
  3. Non-overlapping with obstacle bounds (`!testCircleAABB`).
  Once placed, the candidate enters a 30-tick `materializing` state rendered as an energized cyan/crimson warping reticle before becoming an active combatant.
- **Why**: Completely eliminates RNG telefrags. The player has a full 30 simulation ticks (0.5s at full speed, longer during micro-creep) to see where hostiles are materializing.
- **Alternative Considered**: Spawning enemies off-screen. Rejected because the combat arena is a fixed 960x640 canvas visible in its entirety.

### 5. Transition to Endless Mode via Room 20 Golden Portal
- **Decision**: When Room 20 is cleared, the exit portal switches to radiant gold. Entering it calls `roomManager.startEndlessMode()`, which applies all 7 upgrades via `player.upgradePipeline`, restores `player.shields = player.maxShields`, resets weapon to 8 rounds, and initializes `EndlessDirector` in `ApexColosseumTemplate`.
- **Why**: Delivers a seamless flow (Option A) with immediate empowerment.

## Risks / Trade-offs

- **[Risk] Player pinned away from cover when shield breaks** → *Mitigation*: The Room 20 layout ("The Apex Redoubt") distributes cover bastions so the player is never further than 140px from safe occlusion. Overcharge Dash (480 px/s) allows covering that distance in under 20 ticks.
- **[Risk] High threat budget leading to bullet-hell performance degradation** → *Mitigation*: Hard cap of 8 concurrent active hostiles in the arena. If the budget exceeds the cost of 8 units, the spawner prioritizes higher-tier archetypes (Wardens, Marksmen) rather than flooding the arena with dozens of Grunts.
- **[Risk] Sound clutter during high-threat waves** → *Mitigation*: Audio triggers in `SoundSynthesizer` use dynamic gain damping and polyphony management.

## Migration Plan

- All existing 19 rooms remain identical. Room 20 is appended as the climactic finale.
- `RoomManager.advanceRoom()` handles Room 20 completion without breaking existing defeat/restart cycles.
- Existing tests (474 passing) continue to validate core behaviors; new unit tests will cover `ChronoZenith`, `EndlessDirector`, Cataclysm Pulse occlusion, and Endless HUD telemetry.
