# Proposal: Modular Level Director & Procedural Room Generator

## Why

Currently, ChronoShot's level progression relies entirely on 9 handcrafted room definitions hardcoded in `src/levels/Room.ts`. While these rooms effectively tutor the core mechanics and provide an escalating baseline, they offer limited replayability once mastered and prevent rapid experimentation with new enemy archetypes, tactical cover arrangements, or endless/daily challenge runs. 

Now that enemies, boss phases, and player upgrades have been refactored into composable data-driven building blocks, level design should similarly be decomposed into composable layout templates and a budget-driven procedural encounter director. This enables infinite procedural variation, balanced tactical puzzle layouts, and customizable combat sectors while maintaining the curated 9-room campaign as a first-class sequence.

## What Changes

- Introduce **Composable Room Geometry Templates** (`RoomLayoutTemplate`): modular geometric arrangements of tactical cover (pillars, bunkers, split corridors, choke points, flank barriers) with validated player spawn zones, exit portal anchors, and safe enemy spawn regions.
- Introduce **Threat-Budget Encounter Spawner** (`EncounterDirector`): an intelligent squad generator that distributes enemy forces based on a tier-scaled threat budget (e.g. Grunts = 10, Shotgun Guards = 20, Stalkers = 25, Aegis Wardens = 35, Marksmen = 40), enforcing tactical composition rules (minimum safe player distance, maximum sniper density, frontliner escorts, crossfire angles).
- Introduce **Deterministic Seeded Level Generator** (`LevelDirector`): generates structured `RoomConfig` instances combining layout geometry and enemy squads deterministically via a seedable pseudo-random number generator (PRNG), supporting reproducible daily seeds and progressive endless modes.
- Extend **`RoomManager`** to optionally accept a `LevelDirector` or generator callback to dynamically generate rooms on demand, enabling an endless challenge mode alongside the classic 9-room campaign.
- Preserve 100% backward compatibility with `createStandardRoomSequence()`, `RoomConfig`, and all existing 17 `RoomManager.test.ts` tests.

## Capabilities

### New Capabilities
- `procedural-levels`: Defines the modular level director, composable room layout geometry templates, threat-budget tactical encounter spawning, and deterministic procedural room generation for dynamic campaigns and endless runs.

### Modified Capabilities
<!-- None: all existing combat arena and room manager requirements remain fully satisfied -->

## Impact

- `src/levels/`:
  - `src/levels/templates/`: Geometric cover layout templates (`CenterPillars`, `TwinBunkers`, `FlankCorridor`, `KillboxLanes`, etc.).
  - `src/levels/EncounterDirector.ts`: Threat-budget calculation, composition constraints, and enemy squad positioning.
  - `src/levels/LevelDirector.ts`: High-level room and sector generation with seedable PRNG.
  - `src/levels/RoomManager.ts`: Extended to support dynamic endless progression.
- `src/entities/Arena.ts`: Seamlessly loads generated rooms via `RoomManager`.
- Zero breaking changes to existing campaign rooms or tests.
