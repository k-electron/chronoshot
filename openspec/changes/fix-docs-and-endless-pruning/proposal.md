# Proposal

## Why

Auditing ChronoShot's documentation, level telemetry, and engine loops reveals three subtle discrepancies:
1. `AGENTS.md` documents Vitest suite duration as "under 900ms", whereas with 712+ tests across 43 test suites and TypeScript transforms, the full suite execution time is ~1.5s.
2. In `README.md` and `Room.ts`, Room 9 ("The Iron Gate") claims to require "6 total shield breaks" / "6 enemy shield hits to break", while the actual enemy roster (2 Aegis Wardens @ 2 shields, 1 Marksman @ 0 shields, 1 Stalker @ 0 shields) contains only 4 shields. Furthermore, comparing Room 9 (160 pts, 4 enemies, 8 lethal hits needed, 1-upgrade loadout) and Room 11 ("Vanguard Breach": 165 pts, 6 enemies, 10 lethal hits needed, 2-upgrade loadout) confirms that Room 11 is the harder encounter and is appropriately sequenced after Milestone Boss 2 (Chrono-Weaver, Room 10), but their README summary descriptions need strict alignment with code.
3. In `Arena.ts`, the Endless Mode dead enemy pruning pass executes `this.enemies = this.enemies.filter((e) => e.isAlive)` every 60 Hz simulation tick. This allocates a new array on every tick regardless of whether any enemies died, violating `AGENTS.md`'s core "no garbage in hot loop" performance rule.

## What Changes

- **Update Vitest Suite Duration Metric in `AGENTS.md`**: Update test suite performance documentation from "under 900ms" to "~1.5s" (while maintaining deterministic, timeout-free testing standards).
- **Correct Room 9 Shield Telemetry & Reconcile README Room Profiles**:
  - Update `tacticalTip` in `src/levels/Room.ts` (`createRoom9`) from "6 enemy shield hits to break" to "4 enemy shield hits to break".
  - Update test assertion in `src/levels/RoomManager.test.ts` accordingly.
  - Update `README.md` Room 09 summary from "requiring 6 total shield breaks" to "requiring 4 total shield breaks".
  - Verify and reconcile README Room 09 and Room 11 descriptions to reflect their exact in-engine squad compositions, threat budgets, and difficulty progression (Room 11 being the harder 6-unit gauntlet calibrated for 2 upgrades).
- **In-Place Zero-Allocation Endless Hostile Pruning**:
  - Replace `this.enemies = this.enemies.filter((e) => e.isAlive)` in `Arena.fixedUpdate()` / `Arena.step()` with an in-place array compaction algorithm (or dead-unit check before compaction) that mutates `this.enemies` without allocating a new array reference every tick.
  - Add unit tests in `src/entities/Arena.test.ts` ensuring dead units are pruned in Endless Mode while the array reference remains stable and zero array allocations occur during ticks where all hostiles remain alive.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `procedural-levels`: Refines the Endless Mode hostile pruning scenario to mandate in-place zero-allocation array compaction during simulation ticks, and clarifies Room 09 / Room 11 tactical shield and squad composition requirements.

## Impact

- **Code Files**:
  - `src/entities/Arena.ts`: In-place compaction for dead hostile pruning in Endless Mode.
  - `src/entities/Arena.test.ts`: Tests validating in-place pruning and reference stability.
  - `src/levels/Room.ts`: Correct tactical tip for Room 9 shield count (4 vs 6).
  - `src/levels/RoomManager.test.ts`: Align Room 9 tactical tip assertion.
- **Documentation**:
  - `AGENTS.md`: Update test suite execution time metric to ~1.5s.
  - `README.md`: Correct Room 9 shield count (4) and align Room 9 & Room 11 descriptions.
- **Dependencies & APIs**: Zero breaking changes, zero API modifications.
