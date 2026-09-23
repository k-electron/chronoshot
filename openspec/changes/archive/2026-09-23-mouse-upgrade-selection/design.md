# Design: Mouse Pointer for Upgrade Draft Selection

## Context

ChronoShot's canvas displays a custom cyberpunk crosshair reticle during active combat. To prevent visual doubling between the operating system cursor and the in-canvas reticle, `index.html` currently specifies `cursor: none;` on the `<canvas>` element.

When a boss is neutralized, the arena halts simulation ticks and displays the `UpgradeDraftHUD` overlay. Because `cursor: none;` is statically declared in CSS, the player's mouse pointer is completely invisible on the canvas during upgrade selection. Although `UpgradeDraftHUD.getCardAt()` and click-handling logic exist in `Arena.ts`, players cannot see their cursor, cards do not display hover feedback, and players feel forced to use keyboard keys `[1]`, `[2]`, `[3]` despite the visual card presentation.

## Goals / Non-Goals

**Goals:**
- Provide clear mouse pointer visibility across the canvas whenever the upgrade draft overlay (or pause/game-over screens) is active.
- Dynamically update canvas cursor styling: `cursor: pointer` when hovering over draft cards and `cursor: default` when hovering over the draft backdrop.
- Render responsive visual hover feedback on the targeted upgrade card (illuminated card glass panel, brighter accent borders, highlighted `INSTALL [N]` button).
- Support immediate, single-click upgrade selection and installation while preserving keyboard number shortcuts (`[1]`, `[2]`, `[3]`, `[4]`).
- Cleanly restore `cursor: none` and the in-canvas tactical reticle when advancing into the next combat room.

**Non-Goals:**
- Replacing the custom in-canvas reticle during active combat gameplay.
- Removing or altering existing keyboard shortcut controls (`[1]`, `[2]`, `[3]`, `[4]`).
- Modifying upgrade mechanics, stats, or registry definitions.

## Decisions

### 1. Dynamic Canvas Cursor Lifecycle Management
- **Decision**: Remove static `cursor: none;` from `index.html` CSS and manage `canvas.style.cursor` dynamically in `src/main.ts` based on arena state.
- **Rules**:
  - `arena.isUpgradeDraftActive`:
    - If `getCardAt(mousePos.x, mousePos.y, ...)` returns a valid card index: `canvas.style.cursor = 'pointer'`.
    - Otherwise: `canvas.style.cursor = 'default'`.
  - `arena.isPaused`, `arena.status === 'defeat'`, or `arena.status === 'victory'`: `canvas.style.cursor = 'default'`.
  - Active combat play: `canvas.style.cursor = 'none'` (delegating aim tracking to `Reticle.ts`).
- **Alternatives Considered**:
  - *In-Canvas Procedural Mouse Cursor*: Drawing a custom triangular or arrow pointer on the 2D canvas. Rejected because native OS hardware cursors provide sub-millisecond responsiveness with zero input latency, respect user accessibility settings, and feel natural across all display scaling configurations.

### 2. Reactive Hover Visuals in `UpgradeDraftHUD`
- **Decision**: Extend `renderUpgradeDraft` and `UpgradeDraftHUD.render` to accept an optional `hoveredIndex: number | null = null`.
- **Visual Feedback Specification**:
  - When card `i === hoveredIndex`:
    - **Card Background**: Illuminates to `rgba(20, 26, 38, 0.98)` (vs default `rgba(13, 17, 24, 0.96)`).
    - **Card Border**: Upgraded from subtle `panelBorder` (`#1c2330`) to the card's vibrant `accentColor` (with subtle glow effect or 1.5px stroke).
    - **Install Button**: Replaced from translucent neutral button to filled accent button (`fillStyle = accent`, text styled with dark high-contrast `#070a0f` bold label).
  - When `hoveredIndex` is omitted or `null`, rendering matches existing baseline styles (full backward compatibility with existing tests).

### 3. State Coordination in `Arena` and `main.ts`
- **Decision**: In `Arena`, expose a method/getter `getDesiredCursor(mousePos: Vector2D): string` or track `hoveredUpgradeCardIndex` directly during `step` and `render`.
- **Implementation**:
  - `Arena.step`: Track `mousePos` continuously. When `isUpgradeDraftActive`, calculate `hoveredCardIndex = UpgradeDraftHUD.getCardAt(mousePos.x, mousePos.y, draftCards.length, this.width, this.height)` and store it on the arena instance.
  - `Arena.render`: Pass `this.hoveredUpgradeCardIndex` into `this.renderUpgradeDraft(ctx, this.hoveredUpgradeCardIndex)`.
  - `main.ts`: In the render loop, set `canvas.style.cursor = arena.getDesiredCursor(mousePos)`.
  - `main.ts` input dispatch: When `arena.isUpgradeDraftActive` and mouse is clicked, ensure the click immediately installs the hovered card and transitions rooms cleanly.

## Risks / Trade-offs

- **[Risk] Canvas Coordinate Mismatch**: High-DPI screens or canvas CSS scaling might cause mouse coordinates to drift from card layout hitboxes.
  - **Mitigation**: `main.ts` already computes canvas coordinates using `(event.clientX - rect.left) * (canvas.width / rect.width)`. The same coordinate space `(960 x 640)` is used by `computeCardLayout` and `getCardAt`, guaranteeing exact alignment.
- **[Risk] Test Suite Compatibility**: Existing `UpgradeDraftHUD.test.ts` suites invoke `renderUpgradeDraft` without mouse position or hover parameters.
  - **Mitigation**: Make `hoveredIndex` optional with a default value of `null`. Existing tests will continue to pass without modification.
