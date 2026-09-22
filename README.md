# ChronoShot ⏱️💥

> A top-down tactical arcade puzzle-shooter where **time moves only when you move**.

[![CI](https://github.com/k-electron/chronoshot/actions/workflows/ci.yml/badge.svg)](https://github.com/k-electron/chronoshot/actions/workflows/ci.yml)
[![Cloudflare Pages](https://img.shields.io/badge/Deployed%20with-Cloudflare%20Pages-F38020.svg?logo=cloudflare)](https://pages.cloudflare.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Tests-97%20passing-brightgreen.svg)]()

---

```
+-----------------------------------------------------------------------+
| 02 // CROSSFIRE               CHRONO // 0.20x [||        ] [ESC] PAUSE|
|                                                                       |
|        # # # # # # # # # # # # # # # # # # # # # # # # # #            |
|        #                                                 #            |
|        #    [▲ Enemy: Pistol]                            #            |
|        #       *   .   .   . (bullet creeping at 5%)     #            |
|        #        \                                        #            |
|        #       +-------+                                 #            |
|        #       | PILLAR|                                 #            |
|        #       +-------+                                 #            |
|        #                                                 #            |
|        #                [● You: Cyan] ----> [· Reticle]  #            |
|        #                                                 #            |
|        #                               [▲ Enemy: Shotgun]#            |
|        # # # # # # # # # # # # # [EXIT GATE] # # # # # # #            |
|                                                                       |
| (O) 6 / 6 CYLINDER                                                    |
|     READY                                                             |
+-----------------------------------------------------------------------+
```

---

## 🎮 Overview

**ChronoShot** translates the spatial puzzle mechanics of *SUPERHOT* into the twitch-and-flank readability of a top-down geometric shooter.

Every step you take accelerates global time. When you stop, time slows to a **5% micro-creep**, allowing you to read bullet trajectories, weave through crossfires, and line up precision shots. But choose your moments wisely—reloading costs **30 simulation ticks**, advancing in-flight bullets and enemy patrols while you're vulnerable unless you take cover.

---

## ✨ Core Mechanics

### 1. Dynamic Time Dilation
- **Micro-Creep Baseline (5%)**: Time never fully freezes when stationary. Bullets crawl forward slowly, maintaining constant tactical urgency.
- **Velocity-Driven Time Scale (5% → 100%)**: Player movement velocity smoothly ramps time up to full speed and decelerates when keys are released.
- **Continuous Aiming**: Mouse aiming is free and decoupled from time progression, allowing tactical line-of-sight checks without advancing the world.

### 2. Action Tick Bursts & The Reload Dilemma
- **Discharge Burst (+6 Ticks)**: Firing pushes an immediate short tick advance simulating firearm discharge duration.
- **Reload Window (+30 Ticks)**: Reloading consumes a substantial block of simulation ticks. If you reload in the open, creeping bullets surge forward and strike you. Sprint behind a pillar to reload safely!

### 3. Modular Weapon System & Cylinder HUD
- Declarative `WeaponConfig` schema supporting magazine capacity, cooldowns, bullet velocity, spread, and action tick costs.
- Default **6-Round Revolver** featuring individual chamber tracking (`loaded` vs `spent`) and an interactive HUD rendering cylinder rotation, primer alignment, and reload prompts.

### 4. Continuous Collision Detection (CCD) Ballistics
- High-speed projectiles utilize per-tick segment raycasting against obstacle polygons and circular unit hitboxes, preventing tunneling even across massive tick jumps.

### 5. Enemy Archetypes
- **Pistol Grunt (Crimson Triangle)**: Discharges single accurate lethal rounds at steady intervals.
- **Shotgun Guard (Crimson Square)**: Discharges lethal 5-pellet buckshot spreads, forcing lateral dodges or hard cover.
- Both archetypes feature continuous line-of-sight raycasting against intervening cover obstacles.

### 6. Procedural Web Audio Synthesis with Pitch Modulation
- Zero external audio assets required; all sound effects are synthesized live using the Web Audio API.
- **Dynamic Time-Scale Modulation**: Audio playback rates and oscillator frequencies scale dynamically with `timeScale`. Sounds drop to deep sub-bass drones (~0.43x pitch, ~2.4x duration) during 5% micro-creep and pitch up to normal tempo when sprinting.

### 7. Bite-Sized Tactical Puzzle Progression
- Handcrafted room sequences with distinct spatial challenges:
  - **Room 01 (`BASIC COVER`)**: 1v1 duel teaching micro-creep peeking and precision firing.
  - **Room 02 (`CROSSFIRE`)**: 2v1 flanking engagement teaching line-of-sight breaking and reload timing.
  - **Room 03 (`HEAVY SPREAD`)**: Shotgun Guard + Pistol Grunt pressure teaching spread avoidance.
- Destroying all enemies in a room unlocks the radiant exit portal to advance to the next floor.

---

## 🕹️ Controls

| Input | Action |
|---|---|
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | Move (Smoothly accelerates time to 100%) |
| <kbd>Mouse</kbd> | 360° Hardware Aim Reticle (Does not advance time) |
| <kbd>Left Click</kbd> | Fire Revolver (+6 simulation ticks) / Resume from Pause |
| <kbd>R</kbd> | Reload Revolver (+30 simulation ticks) / Instant Restart on Defeat |
| <kbd>Shift</kbd> + <kbd>R</kbd> | Quick Restart Current Encounter |
| <kbd>Esc</kbd> / <kbd>P</kbd> | Toggle Tactical Pause & Controls Matrix |
| <kbd>M</kbd> | Toggle Audio Mute |

---

## 🏗️ Architecture

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
|  - Queues immediate tick bursts for Fire (+6) and Reload (+30)          |
|  - Converts wall-clock deltaTime into simulation accumulator ticks      |
+-------------------------------------------------------------------------+
                                    |
                                    v  (discrete ticks)
+-------------------------------------------------------------------------+
|                       FIXED-STEP SIMULATOR                              |
|  - Fixed 60 Hz physics loop decoupled from rendering framerate          |
|  - Continuous Collision Detection (Raycasts against Obstacles & Hitboxes)|
|  - Enemy AI Decision Cycles (Line-of-Sight, Firing Timers)              |
|  - Room State & Victory / Defeat Evaluations                            |
+-------------------------------------------------------------------------+
                                    |
                                    v  (interpolated frame state)
+-------------------------------------------------------------------------+
|                       CANVAS 2D RENDERER                                |
|  - High-contrast geometric minimalism (Cyan Player, Crimson Enemies)    |
|  - Glowing bullet tracers, fading trails, and crystalline shatter shards |
|  - Interactive Revolver Cylinder HUD & Time Dilation Meter              |
+-------------------------------------------------------------------------+
```

---

## 🚀 Quickstart

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/k-electron/chronoshot.git
cd chronoshot

# Install dependencies
npm install

# Start local Vite development server
npm run dev
```

Visit the local URL printed in your terminal (typically `http://localhost:5173`) in your web browser.

### Running Tests
ChronoShot features an **outcome-based** test suite covering vector math, collision physics, time dilation acceleration curves, action bursts, revolver state machines, and room state transitions:

```bash
# Run unit & integration test suite with Vitest
npm test

# Run tests in watch mode
npm run test:watch
```

### Production Build
```bash
npm run build
npm run preview
```

### Continuous Integration & Cloudflare Pages Hosting

- **GitHub Actions**: Automated CI (`.github/workflows/ci.yml`) runs on all pull requests and pushes to `main`. It validates dependencies, TypeScript compilation, Vite production build, and all 97 Vitest unit tests under Node 26.
- **Cloudflare Pages Hosting**:
  1. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
  2. Select the `k-electron/chronoshot` repository.
  3. Set the build configuration:
     - **Framework preset**: `Vite` (or None)
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
     - **Environment variables**: Add `NODE_VERSION` = `26` (also auto-detected from `.nvmrc`)
  4. Click **Save and Deploy**. Cloudflare Pages automatically delivers edge-cached static assets with security headers (`public/_headers`) and generates instant preview URLs for each pull request.

---

## 📁 Project Structure

```text
chronoshot/
├── .github/
│   └── workflows/                # GitHub Actions CI automation (Node 26)
│       └── ci.yml
├── .nvmrc                        # Pinned Node runtime (Node 26)
├── AGENTS.md                     # Architecture and instructions for AI coding assistants
├── CONTRIBUTING.md               # Guidelines for contributors and PR submission
├── openspec/                     # OpenSpec durable specifications & archives
│   ├── specs/                    # Durable project capability specs
│   │   ├── combat-arena/spec.md
│   │   ├── time-engine/spec.md
│   │   └── weapon-system/spec.md
│   └── changes/                  # Active and completed changes
├── public/                       # Static public assets copied to dist/ root
│   ├── _headers                  # Cloudflare Pages edge cache & security headers
│   ├── _redirects                # SPA fallback rule
│   └── favicon.svg               # Vector reticle favicon
├── src/
│   ├── audio/                    # Procedural Web Audio API sound synthesizer
│   │   └── SoundSynthesizer.ts
│   ├── engine/                   # Time dilation governor & fixed-step simulator
│   │   ├── FixedStepSimulator.ts
│   │   └── TimeGovernor.ts
│   ├── entities/                 # Game entities & particle systems
│   │   ├── Arena.ts
│   │   ├── Enemy.ts
│   │   ├── Obstacle.ts
│   │   ├── ParticleSystem.ts
│   │   ├── Player.ts
│   │   └── Projectile.ts
│   ├── levels/                   # Puzzle room configurations & room progression
│   │   ├── Room.ts
│   │   └── RoomManager.ts
│   ├── math/                     # 2D vector primitives & continuous collision math
│   │   ├── collision.ts
│   │   └── vector.ts
│   ├── ui/                       # Minimalist HUD, tactical reticle, and theme
│   │   ├── CylinderHUD.ts
│   │   ├── Reticle.ts
│   │   ├── theme.ts
│   │   └── TimeHUD.ts
│   ├── weapons/                  # Modular weapon schema & 6-shot revolver state
│   │   ├── Revolver.ts
│   │   └── Weapon.ts
│   └── main.ts                   # Game entrypoint & canvas loop initialization
├── index.html                    # Single-page canvas container
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📜 Specifications

ChronoShot is developed following [OpenSpec](https://github.com/openspec/openspec) standard specification-driven workflows. Durable capability specifications can be found under [`openspec/specs/`](openspec/specs/):
- **`time-engine`**: Time dilation curves, micro-creep, and action tick bursts.
- **`weapon-system`**: Modular firearm configurations and the 6-round revolver.
- **`combat-arena`**: 2D arena layout, obstacle cover, enemy AI, 1-hit lethality, and puzzle rooms.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.
