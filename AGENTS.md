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
- **`Arena`**: Coordinates entities (`Player`, `Enemy`, `Obstacle`, `Projectile`, `ParticleSystem`), collision passes, and room progression.

### 2. Continuous Collision Detection (CCD) Ballistics & Shield Durability
- High-velocity projectiles must never tunnel through obstacles or hitboxes during discrete tick jumps.
- Projectiles cast raycast line segments between `previousPosition` and `position` against obstacle bounds and unit circles on every tick.
- **Hit-Count Shields**: Units with energy shields absorb discrete bullet impacts via `takeDamage()`, producing procedural deflection sparks and pings before suffering lethal elimination.

### 3. Procedural Audio (Zero External Asset Files)
- All sound effects (gunfire, reload clicks, bullet wall impacts, shield deflections, shield breaks, sniper laser charging, enemy shatters, victory fanfare) are synthesized programmatically using the browser Web Audio API via `SoundSynthesizer`.
- **Never add external audio binaries (`.mp3`, `.wav`, `.ogg`)**.
- Audio pitch and duration scale dynamically with `TimeGovernor.getTimeScale()` (e.g. deep sub-bass pitch drop during micro-creep).

### 4. 40px Grid A* Pathfinding & Modular Boss Phase Engine
- **`GridPathfinder`**: Discrete $24 \times 16$ tile-grid A* with entity radius obstacle inflation ($16\text{px}$) navigates around walls and pillars when line-of-sight is blocked, featuring dual-sided endpoint snapping (`findNearestWalkable`) to prevent deadlocks when starting adjacent to obstacles.
- **Physical Clearance Decoupling & Line-of-Sight String Pulling**: When optical sightlines are clear, AI evaluates continuous swept-circle navigation clearance (`hasNavigationClearance`) before switching to direct-vector steering (rushers close in, kiters retreat), preventing corner-cutting clipping while preserving instant weapon targeting.
- **Archetypes & Bosses**: Pistol Grunt, Shotgun Guard, Stalker Rusher, Aegis Warden, Marksman Sniper, alongside multi-phase milestone bosses Goliath-01 Aegis Colossus, Chrono-Weaver Temporal Anchor, Vektor-Prime Phase Sovereign, and the Room 20 final milestone boss Chrono-Zenith Zero Sovereign.
- **`BossPhaseController` & `BossBlueprint`**: Declarative $N$-phase state machines governing boss progression with dynamic movement/attack swaps, transition triggers, and lifecycle actions (`BossTransitionAction`: radial particle shockwaves, dynamic audio cues, escort minion summons, and Cataclysm Overload telegraphed invulnerability channels with line-of-sight obstacle raycast cover checks). Includes `RadialNovaBehavior` for 360-degree projectile novae.

### 5. Minimalist HUD & Tactical UI
- **In-Canvas Reticle (`src/ui/Reticle.ts`)**: Canvas cursor is set to `cursor: none`. An in-canvas precision hardware crosshair tracks mouse coordinates, dynamically expanding with movement velocity, flashing crimson on dry-fire, and rendering a circular progress sweep with amber hue during active reload.
- **Chrono-Anchor Telemetry (`src/ui/ChronoAnchorRenderer.ts`)**: In-world ground locking clamps, hairline pins, and a $0^\circ \to 360^\circ$ radial sweep arc rendered around the player chassis during anchored reload exposure.
- **Hairline Revolver Dial (`src/ui/CylinderHUD.ts`)**: Minimalist 6-chamber dial (dynamically expandable to 8 chambers with Extended Cylinder) with active chamber alignment notch, smooth rotational transition, incremental chamber seating visuals, and emergency dash abort prompt.
- **Hairline Chrono-Telemetry (`src/ui/TimeHUD.ts`)**: Top-right gauge displaying numeric multiplier (`CHRONO // 0.05x`) and transient action burst pills.
- **Phase-Aware Boss Telemetry (`src/ui/BossTelemetryHUD.ts`) & Endless Telemetry (`src/ui/EndlessTelemetryHUD.ts`)**: Decoupled top-center boss telemetry rendering boss designation, active phase badges (e.g. `PHASE 2/2 // OVERDRIVE`), and shield charge pips. In Endless Mode, in-canvas telemetry displays real-time threat budget, elapsed survival time (MM:SS), and kill counter.
- **Dual-Card Defeat HUD (`src/ui/DefeatHUD.ts`) & Cascading Boss Rollback (`src/levels/RollbackCalculator.ts`)**: Interactive elimination overlay presenting two cards: **Card 1: Rollback** (<kbd>R</kbd> or click) and **Card 2: Full Reset** (<kbd>Shift+R</kbd> or click). Rollback evaluates the failure room and cascades tier-by-tier down to the beginning of the preceding boss fight (Rooms 1–5 $\to$ Room 1, Rooms 6–10 $\to$ Room 5, Rooms 11–15 $\to$ Room 10, Rooms 16–20 $\to$ Room 15, Endless Mode $\to$ Room 20), restoring clean pre-boss upgrade snapshots. In Endless Mode, defeat renders a survival performance tally (elapsed time, max threat reached, hostiles eliminated).
- **Tactical Upgrade Draft & Pipeline (`src/upgrades/` & `src/ui/UpgradeDraftHUD.ts`)**: Data-driven roguelike upgrade pipeline (`UpgradePipeline`) with centralized registry (`UpgradeRegistry`), dynamic $N$-card draft UI (`UpgradeDraftHUD`), stack control, and compounded modifiers. Baseline augmentations (Extended Cylinder, Speed Loader, Reactive Shield) and advanced perks (Kinetic Stride, Chrono Burst, Phase Deflector, Overcharge Dash).
- **Pause Lifecycle**: Toggleable with <kbd>Esc</kbd> or <kbd>P</kbd>. Halts simulation ticks and displays a frosted Swiss-style control matrix card.

### 6. Modular Level Director, Endless Director & Procedural Generation
- **`RoomLayoutTemplate` & `DEFAULT_LAYOUT_REGISTRY`**: Composable tactical geometry layouts (`CenterPillarsTemplate`, `TwinBunkersTemplate`, `SplitCorridorTemplate`, `KillboxLanesTemplate`, `ArenaQuadrantTemplate`, `ApexRedoubtTemplate`, `ApexColosseumTemplate`) with verified spawn safety ($\ge 280\text{px}$ from player spawn).
- **`EncounterDirector`**: Threat-budget encounter synthesizer selecting hostile archetypes dynamically based on difficulty tier while enforcing composition constraints (max 2 snipers, frontliner escort rules) and geometric separation ($\ge 48\text{px}$ between units, outside obstacle collision boxes).
- **`EndlessDirector`**: Survival mode wave coordinator dynamically tracking active threat load against a climbing simulation threat budget ($50 + \lfloor \text{ticks}/120 \rfloor \times 5$), safely filtering spatial candidates ($\ge 350\text{px}$ from player, $\ge 48\text{px}$ unit clearance), and queuing 30-tick visual telegraph rings before unit materialization.
- **`LevelDirector`**: Deterministic Mulberry32 PRNG engine producing reproducible room configurations from numeric or string seeds, with automated milestone boss injection every 5th room (Sector 1: Goliath-01, Sector 2: Chrono-Weaver, Sector 3: Vektor-Prime, Sector 4: Chrono-Zenith).
- **`RoomManager` Dynamic Mode**: Seamlessly switches between classic fixed campaign sequences (20 rooms) and endless procedural room streams upon portal entry. Completing Room 20 unlocks a golden exit gate directly transitioning into Endless Survival Mode with full loadout injection (all 7 upgrades equipped, 3 shields, 8 rounds).

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
   - The entire suite (511+ tests) runs in under 700ms. Avoid arbitrary `setTimeout` or wall-clock waits in tests.

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
