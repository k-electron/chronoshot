import { createObstacle, createPillar, Obstacle } from "../../entities/Obstacle";
import { vec2 } from "../../math/vector";
import { createPerimeterWalls } from "../Room";
import { RoomLayoutTemplate } from "./RoomLayoutTemplate";

/**
 * SplitCorridorTemplate
 *
 * Implements a central barrier partition wall that chokes line-of-sight and divides
 * the arena into distinct north and south transit corridors with tactical peeking cover.
 */
export const SplitCorridorTemplate: RoomLayoutTemplate = {
  id: "split-corridor",
  name: "SPLIT CORRIDOR",
  description:
    "A commanding central partition wall chokes direct sightlines, splitting the arena into north and south tactical corridors.",
  playerSpawn: vec2(140, 320),
  exitPortal: {
    x: 880,
    y: 320,
    radius: 28,
  },
  buildObstacles: (width = 960, height = 640): Obstacle[] => [
    ...createPerimeterWalls(width, height),
    createObstacle("barrier-center", 440, 160, 40, height - 320),
    createPillar("pillar-corridor-north", 640, 110, 48),
    createPillar("pillar-corridor-south", 640, height - 110, 48),
  ],
  enemySpawnZones: [
    { x: 560, y: 70, width: 250, height: 150 },
    { x: 560, y: 420, width: 250, height: 150 },
    { x: 670, y: 240, width: 160, height: 160 },
  ],
};

export const splitCorridorTemplate = SplitCorridorTemplate;
export default SplitCorridorTemplate;
