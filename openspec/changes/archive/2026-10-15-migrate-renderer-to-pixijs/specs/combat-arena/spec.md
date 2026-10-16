# Spec Delta

## MODIFIED Requirements

### Requirement: Sub-Tick Render Interpolation and High-Refresh Display Pacing
The combat arena rendering engine SHALL decouple visual drawing from the fixed 60 Hz physics quantum by interpolating entity spatial coordinates between previous and current simulation ticks (`lerp(previousPosition, position, alpha)` where `alpha` represents the fractional tick accumulator) through Pixi.js scene graph transform updates. On high-refresh displays (120Hz, 144Hz, 240Hz, or variable refresh), entity movement, projectile trails, and player reticle positions SHALL render smoothly at the display's native refresh rate without modifying the deterministic 60 Hz physics step. Additionally, the Pixi.js Application renderer SHALL scale backing resolution with `window.devicePixelRatio` while maintaining 960x640 virtual coordinate space parity for crisp hairline HUDs and reticles.

#### Scenario: Smooth motion on high-refresh displays
- **WHEN** the combat arena is rendered on a display running above 60 Hz (e.g. 120Hz or 240Hz)
- **THEN** entity visual positions in the Pixi scene graph interpolate continuously between fixed simulation ticks using the sub-tick alpha accumulator, eliminating stepped 60 Hz judder

#### Scenario: Device pixel ratio scaling for crisp rendering
- **WHEN** the game initializes on a high-DPI display with `window.devicePixelRatio > 1`
- **THEN** the Pixi renderer backing buffer scales according to `window.devicePixelRatio` with stage scaling applied, maintaining crisp vector outlines while preserving 960x640 logical game coordinate mapping

### Requirement: Decoupled Procedural Hull and Telegraph Rendering
The combat arena rendering system SHALL delegate enemy visual drawing to a modular procedural hull renderer that renders unit chassis geometries (diamond, hexagon, cross-star), weapon hardpoints, hit-count shield auras, and charging laser telegraphs through hardware-accelerated Pixi display objects independently of the core arena simulation loop.

#### Scenario: Rendering an enemy with procedural hull profile
- **WHEN** an active enemy unit is rendered in the combat arena
- **THEN** its assigned chassis shape, directional orientation, barrel hardpoint, and any active shield buffer or charging sightline laser are drawn via procedural Pixi graphics according to its visual profile

#### Scenario: Distinguishing dashed passive sightlines from solid charging lasers
- **WHEN** an enemy unit renders a passive line-of-sight indicator versus an active Marksman charging laser telegraph
- **THEN** passive sightlines and hazard warning rings render as segmented dashed vectors while active charging beams render as continuous solid vectors with distinct luminance
