# Spec Delta

## ADDED Requirements

### Requirement: Cyberpunk Iris Portal Transition
When the operative enters an unlocked room exit portal, the level progression system SHALL execute a continuous geometric cyberpunk iris aperture transition (~250–300ms wall-clock duration) rather than an instantaneous teleport and scene cut. During the transition, the player chassis SHALL be drawn toward the portal center as an octagonal/circular iris aperture contracts to zero, followed by atomic room advancement and an expanding iris reveal at the new room's player spawn position.

#### Scenario: Ingress draw and iris contraction
- **WHEN** the player enters an unlocked exit portal radius
- **THEN** the combat arena initiates portal transit, applies gentle inward magnetic convergence to portal center, and contracts a high-contrast geometric iris aperture around the portal coordinates

#### Scenario: Atomic room advance and egress expansion
- **WHEN** the iris contraction reaches zero radius
- **THEN** the room manager advances the room sequence, obstacles and enemies initialize, and the iris aperture expands outward from the player spawn coordinates, restoring full player locomotion upon full expansion
