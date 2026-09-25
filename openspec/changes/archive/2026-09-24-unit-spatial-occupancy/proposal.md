# Proposal

## Why

In ChronoShot, combat units (operative, baseline hostiles, and bosses) currently lack inter-unit collision volumes and physical occupancy. Enemies steering toward the player converge directly onto the player's center coordinates, stacking inside one another and phasing into the operative's body. Once stacked, units cannot be counted or targeted individually, and enemies firing from inside the player deal unavoidable, point-blank damage. Furthermore, Overcharge Dashes pass through hostile bodies without physical interaction, and boss phase escort spawns can materialize minions directly inside existing units or solid geometry.

Establishing physical unit occupancy ensures that every entity maintains its own circular hull in the tactical arena, resolving collisions through non-damaging contact sliding, enabling kinetic dash shoves, spreading hostile squads through separation steering, and preventing corridor deadlocks.

## What Changes

- **Physical Unit Occupancy & Inelastic Contact**: Define circular collision hulls for all active units ($r = 13\text{--}26\text{px}$) and implement a multi-pass positional overlap correction solver in the fixed-step simulation loop, guaranteeing that no two units share space under any circumstance.
- **Non-Lethal Contact Sliding**: Physical contact between operative and enemies is purely kinematic (solid non-penetrating bodies) without dealing melee damage; damage remains strictly delivered via projectile ballistics, sniper beams, and cataclysm shockwaves.
- **Overcharge Dash Kinetic Shove**: Dashing into regular hostiles imparts high-momentum shove displacement along the contact normal/tangent, clearing paths and knocking enemies aside while preventing body overlap; milestone bosses remain immovable, causing the dashing player to deflect smoothly along the boss hull.
- **Surface-Distance Arrival**: Advance behaviors (`DirectAdvanceBehavior`) halt forward velocity once arriving at the target's physical perimeter ($d \le r_{\text{self}} + r_{\text{target}} + 2\text{px}$) instead of continuously plunging into the target center.
- **Multi-Agent Separation & Flocking**: Hostiles evaluate nearby friendly units within a $64\text{px}$ neighborhood, blending quadratic repulsion forces to fan out into tactical encircling firing arcs rather than collapsing into single-file conga lines.
- **Corridor Queueing & Deadlock Avoidance**: Hostiles navigating single-file corridors where lateral clearance is blocked suppress lateral separation and clamp forward velocity to match the lead unit, preventing wall-grinding, oscillations, and jitter.
- **Safe Dynamic Materialization**: Escort minion spawners (`createMinionEscortSpawn`) and wave generators validate spatial candidates before materialization, using radial candidate probes to prevent spawning units inside obstacles, players, or other hostiles, reinforced by post-spawn relaxation.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `combat-arena`: Updates the combat arena specification to require physical circular unit occupancy, non-lethal contact sliding, dash impact shove dynamics, multi-agent separation steering, single-file corridor queueing, and safe dynamic entity materialization.

## Impact

- **Affected Systems**:
  - `src/entities/Arena.ts`: Fixed-step simulation loop adds multi-pass unit-unit relaxation and post-movement constraint passes.
  - `src/entities/Player.ts`: Player locomotion and dash integration resolve against enemy hitboxes with mass-weighted displacement.
  - `src/entities/Enemy.ts`: Enemy updates pass neighbor context and resolve inter-unit collisions.
  - `src/entities/behaviors/movement/DirectAdvanceBehavior.ts`: Surface arrival and neighbor separation blending.
  - `src/entities/behaviors/movement/KiterBehavior.ts`: Dynamic unit obstacle awareness during retreat/kiting probes.
  - `src/entities/boss/BossTransitionAction.ts`: Spatial candidate validation for escort reinforcement instantiation.
  - `src/math/collision.ts`: Circle-circle collision detection and displacement helper functions.
- **Backward Compatibility**: Fully backward-compatible. Preserves all existing unit speeds, attack cadences, weapon burst mechanics, and map geometries across Rooms 1–20 and Endless Mode.
