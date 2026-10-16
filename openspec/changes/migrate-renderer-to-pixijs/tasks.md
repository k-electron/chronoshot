# Tasks

## 1. Dependencies, Vector Primitives, and Headless Render Harness

- [x] 1.1 Add `pixi.js` v8 dependency to `package.json` and verify clean installation and TypeScript type resolution with `npm run build`.
- [x] 1.2 Implement procedural vector geometry helpers (`drawDashedLine`, `drawDashedCircle`, and octagonal `.cut()` aperture builder) in `src/rendering/vectorGeometry.ts` and verify unit tests in `src/rendering/vectorGeometry.test.ts`.
- [x] 1.3 Implement `MockPixiRenderer` and `PixiContext2DAdapter` (bridging `CanvasRenderingContext2D` draw calls to Pixi display objects and preserving `textUtils.ts` measurement parity) in `src/rendering/headless/` and verify unit tests run cleanly in Vitest's pure Node environment.

## 2. 12-Layer Scene Graph, Sub-Tick Interpolation, and Async Bootstrap

- [x] 2.1 Implement `StageCoordinator` in `src/rendering/StageCoordinator.ts` with the 12-layer Z-order (`FloorGridLayer`, `PortalLayer`, `CataclysmFlashLayer`, `ObstacleLayer`, `ProjectileLayer`, `TelegraphLayer`, `EntityLayer`, `ParticleLayer` under `worldContainer`; `TelemetryLayer`, `ReticleLayer`, `PortalTransitionLayer`, `ModalOverlayLayer` under `hudContainer`) and high-DPI scaling (`resolution: dpr`, `autoDensity: true`, `preserveDrawingBuffer: true`), verifying layer ordering in `src/rendering/StageCoordinator.test.ts`.
- [x] 2.2 Implement `RenderInterpolator` and `PixiArenaRenderer` in `src/rendering/PixiArenaRenderer.ts` decoupling 60 Hz physics from display refresh via `alpha = timeGovernor.getAlpha()`, and wire async `await pixiRenderer.init(canvas)` in `src/main.ts` while keeping `Arena.render(ctx)` synchronous for existing tests.

## 3. World Container Entity Display Object Migration

- [x] 3.1 Migrate `Player` chassis, reactive shield rings, and `ChronoAnchorRenderer` to persistent Pixi display objects in `EntityLayer` while retaining `render(ctx)` compatibility, verifying `src/ui/ChronoAnchorRenderer.test.ts` and `src/entities/Player.test.ts`.
- [x] 3.2 Migrate `EnemyRenderer` chassis profiles (diamond, rounded, chevron, hexagon, star, octagon), hardpoints, shield auras, dotted sightlines (`drawDashedLine`), and charging laser beams to `EntityLayer` and `TelegraphLayer`, verifying all tests in `src/ui/EnemyRenderer.test.ts`.
- [x] 3.3 Implement `DisplayObjectPool` in `src/rendering/DisplayObjectPool.ts` and migrate projectile tracer trails (`ProjectileLayer`) and wall-clock `ParticleSystem` shards (`ParticleLayer`) to pooled `PIXI.Graphics` instances, verifying zero-leak pool recycling and `src/entities/ParticleSystem.test.ts`.
- [x] 3.4 Migrate static `Obstacle` rendering (`ObstacleLayer`), floor exit portal (`PortalLayer`), and `CataclysmFlashController` 3-stop radial gradient visibility polygon (`CataclysmFlashLayer`, ordered beneath `ObstacleLayer` to preserve cover silhouettes), verifying `src/entities/boss/CataclysmFlashController.test.ts`.

## 4. HUD Container and Telemetry Layer Migration

- [x] 4.1 Migrate `Reticle` (`ReticleLayer`), `CylinderHUD`, `TimeHUD`, `BossTelemetryHUD`, `EndlessTelemetryHUD`, and room header (`TelemetryLayer`) to unfiltered `hudContainer` display objects with crisp hairline alignment, verifying `src/ui/HUD.test.ts` and `src/ui/BossTelemetryHUD.test.ts`.
- [x] 4.2 Migrate `PortalTransitionController` octagonal iris shroud using Pixi v8 `.cut()` winding (`PortalTransitionLayer`) and modal overlays (`UpgradeDraftHUD`, `DefeatHUD`, `VictoryHUD`, and Pause matrix in `ModalOverlayLayer`), verifying `src/levels/PortalTransition.test.ts`, `src/ui/UpgradeDraftHUD.test.ts`, `src/ui/DefeatHUD.test.ts`, and `src/ui/VictoryHUD.test.ts`.

## 5. GPU Post-Processing Filter Pipeline

- [x] 5.1 Implement luminance-thresholded radiant bloom filter on `worldContainer` in `src/rendering/filters/WorldFilterPipeline.ts` so cyan/crimson energy primitives glow while `#0e1117` floor and `#1e242f` obstacles remain un-bloomed, verifying filter threshold and HUD isolation tests.
- [x] 5.2 Implement chromatic aberration RGB-split pulse filter triggered on operative damage and Overcharge Dash impacts, verifying transient activation and wall-clock decay tests.
- [x] 5.3 Implement radial shockwave displacement filter triggered on Cataclysm detonations and the 30-tick Boss Defeat slow-motion collapse, verifying distortion radius and wall-clock dissipation tests.

## 6. Integration, Capture Tooling, Documentation, and Final Verification

- [x] 6.1 Update [scripts/capture-preview.mjs](file:///Users/karim/Documents/repos/chronoshot/scripts/capture-preview.mjs) to remove the conflicting `canvas.getContext("2d")` call on `#game-canvas` and verify WebGL frame capture compatibility.
- [x] 6.2 Update [AGENTS.md](file:///Users/karim/Documents/repos/chronoshot/AGENTS.md) architectural guidelines to document the Pixi.js v8 presentation boundary, 12-layer scene graph, and headless testing architecture.
- [x] 6.3 Execute the full test suite (`npm test`) and production build (`npm run build`), verifying all 769+ existing and new tests pass deterministically in ~1.5 seconds with zero TypeScript errors.
