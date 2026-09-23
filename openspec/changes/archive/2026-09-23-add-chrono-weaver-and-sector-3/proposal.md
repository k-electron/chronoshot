# Proposal: Chrono-Weaver Boss & Sector 3 Progression

## Why

With ChronoShot's core modular mechanics (the multi-phase boss engine, modular movement and attack behaviors, layout template registry, and threat-budget director) now in place, the fixed campaign terminates prematurely at Room 9 without a climactic encounter for Sector 2. Furthermore, players drafting powerful upgrade synergies after defeating Goliath-01 lack an escalated sequence of combat environments to test their compounded builds. 

Introducing Milestone Boss 2 (Chrono-Weaver: Temporal Anchor) in Room 10 creates a distinct **step function** in difficulty, requiring players to master micro-creep temporal weaving against 360-degree radial novae and evasive kiting. Following this step function, Rooms 11–14 establish a **linear progression** into Sector 3, testing the player's 2-upgrade build against escalating tactical squads and complex multi-lane geometry.

## What Changes

- **Chrono-Weaver Boss Encounter (Room 10)**:
  - Wire `CHRONO_WEAVER_BLUEPRINT` into the campaign as Milestone Boss 2 in Room 10.
  - Equip Chrono-Weaver's phase transition lifecycle hook with a composable Stalker reinforcement summon (`createMinionEscortSpawn`) and cyan shockwave (`createShockwavePulse`) upon Phase 1 shield depletion.
  - Implement a dedicated Room 10 layout ("The Chrono Chamber") with 4 tactical corner pillars for laser sightline deflection.
- **Sector 3 Tactical Progression (Rooms 11–14)**:
  - **Room 11 (Vanguard Breach)**: Entry calibration testing 2-upgrade builds against mixed vanguard forces (Warden + Shotgun Guards + Stalker) in a dual-pillar arena.
  - **Room 12 (Twin Bunker Crossfire)**: Multi-shield siege featuring dual Wardens advancing down the center flanked by dual Marksman snipers.
  - **Room 13 (Split Flank Matrix)**: High-speed corridor containment featuring dual Stalkers pincer-rushing across split horizontal lanes.
  - **Room 14 (The Crucible)**: Peak squad gauntlet combining Wardens, Snipers, Shotguns, and Stalkers in a 4-quadrant killbox layout.
- **Campaign & Director Lifecycle Updates**:
  - Extend `createStandardRoomSequence()` in `src/levels/Room.ts` from 9 to 14 rooms.
  - Update `RoomManager` victory condition and telemetry to reflect the 14-room campaign sequence and both milestone boss conquests.
  - Enhance `LevelDirector` to dynamically select milestone boss blueprints by sector (Sector 1: Goliath-01, Sector 2+: Chrono-Weaver).

## Capabilities

### Modified Capabilities

- `boss-encounters`: Define multi-phase standoff and radial nova boss combat requirements, including dynamic escort summons upon shield break transitions.
- `procedural-levels`: Expand campaign room sequence to 14 tactical protocols and support sector-indexed milestone boss injection.

## Impact

- **Entities & Bosses**: `src/entities/boss/BossBlueprint.ts` updated to configure Stalker reinforcement spawns in `CHRONO_WEAVER_BLUEPRINT`.
- **Levels & Progression**: `src/levels/Room.ts` adds `createRoom10` through `createRoom14` and expands `createStandardRoomSequence()`. `src/levels/RoomManager.ts` and `src/levels/LevelDirector.ts` updated for 14-room flow and sector boss routing.
- **HUD & UI**: Room header and victory overlay reflect expanded protocol count.
- **Tests**: Comprehensive unit test suites in `RoomManager.test.ts`, `Room.test.ts`, `BossBlueprint.test.ts`, and `LevelDirector.test.ts`.
