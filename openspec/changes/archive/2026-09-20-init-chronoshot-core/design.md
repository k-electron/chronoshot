# Design: ChronoShot Core Game Engine

## Context

See `proposal.md` for motivation and background. ChronoShot is a greenfield browser game requiring zero backend dependencies, client-side deterministic tick simulation, and responsive visual rendering.

## Goals / Non-Goals

**Goals:**
- Provide a deterministic fixed-step simulation engine (`60 Hz` tick rate) decoupled from variable-rate screen rendering (`requestAnimationFrame`).
- Implement dynamic time dilation: smooth ramp between 5% baseline idle creep and 100% full movement speed, plus discrete tick advances on shooting and reloading.
- Implement a modular weapon system starting with a 6-round revolver and an interactive visual cylinder HUD.
- Build a top-down combat arena system supporting collision, cover, enemy tracking/firing AI, 1-hit lethality, instant restart (`R`), and bite-sized room progression.
- Deliver a geometric minimalist visual presentation using HTML5 Canvas 2D with particle shatter effects.

**Non-Goals:**
- Multiplayer or network synchronization.
- Complex asset loaders (audio/texture files); procedural vector rendering and Web Audio synthesize all visuals/sounds in the MVP.
- Complex level editor; initial rooms are declared as compact JSON/data structures.

## System Architecture

```
+-------------------------------------------------------------------------+
|                        BROWSER INPUT & WINDOW                           |
|       (Keyboard: WASD, R, Space | Mouse: Screen Coords, Left Click)     |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                           TIME GOVERNOR                                 |
|  - Tracks player movement speed to calculate timeScale [0.05 .. 1.0]     |
|  - Queues immediate tick bursts for Fire (+N) and Reload (+M)           |
|  - Converts wall-clock deltaTime into simulation accumulator ticks      |
+-------------------------------------------------------------------------+
                                    |
                                    v  (discrete ticks)
+-------------------------------------------------------------------------+
|                       FIXED-STEP SIMULATOR                              |
|  - Physics & Velocity updates (Player, Enemies, Projectiles)            |
|  - Continuous Collision Detection (Raycasts against Obstacles & Units)  |
|  - Enemy AI Decision Cycles (Line-of-Sight, Firing Interval)            |
|  - Room State & Victory / Defeat Evaluations                            |
+-------------------------------------------------------------------------+
                                    |
                                    v  (interpolated frame state)
+-------------------------------------------------------------------------+
|                       CANVAS 2D RENDERER                                |
|  - Render Arena Bounds, Walls, and Cover Pillars                        |
|  - Render Player (Cyan) & Directional Aim Pointer                       |
|  - Render Enemies (Crimson Polygons) & Bullet Tracers                   |
|  - Render Particle Shards & HUD (Revolver Cylinder, Time Gauge)         |
+-------------------------------------------------------------------------+
```

## Decisions

### Decision 1: Vite + TypeScript + HTML5 Canvas 2D
- **Rationale**: TypeScript provides compile-time safety for vector arithmetic, geometric collision math, and weapon configuration schemas. Vite provides an instant dev server with hot module replacement (HMR) and an optimized zero-overhead bundle.
- **Alternatives considered**:
  - *Pure HTML/JS*: Too error-prone for vector math and entity component architectures without static types.
  - *Phaser.js / Pixi.js*: Heavy abstraction layer that obscures custom time-dilation mechanics and fixed-step simulation controls.

### Decision 2: Fixed-Timestep Simulation Decoupled from Render Loop
- **Rationale**: Variable delta time directly in physics leads to projectile tunneling when time suddenly accelerates (e.g. during a 30-tick reload burst). Running a fixed simulation step (e.g. 1/60s per tick) and feeding it ticks based on the time scale ensures deterministic collisions.
- **Alternatives considered**:
  - *Variable dt per frame*: Fast bullets pass through thin walls or players if frame rate drops or when time scale jumps.

### Decision 3: Velocity-Proportional Time Scaling with Micro-Creep
- **Rationale**: Setting `timeScale = Math.max(0.05, playerSpeed / maxSpeed)` creates a continuous, natural transition between planning and fast execution.
- **Alternatives considered**:
  - *Binary time (0% or 100%)*: Jarring and removes the urgency of watching bullets crawl toward you while planning.

### Decision 4: Modular Weapon Architecture
- **Rationale**: Weapons are defined as declarative configs:
  ```typescript
  interface WeaponConfig {
    name: string;
    magSize: number;
    fireTickBurst: number;
    reloadTickBurst: number;
    cooldownTicks: number;
    bulletSpeed: number;
    spreadAngle: number;
    pellets: number;
  }
  ```
  The revolver is the default implementation (`magSize: 6`, single projectile, distinct fire/reload bursts).

## Risks / Trade-offs

- **[Risk] High action tick bursts cause instant player deaths**: If a player reloads in direct line of fire, the 30-tick burst might immediately advance a creeping bullet into them.
  - *Mitigation*: This is the intended core puzzle tension. Provide clear visual cues on HUD (e.g., "[R] RELOAD (+30 TICKS)") and allow instant restart (`R`) upon death.
- **[Risk] Frame pacing during tick bursts**: Advancing 30 simulation ticks in a single frame could cause a frame stutter.
  - *Mitigation*: 30 2D geometric physics ticks are computationally lightweight (<0.2ms in modern JavaScript engines).
