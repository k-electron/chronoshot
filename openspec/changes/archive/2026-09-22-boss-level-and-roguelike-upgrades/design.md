# Design

## Context

ChronoShot currently uses a 5-room linear progression sequence ([`Room.ts`](file:///Users/karim/Documents/repos/chronoshot/src/levels/Room.ts), [`RoomManager.ts`](file:///Users/karim/Documents/repos/chronoshot/src/levels/RoomManager.ts)) where death allows immediate per-room retries with the standard 6-round revolver. See `proposal.md` for motivation.

To establish a compelling roguelike loop with a step-function challenge escalation, this design introduces:
- A milestone Boss encounter at Level 5 (*Goliath-01: Aegis Colossus*).
- An immediate freeze-frame upgrade draft rewarding the player with 1 of 3 tactical augmentations.
- An escalated Zone 2 baseline across Levels 6–9 calibrated for an augmented player.
- Pure permadeath run resets back to Level 1.

## Goals / Non-Goals

**Goals:**
- Implement the Level 5 Boss (*Goliath-01*) with 4-hit multi-layer shields, dual heavy slugs, enraged phase 2, and dedicated top-center telemetry HUD.
- Implement freeze-frame tactical augmentation draft overlay upon Goliath's destruction.
- Implement 3 curated upgrades:
  - *Extended Cylinder* (6 $\rightarrow$ 8 chambers).
  - *Speed Loader* (+30 $\rightarrow$ +15 reload ticks).
  - *Reactive Shield* (1 energy shield hit absorbed per room).
- Author Levels 6–9 with coordinated multi-archetype squads.
- Implement pure permadeath run restart resetting progress to Level 1 and wiping upgrades upon player elimination.

**Non-Goals:**
- Tiers 3–5 (Levels 10–25): Deferred to subsequent change proposals.
- Random procedural level generation: All 9 rooms are authored tactical puzzles.
- Persistent cross-session save progression (meta-progression): Keeps the game a pure tactical arcade permadeath experience.

## Decisions

### 1. Boss Architecture: Extended Enemy vs Separate Entity
- **Decision**: Extend `EnemyConfig` with boss parameters (`isBoss: boolean`, `bossName: string`, `maxShields: 4`, `enragedSpeed: number`) and integrate boss phase updates directly into `Enemy.ts`.
- **Rationale**: Reuses established continuous collision detection (CCD), raycast line-of-sight, obstacle collision sliding, and 40px grid pathfinding without duplicating physics simulation code.
- **Alternative Considered**: A completely separate `Boss` class. Rejected because it would duplicate CCD raycasts and obstacle collision handling without tangible architectural benefit.

### 2. Tactical Augmentation State on Player
- **Decision**: Define a structured `PlayerAugmentations` interface:
  ```ts
  export interface PlayerAugmentations {
    extendedCylinder?: boolean;
    speedLoader?: boolean;
    reactiveShield?: boolean;
  }
  ```
  `Player.ts` maintains active augmentations across rooms. When `extendedCylinder` is enabled, `Player` instantiates a `Revolver` with `magSize: 8` (which `CylinderHUD` natively renders with 8 radial pips). When `speedLoader` is enabled, `Revolver.reload()` queues 15 simulation ticks instead of 30. When `reactiveShield` is enabled, `Player.takeDamage()` absorbs the first impact per room, emitting deflection sparks.
- **Rationale**: Isolates upgrade state from base physics, making reset on death trivial (`player.clearAugmentations()`).
- **Alternative Considered**: Mutating global physics constants. Rejected due to tight coupling and risk of state leaks across runs.

### 3. Freeze-Frame Post-Boss Upgrade Draft
- **Decision**: When Goliath-01 takes its final lethal shot, `Arena` catches the elimination, enters an `upgradeDraftActive = true` state, freezes physics ticks, and renders the 3-card draft overlay directly on the Canvas 2D context. Keyboard keys `1`, `2`, `3` or mouse clicks select the card, play a procedural audio cue (`soundSynth.playUpgradeChime()`), install the augmentation, and immediately transition to Room 6.
- **Rationale**: Delivers instant triumph and immediate tactical pacing without requiring the player to slowly traverse an empty arena to an exit gate.

### 4. Permadeath Run Lifecycle
- **Decision**: On player death, `Arena.status = "defeat"`. When the player presses <kbd>R</kbd>, `Arena.restart()` calls `roomManager.restartGame()` and `player.clearAugmentations()`, returning the player to Room 1. The defeat overlay is updated to show run summary statistics (e.g. `PROTOCOL TERMINATED // SECTOR: TIER 2 // ROOM 07`).
- **Rationale**: Fulfills the explicit user requirement: no lives, no checkpoints, back to Level 1.

## Risks / Trade-offs

- **[Risk] High difficulty spike in Rooms 6–9 if the player selects an upgrade that doesn't fit their playstyle.**
  $\rightarrow$ *Mitigation*: Ensure all 4 rooms in Zone 2 offer sufficient pillar cover and multiple tactical routes, allowing any of the 3 upgrades (Capacity, Speed, or Defense) to solve each puzzle.
- **[Risk] Input handling conflict during freeze-frame upgrade modal.**
  $\rightarrow$ *Mitigation*: When `upgradeDraftActive` is true in `Arena.step`, standard movement, shooting, and reloading inputs are bypassed so trigger pulls cannot dry-fire or advance simulation ticks.
- **[Risk] CylinderHUD layout distortion with 8 chambers.**
  $\rightarrow$ *Mitigation*: `CylinderHUD.ts` already calculates radial angles via `(i / chambers.length) * Math.PI * 2`. We verified the geometry supports 8 pips with 5.5px chamber radius cleanly.
