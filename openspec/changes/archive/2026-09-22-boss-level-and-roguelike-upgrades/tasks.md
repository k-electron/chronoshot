# Tasks

## 1. Tactical Augmentations & Player Capabilities

- [x] 1.1 Define `PlayerAugmentations` interface and implement active augmentation modifiers in `src/entities/Player.ts` (8-chamber cylinder, 15-tick reload, 1-hit reactive shield buffer), verifying with unit tests in `src/entities/Player.test.ts`
- [x] 1.2 Ensure `src/weapons/Revolver.ts` and `src/ui/CylinderHUD.ts` support 8-chamber dynamic capacity and rendering, verifying with tests in `src/weapons/Weapon.test.ts` and `src/ui/HUD.test.ts`

## 2. Boss Entity & Boss Telemetry HUD

- [x] 2.1 Extend `src/entities/Enemy.ts` to support the Goliath-01 boss archetype with 4 shield hits, heavy twin-slug discharges, and enraged second phase upon shield break, verifying with tests in `src/entities/Enemy.test.ts`
- [x] 2.2 Implement top-center in-canvas Boss Telemetry HUD in `src/entities/Arena.ts` rendering boss codename and remaining shield pips, verifying with tests in `src/entities/Arena.test.ts`

## 3. Post-Boss Upgrade Draft System

- [x] 3.1 Implement immediate freeze-frame upgrade selection overlay in `src/entities/Arena.ts` presenting the 3 curated cards with keyboard (`[1]`, `[2]`, `[3]`) and mouse selection, verifying with state tests in `src/entities/Arena.test.ts`
- [x] 3.2 Add procedural Web Audio power-up confirmation cue in `src/audio/SoundSynthesizer.ts`, verifying with tests in `src/audio/SoundSynthesizer.test.ts`

## 4. 9-Room Sequence, Zone 2 Levels & Permadeath Run Lifecycle

- [x] 4.1 Author Level 5 Boss room and Levels 6–9 escalated baseline tactical rooms in `src/levels/Room.ts`, verifying room configurations and enemy spawn placements
- [x] 4.2 Update `src/levels/RoomManager.ts` to coordinate 9 rooms and enforce pure permadeath run restarts back to Room 1 with cleared upgrades, verifying with tests in `src/levels/RoomManager.test.ts`
- [x] 4.3 Update `src/entities/Arena.ts` defeat overlay to display run stats (sector reached, room reached, active upgrade) and wire [R] permadeath reset, verifying with tests in `src/entities/Arena.test.ts`

## 5. End-to-End Verification

- [x] 5.1 Execute full test suite `npm test` and verify all tests pass with zero regressions
- [x] 5.2 Execute production build `npm run build` and verify strict TypeScript compilation succeeds
