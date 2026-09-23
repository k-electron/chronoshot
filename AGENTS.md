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
  - **Action Tick Bursts**: Instant discrete physics advancements:
    - Fire weapon: `+6` simulation ticks.
    - Reload weapon: `+30` simulation ticks.
- **`Arena`**: Coordinates entities (`Player`, `Enemy`, `Obstacle`, `Projectile`, `ParticleSystem`), collision passes, and room progression.

### 2. Continuous Collision Detection (CCD) Ballistics & Shield Durability
- High-velocity projectiles must never tunnel through obstacles or hitboxes during discrete tick jumps.
- Projectiles cast raycast line segments between `previousPosition` and `position` against obstacle bounds and unit circles on every tick.
- **Hit-Count Shields**: Units with energy shields absorb discrete bullet impacts via `takeDamage()`, producing procedural deflection sparks and pings before suffering lethal elimination.

### 3. Procedural Audio (Zero External Asset Files)
- All sound effects (gunfire, reload clicks, bullet wall impacts, shield deflections, shield breaks, sniper laser charging, enemy shatters, victory fanfare) are synthesized programmatically using the browser Web Audio API via `SoundSynthesizer`.
- **Never add external audio binaries (`.mp3`, `.wav`, `.ogg`)**.
- Audio pitch and duration scale dynamically with `TimeGovernor.getTimeScale()` (e.g. deep sub-bass pitch drop during micro-creep).

### 4. 40px Grid A* Pathfinding & Enemy Archetypes
- **`GridPathfinder`**: Discrete $24 \times 16$ tile-grid A* with entity radius obstacle inflation ($16\text{px}$) navigates around walls and pillars when line-of-sight is blocked.
- **Line-of-Sight String Pulling**: When sightlines are clear, AI switches to direct-vector steering (rushers close in, kiters retreat).
- **6 Archetypes**: Pistol Grunt, Shotgun Guard, Stalker Rusher, Aegis Warden, Marksman Sniper, and Goliath-01 Aegis Colossus (Sector 1 Boss with 4 shields, dual heavy slugs, enraged phase 2, and dedicated telemetry).

### 5. Minimalist HUD & Tactical UI
- **In-Canvas Reticle (`src/ui/Reticle.ts`)**: Canvas cursor is set to `cursor: none`. An in-canvas precision hardware crosshair tracks mouse coordinates, dynamically expanding with movement velocity and flashing crimson on dry-fire.
- **Hairline Revolver Dial (`src/ui/CylinderHUD.ts`)**: Minimalist 6-chamber dial (dynamically expandable to 8 chambers with Extended Cylinder) with active chamber alignment notch and smooth rotational transition.
- **Hairline Chrono-Telemetry (`src/ui/TimeHUD.ts`)**: Top-right gauge displaying numeric multiplier (`CHRONO // 0.05x`) and transient action burst pills.
- **Boss Telemetry & Upgrade Draft**: Top-center boss shield telemetry meter during milestone encounters, followed by immediate freeze-frame 3-card tactical augmentation draft (Extended Cylinder, Speed Loader, Reactive Shield).
- **Pause Lifecycle**: Toggleable with <kbd>Esc</kbd> or <kbd>P</kbd>. Halts simulation ticks and displays a frosted Swiss-style control matrix card.

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
   - The entire suite (166+ tests) runs in under 350ms. Avoid arbitrary `setTimeout` or wall-clock waits in tests.

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
