# Tasks: Initialize ChronoShot Core Game Engine

## 1. Project Initialization & Build Setup

- [x] 1.1 Scaffold Vite + TypeScript project structure with `package.json`, `tsconfig.json`, `index.html`, and verify `npm install` and `npm run build` execute without errors.
- [x] 1.2 Implement core 2D vector math utilities (`Vector2D`, normalization, dot product, ray-line collision checks) and verify calculations with unit tests.

## 2. Time Engine & Game Loop

- [x] 2.1 Implement `TimeGovernor` managing baseline micro-creep (5%), velocity-driven time scale ramp/decel up to 100%, and verify time scale curves via unit tests.
- [x] 2.2 Implement action tick queuing on `TimeGovernor` for fire bursts and reload bursts, and verify discrete tick advance calculations via unit tests.
- [x] 2.3 Implement decoupled `FixedStepSimulator` running fixed 60 Hz physics ticks from accumulated time and verify deterministic tick progression.

## 3. Weapon System & HUD

- [x] 3.1 Define modular `WeaponConfig` schema and implement 6-round Revolver state machine (ammo tracking, cooldowns, dry fire, reload cycle), and verify state transitions with unit tests.
- [x] 3.2 Implement Canvas 2D cylinder HUD displaying 6 chamber states (loaded, spent, reloading) and time scale gauge, and verify correct rendering in browser.

## 4. Combat Arena & Entities

- [x] 4.1 Implement `Player` entity with WASD movement, obstacle collision bounds, and continuous mouse crosshair aiming, and verify movement and wall collisions in canvas.
- [x] 4.2 Implement `Projectile` raycasting with continuous collision detection against obstacles and units, and verify bullets terminate and produce impact effects on walls.
- [x] 4.3 Implement `Enemy` entities (Pistol Grunt, Shotgun Guard) with line-of-sight tracking and weapon discharge timers, and verify enemy firing cadence during active simulation.
- [x] 4.4 Implement 1-hit lethality, geometric particle shatter system upon unit destruction, and instant room restart on `R`, and verify death and reset flow.

## 5. Puzzle Room Progression & Integration

- [x] 5.1 Create room configuration data schema and implement a 3-room sequence of tactical puzzles, verifying that destroying all enemies unlocks the exit portal to progress.
- [x] 5.2 Implement Web Audio API procedural sound synthesizer with dynamic pitch modulation tied to `timeScale`, and verify audio pitch shifts with time dilation.
- [x] 5.3 Conduct end-to-end browser gameplay verification, confirming 60 FPS performance, time dilation responsiveness, revolver reload vulnerability, and completion of all 3 puzzle rooms.
