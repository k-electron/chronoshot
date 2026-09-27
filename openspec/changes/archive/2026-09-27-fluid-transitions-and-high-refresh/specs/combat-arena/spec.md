# Spec Delta

## ADDED Requirements

### Requirement: Sub-Tick Render Interpolation and High-Refresh Display Pacing
The combat arena rendering engine SHALL decouple visual drawing from the fixed 60 Hz physics quantum by interpolating entity spatial coordinates between previous and current simulation ticks (`lerp(previousPosition, position, alpha)` where `alpha` represents the fractional tick accumulator). On high-refresh displays (120Hz, 144Hz, 240Hz, or variable refresh), entity movement, projectile trails, and player reticle positions SHALL render smoothly at the display's native refresh rate without modifying the deterministic 60 Hz physics step. Additionally, the canvas backing store buffer SHALL scale with `window.devicePixelRatio` while maintaining 960x640 virtual coordinate parity for razor-sharp hairline HUDs and reticles.

#### Scenario: Smooth motion on high-refresh displays
- **WHEN** the combat arena is rendered on a display running above 60 Hz (e.g. 120Hz or 240Hz)
- **THEN** entity visual positions interpolate continuously between fixed simulation ticks using the sub-tick alpha accumulator, eliminating stepped 60 Hz judder

#### Scenario: Device pixel ratio scaling for crisp rendering
- **WHEN** the game initializes on a high-DPI display with `window.devicePixelRatio > 1`
- **THEN** the canvas pixel buffer scales to `(width * dpr, height * dpr)` with 2D context scaling applied, maintaining crisp vector outlines while preserving 960x640 logical game coordinate mapping

### Requirement: Persistent Wall-Clock Visual Particle Simulation
The particle simulation system SHALL continue updating shard movement, aerodynamic drag, rotation, and alpha fade in wall-clock delta time during pause, upgrade draft, and victory/defeat screens, preventing crystalline shatter shards, sparks, or shockwaves from freezing in mid-air.

#### Scenario: Living particle backdrop during upgrade draft
- **WHEN** the upgrade draft HUD opens following boss defeat
- **THEN** shatter debris and impact sparks continue moving, spinning, and fading out smoothly behind the semi-transparent draft cards rather than freezing on their initial emission frame

#### Scenario: Living particle backdrop during mission victory or defeat
- **WHEN** the combat arena transitions to victory or defeat
- **THEN** geometric shatter particles and shockwave rings continue expanding and dissipating naturally in wall-clock time
