# Proposal: Fix Room 20 Cataclysm Lethality Desync and Lifecycle Anomalies

## Why

During the Room 20 milestone climax against Chrono-Zenith: Zero Sovereign, players caught in open line-of-sight during Cataclysm Overload phase transitions suffer lethal damage that desyncs player lifecycle state: the player chassis stops rendering and controls freeze, but the arena never transitions to `"defeat"` and the Defeat HUD never displays, leaving the player in a soft-locked zombie state where their character has vanished from the map. In addition, phase escort minions fail to spawn as live combat entities due to a missing `Arena.spawnEnemy` implementation, `LevelDirector` spawns procedural Room 20 bosses inside a solid pillar, and boss speed fails to refresh across phase transitions.

## What Changes

- **Global Player Elimination Lifecycle in `Arena.fixedUpdate`**: Detect when `player.isAlive` becomes false regardless of damage source (projectiles or environmental/transition Cataclysm shockwaves), emit death shatter particles (`#00f0ff`), trigger defeat audio, and transition `this.status` to `"defeat"`.
- **Cataclysm Pulse Feedback & Lethality Alignment in `createCataclysmPulse`**: Provide full audiovisual feedback (shield deflection sparks or shield break sounds for shielded hits, shatter cues for lethal hits) and explicitly synchronize arena defeat state when Cataclysm Pulse eliminates an exposed player.
- **`Arena.spawnEnemy` Method & Escort Minion Instantiation**: Implement `Arena.spawnEnemy(config: EnemyConfig): Enemy` to construct and register fully instantiated, live `Enemy` objects with functional hitboxes, AI loops, and rendering, rather than pushing raw config objects that break enemy iteration and room resets.
- **`LevelDirector` Room 20 Boss Clearance**: Update `LevelDirector.generateBossRoom` for Room 20 to position Chrono-Zenith at `this.arenaWidth - 350` (610, 320), matching `Room.ts` and clearing `redoubt-pillar-east` (bounds 716..764).
- **Boss Speed Synchronization across Phases in `Enemy.ts`**: Update `this.speed` from `this.phaseController.speed` upon phase transitions so multi-phase bosses like Chrono-Zenith correctly accelerate across phases (45 -> 95 -> 105 -> 125 px/s).

## Capabilities

### Modified Capabilities
- `boss-encounters`: Clarify Cataclysm Overload lethal shockwave impact requirements to enforce full defeat lifecycle synchronization, ensure escort minion spawning creates active combat entities, and maintain speed scaling across phases.
- `combat-arena`: Require the combat arena to enforce global player elimination state synchronization regardless of damage delivery mechanism and provide a dynamic enemy spawning interface.
- `procedural-levels`: Require `LevelDirector` boss room generation to enforce obstacle collision clearance for Room 20 milestone boss positioning.

## Impact

- `src/entities/Arena.ts`: Lifecycle check in `fixedUpdate`, addition of `spawnEnemy(config)` method.
- `src/entities/boss/BossTransitionAction.ts`: Cataclysm Pulse outcome handling and proper minion spawning invocation.
- `src/entities/Enemy.ts`: Speed update synchronization upon phase transition.
- `src/levels/LevelDirector.ts`: Coordinate offset adjustment for Room 20 milestone boss generation.
- Automated test suites (`Arena.test.ts`, `BossTransitionAction.test.ts`, `Enemy.test.ts`, `LevelDirector.test.ts`).
