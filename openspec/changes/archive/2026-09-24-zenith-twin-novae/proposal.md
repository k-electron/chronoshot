# Proposal: Chrono-Zenith Phase 3 Twin Counter-Rotating Novae

## Why

Chrono-Zenith's Phase 3 ("Singularity Tempest") currently fires only a single 12-pellet ring spinning in a single direction, despite the boss-encounters specification and the blueprint's internal design declaring twin counter-rotating 12-pellet rings. This defect flattens the endgame difficulty curve—making Phase 3 easier than Sector 3's Vektor-Prime—and eliminates the intended diamond-lattice bullet-hell interference pattern.

## What Changes

- **Counter-Rotating Radial Nova Support**: Extend `RadialNovaConfig` and `RadialNovaBehavior` to support an optional `counterRotating?: boolean` mode that discharges two simultaneous rings of `pellets` projectiles per volley rotating in opposite angular directions (`+angularOffsetStep` and `-angularOffsetStep`) with interleaved initial phase offsets.
- **Chrono-Zenith Phase 3 Blueprint Configuration**: Update `CHRONO_ZENITH_BLUEPRINT` in `src/entities/boss/BossBlueprint.ts` Phase 3 to configure `counterRotating: true`, discharging twin 12-pellet rings (24 projectiles per volley at 60-tick cadence) with counter-rotating offsets ($\pm 0.14\text{ rad}$).
- **Automated Test Coverage**: Add unit tests in `RadialNovaBehavior.test.ts` and `BossBlueprint.test.ts` verifying that `counterRotating: true` discharges dual 12-pellet rings with opposite angular velocity and that Chrono-Zenith's third phase executes this behavior.

## Capabilities

### New Capabilities
*(None)*

### Modified Capabilities
- `boss-encounters`: Enforces and refines the Phase 3 Singularity Tempest requirement so that Chrono-Zenith discharges twin 12-pellet rings rotating in opposite directions (24 projectiles per volley) at a 60-tick cadence.

## Impact

- **Affected Systems**: `src/entities/behaviors/attack/RadialNovaBehavior.ts`, `src/entities/boss/BossBlueprint.ts`, `src/entities/behaviors/attack/RadialNovaBehavior.test.ts`, `src/entities/boss/BossBlueprint.test.ts`.
- **Breaking Changes**: None. `counterRotating` defaults to `false` (or undefined), preserving existing single-ring behaviors for Chrono-Weaver, Vektor-Prime, and Chrono-Zenith Phase 4 without regressions.
- **Dependencies**: Zero external runtime or audio dependencies.
