# Tasks

## 1. UI Framing and Canvas Cursor Setup

- [x] 1.1 Remove the `.controls-bar` element from `index.html`, configure canvas cursor to `none`, and adjust layout styles for a clean self-contained frame. Verify layout renders without the lower control tray.
- [x] 1.2 Create shared UI theme tokens in `src/ui/theme.ts` defining standard typography stack, palette colors, and panel styling. Verify TypeScript compilation succeeds.

## 2. In-Canvas Precision Reticle

- [x] 2.1 Implement an in-canvas tactical reticle renderer in `src/ui/Reticle.ts` featuring a central micro-dot, directional tick marks, time-dilation expansion, and dry-fire warning flash. Verify reticle renders at mouse coordinates.
- [x] 2.2 Wire reticle rendering and dry-fire triggers into `src/entities/Arena.ts`. Verify reticle visually reacts to movement acceleration and flashes crimson on empty fire.

## 3. Minimalist HUD Redesign

- [x] 3.1 Redesign `src/ui/CylinderHUD.ts` with hairline circular dial geometry, 6 micro-chamber pips (loaded cyan vs. hollow spent), active chamber alignment notch, and clean status typography. Verify unit tests pass in `src/ui/HUD.test.ts`.
- [x] 3.2 Redesign `src/ui/TimeHUD.ts` into a top-right hairline telemetry gauge displaying numeric speed multiplier (`CHRONO // 0.05x`) and transient action burst pills. Verify unit tests pass in `src/ui/HUD.test.ts`.
- [x] 3.3 Streamline room header rendering in `src/levels/RoomManager.ts` to anchor in the top-left corner with crisp letter-spaced typography, preventing overlap with arena gameplay. Verify room header positioning.

## 4. Simulation Pause System and Minimalist Controls Overlay

- [x] 4.1 Implement pause state in `src/entities/Arena.ts` and wire `Escape` / `KeyP` event handlers in `src/main.ts` to toggle pause, suspending simulation updates while keeping rendering active. Verify pressing `Escape` toggles paused state.
- [x] 4.2 Render an unobtrusive `[ESC] PAUSE` corner hint during active combat, and render a frosted dark card displaying the full control matrix when paused. Verify pausing displays the control matrix and clicking or pressing `Escape` resumes combat.

## 5. Overlay Modernization and Verification

- [x] 5.1 Modernize Defeat, Victory, and Mission Accomplished screens in `src/entities/Arena.ts` and `src/levels/RoomManager.ts` with clean typographic layouts and restart prompts. Verify defeat and victory displays render cleanly.
- [x] 5.2 Run the full test suite (`npm test`) and production build (`npm run build`) to ensure all tests pass and no regressions are introduced.
