# Design: Chrono-Zenith Phase 3 Twin Counter-Rotating Novae

## Context

ChronoShot's modular milestone boss system uses declarative `BossBlueprint` definitions evaluated by `BossPhaseController`. Boss attack patterns delegate to implementations of `AttackBehavior` (`SingleSlugBehavior`, `FanSpreadBehavior`, `TelegraphedBeamBehavior`, `RadialNovaBehavior`, `AlternatingAttackBehavior`).

`RadialNovaBehavior` currently models an omnidirectional 360-degree projectile ring that rotates uniformly by `angularOffsetStep` after each discharge. Chrono-Zenith Phase 3 ("Singularity Tempest") is specified in `openspec/specs/boss-encounters/spec.md` to discharge twin counter-rotating 12-pellet radial novae, but currently instantiates a baseline single-ring `RadialNovaBehavior`.

See `proposal.md` for motivation and `specs/boss-encounters/spec.md` for behavioral requirements.

## Goals / Non-Goals

**Goals:**
- **Counter-Rotating Radial Nova Support**: Extend `RadialNovaConfig` and `RadialNovaBehavior` to support an optional `counterRotating?: boolean` mode and optional `counterOffsetPhase?: number`.
- **Opposing Angular Trajectories**: When `counterRotating: true`, each discharge generates two complete rings of `pellets` projectiles:
  - Ring 1 rotates by `+angularOffsetStep` each volley.
  - Ring 2 rotates by `-angularOffsetStep` each volley.
- **Interleaved Phase Offsets**: Default the secondary ring's initial phase to `Math.PI / pellets` ($\pi / 12 = 15^\circ$ for 12 pellets) so the 24 pellets form a 24-point interleaved pattern on the first volley rather than overlapping at identical angles.
- **Blueprint Alignment**: Configure Phase 3 of `CHRONO_ZENITH_BLUEPRINT` with `counterRotating: true`, producing 24 pellets per volley at 60-tick cadence with $\pm 0.14\text{ rad}$ angular offset step.
- **Strict Backward Compatibility**: Default `counterRotating` to `false` (or undefined) so existing single-ring consumers (Chrono-Weaver Phase 2, Vektor-Prime Phase 3, Chrono-Zenith Phase 4) remain unaffected.

**Non-Goals:**
- Modifying Phase 1 (Citadel Bastion), Phase 2 (Temporal Warp beam kiter), or Phase 4 (Zero-Point Overdrive 16-pellet single nova pursuit) of Chrono-Zenith.
- Modifying earlier milestone bosses (Goliath-01, Chrono-Weaver, Vektor-Prime).
- Modifying projectile collision detection or rendering pipelines.

## Decisions

### 1. Extend `RadialNovaBehavior` vs. Dedicated `TwinRadialNovaBehavior`
- **Decision**: Extend `RadialNovaBehavior` with `counterRotating?: boolean` and `counterOffsetPhase?: number` properties in `RadialNovaConfig`.
- **Why**: `RadialNovaBehavior` already encapsulates cooldown tracking, delta-tick updates, laser charging hooks, stutter delay timers, and projectile instantiation. Adding counter-rotation support directly inside `RadialNovaBehavior` keeps the attack behavior hierarchy compact, avoids duplicating ~130 lines of code, and makes twin-ring novae reusable across any future enemy or boss archetypes.
- **Alternative Considered**: Creating a new `TwinRadialNovaBehavior` class. Rejected due to redundant logic (cooldowns, line-of-sight checks, stutter delays) and additional maintenance overhead.
- **Alternative Considered**: Using `AlternatingAttackBehavior`. Rejected because alternating attacks fire sequentially on separate cadences rather than releasing two simultaneous concentric rings on the same discharge tick.

### 2. Angular Phase Offset for Counter-Rotating Rings
- **Decision**: Initialize the secondary counter-rotating ring with an offset of `initialAngle + (config.counterOffsetPhase ?? Math.PI / pellets)`.
- **Why**: Without an angular phase offset, both 12-pellet rings on tick 0 would share identical spawn angles ($0, \frac{2\pi}{12}, \frac{4\pi}{12}, \dots$), causing pairs of bullets to overlap directly on top of each other. Offsetting by $\frac{\pi}{12}$ ($15^\circ$) produces 24 distinctly spaced projectiles radiating outward on volley 1, which immediately cross over on subsequent volleys ($\theta_1 \leftarrow \theta_1 + 0.14$, $\theta_2 \leftarrow \theta_2 - 0.14$) to create the signature Singularity Tempest diamond lattice.
- **Alternative Considered**: Same initial angle without offset. Rejected because overlapping projectiles waste hitboxes and obscure visual telegraphing.

### 3. State Management & Reset Lifecycle
- **Decision**: Track `counterRotationAngle` alongside `currentRotationAngle`. On `reset()`, reinitialize `counterRotationAngle` to `this.initialAngle + this.counterOffsetPhase`.
- **Why**: Guarantees deterministic pattern replay across room retries and boss phase transitions.

## Risks / Trade-offs

- **[Risk] Increased bullet density and performance impact** → *Mitigation*: 24 projectiles per volley (instead of 12) at a 60-tick cadence remains well within ChronoShot's performance budget. Continuous Collision Detection (CCD) in `FixedStepSimulator` and `Arena` executes the complete test suite (680+ tests) in under 800ms.
- **[Risk] Dodging difficulty during Phase 3** → *Mitigation*: The player has 2 shields and can rely on the Room 20 monolithic bastions (`ApexRedoubtTemplate`, ensuring cover $\le 140\text{px}$ away) and Overcharge Dash (480 px/s) to break line-of-sight during bullet wave intersections.

## Migration Plan

1. Update `RadialNovaConfig` and `RadialNovaBehavior` in `src/entities/behaviors/attack/RadialNovaBehavior.ts`.
2. Update `CHRONO_ZENITH_BLUEPRINT` Phase 3 in `src/entities/boss/BossBlueprint.ts`.
3. Add unit tests for counter-rotation in `RadialNovaBehavior.test.ts`.
4. Update and expand Chrono-Zenith Phase 3 test assertions in `BossBlueprint.test.ts`.
5. Run full test suite (`npm test`) and typecheck build (`npm run build`).
