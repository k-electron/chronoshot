# Proposal: Minimalist HUD and UI Overhaul

## Why

ChronoShot's core gameplay and time-dilation mechanics operate smoothly, but the visual interface and HUD feel unpolished and cluttered. The current HUD relies on chunky arcade-style gradient bars, a heavy mechanical cylinder graphic, disjointed HTML text controls beneath the canvas, and the browser's default crosshair cursor. 

This proposal transforms ChronoShot's user interface into a completely clean, minimalist tactical presentation—fusing sleek peripheral telemetry with center-focused reticle feedback, elevating the game to a cohesive, high-end indie aesthetic.

## What Changes

- **In-Canvas Precision Reticle**: Replaces the default OS cursor with a clean, in-canvas tactical crosshair (center point with micro tick marks) that dynamically pulses with time dilation and flashes signal crimson on dry-fire or empty cylinder.
- **Minimalist Hairline Cylinder HUD**: Overhauls the revolver cylinder graphic from a bulky mechanical wheel into an ultra-clean hairline circular dial with 6 crisp micro-chamber pips (radiant cyan for loaded, hollow slate rings for spent, active chamber alignment notch).
- **Streamlined Chrono-Telemetry**: Replaces the 200x12px gradient progress bar with a top-right hairline latency meter and clean numeric readout (`CHRONO // 0.05x` up to `1.00x`), accompanied by transient action burst pills (`+6 FIRE`, `+30 RELOAD`).
- **Clean Tactical Room Header**: Anchors room titles and sector protocols into a crisp, letter-spaced top-left header, eliminating floating text interference in the active combat arena.
- **Minimalist Lifecycle & Pause Overlay**: Removes the external HTML controls bar below the canvas. During active combat, controls are hidden except for a subtle corner reminder (`[ESC] PAUSE`). Pressing `[ESC]` halts the simulation and opens a clean, semi-transparent frosted card displaying the full control matrix.
- **Modernized Encounter Overlays**: Refines Defeat, Victory, and Game Completed screens into elegant typographic overlays with stats and clean action prompts.

## Capabilities

### New Capabilities
*(None - existing capabilities cover combat arena interactions and weapon telemetry).*

### Modified Capabilities
- `combat-arena`: Adds requirements for custom in-canvas precision aiming reticle, simulation pause toggle (`[ESC]`), active-combat HUD minimalism, and refined encounter transition overlays.
- `weapon-system`: Updates the Cylinder HUD visualization requirement to specify a minimalist hairline dial with 6 micro-chamber pips, active chamber alignment notch, and dynamic dry-fire warning.

## Impact

- **Canvas & Markup**: `index.html` removes the `.controls-bar` footer element and configures canvas cursor styling.
- **Game Engine & Arena**: `src/entities/Arena.ts` and `src/main.ts` gain pause state handling (`Escape` / `KeyP`), custom crosshair rendering, and modern overlay rendering.
- **UI Modules**: `src/ui/CylinderHUD.ts` and `src/ui/TimeHUD.ts` are redesigned for hairline minimalism, unified typography, and dynamic animations.
- **Tests**: `src/ui/HUD.test.ts` and `src/entities/Arena.test.ts` updated to assert new rendering contracts and pause lifecycle states.
