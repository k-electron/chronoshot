# Design

## Context

ChronoShot renders its tactical interface entirely onto an HTML5 Canvas 2D context (`960x640`). HUD components and overlays were developed independently without a unified horizontal column budget or safe text measurement guards. As documented in `proposal.md`, this led to several spatial collisions:
- `renderRoomHeader` drawing 740px tactical tips across the center `BossTelemetryHUD` and redundant stats colliding with `EndlessTelemetryHUD`.
- Top-right corner pause hint `[ESC] PAUSE` sharing baseline `y = 46..47` with `TimeHUD` status text.
- 54-character strings overflowing the 360px `EndlessTelemetryHUD` card.
- `UpgradeDraftHUD` archetype subtitles exceeding card widths and descriptions drawing over the "INSTALL" button.
- `DefeatHUD` single-line loadout descriptions exceeding card borders by ~38px.
- `RoomManager.renderGameVictory` 115-character string exceeding the 840px victory frame border.

## Goals / Non-Goals

**Goals:**
- Eliminate 100% of text overflows, out-of-bounds text rendering, and HUD component collisions across all game modes (Campaign, Boss Encounters, Endless Survival Mode, Pause, Defeat, and Victory).
- Introduce a zero-dependency text measurement and bounding utility (`src/ui/textUtils.ts`).
- Establish a strict 3-column top HUD horizontal spatial budget that prevents future layout collisions.
- Preserve zero-allocation hot-loop performance and fast deterministic Vitest execution (< 700ms).

**Non-Goals:**
- Introducing external canvas UI libraries (Konva, Pixi, ImGui) or HTML/CSS DOM overlays.
- Redesigning visual themes, color schemes, or typography tokens defined in `src/ui/theme.ts`.
- Changing gameplay balance, difficulty tiers, or upgrade mechanics.

## Decisions

### 1. Zero-Dependency Canvas Typography Engine (`src/ui/textUtils.ts`)
- **Choice**: Implement lightweight text utility functions (`truncateText`, `wrapTextLines`, `measureTextWidth`) directly on Canvas 2D context.
- **Rationale**: Keeps the codebase lean and deterministic with zero runtime overhead and no extra bundle size, strictly honoring `AGENTS.md`. Avoids DOM mocking friction in tests.
- **Alternatives Considered**:
  - *Third-party canvas library (Konva, Pixi-UI)*: Rejected due to heavy retained-mode object allocations, bundle weight, and architectural conflict with `AGENTS.md`.
  - *HTML/CSS DOM overlays*: Rejected because ChronoShot's reticle hardware crosshair, mouse hit-testing, and entire render pipeline are 100% Canvas 2D; dual DOM/canvas architectures introduce sync complexity and slow down Vitest.

### 2. 3-Column Top HUD Spatial Budget
- **Layout Definition**:
  ```text
  0px                     240px       260px                    700px       740px               960px
   |                        |           |                        |           |                   |
   +------------------------+           +------------------------+           +-------------------+
   |     LEFT: Room HUD     |   (gap)   |   CENTER: Boss/Endless |   (gap)   |  RIGHT: Time HUD  |
   |     (x: 24 .. 240)     |   20px    |     (x: 260 .. 700)    |   40px    |  (x: 776 .. 936)  |
   +------------------------+           +------------------------+           +-------------------+
  ```
- **Left Column (`x = 24..240`, max width 220px)**:
  - In `RoomManager.renderRoomHeader`, enforce `maxWidth = 220px`.
  - During boss encounters, suppress or truncate the tactical tip so the player's focus remains on boss telemetry without visual collision.
  - In Endless Mode, suppress duplicate survival stats (threat, elapsed time, kills) since `EndlessTelemetryHUD` is the dedicated display.
- **Center Column (`x = 260..700`, width 440px)**:
  - Standardize `EndlessTelemetryHUD` card width to 440px (matching `BossTelemetryHUD`).
  - Compact stats text separators from `    |    ` to `  |  ` (saving 8 chars / ~60px), ensuring the 46-char string sits comfortably inside 440px with 45px padding.
  - In `BossTelemetryHUD`, apply `truncateText` to `bossTitle` and `phaseBadge` to guarantee phase progression pips and shield pips never collide.
- **Right Column (`x = 776..936`, width 160px)**:
  - `TimeHUD` gauge remains at `x = 776..936`, `y = 20..50`.
  - In `Arena.ts`, move combat `[ESC] PAUSE` hint from `y = 46` down to `y = 66` directly below the time gauge, completely resolving the baseline overlap with action burst pills (`+30 TICKS [RELOAD]`).

### 3. Tactical Upgrade Draft Card Containment (`UpgradeDraftHUD`)
- **Archetype Header Subtitle**: Calculate available header width `maxW = cardW - pad * 2 - badgeW - 8`. Truncate long archetypes (e.g. `TACTICAL // BURST LOCOMOTION`) with `truncateText` to guarantee it never breaches the right card border.
- **Description Budgeting**: Descriptions wrap using `wrapTextLines` with a maximum of 5 lines at `lineHeight = 15`. If description text exceeds 5 lines, the fifth line is truncated with an ellipsis (`…`). This guarantees description text stops well above the "INSTALL" button (`btnY = cardY + cardH - 45`).
- **Dynamic Progression Prompts**: Replace hardcoded "SECTOR 1" and "ZONE 2" with dynamic prompts based on current room index or parameterized sector strings (e.g. `SECTOR BOSS NEUTRALIZED`, `ADVANCE TO NEXT SECTOR`).

### 4. Defeat HUD Card Formatting (`DefeatHUD`)
- Split long loadout rollback descriptions into two balanced lines:
  - Line 1: `Restores Sector X entry loadout` (~200px)
  - Line 2: `(Y Augmentations)` (~110px)
- Split Sector 1 reset descriptions:
  - Line 1: `Restart expedition from Room 01` (~200px)
  - Line 2: `(0 Augmentations)` (~110px)
- Both lines fit within `cardW = 280` with comfortable 35px+ horizontal margins.

### 5. Victory Screen Formatting
- **Campaign Victory (`RoomManager.renderGameVictory`)**: Split the 115-char string into 2 centered lines within the 840px box:
  - Row 1: `✓ Goliath-01 Defeated    |    ✓ Chrono-Weaver Neutralized` (~55 chars, ~385px)
  - Row 2: `✓ Vektor-Prime Obliterated    |    ✓ Chrono-Zenith Overthrown` (~57 chars, ~400px)
- **Room Victory (`Arena.ts`)**: Increase hairline divider width from 320px (`±160`) to 400px (`±200`), cleanly enclosing the 322px–327px status strings.

## Risks / Trade-offs

- **[Risk]** Existing unit tests asserting exact `fillText` calls or coordinates may break when coordinates are adjusted (e.g. `[ESC] PAUSE` moving to `y = 66`, or victory checkmark rows).
  → **Mitigation**: Update corresponding test assertions in `Arena.test.ts`, `RoomManager.test.ts`, `HUD.test.ts`, and `UpgradeDraftHUD.test.ts` to verify the new non-overlapping coordinates and multi-line calls.
- **[Risk]** Canvas text measurement in mock test environments (`createMockContext`) might not implement `measureText`.
  → **Mitigation**: `textUtils.ts` falls back gracefully to standard monospace aspect ratio estimation (`str.length * 7`) when `ctx.measureText` is missing or unmocked.
