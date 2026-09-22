# ChronoShot ⏱️💥

> A top-down tactical arcade puzzle-shooter where **time moves only when you move**.

[![CI](https://github.com/k-electron/chronoshot/actions/workflows/ci.yml/badge.svg)](https://github.com/k-electron/chronoshot/actions/workflows/ci.yml)
[![Cloudflare Pages](https://img.shields.io/badge/Deployed%20with-Cloudflare%20Pages-F38020.svg?logo=cloudflare)](https://pages.cloudflare.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Tests-140%20passing-brightgreen.svg)]()

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

### 5. Differentiated Enemy Catalog & Archetypes
Hostiles are differentiated across mobility, shields, weapon cadence, ballistic spreads, and firing styles:
- **Pistol Grunt (Crimson Diamond)**: 120 px/s skirmisher firing single accurate rounds at a 50-tick cadence with a 6-tick discharge stutter.
- **Shotgun Guard (Crimson Pentagon)**: 90 px/s heavy breacher with a 1-hit energy shield and a 5-pellet lethal buckshot fan at an 80-tick cadence.
- **Stalker Rusher (Crimson Chevron)**: 210 px/s high-velocity glass cannon with aggressive pursuit and run-and-gun rapid fire (32-tick cadence) that never halts.
- **Aegis Warden (Heavy Crimson Hexagon)**: 60 px/s frontline tank with 2-hit shield durability (requiring 3 total rounds to eliminate) and heavy suppressive slugs at a 65-tick cadence.
- **Marksman Sniper (Crimson 4-Point Star)**: 80 px/s long-range sniper that kites players, halts movement to project a charging red targeting laser for 30 ticks, and discharges hyper-velocity rounds (850 px/s) at a 110-tick cadence.

### 6. 40px Grid A* Pathfinding & Intelligent Navigation
- Discrete $24 \times 16$ tile-grid A* pathfinder with obstacle clearance inflation ($16\text{px}$) navigates complex wall and pillar layouts with zero corner snagging.
- **Line-of-Sight String Pulling**: When line-of-sight to the player is obstructed, units follow A* waypoints; once line-of-sight is re-established, units transition to smooth direct-vector steering (rushers close distance, kiters retreat).
- Smooth wall-sliding collision physics prevents units from sticking or clipping into barrier edges.

### 7. Hit-Count Shield Durability System
- Shield barriers absorb discrete projectile impacts, directly interfacing with the player's 6-round cylinder economy.
- Concentric radiant electric cyan barrier rings visually communicate active shield charges.
- Procedural audio pings on deflection (`playShieldDeflect`) and resonant energy pops on shield depletion (`playShieldBreak`) before units become vulnerable to lethal elimination.

### 8. Procedural Web Audio Synthesis with Pitch Modulation
- Zero external audio assets required; all sound effects (gunfire, dry-fire clicks, cylinder reload clicks, obstacle impacts, shield deflections, shield breaks, sniper laser charging, and victory fanfare) are synthesized live using the Web Audio API.
- **Dynamic Time-Scale Modulation**: Audio playback rates and oscillator frequencies scale dynamically with `timeScale`. Sounds drop to deep sub-bass drones (~0.43x pitch, ~2.4x duration) during 5% micro-creep and pitch up to normal tempo when sprinting.

### 9. 5-Room Tactical Puzzle Progression
- Handcrafted room sequences teaching each archetype and mechanics progressively:
  - **Room 01 (`BASIC COVER`)**: 1v1 duel against a mobile Pistol Grunt teaching micro-creep peeking and leading shots.
  - **Room 02 (`ARMORED BREACH`)**: Shotgun Guard (1 shield) + Grunt teaching shield breaking and buckshot evasion.
  - **Room 03 (`INFILTRATION`)**: High-speed Stalker rusher + Grunt in a zigzag corridor teaching rapid target acquisition under continuous fire.
  - **Room 04 (`THE LINE OF FIRE`)**: Marksman sniper nest with 30-tick laser telegraph + Shotgun Guard advance teaching sightline evasion.
  - **Room 05 (`TACTICAL GAUNTLET`)**: Aegis Warden (2 shields) + Stalker + Grunt testing strict 6-round cylinder ammunition budgeting and reload timing.
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
│   │   ├── GridPathfinder.ts
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
