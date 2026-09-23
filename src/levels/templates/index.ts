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
  CenterPillarsTemplate,
  centerPillarsTemplate,
} from "./CenterPillarsTemplate";
import {
  TwinBunkersTemplate,
  twinBunkersTemplate,
} from "./TwinBunkersTemplate";
import {
  SplitCorridorTemplate,
  splitCorridorTemplate,
} from "./SplitCorridorTemplate";
import {
  KillboxLanesTemplate,
  killboxLanesTemplate,
} from "./KillboxLanesTemplate";
import {
  ArenaQuadrantTemplate,
  arenaQuadrantTemplate,
} from "./ArenaQuadrantTemplate";
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
  CenterPillarsTemplate,
  centerPillarsTemplate,
  TwinBunkersTemplate,
  twinBunkersTemplate,
  SplitCorridorTemplate,
  splitCorridorTemplate,
  KillboxLanesTemplate,
  killboxLanesTemplate,
  ArenaQuadrantTemplate,
  arenaQuadrantTemplate,
  ApexRedoubtTemplate,
  apexRedoubtTemplate,
  ApexColosseumTemplate,
  apexColosseumTemplate,
};

export const ALL_LAYOUT_TEMPLATES: readonly RoomLayoutTemplate[] = [
  CenterPillarsTemplate,
  TwinBunkersTemplate,
  SplitCorridorTemplate,
  KillboxLanesTemplate,
  ArenaQuadrantTemplate,
  ApexRedoubtTemplate,
  ApexColosseumTemplate,
];

/**
 * Registers all layout templates into the specified registry.
 * Defaults to DEFAULT_LAYOUT_REGISTRY.
 */
export function registerDefaultTemplates(
  registry: LayoutTemplateRegistry = DEFAULT_LAYOUT_REGISTRY
): void {
  for (const template of ALL_LAYOUT_TEMPLATES) {
    registry.register(template);
  }
}

// Auto-register the templates into DEFAULT_LAYOUT_REGISTRY
registerDefaultTemplates(DEFAULT_LAYOUT_REGISTRY);
