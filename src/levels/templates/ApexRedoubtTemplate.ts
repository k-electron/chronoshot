import { createObstacle, createPillar, Obstacle } from "../../entities/Obstacle";
import { vec2 } from "../../math/vector";
import { createPerimeterWalls } from "../Room";
import { RoomLayoutTemplate } from "./RoomLayoutTemplate";

/**
 * ApexRedoubtTemplate
 *
 * Dedicated tactical geometry for the Room 20 Chrono-Zenith final boss encounter.
 * Integrates fortified quadrant pillars, flank bastions, and central cover barriers,
 * guaranteeing accessible line-of-sight occlusion within <= 140px from every engagement spot.
 */
export const ApexRedoubtTemplate: RoomLayoutTemplate = {
  id: "apex-redoubt",
  name: "THE APEX REDOUBT",
  description:
    "Fortified command redoubt with monolithic bastions and tactical pillars providing reachable line-of-sight occlusion.",
  playerSpawn: vec2(140, 320),
  exitPortal: {
    x: 880,
    y: 320,
    radius: 28,
  },
  buildObstacles: (width = 960, height = 640): Obstacle[] => [
    ...createPerimeterWalls(width, height),
    createPillar("redoubt-pillar-west", 220, 320, 48),
    createPillar("redoubt-pillar-nw", 340, 160, 48),
    createPillar("redoubt-pillar-sw", 340, height - 160, 48),
    createObstacle("redoubt-bastion-top", 460, 160, 40, 90),
    createObstacle("redoubt-bastion-bottom", 460, height - 250, 40, 90),
    createPillar("redoubt-pillar-center", 480, 320, 44),
    createPillar("redoubt-pillar-ne", 620, 160, 48),
    createPillar("redoubt-pillar-se", 620, height - 160, 48),
    createPillar("redoubt-pillar-east", 740, 320, 48),
  ],
  enemySpawnZones: [
    { x: 580, y: 80, width: 240, height: 140 },
    { x: 580, y: 420, width: 240, height: 140 },
    { x: 680, y: 240, width: 160, height: 160 },
  ],
};

export const apexRedoubtTemplate = ApexRedoubtTemplate;
export default ApexRedoubtTemplate;
