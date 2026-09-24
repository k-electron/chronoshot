# Proposal

## Why

ChronoShot is designed around two tightly engineered game phases: a 20-room hand-built campaign culminating in the Chrono-Zenith final boss encounter, and the post-victory Endless Protocol survival mode in the Apex Colosseum. A legacy procedural mode behind a hidden `?mode=endless` URL parameter dynamically generates random rooms indefinitely via `LevelDirector` and Mulberry32 PRNG. Nobody asked for this third mode, it clutters the codebase with dead procedural layout templates and point-buy squad generation code, and it causes a broken victory moment at Room 20 (where the engine continues generating Room 21+ instead of completing the campaign and triggering the victory screen).

Removing this mode streamlines the engine into a clean, deterministic architecture: **Campaign → Victory Screen → Endless Protocol**. In place of the legacy URL parameter, a dedicated playtest bypass hook (`?skip`) will drop operatives directly onto the post-Zenith victory screen in the exact state as having beaten Room 20, enabling rapid playtesting of Endless Protocol and expedition resets without replaying the entire campaign.

## What Changes

- **Remove Procedural Generation Mode**:
  - Delete `src/levels/LevelDirector.ts` and `src/levels/LevelDirector.test.ts`.
  - Delete `src/levels/EncounterDirector.ts` and `src/levels/EncounterDirector.test.ts` after migrating necessary constants.
  - Delete the 5 unused procedural layout templates (`CenterPillarsTemplate.ts`, `TwinBunkersTemplate.ts`, `SplitCorridorTemplate.ts`, `KillboxLanesTemplate.ts`, `ArenaQuadrantTemplate.ts`) and associated registry sampling code and tests.
  - Retain `ApexRedoubtTemplate.ts` (Room 20) and `ApexColosseumTemplate.ts` (Endless Colosseum).
- **Relocate Shared Threat Constants**:
  - Move `THREAT_COSTS` and `ARCHETYPE_CONFIGS` directly into `src/levels/EndlessDirector.ts` so Endless Protocol dynamic wave spawning remains 100% functional and self-contained.
- **Simplify `RoomManager`**:
  - Remove `LevelDirector` constructor overload, property, and dynamic room-pushing branches in `advanceRoom()`, `rollbackToCheckpoint()`, and `restartGame()`.
  - Unify `isEndlessMode()` to strictly inspect `this.endlessDirector !== undefined`.
- **Implement Campaign Victory Playtest Bypass Hook (`?skip`)**:
  - Replace `?mode=endless` and `?seed` in `src/main.ts` with `urlParams.has("skip")`.
  - Add `Arena.bypassToCampaignVictory()` to initialize the game directly into the post-Zenith state:
    - Room 20 completed (`roomManager.isGameCompleted() === true`, index 19).
    - Status set to `"victory"` with active Mission Accomplished HUD overlay.
    - Pre-Zenith loadout equipped: Extended Cylinder, Speed Loader, Reactive Shield (8 ammo capacity, 1 shield).
    - Checkpoint loadout snapshots populated for Rooms 5, 10, 15, and 20.
    - Interactive choices fully operational: Card 0 ([E] / [Space] / click) transitions into Endless Protocol (7 augmentations, 3 shields, 8 rounds); Card 1 ([R] / [Shift+R] / click) resets expedition to Room 1.
- **Spec Harmonization**:
  - Update `procedural-levels` capability to remove procedural room generation and squad point-buy requirements.
  - Add the `?skip` campaign victory playtest bypass requirement.
  - Retain specs for the 20-room hand-built campaign, victory screen, and Endless Protocol.

## Capabilities

### Modified Capabilities
- `procedural-levels`: Remove deterministic seeded room generation (`LevelDirector`, Mulberry32 PRNG) and threat-budget tactical squad generation (`EncounterDirector`). Remove dynamic on-demand room generation scenarios from `RoomManager`. Add the Campaign Victory Playtest Bypass (`?skip`) requirement and refocus the capability strictly on the 20-room hand-built campaign, victory screen, playtest bypass hook, and Endless Protocol survival mode.

## Impact

- **Affected Systems**: `RoomManager`, `Arena`, `EndlessDirector`, `main.ts`, layout templates.
- **Removed Code**: `LevelDirector.ts`, `LevelDirector.test.ts`, `EncounterDirector.ts`, `EncounterDirector.test.ts`, and 5 unused template files.
- **Preserved Systems**: 100% compatibility for hand-built Rooms 1–20, all 4 milestone bosses, VictoryHUD, DefeatHUD cascading rollbacks, and Endless Protocol wave mechanics. Zero breaking changes to standard gameplay.
