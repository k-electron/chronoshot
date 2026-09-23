# Spec Delta: Combat Arena

## MODIFIED Requirements

### Requirement: In-Canvas Tactical Reticle
The combat arena SHALL render an in-canvas precision hardware reticle aligned with the player's aim target coordinates, replacing the operating system mouse cursor during active combat, while dynamically restoring native cursor visibility during modal UI overlays.

#### Scenario: Precision aim tracking
- **WHEN** the player moves the mouse cursor over the combat arena during active gameplay
- **THEN** an in-canvas reticle comprising a central point and directional micro-ticks is drawn at the exact aim coordinates with zero operating system cursor overlap and `cursor: none` active

#### Scenario: Dynamic reticle pulse on time dilation
- **WHEN** the player moves and global time scale increases
- **THEN** the reticle micro-ticks subtly expand outward to signal active realtime pacing

#### Scenario: Dry-fire flash indicator
- **WHEN** the player issues a fire command with an empty cylinder
- **THEN** the reticle flashes signal crimson to provide instantaneous tactile aimpoint feedback

#### Scenario: Cursor restoration during modal UI overlays
- **WHEN** the arena enters a modal overlay state (upgrade draft, pause menu, victory screen, or defeat screen)
- **THEN** in-canvas reticle rendering is suppressed, and visible native cursor styling (`default` or `pointer`) is restored on the canvas
