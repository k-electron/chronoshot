# Spec Delta: Roguelike Upgrades

## MODIFIED Requirements

### Requirement: Post-Boss Upgrade Draft Selection
The combat arena SHALL freeze simulation ticks immediately upon the destruction of a milestone boss and present an interactive in-canvas card draft offering distinct tactical upgrade archetypes with active mouse pointer visibility.

#### Scenario: Boss destroyed triggers freeze-frame draft
- **WHEN** the milestone boss unit is destroyed
- **THEN** simulation ticks freeze immediately, combat input is suspended, the canvas cursor is restored to visible interactive pointer mode, and a multi-card augmentation selection overlay is displayed

#### Scenario: Selecting an upgrade via keyboard or mouse
- **WHEN** the player presses keys 1, 2, or 3 or clicks directly on a visible upgrade card
- **THEN** the selected augmentation is installed on the player entity, an audio synthesis confirmation cue is triggered, and the arena transitions to the subsequent room

### Requirement: Decoupled Dynamic Draft Card UI
The combat arena SHALL render the tactical card draft overlay dynamically from any sampled array of upgrade definitions, presenting visual archetype headers, key prompts, stat highlights, interactive hover feedback, dynamic cursor styling, and responsive hit-testing for mouse selection.

#### Scenario: Dynamically rendering sampled draft cards
- **WHEN** an upgrade draft overlay is rendered with $N$ active draft options
- **THEN** the in-canvas overlay dynamically distributes $N$ cards evenly across the viewport with distinct accent colors, key badges, and stat highlight boxes

#### Scenario: Visual hover feedback on draft cards
- **WHEN** the player moves the mouse cursor over a rendered draft card
- **THEN** the targeted card displays an active visual hover state including an illuminated card surface, brightened accent borders, and a highlighted install button

#### Scenario: Dynamic cursor styling for card hit-testing
- **WHEN** the mouse coordinates hover within any active card bounding box
- **THEN** the canvas cursor style updates to `pointer`, and reverts to `default` when hovering outside card bounding boxes within the draft overlay

#### Scenario: Selecting a draft card via mouse click hit-testing
- **WHEN** the player clicks within the rectangular bounding box of a rendered draft card
- **THEN** the corresponding upgrade option is identified, installed on the player entity, and the arena transitions to the subsequent room
