# Design

## Context

Chrono-Zenith's Cataclysm Overload currently relies on an instantaneous mathematical raycast in `createCataclysmPulse()` with localized particle shatter around the boss chassis and no visual feedback across the $960 \times 640$ arena. Reactive shields currently absorb the hit, and simulation time dilation slows down the channel countdown when the operative is stationary. See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- **Encapsulated & Modular Architecture**: Create a dedicated `CataclysmFlashController` component that cleanly encapsulates flash state, wall-clock timing, 2D shadow volume / visibility polygon projection, and Canvas 2D rendering without cluttering `Arena.ts` or `BossPhaseController.ts`.
- **Geometrically Occluded Screen Flash**: Render a blinding screen flash that illuminates open line-of-sight corridors while leaving areas behind bastions in crisp, un-flashed shadow cones.
- **Absolute Lethality in Open LOS**: Bypasses player shield charges to inflict immediate fatal elimination when caught in the open at Apex.
- **Asymmetric Timing**: Smooth ease-in ramp-up (~250ms) during the channel tail $\to$ single-frame Apex detonation at channel expiration ($t=0$) $\to$ fast, snappy ramp-down (~70ms) post-detonation.
- **Wall-Clock Real Time**: Overload countdown and flash progression execute in real wall-clock time (`wallDeltaTime`), immune to time dilation.
- **1:1 Boss Immunity Seam**: Chrono-Zenith remains 100% invulnerable and stationary throughout the channel and ramp-up, with invulnerability ending precisely at the Apex.

**Non-Goals:**
- Reworking non-cataclysm boss phases or non-boss encounters.
- Adding complex 3D lighting engines or external shadow libraries; all shadow geometry is calculated procedurally in Canvas 2D with zero external dependencies.

## Decisions

### Decision 1: Dedicated `CataclysmFlashController` Module

We will create `src/entities/boss/CataclysmFlashController.ts` with a clear, decoupled interface:

```typescript
export interface CataclysmFlashConfig {
  rampUpDuration: number;    // default: 0.25s (~250ms)
  rampDownDuration: number;  // default: 0.07s (~70ms, significantly faster)
}

export class CataclysmFlashController {
  public trigger(origin: Vector2D, color: string, duration?: number): void;
  public update(wallDeltaTime: number): void;
  public render(ctx: CanvasRenderingContext2D, obstacles: readonly Obstacle[], arenaWidth: number, arenaHeight: number): void;
  public isAtApex(): boolean;
  public isActive(): boolean;
  public getAlpha(): number;
  public reset(): void;
}
```

- **Rationale**: Keeps `Arena.ts` and `BossPhaseController.ts` lean. `Arena` simply calls `flashController.update(wallDeltaTime)` and `flashController.render(ctx, obstacles, width, height)`.
- **Alternatives Considered**:
  - *Inlining in `Arena.render()`*: Bloats `Arena.ts` with geometry math and violates single-responsibility principle.
  - *Treating flash as a Particle*: Particles are individual sprites and lack the global clipping/shadow geometry needed for arena-wide occluded flashes.

### Decision 2: 2D Visibility Polygon & Shadow Projection Geometry

To render the flash only in visually accessible regions:
1. For each obstacle AABB, determine silhouette horizon vertices relative to the boss origin.
2. Project shadow quads from the silhouette vertices outward past the arena boundaries (e.g. 2000px).
3. In Canvas 2D, render the luminous flash color (`rgba(...)`) clipped to exclude obstacle shadow volumes, or fill the 2D visibility polygon computed by radial raycasting to obstacle vertices with angular $\pm \epsilon$ offsets.
- **Rationale**: Guarantees exact mathematical equivalence between the visual illuminated zone and `testLineOfSightOcclusion()`. If the player chassis is in the illuminated zone, they are in the blast; if they are in the shadow cone, they are safe.
- **Alternatives Considered**:
  - *Full-screen unclipped wash*: Fails the requirement that visually blocked areas must not flash.
  - *Expanding circular wave entity*: Introduces spatial propagation latency and potential desync with hitboxes.

### Decision 3: Wall-Clock Real-Time Channel Stepping

In `BossPhaseController.ts`, overload channel progression will be stepped using `wallDeltaTime`:

```typescript
if (this.overloadTimeRemaining > 0) {
  this.overloadTimeRemaining = Math.max(0, this.overloadTimeRemaining - wallDeltaTime);
  // Synchronize ramp-up trigger when overload reaches the ramp-up window
}
```

- **Rationale**: Removes player micro-creep from the overload countdown. The clock runs in unyielding real time, forcing the operative to scramble for cover.
- **Boss Immunity Seam**: `isInvulnerable` checks `isOverloading` (`overloadTimeRemaining > 0`). Because the flash ramp-up occurs in the tail of `overloadTimeRemaining` and terminates at $t = 0$, boss immunity naturally covers the entire ramp-up and ends exactly when the Apex detonates.

### Decision 4: Absolute Fatal Wipe in `createCataclysmPulse`

In `BossTransitionAction.ts`:

```typescript
if (occluded) {
  // Safe behind cover: spawn deflection sparks along obstacle face
  if (ctx.particles && obstacle) {
    ctx.particles.emitImpactSparks(hitPoint, faceNormal, 12);
  }
  return { occluded: true, damageDealt: 0, occludingObstacle: obstacle };
}

// In open line of sight: instant lethal wipe (bypasses shields)
player.eliminate(); // or player.takeDamage(999) with lethal wipe override
```

- **Rationale**: Ensures the mechanic is a true "cover-or-die" puzzle. Reactive shields will not bail out an operative who failed to break line of sight.

## Risks / Trade-offs

- **[Risk] Canvas Performance during Shadow Calculation** → Shadow projection over 8 bastions involves only ~16 shadow quads. Calculating these takes $< 0.05\text{ms}$ per frame. Pre-allocating vertex buffers ensures zero GC allocation in the 60Hz loop.
- **[Risk] High Refresh Rate Displays (144Hz–240Hz)** → The controller integrates strictly with `wallDeltaTime`, guaranteeing smooth opacity interpolation regardless of monitor refresh rate.
- **[Risk] Rapid Phase Transition Edge Cases** → If the boss suffers lethal defeat or the game pauses, `reset()` or paused delta-time cleanly freezes/clears the flash controller state.
