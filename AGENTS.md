# AGENTS.md

Welcome, AI agent! This document provides essential project context, architectural guidelines, development workflows, and coding standards for developing **ChronoShot**.

---

## 🎯 Project Overview

**ChronoShot** is a high-performance, top-down tactical puzzle-shooter built around the core mechanic: **Time moves only when you move**.

- **Aesthetic**: Geometric cyberpunk minimalism with radiant cyan player telemetry, signal crimson hostiles, and hairline HUDs.
- **Tech Stack**:
  - **Language**: TypeScript 5.4+ (strict mode enabled)
  - **Bundler**: Vite 5.4
  - **Runtime**: Browser HTML5 Canvas 2D & Web Audio API
  - **Testing**: Vitest 1.6+
  - **Specifications**: OpenSpec (spec-driven development)

---

## 🏛️ Architecture & Core Principles

ChronoShot is deliberately engineered without heavy third-party game engines (no Phaser, Three.js, or Pixi.js). Keep the engine lean, transparent, and deterministic.

### 1. Decoupled Simulation & Rendering
- **`FixedStepSimulator`**: Executes discrete 60 Hz physics quanta (`fixedDeltaTime = 1 / 60`).
- **`TimeGovernor`**: Governs global time dilation:
  - **Micro-Creep**: 5% simulation velocity (`0.05x`) when player is stationary.
  - **Movement Scaling**: Smoothly accelerates time scale up to 100% (`1.00x`) proportional to player movement velocity.
  - **Action Tick Bursts & Anchored Real-Time Reload**:
    - Fire weapon: `+6` simulation ticks (instantaneous recoil burst).
    - Reload weapon: Smooth multi-frame real-time channel (`1.00x` speed) spanning 30 simulation ticks (15 with Speed Loader) while player locomotion is anchored (`velocity = 0`) with 360-degree aiming freedom, sequential chamber loading, and emergency Dash breakout with partial ammo retention.
- **`Arena`**: Coordinates entities (`Player`, `Enemy`, `Obstacle`, `Projectile`, `ParticleSystem`), dynamic entity instantiation (`spawnEnemy`), collision passes, and room progression with unified player elimination lifecycle checks.

### 2. Continuous Collision Detection (CCD) Ballistics & Shield Durability
- High-velocity projectiles must never tunnel through obstacles or hitboxes during discrete tick jumps.
- Projectiles cast raycast line segments between `previousPosition` and `position` against obstacle bounds and unit circles on every tick.
- **Hit-Count Shields**: Units with energy shields absorb discrete bullet impacts via `takeDamage()`, producing procedural deflection sparks and pings before suffering lethal elimination.

### 3. Procedural Audio (Zero External Asset Files)
- All sound effects (gunfire, reload clicks, bullet wall impacts, shield deflections, shield breaks, sniper laser charging, enemy shatters, victory fanfare) are synthesized programmatically using the browser Web Audio API via `SoundSynthesizer`.
- **Never add external audio binaries (`.mp3`, `.wav`, `.ogg`)**.
- Audio pitch and duration scale dynamically with `TimeGovernor.getTimeScale()` (e.g. deep sub-bass pitch drop during micro-creep).

### 4. 20px Grid A* Pathfinding & Modular Boss Phase Engine
- **`GridPathfinder`**: Discrete $48 \times 32$ tile-grid A* with entity radius obstacle inflation and cell-center containment at unit's true radius navigates around walls and pillars when line-of-sight is blocked, featuring dual-sided endpoint snapping (`findNearestWalkable`) to prevent deadlocks when starting adjacent to obstacles.
- **Physical Clearance Decoupling & Directional Contact Filtering**: When optical sightlines are clear, AI evaluates continuous swept-circle navigation clearance (`hasNavigationClearance`) before switching to direct-vector steering. Contact checks filter by contact normal dot product ($\vec{dir} \cdot \hat{n} \ge -0.05$), ensuring units departing or sliding along obstacle boundaries do not suffer false-positive clearance failure. Waypoint shortcuts and sightline transitions are strictly validated with continuous Minkowski swept-circle raycasts.
- **Anti-Freeze Fallback Locomotion & Corner Vertex Tangent Deflection**:
  - `DirectAdvanceBehavior` & `KiterBehavior`: If A* returns an empty path, units fall back to direct pursuit when optical LOS is clear (allowing continuous collision sliding) or goal-aligned obstacle tangent deflection with an 8-tick hysteresis lock when out of sight, guaranteeing mobile units never freeze at `(0, 0)` velocity during active engagement.
  - `Intentional-Stop Movement Watchdog`: Tracks spatial displacement over 12 ticks; if displacement is under 1.5px while commanding nonzero desired velocity (and not intentionally held by fire stutter, charging laser, boss overload, or kiter range holding), triggers an immediate A* repath and tangent breakout slide.
  - `KiterBehavior`: Evaluates lateral wall escape tangents when backwards retreat is obstructed by obstacle boundaries.
  - `Enemy.resolveObstacleCollisions()`: On head-on corner vertex collisions ($\vec{v} \cdot \hat{n} < -0.85$), deflects velocity along the dominant adjacent face tangent ($|v_x| \ge |v_y| \to (v_x, 0)$ else $(0, v_y)$) to break symmetry and prevent corner pinning.
- **Archetypes & Bosses**: Pistol Grunt, Shotgun Guard, Stalker Rusher, Aegis Warden, Marksman Sniper, alongside multi-phase milestone bosses Goliath-01 Aegis Colossus, Chrono-Weaver Temporal Anchor, Vektor-Prime Phase Sovereign, and the Room 20 final milestone boss Chrono-Zenith Zero Sovereign (featuring 4 phases: Citadel Bastion, Temporal Warp, Singularity Tempest with twin counter-rotating novae, and Zero-Point Overdrive).
- **`BossPhaseController` & `BossBlueprint`**: Declarative $N$-phase state machines governing boss progression with dynamic movement/attack swaps, transition triggers, and modular lifecycle actions (`onPhaseEnter`, `onPhaseExit`, and `onOverloadDetonate`). Features Cataclysm Overload: upon shield depletion, the boss anchors in place, gains complete invulnerability, emits an expanding hazard telegraph (`"⚠ CATACLYSM OVERLOAD // SEEK COVER ⚠"`), and counts down a simulation-tick channel (75/65/60 ticks) providing the player a tactical sprint window to break line-of-sight behind cover. When the channel timer expires, `onOverloadDetonate` discharges the lethal arena-wide shockwave (evaluating line-of-sight obstacle raycast occlusion) and materializes escort minion reinforcements before active phase combat engages. Includes `RadialNovaBehavior` for 360-degree projectile novae, supporting both omnidirectional single rings and twin counter-rotating novae (`counterRotating: true`, discharging dual 12-pellet rings in opposing angular directions for Chrono-Zenith Phase 3 Singularity Tempest).

### 5. Minimalist HUD & Tactical UI
- **In-Canvas Reticle (`src/ui/Reticle.ts`)**: Canvas cursor is set to `cursor: none`. An in-canvas precision hardware crosshair tracks mouse coordinates, dynamically expanding with movement velocity, flashing crimson on dry-fire, and rendering a circular progress sweep with amber hue during active reload.
- **Chrono-Anchor Telemetry (`src/ui/ChronoAnchorRenderer.ts`)**: In-world ground locking clamps, hairline pins, and a $0^\circ \to 360^\circ$ radial sweep arc rendered around the player chassis during anchored reload exposure.
- **Hairline Revolver Dial (`src/ui/CylinderHUD.ts`)**: Minimalist 6-chamber dial (dynamically expandable to 8 chambers with Extended Cylinder) with active chamber alignment notch, smooth rotational transition, incremental chamber seating visuals, and emergency dash abort prompt.
- **Hairline Chrono-Telemetry (`src/ui/TimeHUD.ts`)**: Top-right gauge displaying numeric multiplier (`CHRONO // 0.05x`) and transient action burst pills.
- **Phase-Aware Boss Telemetry (`src/ui/BossTelemetryHUD.ts`) & Endless Telemetry (`src/ui/EndlessTelemetryHUD.ts`)**: Decoupled top-center boss telemetry rendering boss designation, active phase badges (e.g. `PHASE 2/2 // OVERDRIVE`), and shield charge pips. In Endless Mode, in-canvas telemetry displays real-time threat budget, elapsed survival time (MM:SS), and kill counter.
- **Campaign Victory HUD (`src/ui/VictoryHUD.ts`)**: Decoupled Swiss-style mission accomplished overlay celebrating completion of all 20 tactical protocols. Features milestone boss checkmarks and dual interactive cards:
  - **Card 0: Endless Protocol** (<kbd>E</kbd>, <kbd>Space</kbd>, or mouse click) transitions directly into Endless Survival Mode in the Apex Colosseum with maxed loadout (all 7 augmentations, 3 shields, 8 rounds).
  - **Card 1: Expedition Reset** (<kbd>R</kbd>, <kbd>Shift+R</kbd>, or mouse click) resets the expedition back to Room 1 with clean starter loadout.
  - Interactive hover state dynamically shifts reticle cursor to `"pointer"` and applies hairline accent frames.
- **Defeat HUD (`src/ui/DefeatHUD.ts`) & Cascading Boss Rollback (`src/levels/RollbackCalculator.ts`)**: Interactive elimination overlay. In Sector 1 (Rooms 1–5), collapses to a single centered **Expedition Reset** card (<kbd>R</kbd>, <kbd>Shift+R</kbd>, or click) to restart at Room 1. In Sectors 2–4 (Rooms 6–20) and Endless Mode, presents dual cards: **Card 1: Rollback** (<kbd>R</kbd> or click) and **Card 2: Full Reset** (<kbd>Shift+R</kbd> or click). Rollback evaluates the failure room and cascades tier-by-tier down to the beginning of the preceding boss fight (Rooms 6–10 $\to$ Room 5, Rooms 11–15 $\to$ Room 10, Rooms 16–20 $\to$ Room 15, Endless Mode $\to$ Room 20), restoring clean pre-boss upgrade snapshots. In Endless Mode, defeat renders a survival performance tally (elapsed time, max threat reached, hostiles eliminated).
- **Tactical Upgrade Draft & Pipeline (`src/upgrades/` & `src/ui/UpgradeDraftHUD.ts`)**: Data-driven roguelike upgrade pipeline (`UpgradePipeline`) with centralized registry (`UpgradeRegistry`), dynamic $N$-card draft UI (`UpgradeDraftHUD`), stack control, and compounded modifiers. Baseline augmentations (Extended Cylinder, Speed Loader, Reactive Shield) and advanced perks (Kinetic Stride, Chrono Burst, Phase Deflector, Overcharge Dash).
- **Pause Lifecycle**: Toggleable with <kbd>Esc</kbd> or <kbd>P</kbd>. Halts simulation ticks and displays a frosted Swiss-style control matrix card.

### 6. Progression Architecture, Endless Director & Playtest Bypass
- **`RoomManager` & Progression Architecture**:
  - Discrete lifecycle manager coordinating sequential progression across 20 handcrafted rooms (Sectors 1–4).
  - Regular rooms (1–4, 6–9, 11–14, 16–19) unlock radiant cyan exit portals upon clearing all hostiles; stepping into the portal advances to the next room.
  - Boss arenas (Rooms 5, 10, 15, 20) and the Endless Colosseum completely suppress floor portals (no zombie inactive portals).
  - Intermediate bosses (Rooms 5, 10, 15) trigger an immediate freeze-frame upgrade draft upon elimination; selecting an upgrade automatically advances the operative into the subsequent sector.
  - Final boss Chrono-Zenith (Room 20) bypasses intermediate drafts upon elimination and immediately triggers the Campaign Victory HUD (`status = "victory"` and `roomManager.advanceRoom()`, marking `isGameCompleted = true`).
  - Selecting **Endless Protocol** on the Victory HUD deploys into Endless Survival Mode in the Apex Colosseum with full loadout injection (all 7 upgrades equipped, 3 shields, 8 rounds).
- **`EndlessDirector` & `ApexColosseumTemplate`**: Survival mode wave coordinator dynamically tracking active threat load against a climbing simulation threat budget ($50 + \lfloor \text{ticks}/120 \rfloor \times 5$), safely filtering spatial candidates ($\ge 350\text{px}$ from player, $\ge 48\text{px}$ unit clearance, zero obstacle overlap), and queuing 30-tick visual telegraph rings before unit materialization. Self-contains archetype threat costs (`THREAT_COSTS`) and cadence timings (`ARCHETYPE_CONFIGS`).
- **Playtest Campaign Bypass (`?skip`)**: Fast developer/playtest hook (`Arena.bypassToCampaignVictory()`) activated via the `?skip` URL query parameter. Directly initializes the operative into the post-Zenith campaign victory screen with completed Room 20 status, pre-Zenith loadout (Extended Cylinder, Speed Loader, Reactive Shield), historical checkpoint snapshots (Rooms 5, 10, 15, 20), and fully functional interactive cards for Endless Protocol and Expedition Reset.

---

## 🛠️ Essential Commands

```bash
# Install dependencies
npm install

# Run complete Vitest test suite
npm test

# Run Vitest in watch mode for TDD
npm run test:watch

# Typecheck and build production distribution
npm run build

# Preview production build locally
npm run preview

# Start local Vite development server
npm run dev
```

---

## 🧪 Testing Guidelines

1. **Outcome-Based Unit Testing**:
   - Tests live side-by-side with source files (e.g. `Arena.test.ts`, `HUD.test.ts`, `TimeGovernor.test.ts`).
   - Every new gameplay feature, UI element, or state transition must include automated Vitest tests.
2. **Mocking Canvas & Web Audio**:
   - Use mock Canvas 2D contexts (`createMockContext()`) with `vi.fn()` for rendering tests.
   - Use mock audio contexts to verify audio trigger calls without requiring real audio devices.
3. **Keep Tests Fast & Deterministic**:
   - The entire suite (712+ tests) runs in under 900ms. Avoid arbitrary `setTimeout` or wall-clock waits in tests.

---

## 📐 Coding Conventions

- **Type Safety**: Strictly typed TypeScript. Do not introduce `any` types unless interfacing with un-typed browser APIs.
- **Performance**:
  - Avoid creating garbage inside hot loop methods (`step()`, `fixedUpdate()`, and `render()`).
  - Pre-allocate vectors and objects where practical.
- **UI Styling**: Use tokens from `src/ui/theme.ts` (`UITheme` and `getUIFont`) for fonts, colors, borders, and panel styling.

---

## 📜 OpenSpec Workflow

This project adheres to the **OpenSpec** standard for durable capability specifications and change tracking:
- **`openspec/specs/`**: Contains the source of truth for capabilities (`combat-arena`, `time-engine`, `weapon-system`).
- **`openspec/changes/`**: Tracks in-flight and archived proposals, specs deltas, design documents, and tasks.
- Always validate changes with `openspec validate <change-name> --strict` before marking work complete.
