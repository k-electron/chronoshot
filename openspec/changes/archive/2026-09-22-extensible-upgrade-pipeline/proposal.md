# Proposal: Extensible Upgrade Pipeline

## Why

Player upgrades are currently hardcoded as three discrete boolean flags on `Player.ts` (`extendedCylinder`, `speedLoader`, `reactiveShield`) with static 3-card draft rendering and fixed index selections in `Arena.ts`. As ChronoShot scales to multi-sector campaigns, varied player builds, and diverse room rewards, an extensible data-driven upgrade pipeline is required to register, draw, compose, and evaluate arbitrary combat augmentations without touching core gameplay loops.

## What Changes

- Introduce a data-driven `UpgradeDefinition` interface supporting unique identifiers, display metadata (name, archetype, description, stat highlight, accent color, tier), modifier properties, and lifecycle callbacks (`onAcquire`, `onRoomStart`, `onTick`, `onDischarge`).
- Introduce `UpgradeRegistry` as a centralized catalog of registered augmentations, supporting dynamic draft sampling (randomized or curated card draws), rarity tiers, and custom upgrade registrations.
- Introduce `UpgradePipeline` / `PlayerUpgradeManager` on `Player` to track acquired upgrades, aggregate continuous stat modifiers (cylinder capacity, reload tick duration, shield charges, movement speed multiplier, projectile speed multiplier), and dispatch lifecycle events.
- Decouple the tactical card draft UI from `Arena.ts` into a dedicated `UpgradeDraftHUD` Canvas 2D component with dynamic card positioning, responsive hit-testing, and hairline aesthetic styling.
- Convert the 3 baseline upgrades (Extended Cylinder, Speed Loader, Reactive Shield) into registered `UpgradeDefinition` instances, maintaining 100% backward compatibility with `player.augmentations` and existing test suites.
- Introduce new tactical upgrade definitions (e.g. Kinetic Stride, Chrono Siphon, Phase Deflector) demonstrating the extensibility of the new pipeline.

## Capabilities

### New Capabilities
<!-- None: all functionality extends the existing roguelike upgrade capability -->

### Modified Capabilities
- `roguelike-upgrades`: Expands the upgrade system to support modular data-driven upgrade definitions, centralized registry and dynamic draft draws, extensible modifier aggregation, and decoupled draft HUD rendering while preserving existing augmentation mechanics.

## Impact

- `src/entities/Player.ts`: Updated to integrate `UpgradePipeline` while preserving existing `PlayerAugmentations` getters and `setAugmentation()` API.
- `src/entities/Arena.ts`: Refactored `renderUpgradeDraft` and `applyUpgrade` to delegate to `UpgradeDraftHUD` and dynamic draft pools.
- New module `src/upgrades/`:
  - `src/upgrades/UpgradeDefinition.ts`
  - `src/upgrades/UpgradeRegistry.ts`
  - `src/upgrades/UpgradePipeline.ts`
  - `src/upgrades/definitions/` (baseline and advanced upgrade definitions)
- New module `src/ui/UpgradeDraftHUD.ts`
- Zero breaking changes to existing tests in `Player.test.ts`, `Arena.test.ts`, and `Weapon.test.ts`.
