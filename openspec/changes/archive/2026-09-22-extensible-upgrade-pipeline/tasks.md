# Tasks

## 1. Upgrade Definition & Registry System

- [x] 1.1 Implement `UpgradeDefinition` and `UpgradeModifiers` interfaces in `src/upgrades/UpgradeDefinition.ts` with metadata, stat modifiers, and lifecycle hook contracts. Verify with unit tests in `UpgradeDefinition.test.ts`.
- [x] 1.2 Implement `UpgradeRegistry` in `src/upgrades/UpgradeRegistry.ts` supporting upgrade registration, lookup, catalog queries, and dynamic draft sampling (`sampleDraft`) with stack filters. Verify with unit tests in `UpgradeRegistry.test.ts`.
- [x] 1.3 Create baseline and new tactical upgrade definitions in `src/upgrades/definitions/` (`extendedCylinder`, `speedLoader`, `reactiveShield`, `kineticStride`, `chronoBurst`, `phaseDeflector`). Verify with unit tests in `definitions.test.ts`.

## 2. Player Upgrade Pipeline Integration

- [x] 2.1 Implement `UpgradePipeline` in `src/upgrades/UpgradePipeline.ts` managing active upgrade instances, stack counts, aggregated stat modifiers, and room lifecycle dispatching. Verify with unit tests in `UpgradePipeline.test.ts`.
- [x] 2.2 Integrate `UpgradePipeline` into `src/entities/Player.ts`, maintaining 100% backward compatibility for `PlayerAugmentations` getters, `setAugmentation()`, `reload()`, `takeDamage()`, and `reset()`. Verify with unit tests in `Player.test.ts`.

## 3. Decoupled Upgrade Draft HUD

- [x] 3.1 Implement `UpgradeDraftHUD` in `src/ui/UpgradeDraftHUD.ts` supporting dynamic $N$-card distribution, Swiss-minimalist styling, key badge prompts, and mouse click hit-testing (`getCardAt`). Verify with mock Canvas 2D unit tests in `UpgradeDraftHUD.test.ts`.
- [x] 3.2 Refactor `src/entities/Arena.ts` to delegate draft overlay rendering and click hit-testing to `UpgradeDraftHUD`, integrating with `UpgradeRegistry.sampleDraft()`. Verify existing draft tests in `Arena.test.ts` pass.

## 4. Full Integration & Verification

- [x] 4.1 Run complete test suite (`npm test`) and typecheck (`npm run build`) to verify all unit tests pass with zero regressions.
