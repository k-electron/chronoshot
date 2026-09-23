# Tasks

## 1. Upgrade Draft Card Hover Visuals & HUD Enhancements

- [x] 1.1 Update `renderUpgradeDraft` and `UpgradeDraftHUD` to accept an optional `hoveredIndex: number | null` parameter and verify existing tests continue to pass
- [x] 1.2 Implement card hover styling in `UpgradeDraftHUD` (illuminated card background, glowing accent border, and highlighted install button)
- [x] 1.3 Add unit tests in `src/ui/UpgradeDraftHUD.test.ts` verifying hover styling execution and non-hover baseline rendering

## 2. Dynamic Cursor State & Coordination in Arena

- [x] 2.1 Add `getDesiredCursor(mousePos: Vector2D): string` and track `hoveredUpgradeCardIndex` in `Arena`, returning `'pointer'` on cards, `'default'` on modal overlays, and `'none'` in combat
- [x] 2.2 Wire `hoveredUpgradeCardIndex` through `Arena.step` and `Arena.render` into `renderUpgradeDraft`
- [x] 2.3 Add unit tests in `src/entities/Arena.test.ts` verifying cursor states during active combat, upgrade draft hover, modal pause, and defeat/victory overlays

## 3. Canvas CSS & Mouse Event Integration

- [x] 3.1 Update `index.html` canvas CSS to allow programmatic `canvas.style.cursor` management without static `cursor: none` lock
- [x] 3.2 Update `src/main.ts` to sync `canvas.style.cursor` each frame and ensure mouse clicks trigger upgrade card acquisition cleanly
- [x] 3.3 Execute `npm test` and `npm run build` to verify all 511+ automated tests pass and production build succeeds
