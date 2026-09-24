# Proposal

## Why

In Sector 1 (Rooms 1–5), the player has not yet cleared any milestone boss checkpoint. Currently, the defeat HUD displays two separate cards ("Timeline Rollback" to Room 1 and "Expedition Reset" to Room 1), which is redundant and confusing because both options return the player to Room 1 with 0 augmentations. Collapsing the defeat screen in Sector 1 to a single centered reset card streamlines user experience and eliminates cognitive noise on early deaths.

## What Changes

- **Single Defeat Card for Sector 1**: When the player is eliminated in Rooms 1 through 5, display a single centered reset card rather than dual cards.
- **Unified Sector 1 Input Routing**: On Sector 1 defeat, pressing `[R]`, pressing `[Shift+R]`, or clicking the single reset card triggers a fresh expedition restart to Room 1 with 0 augmentations.
- **Preserved Multi-Card HUD for Later Sectors**: Keep dual cards (Rollback to preceding boss checkpoint and Full Reset to Room 1) active when eliminated in Sector 2, Sector 3, Sector 4, or Endless Mode (Rooms 6+).
- **Responsive / Centered Layout Calculation**: Update `DefeatHUD.computeDefeatLayout` and `DefeatHUD.getCardAt` to dynamically compute layout and hit bounds based on whether a single card (Sector 1) or dual cards (Sectors 2–4, Endless) are being rendered.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `combat-arena`: Modify `One-Hit Lethality and Instant Room Reset` so that elimination in Sector 1 (Rooms 1–5) displays a single centered interactive reset card that resets the expedition to Room 1, while maintaining dual cards for Rooms 6+.

## Impact

- `src/ui/DefeatHUD.ts`: Support single-card layout computation, hit detection, and rendering when `roomNumber <= 5`.
- `src/entities/Arena.ts`: Pass current room number / single-card indicator to `DefeatHUD.getCardAt`, and route hover/click input correctly when in single-card mode.
- `src/ui/DefeatHUD.test.ts` & `src/entities/Arena.test.ts`: Update existing tests and add unit tests verifying single-card layout, hit detection, rendering, and input handling for Rooms 1–5 vs Rooms 6+.
