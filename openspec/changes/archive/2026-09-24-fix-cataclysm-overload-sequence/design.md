# Design

## Context

Chrono-Zenith (Room 20 climax) is a 4-phase milestone boss governed by `BossPhaseController`. Phases 1, 2, and 3 specify an `overloadChannelTicks` countdown (75, 65, 60 ticks respectively) during which the boss anchors, deflects projectile attacks, and displays a pulsating hazard warning aura. See `proposal.md` for motivation.

In the current implementation:
- `createCataclysmPulse` and `createMinionEscortSpawn` are attached to `onPhaseExit` of the outgoing phase.
- Because `onPhaseExit` executes synchronously when the preceding phase's shields reach 0, the shockwave and escort spawns fire before the overload channel even begins.
- `BossPhaseController.update` counts down `overloadTicksRemaining`, but has no callback or trigger when the channel reaches 0.

## Goals / Non-Goals

**Goals:**
- Provide a clean, modular lifecycle hook (`onOverloadDetonate`) in `BossPhaseConfig` that triggers precisely when `overloadTicksRemaining` drops to 0.
- Re-wire `CHRONO_ZENITH_BLUEPRINT` so that shockwave discharges, escort spawns, and detonation audio cues execute in `onOverloadDetonate`.
- Guarantee that during the active channel (e.g. 75 ticks), the boss is stationary and invulnerable, the warning aura renders, and the player can maneuver behind obstacles to survive the impending blast.
- Keep the boss phase engine modular without breaking other bosses (Goliath-01, Chrono-Weaver, Vektor-Prime).

**Non-Goals:**
- Modifying obstacle collision geometries or changing the baseline raycast occlusion logic in `createCataclysmPulse` (the line-of-sight raycaster already works as specified).
- Changing non-overload boss phases or other boss blueprints that do not use `overloadChannelTicks`.

## Decisions

### Decision 1: Dedicated `onOverloadDetonate` Hook on `BossPhaseConfig`

We will add `onOverloadDetonate?: (ctx: BossTransitionContext) => void;` to `BossPhaseConfig`.

- **Rationale**: When a phase transition occurs (e.g., Phase 0 to Phase 1), `transitionToPhase()` sets `currentPhaseIndex = 1` and `overloadTicksRemaining = 75`. The top-center HUD immediately displays the incoming phase designation and shield pips, while `isOverloading = true` keeps the boss anchored, invulnerable, and surrounded by the hazard aura. When `overloadTicksRemaining` elapses, `onOverloadDetonate` executes the cataclysm pulse and escort spawns, and combat seamlessly begins.
- **Alternatives Considered**:
  - *Delay phase transition until after channel*: Requires adding a separate "interstitial state" to `BossPhaseController` with pending phase indices, complicating telemetry rendering and state serialization.
  - *Insert dummy transition phases*: Inflates the phase list with synthetic phases (e.g., 7 phases instead of 4), breaking phase badge numbering in the UI (`PHASE 1/4`, etc.).

### Decision 2: Countdown Evaluation in `BossPhaseController.update`

In `BossPhaseController.update(deltaTicks: number, bossPos: Vector2D)`:
```typescript
if (this.overloadTicksRemaining > 0) {
  const prevOverload = this.overloadTicksRemaining;
  this.overloadTicksRemaining = Math.max(0, this.overloadTicksRemaining - deltaTicks);

  if (prevOverload > 0 && this.overloadTicksRemaining === 0) {
    const detonateCtx: BossTransitionContext = {
      bossPosition: { ...this.lastBossPosition },
      currentPhase: this.currentPhaseIndex,
      nextPhase: this.currentPhaseIndex,
      ...this.transitionContextExtras,
    };
    this.currentPhase.onOverloadDetonate?.(detonateCtx);
  }
}
```
- **Rationale**: Capturing `prevOverload > 0 && this.overloadTicksRemaining === 0` guarantees `onOverloadDetonate` runs exactly once upon channel completion, whether `deltaTicks` is 1 or stepped in larger increments.

### Decision 3: Chrono-Zenith Blueprint Re-wiring

In `CHRONO_ZENITH_BLUEPRINT`:
- **Phase 0 (Citadel Bastion)**: Remove `onPhaseExit` action. Shield break particles and audio are already handled natively by `Arena.ts` on projectile impact.
- **Phase 1 (Temporal Warp, 75 ticks)**: Add `onOverloadDetonate` with cyan Cataclysm Pulse (36 particles), Shotgun Guard + Stalker escort spawns, and shield break sound cue.
- **Phase 2 (Singularity Tempest, 65 ticks)**: Add `onOverloadDetonate` with purple Cataclysm Pulse (42 particles), Warden escort spawn, and shield break sound cue.
- **Phase 3 (Zero-Point Overdrive, 60 ticks)**: Add `onOverloadDetonate` with crimson Cataclysm Pulse (48 particles) and shield break sound cue.

### Decision 4: Safe Enemy AI Iteration in `Arena.ts`

When `createMinionEscortSpawn` pushes new escort enemies into `arena.enemies` via `spawnEnemy()`, iterating `for (const enemy of [...this.enemies])` in `Arena.update()` avoids modifying an array while iterating it, ensuring newly spawned escorts cleanly take their first update on the subsequent frame with their configured `initialDelayTicks`.

## Risks / Trade-offs

- **[Risk] Escort Minions Spawning Inside Arena Geometry** → Escort configs in `CHRONO_ZENITH_BLUEPRINT` specify fixed relative offsets (`offsetX: -120`, etc.), and `createMinionEscortSpawn` clamps spawn positions within the 960x640 arena bounds. The Room 20 Apex Redoubt layout has open space around the boss's center-right redoubt anchor.
- **[Risk] Pre-fired Projectiles Arriving Right as Channel Expires** → Because `isInvulnerable` is tied to `isOverloading` (`overloadTicksRemaining > 0`), the instant `overloadTicksRemaining` hits 0 and detonation fires, `isInvulnerable` becomes `false`. Any player bullet arriving on or after the detonation tick successfully inflicts damage on the boss's new shields.
