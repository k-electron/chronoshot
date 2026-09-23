# Proposal: Mouse Pointer for Upgrade Draft Selection

## Why

During active combat, ChronoShot enforces `cursor: none` on the HTML5 canvas and renders a custom in-canvas tactical crosshair reticle. However, when a milestone boss is defeated and the tactical upgrade draft overlay appears, this static CSS rule hides the native operating system mouse pointer across the entire canvas without rendering any UI mouse cursor in its place. 

As a result, the player sees no mouse pointer at all during upgrade selection, cards lack interactive hover feedback, and players feel forced to use keyboard number keys `[1]`, `[2]`, `[3]` even though the interface is presented as a visual card layout. Restoring a visible mouse pointer and providing reactive hover states makes card selection intuitive, tactile, and natural for both mouse and keyboard players.

## What Changes

- **Dynamic Canvas Cursor Management**: Transition the canvas cursor from static `cursor: none` in CSS to state-aware dynamic cursor management:
  - During active combat, cursor remains hidden (`none`) while the custom hairline reticle tracks the aimpoint.
  - When the upgrade draft overlay (or pause / victory / defeat overlays) is active, the mouse pointer is made visible (`default` on the overlay background, `pointer` when hovering over upgrade cards).
- **Interactive Card Hover States in `UpgradeDraftHUD`**:
  - Accept mouse coordinates during overlay render to detect the currently hovered card index via `getCardAt()`.
  - Render distinctive hover feedback for the targeted card: illuminated glass background, brightened archetype accent borders, and highlighted `INSTALL [N]` button.
- **Robust Mouse Click Selection**:
  - Ensure mouse clicks on cards reliably trigger `applyUpgrade` without unexpected conflict with weapon firing logic.
  - Support both primary mouse click selection and existing keyboard shortcut keys (`[1]`, `[2]`, `[3]`, `[4]`).

## Capabilities

### New Capabilities
*(None)*

### Modified Capabilities
- `roguelike-upgrades`: Update draft selection and card UI requirements to mandate visible mouse pointer support, interactive card hover highlights, cursor styling (`pointer` / `default`), and responsive click-to-install interactions.
- `combat-arena`: Update tactical reticle and UI overlay requirements to specify the dynamic canvas cursor lifecycle, restoring native mouse pointer visibility when UI overlays are active and suppressing it only during active combat play.

## Impact

- **UI & Entities**:
  - `index.html`: Update canvas CSS to avoid permanently locking `cursor: none` in a way that prevents programmatic cursor switching.
  - `src/main.ts`: Track mouse hover position during upgrade draft, manage canvas cursor style dynamically based on arena UI state, and dispatch card selection on click.
  - `src/ui/UpgradeDraftHUD.ts`: Extend rendering functions to accept hover state/mouse coordinates and render reactive hover visuals (accent glows, button highlights).
  - `src/entities/Arena.ts`: Expose active UI/cursor state requirements, propagate mouse hover state to draft rendering, and coordinate clean mouse click selection.
- **Tests**:
  - New and updated unit tests for `UpgradeDraftHUD` hover rendering, layout hit-testing, and `Arena` cursor/selection lifecycle.
