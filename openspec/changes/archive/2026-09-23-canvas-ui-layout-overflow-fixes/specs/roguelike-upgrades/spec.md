# Spec Delta

## MODIFIED Requirements

### Requirement: Post-Boss Upgrade Draft Selection
The combat arena SHALL freeze simulation ticks immediately upon the destruction of a milestone boss and present an interactive in-canvas card draft offering distinct tactical upgrade archetypes with active mouse pointer visibility, bounded card layouts that prevent text overlapping interactive buttons, and dynamic progression prompts reflecting the completed sector.

#### Scenario: Boss destroyed triggers freeze-frame draft
- **WHEN** the milestone boss unit is destroyed
- **THEN** simulation ticks freeze immediately, combat input is suspended, the canvas cursor is restored to visible interactive pointer mode, and a multi-card augmentation selection overlay is displayed

#### Scenario: Selecting an upgrade via keyboard or mouse
- **WHEN** the player presses keys 1, 2, or 3 or clicks directly on a visible upgrade card
- **THEN** the selected augmentation is installed on the player entity, an audio synthesis confirmation cue is triggered, and the arena transitions to the subsequent room

#### Scenario: Bounded description layout preventing button overlap
- **WHEN** an upgrade card description is rendered in the draft overlay
- **THEN** description text is wrapped with a strict line budget and height limit such that description text never touches or renders on top of the install action button

#### Scenario: Archetype subtitle containment
- **WHEN** an upgrade definition with a multi-word archetype name is rendered in a draft card header
- **THEN** the archetype text is truncated with an ellipsis if it exceeds the card's available header width, preventing text from breaching the right card border

#### Scenario: Dynamic progression prompts
- **WHEN** the upgrade draft is triggered across different campaign sectors
- **THEN** the overlay subhead and footer prompts dynamically reflect the current sector progression rather than displaying hardcoded Sector 1 / Zone 2 labels
