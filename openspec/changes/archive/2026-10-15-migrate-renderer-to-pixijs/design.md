# Design

## Context

ChronoShot's current rendering loop resides in [Arena.ts](file:///Users/karim/Documents/repos/chronoshot/src/entities/Arena.ts#L1011-L1228) and is driven by an imperative `CanvasRenderingContext2D` pass executed on every `requestAnimationFrame` in [main.ts](file:///Users/karim/Documents/repos/chronoshot/src/main.ts#L223). While this keeps the engine zero-dependency and enables fast Vitest unit testing via mock 2D contexts (`createMockContext()`), it prevents the use of GPU shader pipelines (bloom glows, chromatic aberration, radial shockwave distortions) and requires manual CPU stroke/fill calls for all geometric primitives.

The migration introduces Pixi.js v8 to take ownership of the canvas presentation pipeline while keeping simulation ticks (60 Hz in [FixedStepSimulator.ts](file:///Users/karim/Documents/repos/chronoshot/src/engine/FixedStepSimulator.ts)), time dilation ([TimeGovernor.ts](file:///Users/karim/Documents/repos/chronoshot/src/engine/TimeGovernor.ts)), continuous collision detection ([collision.ts](file:///Users/karim/Documents/repos/chronoshot/src/math/collision.ts)), A* pathfinding ([GridPathfinder.ts](file:///Users/karim/Documents/repos/chronoshot/src/engine/GridPathfinder.ts)), and procedural Web Audio ([SoundSynthesizer.ts](file:///Users/karim/Documents/repos/chronoshot/src/audio/SoundSynthesizer.ts)) completely decoupled, zero-dependency, and deterministic.

## Goals / Non-Goals

**Goals:**
- Initialize a `PIXI.Application` (v8 WebGL/WebGPU) via async `await app.init({ canvas, width: 960, height: 640, resolution: dpr, autoDensity: true, antialias: true, preserveDrawingBuffer: true })` managing the 960x640 canvas with high-DPI retina backing store scaling.
- Establish a strict 12-layer Z-order hierarchy split across `worldContainer` (GPU-filtered) and `hudContainer` (unfiltered).
- Preserve sub-tick render interpolation (`alpha = timeGovernor.getAlpha()`) by updating Pixi container/graphics transforms on each display frame without coupling to simulation step ticks.
- Implement a multi-pass GPU filter pipeline on `worldContainer` featuring luminance-thresholded bloom (cyan/crimson emissive glow without muddying `#0e1117`/`#1e242f` dark surfaces), chromatic aberration pulses, and radial shockwave distortion.
- Maintain persistent display objects (`PIXI.Graphics` / `PIXI.Container`) with object pooling for projectiles and particles to avoid garbage allocation and CPU tessellation churn.
- Provide a `PixiContext2DAdapter` bridge and pure-TypeScript headless mock harness (`src/rendering/headless/`) so the game remains continuously playable at every migration step and all 769+ existing Vitest tests (including 250+ `expect(ctx.*)` assertions) continue to run in ~1 second in Node (`environment: "node"`).

**Non-Goals:**
- Transitioning from geometric vector art to bitmap sprite sheets or textured models (the game retains its cyberpunk geometric vector aesthetic).
- Modifying simulation logic, physics quanta, weapon mechanics, or AI behavior trees.
- Replacing browser Web Audio API procedural synthesis with audio libraries.

## Decisions

### 1. Two-Tier, 12-Layer Z-Order Architecture (`worldContainer` vs `hudContainer`)
- **Choice**: The Pixi root stage will host two primary top-level containers with an explicit 12-layer Z-order matching [Arena.ts](file:///Users/karim/Documents/repos/chronoshot/src/entities/Arena.ts#L1011-L1228):
  - **`worldContainer` (GPU Post-Processing Filters Applied)**:
    1. `FloorGridLayer`: `#0e1117` background fill and `#161b22` 40px hairline grid cached as static geometry.
    2. `PortalLayer`: Unlocked floor exit portal beacon ([RoomManager.ts](file:///Users/karim/Documents/repos/chronoshot/src/levels/RoomManager.ts)).
    3. `CataclysmFlashLayer`: Occluded 2D visibility polygon radial flash ([CataclysmFlashController.ts](file:///Users/karim/Documents/repos/chronoshot/src/entities/boss/CataclysmFlashController.ts)), positioned *below* obstacles and combat units so cover walls and unit silhouettes remain sharply readable during apex detonation.
    4. `ObstacleLayer`: Static `#1e242f` walls/pillars with `#384556` borders.
    5. `ProjectileLayer`: Pooled luminous cyan/crimson tracer lines and white bullet cores.
    6. `TelegraphLayer`: Cataclysm hazard warning rings, Endless materialization rings, enemy dotted sightlines, and Marksman charging laser beams.
    7. `EntityLayer`: `ChronoAnchorRenderer` ground clamps, `EnemyRenderer` procedural hulls/shields, and `Player` chassis/shield rings.
    8. `ParticleLayer`: Wall-clock shatter shards, deflection sparks, and expanding shockwave rings ([ParticleSystem.ts](file:///Users/karim/Documents/repos/chronoshot/src/entities/ParticleSystem.ts)).
  - **`hudContainer` (Unfiltered for Razor-Sharp Hairline Vectors & Typography)**:
    9. `TelemetryLayer`: `TimeHUD`, `CylinderHUD`, `BossTelemetryHUD`, `EndlessTelemetryHUD`, room header, and `[ESC] PAUSE` hint.
    10. `ReticleLayer`: In-canvas precision crosshair ([Reticle.ts](file:///Users/karim/Documents/repos/chronoshot/src/ui/Reticle.ts)).
    11. `PortalTransitionLayer`: Cyberpunk octagonal iris shroud and cyan aperture blades ([PortalTransition.ts](file:///Users/karim/Documents/repos/chronoshot/src/levels/PortalTransition.ts)).
    12. `ModalOverlayLayer`: Pause control matrix card, `UpgradeDraftHUD`, `DefeatHUD`, and `VictoryHUD`.
- **Rationale**: Isolating `hudContainer` prevents bloom and displacement shaders from blurring `Inter` / `JetBrains Mono` typography or shifting crosshair coordinates, while placing `CataclysmFlashLayer` at Layer 3 preserves tactical cover visibility.
- **Alternatives Considered**: Global stage filters (blurs HUD text); placing `CataclysmFlashLayer` above obstacles (washes out cover silhouettes during boss overloads).

### 2. Persistent Display Objects with Transform Interpolation
- **Choice**: Entities (`Player`, `Enemy`, `Projectile`, `Obstacle`) map to persistent `PIXI.Container` and `PIXI.Graphics` instances managed by `PixiArenaRenderer`. On each render frame, the coordinator updates object transforms:
  $$\vec{p}_{\text{render}} = \vec{p}_{\text{prev}} \cdot (1 - \alpha) + \vec{p}_{\text{curr}} \cdot \alpha$$
  and updates rotation/visibility directly on the display object.
- **Rationale**: Allocating and rebuilding `PIXI.Graphics` paths every frame forces CPU polygon triangulation (`earcut`) and GC churn. Retaining persistent display objects allows Pixi's batch renderer to execute fast GPU draw calls.
- **Alternatives Considered**: Immediate-mode re-clearing of a single global `PIXI.Graphics` object (causes CPU frame spikes).

### 3. Headless Test Mock Harness & `PixiContext2DAdapter` Dual-Compatibility
- **Choice**:
  - Keep `Arena` construction synchronous and pure-TypeScript so it never imports browser-only WebGL globals at module load in Vitest's `environment: "node"`.
  - Provide `PixiContext2DAdapter` (implementing the subset of `CanvasRenderingContext2D` used by ChronoShot renderers and translating operations into Pixi v8 `Graphics` / `Text` display objects) alongside `MockPixiRenderer` in `src/rendering/headless/`.
  - Retain `render(ctx)` signatures on `Arena` and UI/entity renderers while `PixiArenaRenderer` coordinates the native Pixi scene graph.
- **Rationale**:
  1. An HTML5 `<canvas>` cannot hold both `2d` and `webgl` contexts simultaneously; `PixiContext2DAdapter` ensures that any unmigrated HUD or overlay continues rendering inside Pixi from Step 1, guaranteeing **continuous playability with zero broken midpoint states**.
  2. All 250+ existing `expect(ctx.*)` assertions across 12 test files remain 100% green without destructive test rewrites, while new unit tests directly verify Pixi container hierarchies, object pooling, and shader uniforms.
- **Alternatives Considered**: Big-bang replacement of all `render(ctx)` signatures (breaks 12 test suites simultaneously and leaves the game unplayable until all task groups finish); `@pixi/node` / `headless-gl` (requires native C++ bindings that fail in headless CI and slow tests by 10x–20x).

### 4. Pixi v8 Vector Geometry Primitives & Async Lifecycle
- **Choice**:
  - **Async Bootstrap & Frame Capture**: `src/main.ts` awaits `pixiRenderer.init(canvas)` with `preserveDrawingBuffer: true` before starting `requestAnimationFrame(loop)`, ensuring [scripts/capture-preview.mjs](file:///Users/karim/Documents/repos/chronoshot/scripts/capture-preview.mjs) `offCtx.drawImage(canvas, ...)` captures live WebGL frames instead of blank buffers.
  - **Procedural Dashed Vectors (`src/rendering/vectorGeometry.ts`)**: Because `PIXI.Graphics` lacks `ctx.setLineDash()`, provide `drawDashedLine()` and `drawDashedCircle()` helpers that emit segmented sub-paths for enemy dotted sightlines, Cataclysm warning rings, and Endless materialization rings.
  - **Octagonal Iris Cutout (`.cut()`)**: In `PortalTransition`, use Pixi v8's `.rect(0, 0, w, h).fill(...).poly(octagon).cut()` API (replacing Canvas 2D `fill("evenodd")`).
  - **Cataclysm Radial Falloff**: Use `PIXI.FillGradient` (or a radial gradient texture masked by the 2D visibility polygon `Graphics`) to preserve the 3-stop radial alpha falloff (`1.0 -> 0.85 -> 0.4`) inside the raycast shadow polygon.

### 5. Post-Processing Filter Pipeline & Contrast Guardrails
- **Choice**: Implement GPU filters on `worldContainer`:
  - **Selective Emissive Bloom**: Luminance-thresholded filter (>0.65 luminance) so dark surfaces (`#0e1117` floor, `#161b22` grid, `#1e242f` obstacles) remain un-bloomed while cyan (`#00f0ff`) and crimson (`#ff3344`) projectiles, shields, and portals emit neon glow.
  - **Chromatic Aberration Pulse**: Fragment shader displacing Red and Blue channels radially upon player damage or Overcharge Dash, decaying in wall-clock time.
  - **Cataclysm & Boss Collapse Shockwave**: Radial displacement ripple propagating from boss epicenters during Cataclysm detonations and the 30-tick Boss Defeat slow-motion collapse (`1.00x -> 0.12x`), updating in wall-clock time.

## Risks / Trade-offs

- **[Risk] Display Object Lifecycle & Memory Leaks**: In-flight projectiles and particles spawn and despawn rapidly; creating new Pixi objects without pooling could cause memory leaks.
  → *Mitigation*: Implement `DisplayObjectPool` recycling `PIXI.Graphics` instances upon entity destruction and room transitions.
- **[Risk] High-DPI Scaling & Sub-Pixel Reticle Jitter**: Mismatches between virtual 960x640 coordinates and backing buffer resolution could cause crosshair fuzziness.
  → *Mitigation*: Configure `autoDensity: true` and `resolution: Math.min(window.devicePixelRatio || 1, 3)` in `app.init()`.
- **[Risk] Typography Wrapping Discrepancies**: [textUtils.ts](file:///Users/karim/Documents/repos/chronoshot/src/ui/textUtils.ts) relies on `measureTextWidth(ctx, text)` with a 7px/char headless fallback.
  → *Mitigation*: Keep `textUtils.ts` compatible with both `CanvasRenderingContext2D` and `PixiContext2DAdapter` (using `PIXI.CanvasTextMetrics.measureText` when in browser and the deterministic 7px/char fallback in headless Node tests).

## Migration Plan

1. **Step 1**: Install `pixi.js` v8 and implement the headless mock harness (`MockPixiRenderer`), `PixiContext2DAdapter`, and `vectorGeometry.ts` helpers (`drawDashedLine`, `drawDashedCircle`, octagonal `.cut()`).
2. **Step 2**: Build `StageCoordinator` and `PixiArenaRenderer` with the 12-layer Z-order hierarchy and wire async `app.init({ preserveDrawingBuffer: true })` in `src/main.ts` using `PixiContext2DAdapter` so the full game renders in Pixi immediately.
3. **Step 3**: Migrate `worldContainer` entities (`Player`, `ChronoAnchorRenderer`, `EnemyRenderer`, pooled `Projectile` & `ParticleSystem`, `Obstacle`, and `CataclysmFlashController`) to persistent native Pixi display objects with sub-tick transform interpolation.
4. **Step 4**: Migrate `hudContainer` components (`Reticle`, `CylinderHUD`, `TimeHUD`, `BossTelemetryHUD`, `EndlessTelemetryHUD`, `PortalTransition`, and modal overlays) to native Pixi display objects while retaining `render(ctx)` unit test compatibility.
5. **Step 5**: Attach the GPU post-processing filter pipeline (Luminance-Thresholded Bloom, Chromatic Aberration, Radial Shockwave) to `worldContainer`.
6. **Step 6**: Update `scripts/capture-preview.mjs` and `AGENTS.md`, and verify all 769+ existing and new Vitest tests pass in ~1 second.
