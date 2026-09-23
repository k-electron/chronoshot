import { createObstacle, createPillar, Obstacle } from "../../entities/Obstacle";
import { vec2 } from "../../math/vector";
import { createPerimeterWalls } from "../Room";
import { RoomLayoutTemplate } from "./RoomLayoutTemplate";

/**
 * ApexColosseumTemplate
 *
 * Dedicated endgame survival layout for Endless Mode.
 * Features four corner bastions, wide perimeter kiting rings, and central split pillars,
 * providing dynamic line-of-sight breaks and escape routes against high-threat swarms.
 */
export const ApexColosseumTemplate: RoomLayoutTemplate = {
  id: "apex-colosseum",
  name: "THE APEX COLOSSEUM",
  description:
    "Expansive high-mobility arena featuring fortified quadrant redoubts and central split pillars tailored for endless tactical survival.",
  playerSpawn: vec2(140, 320),
  exitPortal: {
    x: 880,
    y: 320,
    radius: 28,
  },
  buildObstacles: (width = 960, height = 640): Obstacle[] => [
    ...createPerimeterWalls(width, height),
    createObstacle("colosseum-bastion-nw", 280, 140, 48, 72),
    createObstacle("colosseum-bastion-sw", 280, height - 212, 48, 72),
    createObstacle("colosseum-bastion-ne", 640, 140, 48, 72),
    createObstacle("colosseum-bastion-se", 640, height - 212, 48, 72),
    createPillar("colosseum-pillar-top", width / 2, height / 2 - 110, 54),
    createPillar("colosseum-pillar-bottom", width / 2, height / 2 + 110, 54),
  ],
  enemySpawnZones: [
    { x: 560, y: 80, width: 280, height: 140 },
    { x: 560, y: 420, width: 280, height: 140 },
    { x: 680, y: 240, width: 160, height: 160 },
  ],
};

export const apexColosseumTemplate = ApexColosseumTemplate;
export default ApexColosseumTemplate;
