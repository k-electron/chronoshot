# Spec Delta: Combat Arena

## ADDED Requirements

### Requirement: In-Canvas Tactical Reticle
The combat arena SHALL render an in-canvas precision hardware reticle aligned with the player's aim target coordinates, replacing the operating system mouse cursor, with dynamic visual feedback for time acceleration and dry-fire warnings.

#### Scenario: Precision aim tracking
- **WHEN** the player moves the mouse cursor over the combat arena
- **THEN** an in-canvas reticle comprising a central point and directional micro-ticks is drawn at the exact aim coordinates with zero operating system cursor overlap

#### Scenario: Dynamic reticle pulse on time dilation
- **WHEN** the player moves and global time scale increases
- **THEN** the reticle micro-ticks subtly expand outward to signal active realtime pacing

#### Scenario: Dry-fire flash indicator
- **WHEN** the player issues a fire command with an empty cylinder
- **THEN** the reticle flashes signal crimson to provide instantaneous tactile aimpoint feedback

### Requirement: Simulation Pause and Minimalist Control Card
The combat arena SHALL support a toggleable pause state triggered by the Escape key that suspends physics simulation and displays an in-canvas minimalist control card, while hiding control listings during active combat except for an unobtrusive pause hint.

#### Scenario: Pausing the simulation
- **WHEN** the player presses the Escape key during active gameplay
- **THEN** the game enters a paused state, simulation ticks halt, and a minimalist control matrix overlay appears

#### Scenario: Resuming combat from pause
- **WHEN** the player presses the Escape key or clicks within the paused arena
- **THEN** the pause overlay is dismissed and real-time/micro-creep combat resumes immediately

#### Scenario: Minimalist HUD during active play
- **WHEN** the game is in active combat mode
- **THEN** all control hints are hidden from the primary display with the exception of a subtle corner pause key indicator
