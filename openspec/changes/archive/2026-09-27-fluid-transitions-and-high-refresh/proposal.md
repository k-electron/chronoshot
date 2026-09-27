# Proposal

## Why

Tactical combat transitions in ChronoShot currently feel abrupt and disjointed:
- Releasing movement keys snaps time scale from 1.00x down to 0.05x in a single 16.6ms frame, creating a jarring step-function drop in tick pacing and audio pitch.
- Defeating a milestone boss immediately triggers the upgrade draft or victory HUD on the exact frame of lethal impact, abruptly cutting the simulation, freezing shatter particles in mid-air, and granting the player a "free pass" by instantly neutralizing all lethal boss projectiles in flight.
- Entering the room exit portal executes an instantaneous hard cut that wipes particles, teleports the player across the screen, and swaps obstacles with zero spatial continuity.
- On modern high-refresh monitors (120Hz–240Hz, VRR) and high-DPI displays, rendering un-interpolated 60 Hz physics coordinates creates micro-judder and fuzzy scaling.

Addressing these issues transforms ChronoShot's core gameplay flow into a continuous, cinematic geometric combat experience while preserving 100% deterministic physics rules and instant control responsiveness.

## What Changes

- **Asymmetric Time Dilation Decay**: Maintain instantaneous acceleration/attack on movement input for twitch dodging, but replace instantaneous step drops with a smooth ~200ms settling decay curve into the 0.05x micro-creep baseline when keys are released, accompanied by continuous acoustic pitch Doppler.
- **Boss Defeat Slow-Motion Decay & Ballistics Continuity**: When a milestone boss is defeated, enter an active slow-motion disintegration sequence (~400–600ms wall time). In-flight boss projectiles remain live and lethal—requiring the player to dodge active novae or buckshot—before the upgrade draft or victory screen smoothly emerges.
- **Living Particle Simulation**: Decouple visual particle updates from the fixed simulation step so that geometric debris, sparks, and shockwaves continue expanding and fading smoothly in wall-clock time during pause, upgrade draft, and victory/defeat screens.
- **Cyberpunk Iris Portal Transit**: Replace the instantaneous room-load teleport with a continuous geometric cyberpunk iris aperture transition: operative draws inward to the portal center $\to$ iris aperture contracts to zero $\to$ atomic room swap $\to$ iris aperture expands outward from the new room's player spawn.
- **Boss Phase Transition Continuity**: Introduce a brief temporal hit-stop and expanding shockwave telegraph during boss phase swaps so phase changes read as tactile tactical shifts.
- **Display Refresh (60–240Hz) & DPR Backing Store**: Implement sub-tick position interpolation (`lerp(previousPosition, position, alpha)`) across all visible entities (player, enemies, projectiles) and scale canvas internal dimensions by `window.devicePixelRatio` for native Retina sharpness.

## Capabilities

### Modified Capabilities

- `time-engine`: Update time scale ramping requirements to specify asymmetric attack and smooth settling decay into micro-creep upon movement cessation.
- `boss-encounters`: Specify boss defeat continuous slow-motion decay with live projectile lethality and continuous phase transition shockwaves.
- `procedural-levels`: Add requirement for continuous geometric cyberpunk iris portal ingress and egress transitions between rooms.
- `combat-arena`: Specify sub-tick render interpolation across variable display refresh rates (60–240Hz), DPR backing store scaling, and wall-clock particle simulation persistence during freeze-frame overlays.

## Impact

- Affected core files: `src/main.ts`, `src/engine/TimeGovernor.ts`, `src/entities/Arena.ts`, `src/levels/RoomManager.ts`, `src/entities/boss/BossTransitionAction.ts`, `src/entities/ParticleSystem.ts`, `src/ui/Reticle.ts`, `index.html`.
- No breaking changes to existing physics step size (`1/60s`), collision detection math, weapon configs, or upgrade effects.
- Tests will verify frame-rate independence, deterministic physics invariants, and continuous transition states.
