# Design: Campaign Victory Screen & Boss Encounter Flow Alignment

## Context

ChronoShot's combat architecture decouples discrete physics (`FixedStepSimulator`), time dilation (`TimeGovernor`), room progression (`RoomManager`), and stateful encounter coordinators (`EndlessDirector`, `LevelDirector`). Currently, Room 20's completion logic is short-circuited: stepping into an in-arena golden portal calls `startEndlessMode()` directly, which leaves `RoomManager.isGameCompleted()` permanently false and renders `RoomManager.renderGameVictory()` unreachable. Furthermore, all boss rooms and the endless colosseum render inactive, locked floor portals, and Chrono-Zenith's death triggers an upgrade draft whose selection is overwritten by Endless Mode's full 7-augmentation loadout.

See `proposal.md` for motivation and `specs/` for behavioral requirements.

## Goals / Non-Goals

**Goals:**
- **Clean Arena Geometry**: Suppress floor exit portal rendering in all boss rooms (Rooms 5, 10, 15, 20) and in Endless Mode, eliminating inactive locked crimson circles from high-stakes arenas.
- **Unified Boss Lifecycle**:
  - Intermediate bosses (5, 10, 15): Core destruction immediately pops the Tactical Upgrade Draft; card selection advances directly to the next sector.
  - Final boss (20: Chrono-Zenith): Core destruction immediately triggers `MISSION ACCOMPLISHED` campaign victory, skipping the redundant upgrade draft and golden floor portal.
- **Interactive Dual-Card Victory HUD**: Upgrade `RoomManager.renderGameVictory()` (or introduce a decoupled `VictoryHUD`) with two interactive cards styled with the same Swiss cyberpunk aesthetic as `DefeatHUD`:
  - **Card 1 (Endless Protocol)**: `[E]`, `[Space]`, or mouse click $\to$ invokes `startEndlessMode()` (Apex Colosseum with all 7 upgrades, 3 shields, 8 rounds).
  - **Card 2 (Expedition Reset)**: `[R]`, `[Shift+R]`, or mouse click $\to$ invokes `restart()` back to Room 1.
- **Input & Cursor Synchronization**: Support mouse hover, pointer cursor, and keyboard triggers in victory state in both `Arena.ts` and `main.ts`.
- **Documentation Alignment**: Synchronize `AGENTS.md` and `README.md` to reflect the refined progression architecture.

**Non-Goals:**
- Modifying standard puzzle room portal behavior (Rooms 1–4, 6–9, 11–14, 16–19 retain locked crimson $\to$ radiant cyan floor portals).
- Changing Endless Survival Mode wave spawning, threat budgets, or telegraph mechanics once inside the Colosseum.
- External visual or audio binary assets.

## Decisions

### 1. Boss Arena Floor Portal Suppression
- **Decision**: In `RoomManager.renderPortal()`, early-return if `this.isBossRoom() || this.endlessDirector !== undefined`.
- **Why**: Boss rooms are strictly combat elimination arenas where progression is awarded upon boss core destruction, not by walking to a portal. Suppressing floor portal rendering prevents "zombie" locked crimson markers from cluttering the floor.
- **Alternative Considered**: Leaving the portal visible but permanently locked. Rejected because it looks like a bug or an unopened puzzle door to the player.

### 2. Immediate Campaign Victory on Chrono-Zenith Core Shatter
- **Decision**: In `Arena.ts` projectile collision handling, when an enemy with `isBoss === true` suffers lethal damage:
  - If `this.roomManager?.getCurrentRoom().roomNumber === 20` (or `!this.roomManager?.hasNextRoom()`):
    - Do NOT call `this.openUpgradeDraft()`.
    - Set `this.status = "victory"`.
    - Set `this.roomManager.advanceRoom()` (which marks `isGameCompleted = true`).
    - Trigger `soundSynth.playBossDefeat()` and `soundSynth.playVictory()`.
  - For all other bosses (Rooms 5, 10, 15):
    - Retain existing behavior: `this.openUpgradeDraft()`, which auto-advances to the next room upon selection.
- **Why**: Zenith is the final encounter of the 20-room campaign. Granting an upgrade draft when the campaign is already won—only to overwrite it with all 7 upgrades in Endless—is jarring and redundant.

### 3. Dual-Card Victory HUD with Interactive Pointer Support
- **Decision**: Render dual interactive cards on the `MISSION ACCOMPLISHED` victory overlay:
  - Card 1: `ENTER ENDLESS PROTOCOL` (`[E]` / `[Space]` / click) — highlights cyan on hover.
  - Card 2: `EXPEDITION RESET` (`[R]` / `[Shift+R]` / click) — highlights cyan on hover.
  - Reuse the card dimensions ($280 \times 170\text{px}$, $40\text{px}$ gap) and hover detection patterns from `DefeatHUD`.
  - Update `arena.getDesiredCursor()` to return `"pointer"` when hovering over victory cards, and update `main.ts` mousedown/keydown to handle `[E]`, `[Space]`, and card clicks during `arena.status === "victory"`.
- **Why**: Provides a definitive emotional payoff and gives players immediate agency without forcing them through unintended game modes.

## Risks / Trade-offs

- **[Risk] Test suite breakages for Room 20 golden portal stepping** → *Mitigation*: Existing tests in `Arena.test.ts` and `RoomManager.test.ts` that manually stepped into the Room 20 golden portal will be refactored to verify that killing Chrono-Zenith sets `arena.status = "victory"` and `roomManager.isGameCompleted() === true`, and selecting Card 1 transitions to Endless Survival Mode.
- **[Risk] Keyboard shortcut collision in main loop** → *Mitigation*: Ensure key bindings for `[E]` and `[Space]` in `main.ts` only trigger Endless Mode when `arena.status === "victory"`, leaving standard dash inputs unaffected during active combat.

## Migration Plan

1. Update `RoomManager.ts` to suppress floor portal rendering in boss rooms and endless mode, and update `renderGameVictory()` with dual interactive cards and hover tracking.
2. Update `Arena.ts` boss elimination logic to route Room 20 to `status = "victory"` and handle victory card hover, clicks, and keys (`[E]`, `[Space]`, `[R]`).
3. Update `main.ts` input wiring to dispatch victory interactions.
4. Refactor and expand unit tests in `RoomManager.test.ts` and `Arena.test.ts`.
5. Update `AGENTS.md` and `README.md` to document the clean progression flow.
