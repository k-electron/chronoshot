# Spec: Visual Effects Pipeline

## Purpose

Provides a hardware-accelerated GPU post-processing filter pipeline and visual effects architecture for ChronoShot, delivering luminance-thresholded radiant bloom, chromatic aberration, energy shockwaves, and headless testing compatibility.

## Requirements

### Requirement: Hardware-Accelerated Post-Processing Filters
The visual effects pipeline SHALL execute GPU-accelerated post-processing filters on the Pixi world container, including luminance-thresholded bloom on cyan and crimson energy primitives, chromatic aberration displacement pulses upon operative damage or dash, and subtle CRT scanline vignette grading.

#### Scenario: Radiant energy bloom on combat projectiles and shields
- **WHEN** active cyan player bullets, crimson hostile projectiles, or energy shields are present in the world container
- **THEN** a multi-pass bloom filter generates a luminous glow around high-luminance emitting geometry without blurring UI text or HUD elements in the HUD container

#### Scenario: High-contrast luminance thresholding preserves dark arena geometry
- **WHEN** the bloom filter processes the world container
- **THEN** low-luminance surfaces including the `#0e1117` floor background, `#161b22` tactical grid, and `#1e242f` obstacle walls remain below the bloom threshold, preserving crisp dark contrast and cover silhouettes

#### Scenario: Chromatic aberration pulse on lethal damage or dash impact
- **WHEN** the operative takes lethal damage or initiates an Overcharge Dash
- **THEN** a transient RGB-split chromatic aberration filter activates and decays smoothly back to zero over its designated wall-clock duration

### Requirement: Dynamic Shockwave and Blast Distortion
The visual effects pipeline SHALL render radial displacement ripples and shockwave distortions on high-energy ballistic detonations, Cataclysm detonations, and boss phase shifts, decaying over wall-clock duration while preserving obstacle cover silhouettes.

#### Scenario: Cataclysm detonation shockwave and occluded radial flash
- **WHEN** a boss Cataclysm Overload detonates
- **THEN** an expanding radial distortion ring propagates outward from the boss epicenter while the raycast visibility flash renders with radial falloff beneath obstacle and unit layers so cover walls remain sharply silhouetted

#### Scenario: Shockwave decay in wall-clock time
- **WHEN** the arena enters pause or slow-motion decay while a shockwave is expanding
- **THEN** the shockwave distortion continues animating and dissipating smoothly in wall-clock time

### Requirement: Headless Render and Fallback Compatibility
The rendering pipeline SHALL support headless execution where WebGL and WebGPU contexts are unavailable (such as automated Vitest test runners and CI environments), ensuring all entities and UI components update deterministically without throwing rendering errors.

#### Scenario: Running test suites in headless Node environment
- **WHEN** automated unit or integration tests execute in Vitest without native WebGL drivers
- **THEN** the render pipeline operates via mock display containers and the 2D context adapter without throwing context initialization exceptions, preserving deterministic test execution
