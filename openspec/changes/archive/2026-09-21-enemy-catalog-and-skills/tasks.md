# Tasks

## 1. Navigation & Pathfinding Infrastructure

- [x] 1.1 Implement `GridPathfinder` (40px tile grid, obstacle clearance inflation, A* waypoint search) and verify with unit tests in `src/engine/GridPathfinder.test.ts`
- [x] 1.2 Implement obstacle collision sliding resolution for enemy entities in `src/entities/Enemy.ts` and verify with unit tests in `src/entities/Enemy.test.ts`

## 2. Shield Durability & Audio/Visual FX

- [x] 2.1 Update `CombatUnit` and `Projectile` collision handling in `src/entities/Projectile.ts` to support hit-count shields (`takeDamage()`) before elimination and verify with unit tests in `src/entities/Projectile.test.ts`
- [x] 2.2 Add procedural Web Audio synthesis methods (`playShieldDeflect`, `playShieldBreak`, `playSniperCharge`) in `src/audio/SoundSynthesizer.ts` and verify with unit tests in `src/audio/SoundSynthesizer.test.ts`
- [x] 2.3 Add radiant shield impact and break particle bursts in `src/entities/ParticleSystem.ts` and verify with unit tests in `src/entities/ParticleSystem.test.ts`

## 3. Enemy Catalog Archetypes & Firing Behaviors

- [x] 3.1 Expand `EnemyType` and `EnemyConfig` in `src/entities/Enemy.ts` to support Pistol Grunt, Shotgun Guard, Stalker, Aegis Warden, and Marksman with distinct speeds, shields, cadences, and ballistic spreads
- [x] 3.2 Implement pathing AI state, line-of-sight vector steering, and archetype-specific firing behaviors (Stalker run-and-gun, Marksman charging laser, Grunt/Shotgun/Warden stutter-step) in `src/entities/Enemy.ts` and verify with unit tests in `src/entities/Enemy.test.ts`
- [x] 3.3 Update enemy rendering in `src/entities/Arena.ts` to draw distinctive geometric silhouettes, concentric radiant shield rings, and Marksman red targeting lasers

## 4. 5-Room Campaign Redesign & Progression

- [x] 4.1 Update `src/levels/Room.ts` to define the redesigned 5-room tactical puzzle progression showcasing all 5 archetypes and verify room layouts with unit tests in `src/levels/RoomManager.test.ts`
- [x] 4.2 Update `RoomManager.ts` and `Arena.ts` to support 5-room progression transitions and victory triggers, verifying with unit tests in `src/entities/Arena.test.ts`

## 5. Verification & Validation

- [x] 5.1 Run full Vitest test suite (`npm test`) and production build (`npm run build`) to ensure zero regressions and fast execution
- [x] 5.2 Validate OpenSpec change compliance with `openspec validate enemy-catalog-and-skills --strict`
