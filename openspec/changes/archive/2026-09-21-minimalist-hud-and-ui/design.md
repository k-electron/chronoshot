# Design: Minimalist HUD & Tactical UI Architecture

## Context

ChronoShot operates on a decoupled 60 Hz fixed-step simulation loop coordinated by `TimeGovernor` and rendered via Canvas 2D in `Arena.render()`. 

The current interface relies on:
- A mechanical revolver wheel in `CylinderHUD.ts` (32px radius with heavy brass/cyan fills).
- A 200x12px gradient progress bar in `TimeHUD.ts`.
- Raw HTML control text below the canvas in `index.html`.
- The browser's default OS crosshair cursor.

This design overhauls the HUD and game framing into a unified, high-polish tactical interface combining peripheral hairline telemetry with reticle-centric combat feedback.

## Goals / Non-Goals

**Goals:**
- **In-Canvas Precision Reticle**: Render an in-canvas tactical crosshair at mouse coordinates with `cursor: none` on the canvas element, featuring dynamic pulse on time acceleration and dry-fire warning.
- **Hairline Revolver Cylinder**: Re-architect `CylinderHUD` into a minimalist circular dial with hairline borders, crisp micro-pips (loaded/spent), active chamber index notch, and sleek typography.
- **Hairline Chrono-Telemetry**: Re-architect `TimeHUD` into a top-right hairline gauge with clean numeric readout (`0.05x` to `1.00x`) and transient action burst pills.
- **Clean In-Canvas Pause Lifecycle**: Introduce toggleable pause via `[ESC]`, halting simulation ticks and rendering a subtle, frosted Swiss-style control matrix card while completely removing the HTML `.controls-bar`.
- **Streamlined Overlays**: Modernize the top-left room header banner, defeat screen, and victory screen with refined typography and accent hairlines.

**Non-Goals:**
- Changing core weapon parameters, time-dilation math, bullet speeds, or enemy AI algorithms.
- Replacing HTML5 Canvas 2D with WebGL or 3D graphics libraries.

## Decisions

### Decision 1: In-Canvas Hardware Reticle vs. Custom CSS Cursor
- **Choice**: Implement an in-canvas reticle directly rendered in `Arena.render()` at mouse/aim coordinates, hiding the OS mouse pointer via `cursor: none`.
- **Rationale**: Direct Canvas rendering guarantees sub-pixel synchronization with the player's aim angle, allows dynamic bracket expansion proportional to `TimeGovernor.getTimeScale()`, and enables instant signal-crimson dry-fire flashes without CSS animation lag.
- **Alternative Considered**: CSS custom cursor (`cursor: url(...)`). Rejected because it cannot dynamically react to time dilation scaling or simulate weapon dry-fire flashes.

### Decision 2: Hairline Revolver Dial Architecture
- **Choice**: Retain the 6-chamber revolver layout using 1px hairline concentric geometry:
  - Translucent backing ring (`rgba(14, 18, 26, 0.75)`).
  - 6 circular micro-chambers: radiant cyan dots (`#00f0ff`) when loaded; clean hollow slate rings (`#252e3d`) when spent.
  - Micro-notch at 12 o'clock indicating the chamber under the firing hammer.
  - Minimalist ammo counter (`6 / 6`) and status text (`READY` vs `[R] RELOAD`).
- **Rationale**: Respects the user's explicit preference for the revolver mechanism while eliminating visual heaviness.
- **Alternative Considered**: Linear magazine strip. Rejected because the circular revolver is iconic to ChronoShot's tactical flavor.

### Decision 3: Simulation Pause State in Arena
- **Choice**: Introduce `isPaused: boolean` in `Arena`. `main.ts` listens for `Escape` (and `KeyP`) to toggle pause:
  - While paused, `Arena.step()` bypasses physics simulation ticks and timer advancements.
  - `Arena.render()` renders the frozen combat frame, then applies a semi-transparent dark veil (`rgba(8, 10, 15, 0.85)`) with an elegant, centered controls matrix.
  - Clicking the canvas or pressing `Escape` unpauses combat.
- **Rationale**: Eliminates the external HTML controls bar entirely during active play, keeping the screen pristine while providing comprehensive control guidance on demand.
- **Alternative Considered**: Halting `requestAnimationFrame` loop. Rejected because the pause menu overlay and animated reticle/transitions require active rendering.

### Decision 4: Typography & Palette System
- **Choice**: Standardize on a unified typography stack: `"SF Mono", "Segoe UI Mono", "Cascadia Code", monospace` with deliberate letter-spacing and hierarchy.
- **Palette**:
  - Background/Panels: Obsidian `#0b0d11`, Panel Glass `rgba(14, 18, 26, 0.85)`, Hairline `#252e3d`.
  - Chrono/Player: Radiant Cyan `#00f0ff`, Muted Cyan `#00bcd4`, Stark White `#ffffff`.
  - Threat/Lethal: Signal Crimson `#ff3344`, Warning Amber `#ffb700`.
  - Muted Text: Slate `#64748b`, Dark Slate `#475569`.

## Risks / Trade-offs

- **[Risk] Mouse coordinates leaving canvas**: If the player moves the cursor outside the canvas element, the in-canvas reticle might freeze at the edge.
  - *Mitigation*: Track mouse enter/leave events; clamp aim coordinates to arena bounds and render gracefully.
- **[Risk] Browser Escape Key Interception**: In certain browsers or fullscreen modes, `Escape` triggers browser actions.
  - *Mitigation*: Call `event.preventDefault()` on `Escape` keydown when canvas has focus or container is active.
- **[Risk] Regression in existing HUD unit tests**: `src/ui/HUD.test.ts` checks specific text strings and canvas method invocations.
  - *Mitigation*: Update unit tests to reflect the new typography and visual layouts while preserving test coverage.
