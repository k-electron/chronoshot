# Design: Extensible Upgrade Pipeline

## Context

ChronoShot features a roguelike upgrade draft triggered upon milestone boss defeat in Room 5. Currently, player augmentations are hardcoded as three discrete boolean flags on `Player.ts` (`extendedCylinder`, `speedLoader`, `reactiveShield`) with static 3-card draft rendering and fixed index selections in `Arena.ts`. As the game expands toward multi-sector campaigns with branching paths and diverse player builds, upgrades must be modular, data-driven building blocks that can modify weapon characteristics, physical movement, shields, time mechanics, and lifecycle hooks without altering core entity classes.

See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Define a declarative `UpgradeDefinition` interface supporting metadata, stat modifiers, and lifecycle hooks (`onAcquire`, `onRoomStart`, `onTick`).
- Implement an `UpgradeRegistry` for cataloging upgrades and sampling dynamic draft pools (filtering out non-stackable or max-stack upgrades).
- Implement an `UpgradePipeline` composed inside `Player` to track active upgrades, aggregate continuous stat modifiers, and dispatch lifecycle events.
- Decouple the tactical card draft overlay into a dedicated `UpgradeDraftHUD` supporting dynamic $N$-card distribution, hairline styling, and responsive click hit-testing.
- Implement baseline upgrades (`extended-cylinder`, `speed-loader`, `reactive-shield`) and new additions (`kinetic-stride`, `chrono-siphon`, `phase-deflector`) via the new pipeline.
- Maintain 100% backward compatibility with `player.augmentations`, `player.setAugmentation()`, and existing tests.

**Non-Goals:**
- Procedural room or puzzle level generation (Phase 4: `modular-level-director`).
- Modifying enemy AI or boss phase architectures (completed in Phases 1 & 2).

## Decisions

### 1. Data-Driven Upgrade Contract & Stat Modifiers
```ts
export interface UpgradeModifiers {
  magSizeBonus?: number;
  reloadTickReduction?: number;
  shieldChargesBonus?: number;
  speedMultiplier?: number;
  bulletSpeedMultiplier?: number;
}

export interface UpgradeDefinition {
  readonly id: string;
  readonly name: string;
  readonly archetype: string;
  readonly description: string;
  readonly statHighlight: string;
  readonly accentColor: string;
  readonly tier?: "standard" | "rare" | "overclock";
  readonly maxStacks?: number;
  readonly modifiers?: UpgradeModifiers;
  readonly onAcquire?: (player: Player) => void;
  readonly onRoomStart?: (player: Player) => void;
  readonly onTick?: (player: Player, deltaTicks: number) => void;
}
```
- **Rationale**: Isolates upgrade definitions from execution logic. Numerical modifiers handle 90% of tactical perks declaratively, while optional lifecycle hooks support bespoke mechanics (e.g. refreshing shields per room, spawning pulse fields).
- **Alternatives Considered**: Object-oriented subclassing per upgrade (`class ExtendedCylinderUpgrade extends Upgrade`). Rejected because data-driven object literals are significantly more composable, testable, and serialize cleanly.

### 2. Centralized Registry & Dynamic Draft Sampling
```ts
export class UpgradeRegistry {
  private registered = new Map<string, UpgradeDefinition>();

  public register(upgrade: UpgradeDefinition): void;
  public get(id: string): UpgradeDefinition | undefined;
  public getAll(): UpgradeDefinition[];
  public sampleDraft(count: number, player: Player, rng?: () => number): UpgradeDefinition[];
}
```
- **Rationale**: Provides a single source of truth for all available combat augmentations. The sampler automatically filters out non-stackable upgrades that the player has already acquired.

### 3. Player Upgrade Pipeline Integration
- `Player` holds an instance of `UpgradePipeline`:
  ```ts
  export class UpgradePipeline {
    private activeUpgrades = new Map<string, { definition: UpgradeDefinition; count: number }>();
    public acquire(upgrade: UpgradeDefinition, player: Player): void;
    public has(id: string): boolean;
    public getCount(id: string): number;
    public computeModifiers(): UpgradeModifiers;
    public onRoomStart(player: Player): void;
    public reset(): void;
  }
  ```
- **Backward Compatibility Facade**:
  - `Player.augmentations` returns a getter proxy or synchronized object matching `PlayerAugmentations`.
  - `Player.setAugmentation(key, val)` delegates to `upgradePipeline.acquire(...)` or removes it, ensuring all existing tests pass without modification.

### 4. Decoupled Dynamic Draft Card UI (`UpgradeDraftHUD`)
- Extract 100+ lines of card drawing from `Arena.ts` into `src/ui/UpgradeDraftHUD.ts`.
- Share a single `computeCardLayout(cardCount, width, height)` layout calculation between rendering and click hit-testing (`getCardAt(x, y, cardCount, width, height)`), ensuring zero coordinate mismatch.

## Risks / Trade-offs

- **[Risk] State desynchronization between `UpgradePipeline` and `player.weapon` / `player.shields`**  
  → *Mitigation*: `UpgradePipeline.acquire()` immediately re-evaluates effective attributes (e.g., resizing cylinder, adjusting reload burst ticks, assigning shield buffers), ensuring immediate synchronous consistency.
- **[Risk] Layout breakage when drawing fewer or more than 3 cards**  
  → *Mitigation*: `computeCardLayout` dynamically scales card widths, gaps, and centering offsets based on `draftOptions.length`, gracefully accommodating 1, 2, 3, or 4 options.
