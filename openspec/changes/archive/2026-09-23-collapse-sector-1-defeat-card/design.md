# Design

## Context

ChronoShot's defeat interface (`DefeatHUD.ts`) currently renders a dual-card presentation on any player elimination regardless of sector:
1. Card 0: Checkpoint Rollback (`[R]`), rolling back to the preceding boss checkpoint with that boss entry's loadout snapshot.
2. Card 1: Full Expedition Reset (`[Shift+R]`), abandoning the run and restarting at Room 1 with 0 augmentations.

In Sector 1 (Rooms 1–5), no boss checkpoint exists yet. Thus, `RollbackCalculator` targets Room 1 with 0 augmentations for both options. Presenting two separate cards with identical functional outcomes creates confusion.

See `proposal.md` for problem context and motivation.

## Goals / Non-Goals

**Goals:**
- Dynamically detect when elimination occurs in Sector 1 (`roomNumber <= 5`) versus later sectors (`roomNumber > 5`).
- In Sector 1, render a single centered reset card (`cardCount = 1`, centered at `(arenaWidth - cardW) / 2`).
- Accept `[R]`, `[Shift+R]`, or mouse click on the single card to restart the run back to Room 1.
- Ensure hit testing (`DefeatHUD.getCardAt`) and cursor styling (`Arena.getDesiredCursor`) accurately match single-card vs dual-card bounds.
- Maintain existing dual-card behavior intact for Sectors 2–4 (Rooms 6–20) and Endless Mode.

**Non-Goals:**
- Altering the cascading rollback algorithm for Sectors 2–4 or Endless Mode.
- Modifying how player death, particles, or audio are synthesized.
- Changing upgrade drafting or loadout snapshot logic.

## Decisions

### 1. Parametric Layout & Hit Detection in `DefeatHUD`
- **Decision**: Update `computeDefeatLayout(arenaWidth, arenaHeight, cardCount: 1 | 2 = 2)` and `getCardAt(mouseX, mouseY, arenaWidth, arenaHeight, cardCount: 1 | 2 = 2)`.
  - When `cardCount === 1`:
    - `totalW = cardW` (280px).
    - `startX = Math.floor((arenaWidth - cardW) / 2)` (340px on 960px arena).
    - `cards = [{ x: startX, y: cardY, width: cardW, height: cardH }]`.
    - `getCardAt(...)` checks only `cards[0]` and returns `0` if hit, else `null`.
  - When `cardCount === 2`:
    - Existing two-card layout (`startX = 180`, Card 0 at 180, Card 1 at 500) and hit testing (`0 | 1 | null`).
- **Rationale**: Keeps layout calculation pure and deterministic while avoiding separate layout algorithms for 1-card and 2-card HUD states.
- **Alternatives Considered**:
  - Hardcoding Sector 1 checks inside `DefeatHUD`: Having `DefeatHUD.computeDefeatLayout` take `cardCount` directly decouples geometry math from domain room rules, making testing trivial.

### 2. Single Reset Card Presentation & Styling
- **Decision**:
  - Top badge: `[ R ]` (prominent keybind; `Shift+R` also works in code).
  - Title: `EXPEDITION RESET`.
  - Destination: `ROOM 01 // FRESH START`.
  - Description: `Restart expedition from Room 01 (0 Augmentations)`.
  - Action Prompt: `>> CLICK TO RESTART <<`.
  - Palette: Crimson themed with crimson accent bar and dim red card background, matching the reset card aesthetic.
- **Rationale**: Reuses established visual tokens from `DefeatHUD.renderResetCard`, ensuring aesthetic consistency while clearly conveying that the run is starting over.
- **Alternatives Considered**:
  - Showing both `[ R / SHIFT+R ]` in the key badge: The 50px badge is too small for long text; `[ R ]` is concise and the standard quick restart key.

### 3. Input Routing in `Arena.ts`
- **Decision**:
  - In `Arena.step`, check if `isSingleCard` (`roomNumber <= 5`).
  - Pass `isSingleCard ? 1 : 2` to `DefeatHUD.getCardAt`.
  - If `isSingleCard`:
    - Both `input.restart` (`[R]`) and `input.fullReset` (`[Shift+R]`) invoke `this.restart()`.
    - Clicking Card index `0` invokes `this.restart()`.
  - If not `isSingleCard`:
    - Retain existing routing: `input.restart` and clicking Card `0` invoke `this.rollbackToCheckpoint()`, while `input.fullReset` and clicking Card `1` invoke `this.restart()`.
- **Rationale**: Guarantees that whether the player presses `R`, presses `Shift+R`, or clicks the single card, the run resets cleanly to Room 1.

## Risks / Trade-offs

- **[Risk] Test regressions in existing defeat test suites** →
  - **Mitigation**: Existing tests in `DefeatHUD.test.ts` and `Arena.test.ts` that specifically test Room 5 defeat or generic defeat layouts will be updated to test both Sector 1 (single card at x: 340..620) and Sectors 2+ (dual cards at 180..460 and 500..780).
