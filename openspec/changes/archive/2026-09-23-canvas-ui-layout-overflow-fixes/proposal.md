# Proposal

## Why

In ChronoShot's HTML5 Canvas 2D tactical HUD and modal overlays, multiple UI components suffer from text overflow, boundary violations, and spatial overlaps across the 960x640 canvas. Unbounded tactical tips and duplicated endless telemetry in `renderRoomHeader` collide with the centered `BossTelemetryHUD` and `EndlessTelemetryHUD`, the combat `[ESC] PAUSE` hint shares a vertical baseline and overlaps with `TimeHUD` action burst pills, card descriptions in `DefeatHUD` and `UpgradeDraftHUD` extend past card borders or draw over action buttons, and single-line victory texts breach the viewport bounding frame. Fixing these issues guarantees clean, readable, professional UI presentation adhering to ChronoShot's geometric cyberpunk minimalist aesthetic without introducing third-party library bloat.

## What Changes

- **In-Engine Typography & Layout Helpers (`src/ui/textUtils.ts`)**: Introduce zero-dependency, zero-allocation-friendly text measurement, ellipsis truncation (`truncateText`), and bounded word wrapping (`wrapTextLines`) with strict line budgets and clipping.
- **Top HUD 3-Column Spatial Partition**:
  - Left Zone (`x = 24..240`): Restrict `renderRoomHeader` to a maximum width of 220px. In Endless Mode, suppress redundant survival telemetry duplication. During active boss encounters, suppress or tightly clamp tactical guidance to prevent collision with top-center boss telemetry.
  - Center Zone (`x = 260..700`, width 440px): Standardize `EndlessTelemetryHUD` to 440px (matching `BossTelemetryHUD`), compacting text separators from 4 spaces to 2 spaces (`THREAT: X  |  SURVIVED: MM:SS  |  KILLS: Y`) so text never overflows the card. Add ellipsis truncation guards to `BossTelemetryHUD` to guarantee phase badges/pips never collide with shield pips.
  - Right Zone (`x = 776..936`): Move combat `[ESC] PAUSE` hint from `y = 46` down to `y = 66`, cleanly below the `TimeHUD` gauge and action burst status line (`y = 47`), eliminating baseline text collision.
- **Tactical Upgrade Draft Bounded Card Rendering (`UpgradeDraftHUD`)**:
  - Truncate archetype subtitles with ellipsis if they exceed available card header width.
  - Apply line-budgeted word wrapping to card descriptions (`maxLines = 5` or bounded height) so text never touches or overlaps the "INSTALL" action button.
  - Parameterize header and footer progression text (e.g. "SECTOR BOSS NEUTRALIZED", "ADVANCE TO NEXT SECTOR") rather than hardcoding "SECTOR 1" and "ZONE 2".
- **Defeat HUD Card Bounds & Multi-Line Loadout Formatting (`DefeatHUD`)**:
  - Split loadout rollback descriptions and Sector 1 reset descriptions into two clean lines (`Restores Sector X entry loadout` / `(Y Augmentations)`), preventing horizontal spillover past the 280px card borders.
- **Victory Screen Alignment & Multi-Row Formatting**:
  - Split the 4-boss victory string in `RoomManager.renderGameVictory` into two balanced rows of 2 bosses, keeping all text within the 840px hairline border frame.
  - Widen regular room victory divider lines in `Arena.ts` from 320px to 400px so enclosed victory text sits comfortably within the divider boundaries.

## Capabilities

### New Capabilities
*(None)*

### Modified Capabilities
- `combat-arena`: Updates HUD and overlay requirements to enforce non-overlapping top HUD horizontal partitioning, non-colliding corner pause hint placement below time telemetry, multi-line defeat card description containment, and divider alignment on victory screens.
- `procedural-levels`: Updates endless telemetry HUD dimensions (440px width with compacted separators) and room progression header constraints (suppression of duplicate stats in endless mode, width clamping during boss encounters to avoid center HUD collision, and 2-row game victory text formatting).
- `roguelike-upgrades`: Updates tactical upgrade draft HUD requirements to enforce archetype header truncation, strict line-budgeted description wrapping preventing overlap with the install button, and dynamic sector/zone progression prompts.

## Impact

- **Affected Code**: `src/ui/textUtils.ts` (new), `src/ui/TimeHUD.ts`, `src/ui/EndlessTelemetryHUD.ts`, `src/ui/UpgradeDraftHUD.ts`, `src/ui/DefeatHUD.ts`, `src/ui/BossTelemetryHUD.ts`, `src/levels/RoomManager.ts`, `src/entities/Arena.ts`.
- **Dependencies**: Zero external dependencies added.
- **Performance & Testing**: Retains 100% Canvas 2D determinism and fast Vitest execution under 700ms.
