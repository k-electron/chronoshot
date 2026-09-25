# Spec Delta

## ADDED Requirements

### Requirement: Physical Unit Spatial Occupancy and Non-Lethal Contact
The combat arena SHALL enforce physical spatial occupancy for all active combat units (operative, baseline hostiles, and milestone bosses) through circular collision hulls that prevent mutual interpenetration across all simulation ticks, resolving physical contact via non-damaging inelastic sliding.

#### Scenario: Hostiles maintain physical separation
- **WHEN** multiple mobile enemies pursue the player or navigate toward identical locations
- **THEN** their circular collision hulls cannot interpenetrate, maintaining center-to-center distance $d \ge r_A + r_B$ at all times

#### Scenario: Non-damaging kinematic contact sliding
- **WHEN** the operative and an active hostile come into physical contact
- **THEN** the contact does not inflict damage or consume shields, relative velocity along the contact normal is canceled, and both entities slide smoothly along their tangential boundaries

#### Scenario: Point-blank hostile gunfire safety gap
- **WHEN** an enemy fires its weapon while in physical contact with the operative
- **THEN** the projectile materializes in the clearance gap between the enemy muzzle hardpoint ($r_E + 6\text{px}$) and the operative chassis ($d \ge r_P + r_E$), allowing standard continuous collision detection and reactive shield deflection to resolve normally

#### Scenario: Wall and obstacle sandwich equilibrium
- **WHEN** a unit is pushed against a solid obstacle by another unit
- **THEN** multi-pass constraint relaxation resolves both obstacle bounds and unit-unit boundaries, keeping the sandwiched unit outside obstacle geometry and separated from the pushing unit

### Requirement: Dash Impact Kinetic Shove and Boss Deflection
The combat arena SHALL resolve Overcharge Dash collisions with combat units based on mass hierarchy, imparting kinetic shove displacement against standard hostiles while smoothly deflecting the dashing operative around immovable milestone bosses without penetrating either entity.

#### Scenario: Dashing into standard hostiles
- **WHEN** the operative executes an Overcharge Dash into one or more standard enemies
- **THEN** the dashing operative does not penetrate enemy hitboxes, and impacted enemies are shoved outward along the contact normal and dash tangent while sliding cleanly along any adjacent obstacles

#### Scenario: Dashing into milestone bosses
- **WHEN** the operative executes an Overcharge Dash directly into a milestone boss
- **THEN** the boss remains anchored and immovable, the operative does not enter the boss hitbox, and the operative's dash velocity deflects smoothly along the curved boss perimeter

### Requirement: Multi-Agent Locomotion, Separation, and Corridor Queueing
The combat AI navigation system SHALL incorporate surface-distance arrival, multi-agent separation steering, and single-file corridor queueing to prevent hostile stacking, conga-line clustering, and movement jitter.

#### Scenario: Surface-distance arrival at operative perimeter
- **WHEN** an advancing hostile reaches surface contact proximity ($d \le r_{\text{self}} + r_{\text{target}} + 2\text{px}$) to its target
- **THEN** forward pursuit thrust drops to zero instead of continuously driving into the target center

#### Scenario: Separation steering in open space
- **WHEN** multiple hostiles advance toward the operative across open sightlines
- **THEN** mutual separation repulsion forces fan the units out laterally into an encircling tactical firing arc

#### Scenario: Corridor queueing without jitter
- **WHEN** a trailing hostile pursues a target through a narrow corridor where lateral clearance is blocked by obstacles
- **THEN** lateral separation forces are suppressed and forward velocity is clamped to match the leading unit's speed, queueing in single file without wall-grinding or oscillation

### Requirement: Safe Dynamic Entity Materialization
The combat system SHALL validate spatial candidate coordinates for mid-encounter dynamic spawns and boss escort summons to prevent entities from materializing inside obstacles, the operative, or other active units.

#### Scenario: Spawning boss escort reinforcements
- **WHEN** a boss phase transition or cataclysm detonation triggers minion escort summoning
- **THEN** candidate spawn locations are evaluated for obstacle clearance and unit separation, radially probing outward if the default offset is obstructed, ensuring summoned units materialize only in legal, unoccupied arena space
