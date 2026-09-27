# Design: Documentation Metrics, Room Telemetry, and In-Place Endless Pruning

## Context

See [proposal.md](proposal.md) for background and motivation. ChronoShot enforces strict 60 Hz physics determinism with zero garbage generation in the hot loop (`FixedStepSimulator.step()`, `Arena.fixedUpdate()`). Currently, `Arena.fixedUpdate()` executes `this.enemies = this.enemies.filter((e) => e.isAlive)` every tick during Endless Mode, allocating an array on every simulation tick. Concurrently, documentation metrics in `AGENTS.md` and `README.md` have drifted from the codebase's current scale (712 tests, 20 rooms).

## Goals / Non-Goals

**Goals:**
- Eliminate heap allocations from `Arena.ts`'s Endless Mode dead hostile pruning pass, keeping `this.enemies` reference stable across ticks where no hostiles are eliminated.
- Align `AGENTS.md`'s test performance guideline with current wall-clock execution metrics (~1.5s for 712+ tests across 43 test suites).
- Correct Room 9 shield count from 6 to 4 across `src/levels/Room.ts`, `src/levels/RoomManager.test.ts`, and `README.md`.
- Ensure `README.md` summaries for Room 9 and Room 11 clearly reflect their exact squad rosters and difficulty progression (Room 11 being the harder 165-point, 6-hostile encounter positioned after Chrono-Weaver).

**Non-Goals:**
- Modifying room enemy formations, spawn coordinates, or threat budgets in `Room.ts` (the current layouts are balanced and validated across all 21 maps).
- Rewriting hostile collection structures across standard campaign rooms (standard rooms only have 3–6 enemies per room and transition upon clearing).

## Decisions

### Decision 1: Two-Pointer In-Place Hostile Compaction vs Filter in `Arena.ts`

- **Choice**: Implement two-pointer in-place compaction directly on `this.enemies`.
  ```ts
  if (this.endlessDirector) {
    let writeIdx = 0;
    let hasDead = false;
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (enemy.isAlive) {
        if (hasDead) {
          this.enemies[writeIdx] = enemy;
        }
        writeIdx++;
      } else {
        hasDead = true;
      }
    }
    if (hasDead) {
      for (let i = writeIdx; i < this.enemies.length; i++) {
        (this.enemies as any)[i] = undefined;
      }
      this.enemies.length = writeIdx;
    }
  }
  ```
- **Rationale**: On the vast majority of ticks, no enemies are killed (`hasDead === false`), resulting in a single loop that performs zero writes, zero array mutations, and zero allocations. When an enemy is destroyed, elements are compacted in place, dead references cleared to allow immediate V8 garbage collection, and array length updated without replacing the array instance.
- **Alternatives Considered**:
  - `this.enemies = this.enemies.filter((e) => e.isAlive)`: Allocates 60 arrays per second at 60 Hz.
  - Secondary scratch array: Requires storing an extra buffer on `Arena` and copying between them. In-place compaction achieves $O(1)$ auxiliary space.

### Decision 2: Update Test Suite Duration Metric in `AGENTS.md`

- **Choice**: Update the documentation line in `AGENTS.md` from `The entire suite (712+ tests) runs in under 900ms` to `The entire suite (712+ tests) runs in ~1.5s`.
- **Rationale**: While pure test assertion execution is ~740ms, total test runner time includes TypeScript file compilation/transforms (870ms), suite collection (2.15s across worker threads), and environment setup, resulting in ~1.5s wall-clock duration. Documenting ~1.5s sets an honest, accurate expectation while keeping tests deterministic.

### Decision 3: Room 9 Shield Telemetry & Room 9/11 Sequencing

- **Choice**: Correct Room 9 shield count from 6 to 4 in `src/levels/Room.ts`, `src/levels/RoomManager.test.ts`, and `README.md`. Retain Room 9 as "The Iron Gate" (160 pts, 4 hostiles, 8 lethal hits needed) and Room 11 as "Vanguard Breach" (165 pts, 6 hostiles, 10 lethal hits needed).
- **Rationale**:
  - Room 9's enemy roster has `warden-lead` (2 shields), `warden-flank` (2 shields), `marksman-anchor` (0 shields), and `stalker-infiltrator` (0 shields). The total shields to break is $2 + 2 = 4$.
  - Room 11's enemy roster has `warden-center` (2 shields), `guard-top` (1 shield), `guard-bottom` (1 shield), `stalker-vanguard` (0 shields), `grunt-support-1` (0 shields), and `grunt-support-2` (0 shields). Total shields is $2 + 1 + 1 = 4$, but with 6 distinct units and 10 lethal hits required, it is strictly harder than Room 9.
  - This perfectly aligns with the principle that harder encounters should appear later: Room 9 serves as the climax of Zone 2 (equipped with 1 upgrade), while Room 11 serves as the higher-pressure Sector 3 entry calibration (equipped with 2 upgrades post-Chrono-Weaver).

## Risks / Trade-offs

- **[Risk] Garbage collection reference retention on truncated array slots**: In V8, simply setting `array.length = smallerLength` can retain references in hidden class elements.
  - $\rightarrow$ *Mitigation*: Null out trailing elements (`this.enemies[i] = undefined as any`) before setting `this.enemies.length = writeIdx`.
- **[Risk] Stale test assertions checking for "6 enemy shield hits"**:
  - $\rightarrow$ *Mitigation*: Update `src/levels/RoomManager.test.ts` line 198 to assert `4 enemy shield hits to break` matching the updated `tacticalTip`.
