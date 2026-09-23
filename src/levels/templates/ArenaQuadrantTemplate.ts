import { createPillar, Obstacle } from "../../entities/Obstacle";
import { vec2 } from "../../math/vector";
import { createPerimeterWalls } from "../Room";
import { RoomLayoutTemplate } from "./RoomLayoutTemplate";

/**
 * ArenaQuadrantTemplate
 *
 * Positions four symmetric quadrant bastions, providing comprehensive
 * 360-degree cover maneuvering and tactical flanking opportunities.
 */
export const ArenaQuadrantTemplate: RoomLayoutTemplate = {
  id: "arena-quadrant",
  name: "ARENA QUADRANT",
  description:
    "Four symmetrical quadrant bastions providing comprehensive 360-degree cover maneuvering and tactical flanking routes.",
  playerSpawn: vec2(140, 320),
  exitPortal: {
    x: 880,
    y: 320,
    radius: 28,
  },
  buildObstacles: (width = 960, height = 640): Obstacle[] => [
    ...createPerimeterWalls(width, height),
    createPillar("quadrant-nw", 340, 180, 56),
    createPillar("quadrant-sw", 340, height - 180, 56),
    createPillar("quadrant-ne", 620, 180, 56),
    createPillar("quadrant-se", 620, height - 180, 56),
  ],
  enemySpawnZones: [
    { x: 560, y: 70, width: 260, height: 160 },
    { x: 560, y: 410, width: 260, height: 160 },
    { x: 680, y: 240, width: 160, height: 160 },
  ],
};

export const arenaQuadrantTemplate = ArenaQuadrantTemplate;
export default ArenaQuadrantTemplate;
