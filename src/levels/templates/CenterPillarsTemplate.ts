import { createPillar, Obstacle } from "../../entities/Obstacle";
import { vec2 } from "../../math/vector";
import { createPerimeterWalls } from "../Room";
import { RoomLayoutTemplate } from "./RoomLayoutTemplate";

/**
 * CenterPillarsTemplate
 *
 * Anchors two heavy fortified pillars along the central vertical axis,
 * establishing prominent cover dueling zones with wide upper and lower flanking lanes.
 */
export const CenterPillarsTemplate: RoomLayoutTemplate = {
  id: "center-pillars",
  name: "CENTER PILLARS",
  description:
    "Two heavy fortified pillars anchored along the central meridian providing tactical cover with wide upper and lower flanking lanes.",
  playerSpawn: vec2(140, 320),
  exitPortal: {
    x: 880,
    y: 320,
    radius: 28,
  },
  buildObstacles: (width = 960, height = 640): Obstacle[] => [
    ...createPerimeterWalls(width, height),
    createPillar("center-pillar-north", width / 2, height / 2 - 120, 70),
    createPillar("center-pillar-south", width / 2, height / 2 + 120, 70),
  ],
  enemySpawnZones: [
    { x: 580, y: 80, width: 240, height: 140 },
    { x: 580, y: 420, width: 240, height: 140 },
    { x: 660, y: 240, width: 160, height: 160 },
  ],
};

export const centerPillarsTemplate = CenterPillarsTemplate;
export default CenterPillarsTemplate;
