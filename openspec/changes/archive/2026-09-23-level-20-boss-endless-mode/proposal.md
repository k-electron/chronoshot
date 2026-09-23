# Proposal: Level 20 Final Boss Encounter & Endless Mode Protocol

## Why

The current campaign concludes at Room 19 without a dedicated Sector 4 climactic milestone encounter, and the existing endless mode merely recycles static rooms rather than providing an escalating survival gauntlet. Introducing a multi-phase final boss for Level 20 along with a seamless transition into a true continuous-threat Endless Mode provides players with a definitive campaign peak and a high-replayability endgame testing fully upgraded builds.

## What Changes

- **Level 20 Milestone Final Boss**: Introduces `CHRONO-ZENITH: ZERO SOVEREIGN` as the climactic final boss of Sector 4, featuring a 4-phase state machine escalating from heavy artillery to sniper kiting, rotating radial novae, and high-velocity core pursuit.
- **Telegraphed Cataclysm Pulse**: Integrates an overload channel mechanic triggered upon shield breaks where the boss anchors and becomes invulnerable for 75 simulation ticks before discharging a lethal arena-wide shockwave that must be avoided by breaking line-of-sight behind cover obstacles.
- **High-Skill Overload Timing Window**: Boss invulnerability ends immediately upon blast detonation, enabling skilled players to pre-fire projectiles during the channel that land after the blast while safely hidden behind cover.
- **Room 20 Geometry Template ("The Apex Redoubt")**: Symmetrical arena layout with monolithic bastions and pillars ensuring safe cover is always within reachable distance.
- **Seamless Endless Mode Warping**: Stepping into the unlocked Room 20 exit portal seamlessly initializes Endless Survival mode with full 7-upgrade loadout injection (`extended-cylinder`, `speed-loader`, `reactive-shield`, `kinetic-stride`, `chrono-burst`, `phase-deflector`, `overcharge-dash`) and restores depleted player shields to full capacity.
- **Continuous Survival Spawner & Layout ("The Apex Colosseum")**: In Endless Mode, enemies continuously spawn in an advanced multi-lane layout to satisfy a dynamic, real-time climbing threat budget.
- **Fair Safe Spawning ($\ge 350\text{px}$ Rule & Telegraph)**: Dynamic reinforcement spawns enforce a strict minimum 350px distance from the player, collision clearance against obstacles, and a 30-tick visual materialization telegraph to eliminate luck-based telefrag deaths.
- **Live Endless Telemetry HUD**: Renders real-time threat budget, survival time, and kill counter overlays.

## Capabilities

### New Capabilities
*(None; builds on existing boss and procedural systems)*

### Modified Capabilities
- `boss-encounters`: Adds the `CHRONO-ZENITH: ZERO SOVEREIGN` 4-phase final boss encounter, Cataclysm Pulse shockwave behavior with line-of-sight obstacle occlusion, and overload channeling invulnerability with post-channel timing vulnerability.
- `procedural-levels`: Expands the campaign sequence to 20 rooms including Room 20 "The Apex Redoubt", adds the "The Apex Colosseum" layout, dynamic Endless Mode survival loop with climbing threat budget, live threat telemetry HUD, and fair distance-guaranteed safe reinforcement spawner with telegraphs.

## Impact

- **Affected Systems**: `BossBlueprint`, `BossPhaseController`, `LevelDirector`, `EncounterDirector`, `RoomManager`, `Arena`, `HUD`, `EnemyRenderer`.
- **Breaking Changes**: None. Existing 19-room campaign and earlier boss sequences remain backward-compatible while extending Room 20 and Endless Mode functionality.
- **Dependencies**: No external dependencies; utilizes deterministic math, canvas 2D rendering, and procedural Web Audio.
