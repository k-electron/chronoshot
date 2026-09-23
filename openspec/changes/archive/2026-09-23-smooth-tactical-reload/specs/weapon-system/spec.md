# Spec Delta

## MODIFIED Requirements

### Requirement: Reload Cycle and Cylinder HUD Display
The system SHALL support an anchored, multi-tick reload cycle that seats ammunition sequentially, immobilizes player ground locomotion while preserving free aiming, provides visual telemetry across the cylinder HUD and targeting reticle, and permits tactical dash interruption with sequential chamber retention.

#### Scenario: Reloading the revolver
- **WHEN** the player triggers reload via the reload key when ammunition is below maximum capacity
- **THEN** the weapon enters an active reload state spanning the configured reload tick duration (30 ticks baseline, 15 ticks with Speed Loader), player movement is immobilized while mouse aiming remains free, and chambers load sequentially across the duration

#### Scenario: Visualizing chamber states
- **WHEN** the HUD renders the current weapon state
- **THEN** the revolver cylinder visually reflects all available, expended, and actively loading bullet chambers using hairline circular geometry, loaded cyan pips, hollow spent sockets, dynamic incremental loading transitions, and an active chamber alignment notch

#### Scenario: Visualizing reload progress on reticle
- **WHEN** the player is actively reloading
- **THEN** the precision crosshair reticle renders a circular reload progress arc tracking elapsed ticks and shifts to an amber cycling state until reload completes or aborts

#### Scenario: Cancelling reload via tactical dash
- **WHEN** the player executes an Overcharge Dash while actively reloading
- **THEN** the reload channel is immediately aborted, player immobilization is released, any chambers completed prior to the dash are retained in the cylinder, and incomplete chambers remain spent
