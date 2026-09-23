import { createPillar, Obstacle } from "../../entities/Obstacle";
import { vec2 } from "../../math/vector";
import { createPerimeterWalls } from "../Room";
import { RoomLayoutTemplate } from "./RoomLayoutTemplate";

/**
 * KillboxLanesTemplate
 *
 * Distributes four heavy cover pillars across the arena midsection to construct
 * tight horizontal and vertical crossfire firing lanes.
 */
export const KillboxLanesTemplate: RoomLayoutTemplate = {
  id: "killbox-lanes",
  name: "KILLBOX LANES",
  description:
    "Four distributed cover pillars forming narrow crossfire firing lanes for intense line-of-sight dueling.",
  playerSpawn: vec2(140, 320),
  exitPortal: {
    x: 880,
    y: 320,
    radius: 28,
  },
  buildObstacles: (width = 960, height = 640): Obstacle[] => [
    ...createPerimeterWalls(width, height),
    createPillar("killbox-nw", 380, 180, 52),
    createPillar("killbox-sw", 380, height - 180, 52),
    createPillar("killbox-ne", 600, 180, 52),
    createPillar("killbox-se", 600, height - 180, 52),
  ],
  enemySpawnZones: [
    { x: 520, y: 70, width: 280, height: 150 },
    { x: 520, y: 420, width: 280, height: 150 },
    { x: 680, y: 240, width: 160, height: 160 },
  ],
};

export const killboxLanesTemplate = KillboxLanesTemplate;
export default KillboxLanesTemplate;
