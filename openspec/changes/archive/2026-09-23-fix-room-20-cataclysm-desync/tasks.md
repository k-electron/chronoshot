# Tasks

## 1. Global Elimination Lifecycle and Defeat State Synchronization

- [x] 1.1 Add global player elimination check in `Arena.fixedUpdate` to trigger shatter particles, defeat audio, and transition `this.status = "defeat"` whenever `this.status === "playing" && !this.player.isAlive`, and verify with unit tests in `src/entities/Arena.test.ts`.
- [x] 1.2 Update `createCataclysmPulse` in `src/entities/boss/BossTransitionAction.ts` to inspect damage result, emit deflection/shield-break feedback when absorbed, and verify lethal Cataclysm Pulse triggers full defeat state in `src/entities/boss/BossTransitionAction.test.ts`.

## 2. Dynamic Hostile Entity Spawning and Escort Materialization

- [x] 2.1 Implement `Arena.spawnEnemy(config: EnemyConfig): Enemy` in `src/entities/Arena.ts` to instantiate and register fully active `Enemy` instances, and verify with unit tests in `src/entities/Arena.test.ts`.
- [x] 2.2 Update `createMinionEscortSpawn` in `src/entities/boss/BossTransitionAction.ts` to invoke `ctx.arena.spawnEnemy(item)` or instantiate `new Enemy(item)` on fallback, and verify escort spawning and room restart safety in `src/entities/boss/BossTransitionAction.test.ts`.

## 3. Boss Speed Synchronization and LevelDirector Geometry Alignment

- [x] 3.1 Update `Enemy.takeDamage` and `Enemy.update` in `src/entities/Enemy.ts` to synchronize `this.speed = this.phaseController.speed` upon phase transitions, and verify with unit tests in `src/entities/Enemy.test.ts`.
- [x] 3.2 Align `LevelDirector.generateBossRoom` in `src/levels/LevelDirector.ts` for Room 20 to position Chrono-Zenith at `arenaWidth - 350`, verifying separation from `redoubt-pillar-east` in `src/levels/LevelDirector.test.ts`.

## 4. End-to-End Validation

- [x] 4.1 Run full test suite (`npm test`) to verify all existing and new unit tests pass cleanly without regression.
- [x] 4.2 Validate change artifacts with `npx openspec validate fix-room-20-cataclysm-desync --strict` to verify OpenSpec schema compliance.
