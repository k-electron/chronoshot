/**
 * Modular Room Layout Templates and Registry Catalog for ChronoShot.
 */

import {
  DEFAULT_LAYOUT_REGISTRY,
  getDistance,
  LayoutTemplateRegistry,
  RoomLayoutTemplate,
  SpawnZone,
  validateSpawnSeparation,
} from "./RoomLayoutTemplate";

import {
  ApexRedoubtTemplate,
  apexRedoubtTemplate,
} from "./ApexRedoubtTemplate";
import {
  ApexColosseumTemplate,
  apexColosseumTemplate,
} from "./ApexColosseumTemplate";

export type { RoomLayoutTemplate, SpawnZone };
export {
  DEFAULT_LAYOUT_REGISTRY,
  LayoutTemplateRegistry,
  getDistance,
  validateSpawnSeparation,
};

export {
  ApexRedoubtTemplate,
  apexRedoubtTemplate,
  ApexColosseumTemplate,
  apexColosseumTemplate,
};

export const ALL_LAYOUT_TEMPLATES: readonly RoomLayoutTemplate[] = [
  ApexRedoubtTemplate,
  ApexColosseumTemplate,
];

/**
 * Registers all active layout templates into the specified registry.
 * Defaults to DEFAULT_LAYOUT_REGISTRY.
 */
export function registerDefaultTemplates(
  registry: LayoutTemplateRegistry = DEFAULT_LAYOUT_REGISTRY
): void {
  for (const template of ALL_LAYOUT_TEMPLATES) {
    registry.register(template);
  }
}

// Auto-register active templates into DEFAULT_LAYOUT_REGISTRY
registerDefaultTemplates(DEFAULT_LAYOUT_REGISTRY);
