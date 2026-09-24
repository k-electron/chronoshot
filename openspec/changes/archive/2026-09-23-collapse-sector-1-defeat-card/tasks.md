# Tasks

## 1. DefeatHUD Layout and Rendering

- [x] 1.1 Update `computeDefeatLayout` in `src/ui/DefeatHUD.ts` to support single-card centering when `cardCount === 1` and verify with unit tests in `src/ui/DefeatHUD.test.ts`
- [x] 1.2 Update `getCardAt` in `src/ui/DefeatHUD.ts` to accept `cardCount` and verify hit detection for single-card vs dual-card layouts in `src/ui/DefeatHUD.test.ts`
- [x] 1.3 Update `DefeatHUD.render` to render a single centered reset card when `data.roomNumber <= 5`, and verify with mock render tests in `src/ui/DefeatHUD.test.ts`

## 2. Arena Input Integration

- [x] 2.1 Update `Arena.step` in `src/entities/Arena.ts` to pass single-card state to `DefeatHUD.getCardAt` and route `[R]`, `[Shift+R]`, and mouse clicks to full restart when eliminated in Rooms 1–5
- [x] 2.2 Update `Arena.getDesiredCursor` in `src/entities/Arena.ts` to use single-card hit bounds when `roomNumber <= 5`
- [x] 2.3 Update existing tests and add new tests in `src/entities/Arena.test.ts` to verify single-card hover and restart execution in Sector 1 (Rooms 1–5) while preserving dual-card rollback in Sector 2+ (Rooms 6+)

## 3. Verification & Validation

- [x] 3.1 Run full test suite (`npm test`) and typecheck build (`npm run build`) to ensure all tests pass and no regressions exist
- [x] 3.2 Validate change compliance with `openspec validate collapse-sector-1-defeat-card --strict`
