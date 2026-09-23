import { UpgradeDefinition } from "../UpgradeDefinition";
import { DEFAULT_UPGRADE_REGISTRY, UpgradeRegistry } from "../UpgradeRegistry";
import { chronoBurst } from "./chronoBurst";
import { extendedCylinder } from "./extendedCylinder";
import { kineticStride } from "./kineticStride";
import { overchargeDash } from "./overchargeDash";
import { phaseDeflector } from "./phaseDeflector";
import { reactiveShield } from "./reactiveShield";
import { speedLoader } from "./speedLoader";

export {
  chronoBurst,
  extendedCylinder,
  kineticStride,
  overchargeDash,
  phaseDeflector,
  reactiveShield,
  speedLoader,
};

export const ALL_UPGRADE_DEFINITIONS: readonly UpgradeDefinition[] = [
  extendedCylinder,
  speedLoader,
  reactiveShield,
  kineticStride,
  chronoBurst,
  phaseDeflector,
  overchargeDash,
];

/**
 * Registers all baseline and tactical upgrade definitions into the specified registry.
 * Defaults to DEFAULT_UPGRADE_REGISTRY.
 */
export function registerDefaultUpgrades(
  registry: UpgradeRegistry = DEFAULT_UPGRADE_REGISTRY
): void {
  for (const def of ALL_UPGRADE_DEFINITIONS) {
    registry.register(def);
  }
}

// Auto-register baseline and tactical definitions into DEFAULT_UPGRADE_REGISTRY
registerDefaultUpgrades(DEFAULT_UPGRADE_REGISTRY);
