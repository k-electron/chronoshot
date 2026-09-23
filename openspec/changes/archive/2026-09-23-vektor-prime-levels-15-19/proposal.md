# Proposal

## Why

ChronoShot's fixed campaign currently terminates at Room 14 ("The Crucible"), leaving the tactical upgrade progression capped at 2 augmentations and missing a true high-stakes milestone boss encounter for Sector 3. Introducing Level 15 as a "step function" milestone boss—Vektor-Prime: Phase Sovereign—creates a sharp qualitative leap in mechanical demand, provides a 3rd tactical upgrade draft reward, and establishes a linearly escalating 4-room endgame gauntlet (Rooms 16–19) that tests full 3-upgrade synergies before campaign completion.

## What Changes

- **Step-Function Milestone Boss (Level 15 - Vektor-Prime: Phase Sovereign)**:
  - Implements the game's first 3-phase boss state machine (`BossBlueprint`).
  - **Phase 1 (Fortress Aegis)**: 5-pip shield durability, deliberate direct advance (50 px/s), pinpoint heavy slugs (cadence 50, speed 550), supported by 2 Grunt escorts. Phase exit triggers violet shockwave pulse and summons 1 Shotgun Guard + 1 Stalker escort.
  - **Phase 2 (Phase Warp / Kiter)**: 3-pip shield durability, high-speed standoff kiting (280–460px standoff, 85 px/s), alternating 25-tick telegraphed charging beams and 3-pellet buckshot spreads. Phase exit triggers radial shockwave and summons 2 high-speed Stalkers.
  - **Phase 3 (Singularity Nova Overdrive)**: 0 shields (exposed lethal core), aggressive chase (115 px/s), continuous 16-pellet rotating 360-degree radial novae (cadence 65, speed 420 px/s, angular offset step 0.12).
- **New Tactical Augmentation (Overcharge Dash)**:
  - Registers `overchargeDash` in `UpgradeRegistry` as a 7th augmentation definition.
  - Activated via `Space` or `Shift`.
  - Queues an action burst of `+12` simulation ticks on `TimeGovernor`, propelling the player forward at 480 px/s with temporary phase invulnerability/projectile deflection and a 90-tick cooldown.
- **Post-Boss Upgrade Draft 3**:
  - Eliminating Vektor-Prime triggers immediate simulation freeze and renders a 3-card upgrade draft drawn from the remaining eligible upgrades, allowing the player to enter Room 16 with 3 active augmentations.
- **Endgame Campaign Gauntlet (Rooms 16–19)**:
  - Implements concrete level configurations for Rooms 15, 16, 17, 18, and 19.
  - Linear threat budget escalation from 240 (Room 16) to 285 (Room 19).
  - Updates `createStandardRoomSequence()` to supply 19 rooms.
  - Updates `RoomManager` and victory UI to recognize 19 total rooms, unlocking the exit portal upon clearing Room 19 and displaying updated protocol completion telemetry.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `boss-encounters`: Adds requirements for Vektor-Prime Phase Sovereign milestone encounter with a 3-phase state machine, multi-layer shield stripping, standoff laser/buckshot kiting, dynamic mid-fight escort reinforcements, and 16-pellet rotating radial nova overdrive.
- `procedural-levels`: Expands campaign sequence from 14 to 19 rooms, incorporating Room 15 milestone boss routing, Rooms 16–19 linear endgame tactical encounters, and updated 19-room campaign victory condition.
- `roguelike-upgrades`: Adds requirements for the Overcharge Dash tactical locomotion augmentation and integrates the 3rd freeze-frame draft selection following Room 15 milestone boss neutralization.

## Impact

- **Entities & Bosses**: `BossBlueprint.ts`, `BossPhaseController.ts`, `BossTransitionAction.ts`.
- **Augmentation Systems**: `src/upgrades/definitions/overchargeDash.ts`, `src/upgrades/definitions/index.ts`, `Player.ts`, `Arena.ts`, `main.ts` (spacebar/shift dash input dispatch).
- **Levels & Progression**: `Room.ts` (Rooms 15–19), `LevelDirector.ts` (Sector 3 boss routing), `RoomManager.ts` (19-room campaign bounds & victory rendering).
- **UI & Telemetry**: `BossTelemetryHUD.ts` displays 3-phase indicators, `RoomManager.ts` renders 19-protocol victory screen.
