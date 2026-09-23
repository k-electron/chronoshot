# Proposal

## Why

Currently, triggering a reload executes an instantaneous burst of 30 simulation ticks in a single rendering frame (16.6ms), causing an abrupt visual jump where enemy projectiles and hostiles teleport up to 200 pixels with zero visual continuity or telegraphing. Furthermore, player movement is not locked during this burst, allowing players holding movement keys to glide across the arena mid-reload without tactical vulnerability.

This change transforms the reload cycle into a smooth, high-stakes tactical channel. The player is physically immobilized while retaining full 360-degree aiming freedom, simulation time runs smoothly at real-time speed (1.00x) over 30 simulation ticks (15 with Speed Loader), visual telemetry clearly communicates the anchor state across in-world ground geometry, reticle, and cylinder HUD, and players can execute an Overcharge Dash to break the lock in emergencies while retaining partially loaded rounds.

## What Changes

- **Real-Time Reload Exposure**: Replace the single-frame 30-tick instantaneous time skip with a smooth multi-frame reload channel running at real-time (1.00x) speed (30 ticks = 0.50s at 60 Hz; 15 ticks = 0.25s with Speed Loader).
- **Player Immobilization & Aiming Freedom**: Lock player translation (`velocity = 0`, WASD inputs ignored) during the reload channel while preserving continuous 360-degree mouse aiming and facing orientation.
- **Sequential Chamber Loading**: Revolver chambers seat one-by-one at uniform intervals throughout the reload duration rather than refilling all sockets on tick 0.
- **Emergency Dash Breakout with Sequential Retention**: If Overcharge Dash is ready, dashing cancels the remaining reload lock immediately; any chambers already seated before the breakout are retained, while unfinished chambers remain unchambered.
- **Modular In-World Chrono-Anchor Visuals**: Render hairline ground anchor clamps and a $0^\circ \to 360^\circ$ radial progress sweep around the player chassis, alongside spent brass casing particle ejections.
- **In-Canvas Reticle Reload Telemetry**: Render an in-canvas circular progress sweep around the precision crosshair micro-dot, transitioning the reticle to an amber/cycling hue during reload.
- **Dynamic Cylinder HUD & Audio Synchronization**: Update the cylinder HUD to reflect active sequential chamber seating and cycling status, and synchronize mechanical ratchet clicks with chamber loading leading into a solid latch lock upon completion.

## Capabilities

### Modified Capabilities
- `time-engine`: Update combat action burst behavior so reload actions advance simulation time through a real-time (1.00x) multi-frame exposure window rather than an instantaneous single-frame jump.
- `weapon-system`: Update the reload cycle and cylinder HUD requirement to specify stateful multi-tick reload execution, sequential chamber loading, player ground immobilization with aiming freedom, emergency dash cancellation with partial ammo retention, and reticle progress telemetry.

## Impact

- `src/weapons/Weapon.ts` & `src/weapons/Revolver.ts`: Weapon interfaces and Revolver implementation gain modular reload state tracking (progress, ticks remaining, sequential chamber loading, partial retention, cancel/abort).
- `src/entities/Player.ts`: Player update loop coordinates immobilization, aiming freedom, reload state lifecycle, and Overcharge Dash breakout.
- `src/engine/TimeGovernor.ts` & `src/entities/Arena.ts`: Simulation coordination ensures real-time 1.00x progression during active reloads without 1-frame tick bursts.
- `src/ui/Reticle.ts`: Reticle supports circular reload progress indicator and cycling color states.
- `src/ui/CylinderHUD.ts`: Cylinder HUD renders incremental chamber loading animations and cycling status prompts.
- `src/audio/SoundSynthesizer.ts`: Audio timing aligns ratchet clicks and cylinder latch with multi-tick progression.
