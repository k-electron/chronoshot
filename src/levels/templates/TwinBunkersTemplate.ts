import { createObstacle, Obstacle } from "../../entities/Obstacle";
import { vec2 } from "../../math/vector";
import { createPerimeterWalls } from "../Room";
import { RoomLayoutTemplate } from "./RoomLayoutTemplate";

/**
 * TwinBunkersTemplate
 *
 * Deploys dual rectangular fortified bunkers dividing the arena into upper and lower
 * tactical alleys, forcing lane commitments and mid-range cover duels.
 */
export const TwinBunkersTemplate: RoomLayoutTemplate = {
  id: "twin-bunkers",
  name: "TWIN BUNKERS",
  description:
    "Dual rectangular fortified bunkers dividing the arena into upper and lower tactical alleys, forcing lane commitments and mid-range cover duels.",
  playerSpawn: vec2(140, 320),
  exitPortal: {
    x: 880,
    y: 320,
    radius: 28,
  },
  buildObstacles: (width = 960, height = 640): Obstacle[] => [
    ...createPerimeterWalls(width, height),
    createObstacle("bunker-north", 400, 110, 80, 140),
    createObstacle("bunker-south", 400, height - 250, 80, 140),
  ],
  enemySpawnZones: [
    { x: 560, y: 80, width: 250, height: 150 },
    { x: 560, y: 410, width: 250, height: 150 },
    { x: 650, y: 240, width: 170, height: 160 },
  ],
};

export const twinBunkersTemplate = TwinBunkersTemplate;
export default TwinBunkersTemplate;
