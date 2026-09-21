# Proposal: Initialize ChronoShot Core Game Engine

## Why

Browser-based action games often struggle to balance intense combat with tactical depth on keyboard and mouse. ChronoShot introduces a top-down tactical shooter where time progression is directly coupled to player movement and action costs (inspired by *SUPERHOT* and *Hotline Miami*), creating a spatial puzzle experience where every step, shot, and reload carries tangible tactical weight.

## What Changes

- **Project Foundation**: Initialize a lightweight Vite + TypeScript web application rendering to an HTML5 Canvas 2D context.
- **Time Dilation Engine**: Implement a decoupled fixed-step simulation where global time scales from a baseline micro-creep (~5%) up to full speed (100%) based on player movement velocity, with discrete time-tick bursts consumed during shooting and reloading.
- **Configurable Weapon Architecture**: Build a modular weapon system with customizable magazine size, cooldowns, and action tick costs, featuring a 6-round revolver with a visual cylinder HUD.
- **Combat & Room Loop**: Implement bite-sized puzzle rooms featuring geometric minimalist obstacles, 1-hit lethality, enemy types (pistol grunts and shotgun guards), instant room restart (`R`), and level transition triggers upon room clearance.

## Capabilities

### New Capabilities
- `time-engine`: Time scale governor that computes dynamic simulation speeds from player movement interpolation and applies discrete simulation tick bursts for weapon actions.
- `weapon-system`: Configurable weapon model supporting magazine capacities, firing cooldowns, projectile raycasting, and action tick costs, including a 6-chamber revolver.
- `combat-arena`: 2D top-down arena simulation containing player controls, enemy combat AI, obstacle collision/cover, 1-hit lethality, and room progression flow.

### Modified Capabilities
<!-- None: Greenfield project -->

## Impact

- **New Dependencies**: Vite, TypeScript, and standard development tooling.
- **Runtime Environment**: Browser client supporting HTML5 Canvas 2D and modern JavaScript/ES6.
- **APIs/State**: Client-only deterministic game state; no backend services or persistence required for core gameplay.
