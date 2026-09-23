# Tasks

## 1. Composable Room Layout Templates

- [x] 1.1 Implement `RoomLayoutTemplate` interface, `SpawnZone` contract, and layout registry/catalog in `src/levels/templates/RoomLayoutTemplate.ts`. Verify with unit tests in `RoomLayoutTemplate.test.ts`.
- [x] 1.2 Implement modular tactical cover templates in `src/levels/templates/` (`CenterPillarsTemplate`, `TwinBunkersTemplate`, `SplitCorridorTemplate`, `KillboxLanesTemplate`, `ArenaQuadrantTemplate`). Verify with unit tests in `templates.test.ts`.

## 2. Threat-Budget Encounter Spawner

- [x] 2.1 Implement `EncounterDirector` in `src/levels/EncounterDirector.ts` supporting threat-budget allocation across hostile archetypes, tactical composition constraints (max 2 snipers, frontliner escort rules), and safe coordinate sampling outside obstacle bounds with 280px minimum distance from player spawn. Verify with unit tests in `EncounterDirector.test.ts`.

## 3. Deterministic Level Director & PRNG

- [x] 3.1 Implement seedable PRNG (Mulberry32) and `LevelDirector` in `src/levels/LevelDirector.ts` supporting reproducible room and sector generation, difficulty budget scaling, and milestone boss room creation (every 5th room). Verify with unit tests in `LevelDirector.test.ts`.
- [x] 3.2 Extend `RoomManager` in `src/levels/RoomManager.ts` to optionally accept `LevelDirector` for dynamic endless room progression upon exit portal entry, while maintaining 100% backward compatibility with `createStandardRoomSequence()` and existing campaign runs. Verify with unit tests in `RoomManager.test.ts`.

## 4. Full Integration & Verification

- [x] 4.1 Run complete test suite (`npm test`) and typecheck (`npm run build`) to verify all unit tests pass with zero regressions.
