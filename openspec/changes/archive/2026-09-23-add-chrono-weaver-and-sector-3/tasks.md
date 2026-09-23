# Tasks

## 1. Boss Blueprint & Transition Action Configuration

- [x] 1.1 Update `CHRONO_WEAVER_BLUEPRINT` in `src/entities/boss/BossBlueprint.ts` to combine `createShockwavePulse`, `createMinionEscortSpawn` (spawning a Stalker escort), and `createAudioCue("shieldBreak")` on Phase 1 exit, verifying with unit tests.
- [x] 1.2 Update `src/entities/boss/BossBlueprint.test.ts` to assert that Chrono-Weaver's phase transition executes shockwave, minion escort, and audio cue hooks.

## 2. Room 10 & Sector 3 Level Configurations

- [x] 2.1 Implement `createRoom10` ("The Chrono Chamber") in `src/levels/Room.ts` configuring Chrono-Weaver milestone boss, 4 tactical corner pillars, and initial Aegis Warden escort.
- [x] 2.2 Implement `createRoom11` (Vanguard Breach), `createRoom12` (Twin Bunker Crossfire), `createRoom13` (Split Flank Matrix), and `createRoom14` (The Crucible) in `src/levels/Room.ts`.
- [x] 2.3 Update `createStandardRoomSequence()` in `src/levels/Room.ts` to assemble all 14 rooms in sequential order and verify room counts, obstacle bounds, and enemy placements in `src/levels/Room.test.ts`.

## 3. Campaign Progression & Director Routing

- [x] 3.1 Update `LevelDirector.ts` to dynamically route milestone boss blueprints by sector index (Sector 1: Goliath-01, Sector 2+: Chrono-Weaver) and verify in `src/levels/LevelDirector.test.ts`.
- [x] 3.2 Update `RoomManager.ts` to support 14-room campaign sequence, dual milestone boss identification (Rooms 5 and 10), and updated victory screen telemetry ("ALL 14 TACTICAL PROTOCOLS CONQUERED").
- [x] 3.3 Update `src/levels/RoomManager.test.ts` to verify 14-room progression, portal unlocking lifecycle, and boss detection at Rooms 5 and 10.

## 4. Full Verification & Quality Gate

- [x] 4.1 Run full Vitest test suite (`npm test`) and verify all 450+ unit tests pass deterministically.
- [x] 4.2 Run production build check (`npm run build`) to ensure strict TypeScript type checking and Vite bundling succeed without errors.
