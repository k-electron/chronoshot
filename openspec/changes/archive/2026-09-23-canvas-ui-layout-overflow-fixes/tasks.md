# Tasks

## 1. Canvas Typography & Layout Helpers

- [x] 1.1 Create `src/ui/textUtils.ts` with `truncateText`, `wrapTextLines`, and `measureTextWidth` and verify unit tests in `src/ui/textUtils.test.ts` pass
- [x] 1.2 Implement monospace fallback measurement for mock environments lacking `ctx.measureText` and verify edge cases (empty strings, single characters, long unspaced words, lines exceeding budget) pass in `textUtils.test.ts`

## 2. Top HUD Spatial Budget & Layout De-confliction

- [x] 2.1 Update `Arena.ts` to reposition the `[ESC] PAUSE` combat hint from `y = 46` to `y = 66` below `TimeHUD` and verify `Arena.test.ts` and `HUD.test.ts` pass
- [x] 2.2 Standardize `EndlessTelemetryHUD.ts` card width to 440px and compact separators from `    |    ` to `  |  ` and verify `HUD.test.ts` passes
- [x] 2.3 Update `RoomManager.ts:renderRoomHeader` to enforce `maxWidth = 220px`, suppress duplicate survival stats in Endless Mode, and clamp/suppress tactical tips during active boss encounters, verifying `RoomManager.test.ts` passes
- [x] 2.4 Add width-bounded truncation to `BossTelemetryHUD.ts` for `bossTitle` and `phaseBadge` ensuring phase progression pips and shield pips never collide, verifying `BossTelemetryHUD.test.ts` passes

## 3. Modal Overlays & Card Containment

- [x] 3.1 Update `UpgradeDraftHUD.ts` to truncate archetype subtitles with `truncateText`, apply strict 5-line budgeted wrapping to descriptions stopping above the "INSTALL" button, and parameterize progression prompts, verifying `UpgradeDraftHUD.test.ts` passes
- [x] 3.2 Update `DefeatHUD.ts` to format rollback and reset descriptions across two balanced lines fitting within the 280px card bounds, verifying `DefeatHUD.test.ts` passes

## 4. Victory Screen Multi-Row Formatting & Divider Alignment

- [x] 4.1 Update `RoomManager.ts:renderGameVictory` to format the 4 milestone boss achievements across 2 balanced rows within the 840px frame boundary and verify `RoomManager.test.ts` passes
- [x] 4.2 Update `Arena.ts` regular room victory to widen decorative divider lines from 320px to 400px enclosing all text, and verify `Arena.test.ts` passes

## 5. Full Suite Verification & Build

- [x] 5.1 Run complete Vitest suite (`npm test`) and ensure all 660+ tests pass with zero regressions and under 700ms execution time
- [x] 5.2 Run production build (`npm run build`) and verify TypeScript compilation and asset bundling succeed with zero errors
