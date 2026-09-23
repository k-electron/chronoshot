# Tasks

## 1. Boss Overload Channel & Cataclysm Pulse Mechanics

- [x] 1.1 Add `overloadChannelTicks` support and invulnerability state to `Enemy` and `BossPhaseController`, verifying damage deflection and deflection particle/audio feedback with unit tests in `src/entities/boss/BossPhaseController.test.ts`
- [x] 1.2 Implement raycast line-of-sight obstacle occlusion check for the Cataclysm Pulse detonation, verifying blocked line-of-sight produces 0 damage and open line-of-sight inflicts damage with unit tests in `src/entities/boss/BossTransitionAction.test.ts`
- [x] 1.3 Implement pre-fired projectile post-channel timing window test, verifying projectiles striking after the channel timer expires successfully damage the boss's subsequent phase in `src/entities/Enemy.test.ts`

## 2. Chrono-Zenith Boss Blueprint & Room 20 Arena Template

- [x] 2.1 Define `CHRONO_ZENITH_BLUEPRINT` in `src/entities/boss/BossBlueprint.ts` with 4-phase state sequence, escalating weaponry, and Cataclysm Overload transitions, verified with unit tests in `src/entities/boss/BossBlueprint.test.ts`
- [x] 2.2 Create `ApexRedoubtTemplate` in `src/levels/templates/ApexRedoubtTemplate.ts` with tactical bastions and pillars ensuring $\le 140\text{px}$ distance to cover, verified with unit tests in `src/levels/templates/templates.test.ts`
- [x] 2.3 Implement `createRoom20` in `src/levels/Room.ts`, update `createStandardRoomSequence` to 20 rooms, and update `LevelDirector` to route Chrono-Zenith as Sector 4 milestone boss in `src/levels/LevelDirector.ts`, verified with tests in `src/levels/Room.test.ts` and `src/levels/LevelDirector.test.ts`

## 3. Endless Director & Safe Distant Spawner

- [x] 3.1 Create `ApexColosseumTemplate` in `src/levels/templates/ApexColosseumTemplate.ts` with high-mobility kiting lanes and central breakout bastions, verified with layout tests in `src/levels/templates/templates.test.ts`
- [x] 3.2 Implement `EndlessDirector` in `src/levels/EndlessDirector.ts` with simulation-tick threat budget climbing, active threat tracking, safe spatial sampling ($\ge 350\text{px}$ from player, $\ge 48\text{px}$ unit separation, obstacle collision clearance), and 30-tick materialization queue
- [x] 3.3 Add unit test suite `src/levels/EndlessDirector.test.ts` verifying threat curve calculation, distant spawn filtering, obstacle avoidance, and materialization lifecycle

## 4. Seamless Endless Transition & Combat Arena Integration

- [x] 4.1 Update `RoomManager` to support Room 20 completion, golden portal state, and `startEndlessMode()` transition, verified with unit tests in `src/levels/RoomManager.test.ts`
- [x] 4.2 Implement full 7-upgrade loadout injection (`extended-cylinder`, `speed-loader`, `reactive-shield`, `kinetic-stride`, `chrono-burst`, `phase-deflector`, `overcharge-dash`) and shield replenishment to max capacity upon Endless Mode entry, verified in `src/entities/Player.test.ts` and `src/entities/Arena.test.ts`
- [x] 4.3 Integrate `EndlessDirector` into `Arena.ts` simulation loop, rendering materialization telegraph rings and Cataclysm warning auras, verified with integration tests in `src/entities/Arena.test.ts`

## 5. Telemetry HUD & Verification

- [x] 5.1 Implement in-canvas Endless Telemetry HUD displaying active threat budget, elapsed survival time, and kill counter, verified with rendering tests in `src/ui/HUD.test.ts`
- [x] 5.2 Run complete test suite (`npm test`) and typecheck build (`npm run build`) to ensure all tests pass with zero regressions
