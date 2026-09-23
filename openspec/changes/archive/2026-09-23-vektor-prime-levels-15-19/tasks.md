# Tasks

## 1. Boss Engine & Vektor-Prime Blueprint

- [x] 1.1 Implement alternating or dual-cadence attack behavior for Phase 2 kiting (laser charge and fan spread) and verify with unit tests in `src/entities/behaviors/attack/`
- [x] 1.2 Implement `VEKTOR_PRIME_BLUEPRINT` in `src/entities/boss/BossBlueprint.ts` with 3 discrete phases, shield pools (5, 3, 0), transition actions (shockwaves and escort summons), and 16-pellet radial nova, verifying with unit tests in `src/entities/boss/BossBlueprint.test.ts`
- [x] 1.3 Update `LevelDirector.generateBossRoom` in `src/levels/LevelDirector.ts` to route Sector 3 / Room 15+ to `VEKTOR_PRIME_BLUEPRINT`, and verify with tests in `src/levels/LevelDirector.test.ts`

## 2. Overcharge Dash Tactical Augmentation

- [x] 2.1 Create `src/upgrades/definitions/overchargeDash.ts`, export and register it in `src/upgrades/definitions/index.ts`, and verify in `src/upgrades/definitions/definitions.test.ts`
- [x] 2.2 Implement Overcharge Dash mechanics in `src/entities/Player.ts` (action burst of +12 simulation ticks on `TimeGovernor`, 480 px/s velocity impulse, projectile deflection window, and 90-tick cooldown), verifying in `src/entities/Player.test.ts`
- [x] 2.3 Wire Space/Shift key input in `src/main.ts` and `src/entities/Arena.ts` to trigger player dash, verifying projectile deflection during dash frames in `src/entities/Arena.test.ts`

## 3. Campaign Sequence (Rooms 15–19) & Victory Management

- [x] 3.1 Implement `createRoom15`, `createRoom16`, `createRoom17`, `createRoom18`, and `createRoom19` with escalating threat budgets (240 to 285) in `src/levels/Room.ts`, and verify in `src/levels/Room.test.ts`
- [x] 3.2 Update `createStandardRoomSequence()` in `src/levels/Room.ts` to return the 19-room campaign and update `src/levels/RoomManager.ts` to manage 19 rooms, verifying in `src/levels/RoomManager.test.ts`
- [x] 3.3 Update `RoomManager.renderGameVictory()` in `src/levels/RoomManager.ts` to render 19 tactical protocols conquered and Vektor-Prime checkmark, verifying in `src/levels/RoomManager.test.ts`

## 4. Verification & Validation

- [x] 4.1 Run complete Vitest test suite (`npm test`) and verify all tests pass with zero regressions
- [x] 4.2 Run production build check (`npm run build`) and verify TypeScript compilation succeeds cleanly
- [x] 4.3 Validate OpenSpec change with `npx openspec validate vektor-prime-levels-15-19 --strict` and verify zero errors
