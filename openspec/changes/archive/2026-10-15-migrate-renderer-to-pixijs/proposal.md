# Proposal

## Why

ChronoShot's current rendering architecture relies exclusively on the browser HTML5 Canvas 2D API (`CanvasRenderingContext2D`). While lightweight and zero-dependency, Canvas 2D limits visual fidelity by lacking native GPU shader pipelines (bloom, chromatic aberration, glow filters, screen distortions) and faces CPU fill-rate bounds during high particle counts and multi-unit bullet hell novae. Migrating the rendering layer to Pixi.js v8 leverages hardware-accelerated WebGL/WebGPU rendering, multi-pass GPU filter shaders, and batched geometry rendering while strictly preserving ChronoShot's core 60 Hz deterministic fixed-step simulation, sub-tick interpolation, and 960x640 virtual resolution.

## What Changes

- **Pixi.js v8 Integration**: Introduce Pixi.js (`pixi.js`) as the underlying hardware-accelerated rendering engine powering the canvas backing surface via asynchronous `await app.init({ preserveDrawingBuffer: true, ... })`.
- **Decoupled 12-Layer Stage Hierarchy**: Re-architect arena presentation into a two-tier Pixi scene graph:
  - `worldContainer` (GPU-filtered): `FloorGridLayer`, `PortalLayer`, `CataclysmFlashLayer` (rendered beneath obstacles/units to preserve cover silhouettes), `ObstacleLayer`, `ProjectileLayer`, `TelegraphLayer`, `EntityLayer`, and `ParticleLayer`.
  - `hudContainer` (unfiltered, crisp hairline vectors & typography): `TelemetryLayer`, `ReticleLayer`, `PortalTransitionLayer`, and `ModalOverlayLayer`.
- **Sub-Tick Interpolation in Scene Graph**: Update entity transforms during `requestAnimationFrame` using sub-tick alpha interpolation (`alpha = timeGovernor.getAlpha()`), decoupling simulation ticks from display refresh.
- **Procedural Geometric Graphics & Vector Primitives**: Convert `EnemyRenderer`, `ChronoAnchorRenderer`, `Reticle`, `Obstacle`, `PortalTransition`, `CataclysmFlashController`, and projectile drawing to `PIXI.Graphics` with custom dashed-line tessellation (`drawDashedLine`), octagonal hole cutting (`.cut()`), and radial gradient visibility masking.
- **GPU Visual Shader Effects**: Add multi-pass post-processing filter pipelines on `worldContainer` (luminance-thresholded bloom for cyan/crimson energy, chromatic aberration pulses on damage/dash, CRT scanline vignette, and radial shockwave distortion).
- **Headless Test Harness & `PixiContext2DAdapter` Bridge**: Provide an in-repo TypeScript headless mock render harness (`src/rendering/headless/`) and a `PixiContext2DAdapter` bridge so the game remains continuously playable throughout incremental migration and all 769+ existing Vitest unit tests (including 250+ `expect(ctx.*)` assertions) run in ~1 second in Node without native WebGL dependencies.
- **Architectural Policy Update (BREAKING)**: Supersede the previous constraint in `AGENTS.md` ("no Phaser, Three.js, or Pixi.js") to permit Pixi.js strictly for the presentation/rendering layer while keeping simulation, physics, and AI zero-dependency and fully deterministic.

## Capabilities

### New Capabilities
- `visual-effects-pipeline`: Covers hardware-accelerated GPU post-processing filters (luminance-thresholded bloom, chromatic aberration pulses, radial energy shockwaves) and headless testing compatibility integrated with the Pixi.js render pipeline.

### Modified Capabilities
- `combat-arena`: Updates rendering engine requirements to mandate Pixi.js WebGL/WebGPU stage composition, sub-tick transform interpolation, procedural dashed/geometric hull rendering, and headless test compatibility while preserving 960x640 coordinate parity and high-DPI scaling.

## Impact

- **Dependencies**: Add `pixi.js` (v8) to `package.json` dependencies (zero native C++/GL devDependencies required; headless mocks are pure TypeScript).
- **Core Engine & Presentation**: Introduce `PixiArenaRenderer` and `StageCoordinator` in `src/rendering/`, wire async initialization in [src/main.ts](file:///Users/karim/Documents/repos/chronoshot/src/main.ts), preserve synchronous `Arena.render(ctx)` compatibility in [src/entities/Arena.ts](file:///Users/karim/Documents/repos/chronoshot/src/entities/Arena.ts), and migrate entity/UI renderers ([EnemyRenderer.ts](file:///Users/karim/Documents/repos/chronoshot/src/ui/EnemyRenderer.ts), [CylinderHUD.ts](file:///Users/karim/Documents/repos/chronoshot/src/ui/CylinderHUD.ts), [TimeHUD.ts](file:///Users/karim/Documents/repos/chronoshot/src/ui/TimeHUD.ts), [BossTelemetryHUD.ts](file:///Users/karim/Documents/repos/chronoshot/src/ui/BossTelemetryHUD.ts), [EndlessTelemetryHUD.ts](file:///Users/karim/Documents/repos/chronoshot/src/ui/EndlessTelemetryHUD.ts), [DefeatHUD.ts](file:///Users/karim/Documents/repos/chronoshot/src/ui/DefeatHUD.ts), [VictoryHUD.ts](file:///Users/karim/Documents/repos/chronoshot/src/ui/VictoryHUD.ts), [UpgradeDraftHUD.ts](file:///Users/karim/Documents/repos/chronoshot/src/ui/UpgradeDraftHUD.ts), [PortalTransition.ts](file:///Users/karim/Documents/repos/chronoshot/src/levels/PortalTransition.ts), [CataclysmFlashController.ts](file:///Users/karim/Documents/repos/chronoshot/src/entities/boss/CataclysmFlashController.ts)).
- **Testing & Tooling**: Preserve all 769 existing unit tests via `createMockContext()` and `PixiContext2DAdapter`, add new scene-graph and shader tests in `src/rendering/`, and update [scripts/capture-preview.mjs](file:///Users/karim/Documents/repos/chronoshot/scripts/capture-preview.mjs) to capture frames cleanly from the WebGL canvas.
- **Documentation**: Update [AGENTS.md](file:///Users/karim/Documents/repos/chronoshot/AGENTS.md) architectural guidelines to define the strict boundary between Pixi.js presentation and deterministic simulation.
