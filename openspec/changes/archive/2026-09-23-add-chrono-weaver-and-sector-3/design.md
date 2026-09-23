# Design: Chrono-Weaver Encounter & Sector 3 Tactical Progression

## Context

ChronoShot features a decoupled 60 Hz simulation engine (`FixedStepSimulator`), time dilation controller (`TimeGovernor`), composable enemy behaviors (`MovementBehavior`, `AttackBehavior`), and declarative boss phase state machines (`BossPhaseController`). 

Currently, the fixed campaign terminates at Room 9 with a 1-boss victory condition (Goliath-01 at Room 5). While `CHRONO_WEAVER_BLUEPRINT` exists as a draft in `src/entities/boss/BossBlueprint.ts`, it is not yet integrated into the campaign sequence, nor are its phase transition hooks armed with escort summons. Rooms 11–14 are needed to complete Sector 3 with a coherent linear escalation.

## Goals / Non-Goals

**Goals:**
- Arm `CHRONO_WEAVER_BLUEPRINT` with a multi-action phase transition hook (`createShockwavePulse`, `createMinionEscortSpawn` for Stalkers, and `createAudioCue`).
- Construct hand-crafted configurations for Room 10 (Chrono-Weaver Milestone Boss) and Rooms 11–14 (Sector 3 linear progression) in `src/levels/Room.ts`.
- Expand `createStandardRoomSequence()` to 14 rooms.
- Update `RoomManager` to handle 14-room lifecycle, dual milestone boss checks, and updated victory telemetry.
- Update `LevelDirector` to dynamically route milestone boss blueprints by sector index (Sector 1: Goliath-01, Sector 2+: Chrono-Weaver).

**Non-Goals:**
- Introducing new enemy archetype classes (existing Grunt, Shotgun, Stalker, Warden, Marksman, and Boss are reused).
- Modifying weapon or upgrade definitions.
- Developing Sector 4 or Room 15 (Boss 3) at this stage.

## Decisions

### 1. Composable Transition Action for Chrono-Weaver
- **Choice**: Combine shockwave pulse, procedural audio cues, and escort minion spawning using `combineTransitionActions` in `CHRONO_WEAVER_BLUEPRINT.phases[0].onPhaseExit`.
- **Alternatives Considered**: Direct mutation inside `Arena.ts` or hardcoded enemy spawning.
- **Rationale**: `BossTransitionAction.ts` already provides pure functional composability (`createShockwavePulse`, `createMinionEscortSpawn`, `createAudioCue`). Keeping this declarative within `BossBlueprint` preserves clean engine separation.

### 2. Room 10 ("The Chrono Chamber") Arena Geometry
- **Choice**: Four symmetrically placed circular pillars (radius 48px at coordinates `(340, 180)`, `(340, height - 180)`, `(620, 180)`, and `(620, height - 180)`).
- **Alternatives Considered**: Rectangular bunker enclosures or an empty open arena.
- **Rationale**: Smooth circular pillars provide cover from precision telegraphed laser sightlines during Phase 1 while preventing player corner-trapping when weaving through expanding 360-degree radial novae in Phase 2.

### 3. Sector 3 Linear Difficulty Escalation (Rooms 11–14)
- **Choice**: Curated room configs following an escalating threat budget (~165 to ~210 pts) mapped to the 5 standard layout templates:
  - **Room 11 (Vanguard Breach, 165 pts)**: `CenterPillarsTemplate` geometry. 1 Warden, 2 Shotgun Guards, 1 Stalker, 2 Grunts (4 shields total).
  - **Room 12 (Twin Bunker Crossfire, 180 pts)**: `TwinBunkersTemplate` geometry. 2 Wardens, 2 Marksman Snipers, 1 Shotgun Guard, 1 Grunt (5 shields total).
  - **Room 13 (Split Flank Matrix, 195 pts)**: `SplitCorridorTemplate` geometry. 2 Stalkers, 2 Shotgun Guards, 1 Warden, 3 Grunts (4 shields total).
  - **Room 14 (The Crucible, 210 pts)**: `ArenaQuadrantTemplate` geometry. 2 Wardens, 2 Marksman Snipers, 1 Stalker, 1 Shotgun Guard, 1 Grunt (5 shields total).
- **Alternatives Considered**: Fully procedural generation for Rooms 11–14.
- **Rationale**: Hand-crafted tactical puzzle rooms establish a deliberate pedagogical difficulty curve for the core campaign, while `LevelDirector` provides procedural generation for dynamic runs.

### 4. Dynamic Milestone Boss Selection in LevelDirector
- **Choice**: In `LevelDirector.generateBossRoom(roomNumber, rng)`, resolve the boss blueprint using `sectorNumber <= 1 ? GOLIATH_01_BLUEPRINT : CHRONO_WEAVER_BLUEPRINT`.
- **Alternatives Considered**: Keeping a single static boss blueprint across all procedural milestone rooms.
- **Rationale**: Ensures procedural endless mode and sector runs naturally scale in boss variety and mechanics as room numbers climb.

## Risks / Trade-offs

- **[Risk]** Spawn position overlap during Stalker escort spawn on phase transition.
  - **Mitigation**: `resolveEscortDefinitions` offsets relative to boss position with negative X offset (toward player/center), ensuring clearance from arena boundaries.
- **[Risk]** High difficulty spike in Room 10 from simultaneous Stalker rusher and 360° nova.
  - **Mitigation**: Stalker spawns with an initial delay ticks (`initialDelayTicks: 25`) giving the player a brief window to register the transition shockwave and reposition before the Stalker engages.
- **[Risk]** Test suite regressions due to change in `createStandardRoomSequence().length` from 9 to 14.
  - **Mitigation**: Update assertions in `RoomManager.test.ts` and `Room.test.ts` to expect 14 rooms, while verifying milestone boss detection for both Room 5 and Room 10.
