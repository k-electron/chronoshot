# Tasks

## 1. Relocate Threat Constants & Make EndlessDirector Self-Contained

- [x] 1.1 Move `THREAT_COSTS` and `ARCHETYPE_CONFIGS` definitions directly into `src/levels/EndlessDirector.ts`, update internal references, and verify `npm test src/levels/EndlessDirector.test.ts` passes.
- [x] 1.2 Remove `src/levels/EncounterDirector.ts` and `src/levels/EncounterDirector.test.ts`, ensuring no dangling references remain in the codebase.

## 2. Prune Dead Procedural Files & Unused Templates

- [x] 2.1 Remove `src/levels/LevelDirector.ts` and `src/levels/LevelDirector.test.ts`.
- [x] 2.2 Delete the 5 unused procedural templates (`CenterPillarsTemplate.ts`, `TwinBunkersTemplate.ts`, `SplitCorridorTemplate.ts`, `KillboxLanesTemplate.ts`, `ArenaQuadrantTemplate.ts`) from `src/levels/templates/`.
- [x] 2.3 Update `src/levels/templates/index.ts`, `RoomLayoutTemplate.ts`, and `src/levels/templates/templates.test.ts` to export and test only `ApexRedoubtTemplate` and `ApexColosseumTemplate`, and verify `npm test src/levels/templates/` passes.

## 3. Streamline RoomManager

- [x] 3.1 Strip `LevelDirector` constructor overload, imports, property, and dynamic room-pushing loops from `src/levels/RoomManager.ts`, and simplify `isEndlessMode()` to strictly check `this.endlessDirector !== undefined`.
- [x] 3.2 Update `src/levels/RoomManager.test.ts` to remove obsolete `LevelDirector` tests and verify `npm test src/levels/RoomManager.test.ts` passes.

## 4. Implement Campaign Victory Playtest Bypass

- [x] 4.1 Implement `Arena.bypassToCampaignVictory()` in `src/entities/Arena.ts` configuring the exact post-Zenith state: Room 20 completed (`gameCompleted = true`), pre-Zenith loadout (Extended Cylinder, Speed Loader, Reactive Shield), pre-boss checkpoint snapshots (Rooms 5, 10, 15, 20), and `status = "victory"`.
- [x] 4.2 Replace `?mode=endless` and `?seed` parsing in `src/main.ts` with `urlParams.has("skip")` to invoke `arena.bypassToCampaignVictory()` on startup.
- [x] 4.3 Add comprehensive unit tests in `src/entities/Arena.test.ts` validating that `bypassToCampaignVictory()` sets post-Zenith state, that Card 0 ([E] / [Space] / click) deploys to Endless Protocol with all 7 upgrades, 3 shields, and 8 ammo, and that Card 1 ([R] / [Shift+R] / click) resets to Room 1. Verify with `npm test src/entities/Arena.test.ts`.

## 5. Verification & Documentation

- [x] 5.1 Run full Vitest test suite (`npm test`) and build verification (`npm run build`) to ensure all tests pass with zero regressions.
- [x] 5.2 Validate OpenSpec change compliance with `openspec validate remove-procedural-mode-and-add-playtest-bypass --strict`.
- [x] 5.3 Update `README.md` and `AGENTS.md` to remove mentions of `LevelDirector` and procedural random mode, documenting the clean two-phase progression (`Campaign → Victory → Endless Protocol`) and the `?skip` bypass hook.
