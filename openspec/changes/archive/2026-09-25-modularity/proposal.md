# Proposal

## Why

In Room 16, the Aegis Warden ($R=18$) frequently parks against the central barrier and freezes permanently at $(0, 0)$ velocity. This occurs because the $40\text{px}$ grid pathfinder uses bounding box AABB inflation at the unit's true radius, which fuses separate obstacles across $47.5\text{px}$ to $87.5\text{px}$ physical gaps, severing the room into disconnected grid graphs. When A* returns an empty path and line-of-sight is blocked, the fallback locomotion steers head-on into the barrier, where collision resolution zeroes out its forward momentum in corners. A similar disconnection severs Chrono-Zenith ($R=24/28$) in Room 20.

Rather than compromising navigation fidelity by artificially clamping clearance radii or altering handcrafted room layouts, the pathfinding engine must represent physical passages accurately at the unit's true radius on a finer $20\text{px}$ grid with cell-center containment, backed by an anti-grind tangent fallback with hysteresis and an intentional-stop-aware stuck watchdog.

## What Changes

- **20px Grid Pathfinding**: Transition default `GridPathfinder` tile resolution from $40\text{px}$ ($24 \times 16$) to $20\text{px}$ ($48 \times 32$), doubling spatial resolution while keeping search times well under $100\mu\text{s}$.
- **Cell-Center Obstacle Inflation**: Mark grid cells as impassable if and only if the cell center falls within the obstacle bounds inflated by the unit's true radius ($R=18$ for Warden, $R=24\text{--}28$ for Bosses), eliminating phantom padding that falsely sealed open corridors.
- **Anti-Grind Tangent Fallback**: When line-of-sight is blocked and A* yields no path, deflect the fallback velocity along the obstacle face tangent that heads toward the goal ($\vec{d}_{\text{goal}} \cdot \hat{t} > 0$), stabilized with hysteresis to prevent corner vibration.
- **Intentional-Stop Movement Watchdog**: Detect sustained locomotion stalls ($< 1.5\text{px}$ over 12 ticks) exclusively when the unit's commanded velocity is nonzero, resetting the watchdog during intentional halts (fire stutter, laser charging, boss overload channel, arrival, corridor queuing, kiter sweet spot) and triggering immediate repathing or tangent breakout.
- **Swept-Circle Shortcut Verification**: Ensure any waypoint smoothing, shortcut lookahead, or direct steering transition is strictly validated against `hasNavigationClearance` at the unit's true physical radius to prevent corner clipping.
- **Static & Dynamic Test Suite Hardening**: Add static graph connectivity validation across all 21 rooms at true blueprint radii alongside 300-tick dynamic simulation deadlock tests in `All21MapsValidation.test.ts`.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `combat-arena`: Updates the "Enemy Pathing and Intelligent Navigation" requirement from a $40\text{px}$ grid to a $20\text{px}$ grid with cell-center containment at true entity radii, swept-circle shortcut verification, goal-aligned tangent fallback with hysteresis, and an intentional-stop-aware stuck watchdog.

## Impact

- `src/engine/GridPathfinder.ts`: Updates default cell size to 20, implements cell-center inflation range calculation (`Math.ceil`/`Math.floor` offsets).
- `src/entities/behaviors/movement/DirectAdvanceBehavior.ts`: Instantiates $20\text{px}$ pathfinder, adds obstacle tangent deflection with goal alignment and hysteresis, adds intentional-stop movement watchdog.
- `src/entities/behaviors/movement/KiterBehavior.ts`: Instantiates $20\text{px}$ pathfinder, unifies fallback tangent steering with hysteresis.
- `src/levels/All21MapsValidation.test.ts`: Adds static true-radius graph connectivity verification across all 21 maps and hardens 300-tick dynamic deadlock tests.
- Zero breaking changes to room layouts (`Room.ts`, `ApexRedoubtTemplate.ts`) or public entity APIs.
