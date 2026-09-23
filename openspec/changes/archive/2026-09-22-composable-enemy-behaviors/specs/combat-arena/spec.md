# Spec Delta: Combat Arena

## ADDED Requirements

### Requirement: Composable Enemy Behavior Components
The combat system SHALL support constructing enemy combat units from modular movement behaviors (direct advance, distance-keeping kiter, obstacle grid A* navigation) and attack behaviors (single slug, fan spread buckshot, telegraphed charging beam), allowing custom and baseline archetypes to be assembled from interchangeable behavior strategies.

#### Scenario: Composing an enemy with custom movement and attack behaviors
- **WHEN** an enemy unit is initialized with a distinct combination of movement and attack behavior components
- **THEN** during simulation updates the unit executes the assigned movement strategy for locomotion and the assigned attack strategy for aiming and projectile discharge

#### Scenario: Preserving baseline archetype combat behavior
- **WHEN** standard enemy archetypes (Pistol Grunt, Shotgun Guard, Stalker Rusher, Aegis Warden, Marksman Sniper) are spawned in the arena
- **THEN** their composed behavior strategies produce identical movement speeds, line-of-sight tracking, firing cadences, spread angles, and laser charge telegraphs to their baseline specifications

### Requirement: Decoupled Procedural Hull and Telegraph Rendering
The combat arena rendering system SHALL delegate enemy visual drawing to a modular procedural hull renderer that renders unit chassis geometries (diamond, hexagon, cross-star), weapon hardpoints, hit-count shield auras, and charging laser telegraphs independently of the core arena loop.

#### Scenario: Rendering an enemy with procedural hull profile
- **WHEN** an active enemy unit is rendered on the canvas
- **THEN** its assigned chassis shape, directional orientation, barrel hardpoint, and any active shield buffer or charging sightline laser are drawn according to its visual profile
