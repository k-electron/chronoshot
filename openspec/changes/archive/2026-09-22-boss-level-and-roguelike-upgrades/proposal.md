# Proposal

## Why

ChronoShot currently features a 5-room linear prototype without distinct boss climaxes, build variety, or long-term stakes. Introducing a dedicated Level 5 Boss encounter (*Goliath-01: Aegis Colossus*), an immediate 3-card roguelike upgrade draft, and an escalated baseline across Levels 6–9 establishes a core gameplay loop with escalating mastery, build customization, and high-tension permadeath runs.

## What Changes

- **Level 5 Boss Encounter (*Goliath-01: Aegis Colossus*)**: Introduces a multi-phase, heavy-armored boss unit with 4 hit-absorption shields, twin-slug heavy cannon, an enraged lethal second phase, and top-screen boss telemetry.
- **Post-Boss Roguelike Upgrade Draft**: Implements an immediate freeze-frame draft upon defeating Goliath-01 offering a choice of 1 of 3 curated tactical augmentations:
  - *Extended Cylinder* (Expands revolver from 6 to 8 chambers).
  - *Speed Loader* (Cuts reload tick cost from +30 to +15 simulation ticks).
  - *Reactive Shield* (Grants the player 1 energy shield hit absorption per room).
- **Step-Function Baseline Escalation (Levels 6–9)**: Expands the room sequence to 9 levels where Levels 6–9 introduce dense, coordinated squad formations (Stalker pincers, dual Sniper crossfires, multi-Warden gauntlets) calibrated against the player's newly acquired upgrade.
- **Pure Permadeath Run Lifecycle**: **BREAKING** Death at any room (Levels 1–9) now terminates the run, displays run statistics, and resets progress back to Level 1 with all upgrades cleared.

## Capabilities

### New Capabilities
- `boss-encounters`: Boss unit entity specifications, multi-layer shield mechanics, dual-phase combat behaviors, and top-center boss telemetry HUD.
- `roguelike-upgrades`: Tactical augmentation draft system, immediate freeze-frame card selection UI, and player combat modifier application (cylinder capacity, reload speed, reactive shield).

### Modified Capabilities
- `combat-arena`: Expands the room progression sequence from 5 to 9 rooms, replaces per-room retry with pure permadeath run resets back to Level 1, and updates defeat overlays with run statistics.

## Impact

- **Entities**: [`Player`](file:///Users/karim/Documents/repos/chronoshot/src/entities/Player.ts) gains upgrade modifier state and shield hit absorption; [`Enemy`](file:///Users/karim/Documents/repos/chronoshot/src/entities/Enemy.ts) gains boss archetype configurations; [`Arena`](file:///Users/karim/Documents/repos/chronoshot/src/entities/Arena.ts) integrates freeze-frame boss defeat, upgrade modal overlay, boss HUD rendering, and permadeath resets.
- **Weapons & HUD**: [`Revolver`](file:///Users/karim/Documents/repos/chronoshot/src/weapons/Revolver.ts) dynamically supports 8-chamber capacity and reduced reload tick costs; [`CylinderHUD`](file:///Users/karim/Documents/repos/chronoshot/src/ui/CylinderHUD.ts) renders 8 radial pips when augmented.
- **Levels**: [`Room.ts`](file:///Users/karim/Documents/repos/chronoshot/src/levels/Room.ts) and [`RoomManager.ts`](file:///Users/karim/Documents/repos/chronoshot/src/levels/RoomManager.ts) updated with 9 total room configurations and permadeath state handling.
