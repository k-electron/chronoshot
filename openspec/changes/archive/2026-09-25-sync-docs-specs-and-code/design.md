# Design

## Context

ChronoShot operates on a deterministic 60 Hz simulation engine decoupled from rendering framerate. Documentation, specifications, and engine implementations have drifted in several key areas (detailed in `proposal.md`). Addressing these requires:
1. Documentation and configuration reconciliation (`README.md`, `AGENTS.md`, `package.json`).
2. Specification calibration (`procedural-levels/spec.md`).
3. Targeted AI locomotion fixes for swept waypoint shortcuts and kiter deadlock recovery.
4. Concurrency accounting fixes in `EndlessDirector` and dynamic entity garbage collection in `Arena`.

## Goals / Non-Goals

**Goals:**
- Zero gameplay mechanic alterations outside the identified pathfinding and Endless Mode defects.
- Full parity between `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `package.json`, and current game systems.
- Robust obstacle navigation for all archetypes via continuous swept-circle shortcut lookahead (`hasNavigationClearance`) and intentional-stop-aware stuck recovery for kiters.
- Strict enforcement of the 8-unit concurrent limit and 2-sniper cap in Endless Mode across arbitrary kill churn rates.
- Unbounded Endless Mode survival without memory leakage or tick time degradation from dead hostile accumulation.

**Non-Goals:**
- Redesigning room geometries, boss attack patterns, or player movement physics.
- Modifying A* grid sizing or cell heuristics in `GridPathfinder`.

## Decisions

### 1. Continuous Swept-Circle Waypoint Shortcutting
**Choice**: When traversing `this.currentPath` in `DirectAdvanceBehavior` and `KiterBehavior`, evaluate forward waypoints from the end of the path (`this.currentPath.length - 1`) down to `this.currentWaypointIndex + 1`. If `hasNavigationClearance(ctx.position, candidateWp, ctx.radius, obstacles)` succeeds, advance `this.currentWaypointIndex` directly to that waypoint.
**Rationale**: Grid pathfinding produces jagged step-by-step waypoints along tile centers. A straight line between non-adjacent waypoints can clip convex obstacle corners unless strictly validated. Minkowski swept-circle raycasting guarantees physical clearance at the unit's true radius before skipping intermediate waypoints.
**Alternatives Considered**:
- *String pulling during path generation in `GridPathfinder`*: Would require passing full obstacle geometries into `findPath` and wouldn't adapt dynamically to moving obstacles or runtime clearances.

### 2. Intentional-Stop-Aware Stuck Watchdog in `KiterBehavior`
**Choice**: Mirror the 12-tick watchdog architecture from `DirectAdvanceBehavior` into `KiterBehavior`, integrating an explicit exemption for kiter sweet-spot range holding (`dist >= minDist && dist <= maxDist` with line-of-sight).
**Rationale**: Kiters can be pushed against obstacles or get pinned while retreating or advancing. If commanded velocity is nonzero but displacement $< 1.5\text{px}$ over 12 ticks ($0.2\text{s}$), the watchdog forces an immediate A* repath (`repathCooldownTicks = 0`) and triggers a lateral tangent breakout slide. Explicitly zeroing `stallTicks` during range holding, weapon recoil stutter, and laser telegraphs avoids false-positive triggers.
**Alternatives Considered**:
- *Relying solely on lateral retreat tangents*: When retreating into a corner formed by two meeting obstacles, lateral tangents can deadlock without an A* repath.

### 3. Comprehensive `readyToSpawn` Accounting in `EndlessDirector`
**Choice**: In `EndlessDirector.update`, account for units popped from `materializationQueue` with expired timers (`readyToSpawn`) across:
1. `currentActiveCount = activeLiving.length + readyToSpawn.length + this.materializationQueue.length`
2. `snipersActive = activeLivingSnipers + readyToSpawnSnipers + queuedSnipers`
3. `currentActiveThreat = activeLivingThreat + readyToSpawnThreat + queuedThreat`
4. `existingUnits = [...activeLivingPositions, ...readyToSpawnPositions, ...queuedPositions]`
**Rationale**: Previously, units in `readyToSpawn` were removed from `this.materializationQueue` but had not yet been returned to `Arena` and pushed to `this.enemies`. In that single tick, the director perceived a temporary dip in active count and threat deficit, queueing excess units that overshot the 8-unit and 2-sniper caps.
**Alternatives Considered**:
- *Mutating `this.enemies` directly inside `EndlessDirector`*: Violates decoupled engine design where `EndlessDirector` remains a pure wave planner returning spawn configurations to `Arena`.

### 4. Simulation-Step Entity Pruning in Endless Mode
**Choice**: In `Arena.ts`, at the end of `fixedUpdate()`, when `this.endlessDirector` is active, prune dead enemies:
```typescript
if (this.endlessDirector) {
  this.enemies = this.enemies.filter((e) => e.isAlive);
}
```
**Rationale**: In fixed campaign rooms, rooms conclude after a few eliminations and `loadRoom()` resets `this.enemies`. In Endless Mode, enemies respawn continuously; retaining dead instances causes unbounded array growth, degrading collision detection, render passes, and AI update loops.
**Alternatives Considered**:
- *Pruning immediately inside bullet impact callback*: Can cause concurrent modification issues if multiple projectiles or iterations touch `this.enemies` within the same tick. Pruning at the end of the physics sub-step is safe and clean.

## Risks / Trade-offs

- **[CPU overhead of swept-circle lookahead on every tick]** $\to$ *Mitigation*: Lookahead scans at most a small handful of waypoints per mobile unit, and `hasNavigationClearance` performs fast bounding box early-exits. Vitest test suite runtime remains under 900ms.
- **[Kiter watchdog oscillating with Sweet Spot holding]** $\to$ *Mitigation*: Watchdog state explicitly resets when distance to target falls within `[minDist, maxDist]` under line-of-sight.
- **[Dead enemy pruning affecting post-defeat stats]** $\to$ *Mitigation*: Endless kills and metrics are tracked internally by `EndlessDirector.recordKill()`, not derived from counting dead objects in `this.enemies`.
