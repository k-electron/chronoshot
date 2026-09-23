# Design

## Context

ChronoShot executes deterministic 60Hz fixed-step simulation (`FixedStepSimulator`) where time dilation scales with player velocity (`TimeGovernor`). Currently, `src/entities/Enemy.ts` mixes physics integration, collision sliding, line-of-sight checks, A* waypoint traversal, kiting math, charging laser state, weapon discharge fans, and boss enrage speed checks inside a single class. In addition, `src/entities/Arena.ts` has an inline 150-line procedural drawing ladder rendering enemy hulls.

See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Decompose enemy locomotion into swappable `MovementBehavior` strategies (`DirectAdvance`, `Kiter`, `AStarPathfollower`).
- Decompose weapon handling into swappable `AttackBehavior` strategies (`SingleSlug`, `FanSpread`, `TelegraphedBeam`).
- Isolate procedural Canvas 2D rendering into `src/ui/EnemyRenderer.ts`.
- Retain the public contract of `Enemy` as a facade so that `Arena.ts`, `Room.ts`, and all existing unit tests operate seamlessly with zero regressions.
- Enforce zero garbage collection overhead in the 60Hz hot loop by pre-allocating reusable vectors in behavior instances.

**Non-Goals:**
- Redesigning boss multi-phase mechanics (deferred to Phase 2: `modular-boss-phase-engine`).
- Modifying player augmentations or roguelike draft UI (deferred to Phase 3: `extensible-upgrade-pipeline`).
- Procedural room or encounter generation (deferred to Phase 4: `modular-level-director`).

## Decisions

### 1. Strategy Composition over Heavyweight ECS
- **Decision**: Use the Strategy Pattern where an `Enemy` owns a `MovementBehavior` and an `AttackBehavior`, rather than introducing a full Entity-Component-System (ECS) framework.
- **Rationale**: A full ECS adds indirection, boilerplate, and memory layout complexity without benefit in a deterministic, 2D minimalist canvas shooter. Strategy composition keeps the engine lightweight, typed, and deterministic while achieving complete modularity.
- **Alternative considered**: Full ECS (e.g. BiteCS or miniplex). Rejected as overly complex and unnecessary for ChronoShot's deterministic micro-engine.

### 2. Behavioral Interface Contracts

```ts
export interface MovementContext {
  position: Vector2D;
  previousPosition: Vector2D;
  velocity: Vector2D;
  radius: number;
  speed: number;
  aimAngle: number;
  hasLineOfSight: boolean;
}

export interface MovementBehavior {
  update(
    ctx: MovementContext,
    target: CombatUnit,
    obstacles: Obstacle[],
    deltaTicks: number,
    fixedDeltaTime: number,
    pathfinder?: GridPathfinder
  ): Vector2D;
  reset(): void;
}

export interface AttackContext {
  id: string;
  position: Vector2D;
  aimAngle: number;
  radius: number;
}

export interface AttackBehavior {
  readonly fireCadenceTicks: number;
  fireCooldownTicks: number;
  isChargingLaser: boolean;
  stutterTimerTicks: number;
  update(
    ctx: AttackContext,
    hasLineOfSight: boolean,
    deltaTicks: number
  ): Projectile[];
  discharge(ctx: AttackContext): Projectile[];
  reset(): void;
}
```

### 3. Blueprint Data Architecture
- **Decision**: Define archetypes via data-driven `EnemyBlueprint` objects registering default behaviors and stats:
```ts
export interface EnemyBlueprint {
  type: EnemyType;
  radius: number;
  speed: number;
  maxShields: number;
  movement: () => MovementBehavior;
  attack: () => AttackBehavior;
  hull: EnemyHullConfig;
}
```
- **Rationale**: Simplifies room construction and allows new enemy variants (e.g. shielded snipers or shotgun kiters) to be authored purely by configuring blueprint building blocks.

### 4. Decoupling Procedural Hull Rendering
- **Decision**: Extract drawing routines into `EnemyRenderer.ts` using clean procedural primitive helpers:
  - `renderChassis(ctx, shape, radius, color, borderColor)`
  - `renderMuzzle(ctx, muzzleType, radius)`
  - `renderShieldAura(ctx, position, radius, shields)`
  - `renderLaserTelegraph(ctx, from, to, isCharging)`
- **Rationale**: Cleans up `Arena.ts` and allows visual customization for future elite or boss enemy variants.

## Risks / Trade-offs

- **[Risk] Garbage collection spikes from vector allocations in behaviors**  
  → *Mitigation*: Allocate cached scratch vectors (`scratchVec1`, `scratchVec2`) inside each behavior instance; reuse them across 60Hz tick computations.
- **[Risk] Behavioral drift breaking existing unit tests**  
  → *Mitigation*: Ensure every constant (speed values 120, 90, 210, 60, 80, cadence ticks, stutter ticks, laser charge ticks 30) is faithfully preserved in the extracted behavior classes. Run `npm test` after each behavior extraction.
