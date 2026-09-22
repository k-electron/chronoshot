# Spec Delta: Weapon System

## MODIFIED Requirements

### Requirement: Reload Cycle and Cylinder HUD Display
The system SHALL support reloading back to full capacity and render a real-time cylinder HUD showing loaded and spent chambers.

#### Scenario: Reloading the revolver
- **WHEN** the player triggers reload via the reload key
- **THEN** the cylinder ammunition refills to 6 rounds and the reload time cost is applied to the time engine

#### Scenario: Visualizing chamber states
- **WHEN** the HUD renders the current weapon state
- **THEN** the revolver cylinder visually reflects all available and expended bullet chambers using hairline circular geometry, loaded cyan pips, hollow spent sockets, and an active chamber alignment notch
