import { describe, expect, it } from "vitest";
import { GridPathfinder } from "./GridPathfinder";
import { createObstacle, createPillar } from "../entities/Obstacle";
import { vec2 } from "../math/vector";
import { createRoom1 } from "../levels/Room";

describe("GridPathfinder", () => {
  describe("Grid initialization & coordinate conversions", () => {
    it("initializes with default dimensions and cell size (20px, 48x32 grid)", () => {
      const pf = new GridPathfinder();
      expect(pf.width).toBe(960);
      expect(pf.height).toBe(640);
      expect(pf.cellSize).toBe(20);
      expect(pf.cols).toBe(48);
      expect(pf.rows).toBe(32);
    });

    it("initializes with custom dimensions", () => {
      const pf = new GridPathfinder(400, 200, 20);
      expect(pf.cols).toBe(20);
      expect(pf.rows).toBe(10);
    });

    it("converts world coordinates to grid indices correctly", () => {
      const pf = new GridPathfinder();
      expect(pf.worldToGrid(vec2(0, 0))).toEqual({ gx: 0, gy: 0 });
      expect(pf.worldToGrid(vec2(19.9, 19.9))).toEqual({ gx: 0, gy: 0 });
      expect(pf.worldToGrid(vec2(40, 80))).toEqual({ gx: 2, gy: 4 });
      expect(pf.worldToGrid(vec2(65, 105))).toEqual({ gx: 3, gy: 5 });
      expect(pf.worldToGrid(vec2(959, 639))).toEqual({ gx: 47, gy: 31 });
    });

    it("converts grid indices to cell center world coordinates correctly", () => {
      const pf = new GridPathfinder();
      expect(pf.gridToWorld(0, 0)).toEqual(vec2(10, 10));
      expect(pf.gridToWorld(1, 2)).toEqual(vec2(30, 50));
      expect(pf.gridToWorld(47, 31)).toEqual(vec2(950, 630));
    });

    it("validates grid boundary coordinates correctly", () => {
      const pf = new GridPathfinder();
      expect(pf.isValidGrid(0, 0)).toBe(true);
      expect(pf.isValidGrid(47, 31)).toBe(true);
      expect(pf.isValidGrid(-1, 0)).toBe(false);
      expect(pf.isValidGrid(0, -1)).toBe(false);
      expect(pf.isValidGrid(48, 0)).toBe(false);
      expect(pf.isValidGrid(0, 32)).toBe(false);
    });
  });

  describe("Grid walkability state & manipulation", () => {
    it("marks all cells as walkable initially", () => {
      const pf = new GridPathfinder();
      for (let gy = 0; gy < pf.rows; gy++) {
        for (let gx = 0; gx < pf.cols; gx++) {
          expect(pf.isWalkable(gx, gy)).toBe(true);
        }
      }
    });

    it("returns false for out-of-bounds cells", () => {
      const pf = new GridPathfinder();
      expect(pf.isWalkable(-1, 5)).toBe(false);
      expect(pf.isWalkable(5, -1)).toBe(false);
      expect(pf.isWalkable(50, 5)).toBe(false);
      expect(pf.isWalkable(5, 35)).toBe(false);
    });

    it("sets and resets cell walkability", () => {
      const pf = new GridPathfinder();
      pf.setWalkable(3, 4, false);
      expect(pf.isWalkable(3, 4)).toBe(false);
      expect(pf.isWalkable(3, 5)).toBe(true);

      pf.reset();
      expect(pf.isWalkable(3, 4)).toBe(true);
    });
  });

  describe("Obstacle clearance inflation & cell-center containment (updateObstacles)", () => {
    it("blocks only the exact cells covered by an obstacle when clearance is 0", () => {
      const pf = new GridPathfinder();
      // 40x40 obstacle covering x: [80..120], y: [80..120]
      // Cell centers inside [80, 120] are gx = 4 (center 90) and gx = 5 (center 110)
      const obstacle = createObstacle("box", 80, 80, 40, 40);
      pf.updateObstacles([obstacle], 0);

      expect(pf.isWalkable(4, 4)).toBe(false);
      expect(pf.isWalkable(5, 5)).toBe(false);
      // Cardinal neighbors must remain walkable
      expect(pf.isWalkable(3, 4)).toBe(true);
      expect(pf.isWalkable(6, 4)).toBe(true);
      expect(pf.isWalkable(4, 3)).toBe(true);
      expect(pf.isWalkable(4, 6)).toBe(true);
    });

    it("inflates obstacle bounds by clearance radius using cell-center containment", () => {
      const pf = new GridPathfinder();
      // 40x40 obstacle at (80, 80). Clearance = 16.
      // Inflated bounds: [64, 136] x [64, 136]
      // Cell centers (c = (gx + 0.5) * 20):
      // gx=2: c=50 < 64 (walkable)
      // gx=3: c=70 in [64, 136] (blocked)
      // gx=4: c=90 in [64, 136] (blocked)
      // gx=5: c=110 in [64, 136] (blocked)
      // gx=6: c=130 in [64, 136] (blocked)
      // gx=7: c=150 > 136 (walkable)
      const obstacle = createObstacle("box", 80, 80, 40, 40);
      pf.updateObstacles([obstacle], 16);

      for (let gy = 3; gy <= 6; gy++) {
        for (let gx = 3; gx <= 6; gx++) {
          expect(pf.isWalkable(gx, gy)).toBe(false);
        }
      }

      // Cells beyond clearance inflation must remain walkable
      expect(pf.isWalkable(2, 4)).toBe(true);
      expect(pf.isWalkable(7, 4)).toBe(true);
      expect(pf.isWalkable(4, 2)).toBe(true);
      expect(pf.isWalkable(4, 7)).toBe(true);
    });

    it("leaves a narrow channel walkable when cell centers fall outside inflated bounds", () => {
      const pf = new GridPathfinder();
      // Obstacle 1: x: [0, 450], y: [0, 250]
      // Obstacle 2: x: [515, 600], y: [0, 250] (channel from x: 450 to 515, width 65px)
      // With radius R = 18:
      // Obstacle 1 inflated maxX = 468.
      // Obstacle 2 inflated minX = 497.
      // Open window for unit center: x in (468, 497), width 29px.
      // Cell gx=24 has center x = (24 + 0.5) * 20 = 490px! (490 is > 468 and < 497)
      const obs1 = createObstacle("obs1", 0, 0, 450, 250);
      const obs2 = createObstacle("obs2", 515, 0, 85, 250);
      pf.updateObstacles([obs1, obs2], 18);

      expect(pf.isWalkable(24, 5)).toBe(true);
      // gx=22 center is 450 (inside obs1 inflated [0, 468], so blocked)
      expect(pf.isWalkable(22, 5)).toBe(false);
      // gx=25 center is 510 (inside obs2 inflated [497, 618], so blocked)
      expect(pf.isWalkable(25, 5)).toBe(false);
    });

    it("handles boundary wall obstacles without out-of-bounds indexing", () => {
      const pf = new GridPathfinder();
      const perimeterWalls = [
        createObstacle("top", 0, 0, 960, 20),
        createObstacle("bottom", 0, 620, 960, 20),
        createObstacle("left", 0, 0, 20, 640),
        createObstacle("right", 940, 0, 20, 640),
      ];

      pf.updateObstacles(perimeterWalls, 16);

      // Perimeter outer rows and cols with centers in [-16, 36] or [604, 656]
      // gy=0 (10) and gy=1 (30) are <= 36 -> blocked
      // gy=30 (610) and gy=31 (630) are >= 604 -> blocked
      for (let gx = 0; gx < pf.cols; gx++) {
        expect(pf.isWalkable(gx, 0)).toBe(false);
        expect(pf.isWalkable(gx, 1)).toBe(false);
        expect(pf.isWalkable(gx, 30)).toBe(false);
        expect(pf.isWalkable(gx, 31)).toBe(false);
      }
      for (let gy = 0; gy < pf.rows; gy++) {
        expect(pf.isWalkable(0, gy)).toBe(false);
        expect(pf.isWalkable(1, gy)).toBe(false);
        expect(pf.isWalkable(46, gy)).toBe(false);
        expect(pf.isWalkable(47, gy)).toBe(false);
      }

      // First inner row and col (gx = 2..45, gy = 2..29) remain walkable
      expect(pf.isWalkable(2, 2)).toBe(true);
      expect(pf.isWalkable(45, 2)).toBe(true);
      expect(pf.isWalkable(2, 29)).toBe(true);
      expect(pf.isWalkable(45, 29)).toBe(true);
    });

    it("handles obstacles outside grid bounds cleanly", () => {
      const pf = new GridPathfinder();
      const outside = [
        createObstacle("far-away", 2000, 2000, 100, 100),
        createObstacle("negative", -500, -500, 100, 100),
      ];

      expect(() => pf.updateObstacles(outside, 16)).not.toThrow();
      expect(pf.isWalkable(5, 5)).toBe(true);
    });
  });

  describe("A* waypoint search (findPath)", () => {
    it("returns single waypoint when start and target are in the same cell", () => {
      const pf = new GridPathfinder();
      const pathWithStart = pf.findPath(vec2(30, 30), vec2(35, 35), true);
      expect(pathWithStart).toHaveLength(1);
      expect(pathWithStart[0]).toEqual(vec2(30, 30));

      const pathWithoutStart = pf.findPath(vec2(30, 30), vec2(35, 35), false);
      expect(pathWithoutStart).toHaveLength(0);
    });

    it("finds a straight horizontal path across open space", () => {
      const pf = new GridPathfinder();
      // Start: cell (1, 1) -> center (30, 30)
      // Target: cell (4, 1) -> center (90, 30)
      const path = pf.findPath(vec2(30, 30), vec2(90, 30), true);

      expect(path).toHaveLength(4);
      expect(path[0]).toEqual(vec2(30, 30));
      expect(path[1]).toEqual(vec2(50, 30));
      expect(path[2]).toEqual(vec2(70, 30));
      expect(path[3]).toEqual(vec2(90, 30));
    });

    it("finds a straight vertical path across open space", () => {
      const pf = new GridPathfinder();
      // Start: cell (1, 1) -> center (30, 30)
      // Target: cell (1, 4) -> center (30, 90)
      const path = pf.findPath(vec2(30, 30), vec2(30, 90), true);

      expect(path).toHaveLength(4);
      expect(path[0]).toEqual(vec2(30, 30));
      expect(path[1]).toEqual(vec2(30, 50));
      expect(path[2]).toEqual(vec2(30, 70));
      expect(path[3]).toEqual(vec2(30, 90));
    });

    it("finds a direct diagonal path across open space", () => {
      const pf = new GridPathfinder();
      // Start: cell (1, 1) -> center (30, 30)
      // Target: cell (4, 4) -> center (90, 90)
      const path = pf.findPath(vec2(30, 30), vec2(90, 90), true);

      expect(path).toHaveLength(4);
      expect(path[0]).toEqual(vec2(30, 30));
      expect(path[1]).toEqual(vec2(50, 50));
      expect(path[2]).toEqual(vec2(70, 70));
      expect(path[3]).toEqual(vec2(90, 90));
    });

    it("navigates around a blocking vertical wall obstacle", () => {
      const pf = new GridPathfinder();
      // Wall spanning x: 60..80, y: 20..80 (covers gx=3, gy=1..3)
      const wall = createObstacle("wall", 60, 20, 20, 60);
      pf.updateObstacles([wall], 0);

      // Verify col 3 rows 1..3 are blocked
      expect(pf.isWalkable(3, 1)).toBe(false);
      expect(pf.isWalkable(3, 2)).toBe(false);
      expect(pf.isWalkable(3, 3)).toBe(false);

      // Path from cell (1, 2) [30, 50] to cell (5, 2) [110, 50]
      const path = pf.findPath(vec2(30, 50), vec2(110, 50), true);

      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toEqual(vec2(30, 50));
      expect(path[path.length - 1]).toEqual(vec2(110, 50));

      // Assert no waypoint in the path steps into an impassable cell
      for (const pt of path) {
        const { gx, gy } = pf.worldToGrid(pt);
        expect(pf.isWalkable(gx, gy)).toBe(true);
      }
    });

    it("navigates around a pillar with clearance inflation", () => {
      const pf = new GridPathfinder();
      // Pillar at center (70, 50) with size 20 (covers cell gx = 3, gy = 2)
      const pillar = createPillar("pillar", 70, 50, 20);
      pf.updateObstacles([pillar], 16);

      // Center cell and clearance inflated neighbors are impassable
      expect(pf.isWalkable(3, 2)).toBe(false);
      expect(pf.isWalkable(2, 2)).toBe(false);
      expect(pf.isWalkable(4, 2)).toBe(false);

      // Path from (30, 50) [cell 1, 2] to (130, 50) [cell 6, 2]
      const path = pf.findPath(vec2(30, 50), vec2(130, 50), true);

      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toEqual(vec2(30, 50));
      expect(path[path.length - 1]).toEqual(vec2(130, 50));

      for (const pt of path) {
        const { gx, gy } = pf.worldToGrid(pt);
        expect(pf.isWalkable(gx, gy)).toBe(true);
      }
    });

    it("returns empty path when start or target is on an impassable cell", () => {
      const pf = new GridPathfinder();
      pf.setWalkable(2, 2, false);

      // Start on blocked cell (center 50, 50)
      expect(pf.findPath(vec2(50, 50), vec2(110, 110))).toEqual([]);

      // Target on blocked cell
      expect(pf.findPath(vec2(30, 30), vec2(50, 50))).toEqual([]);
    });

    it("returns empty path when destination is completely unreachable", () => {
      const pf = new GridPathfinder();
      // Enclose cell (2, 2) entirely
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx !== 0 || dy !== 0) {
            pf.setWalkable(2 + dx, 2 + dy, false);
          }
        }
      }

      // Target is trapped inside
      const path = pf.findPath(vec2(30, 30), vec2(50, 50));
      expect(path).toEqual([]);
    });

    it("prevents diagonal corner cutting around blocked obstacles", () => {
      const pf = new GridPathfinder();
      // Block cells (2, 1) and (1, 2)
      pf.setWalkable(2, 1, false);
      pf.setWalkable(1, 2, false);

      // Moving from (1, 1) [30, 30] to (2, 2) [50, 50] directly diagonally
      // would cut between the corners of (2, 1) and (1, 2)
      const path = pf.findPath(vec2(30, 30), vec2(50, 50), true);

      // Direct 2-step diagonal path should not occur
      if (path.length > 0) {
        // If path exists, it must detour around without diagonal cut
        for (let i = 0; i < path.length - 1; i++) {
          const from = pf.worldToGrid(path[i]);
          const to = pf.worldToGrid(path[i + 1]);
          const isDiagonal = Math.abs(to.gx - from.gx) === 1 && Math.abs(to.gy - from.gy) === 1;
          if (isDiagonal) {
            expect(pf.isWalkable(from.gx + (to.gx - from.gx), from.gy)).toBe(true);
            expect(pf.isWalkable(from.gx, from.gy + (to.gy - from.gy))).toBe(true);
          }
        }
      }
    });

    it("generates a valid path in Room 1 avoiding the central pillar", () => {
      const room1 = createRoom1();
      const pf = new GridPathfinder();
      pf.updateObstacles(room1.obstacles, 16);

      const enemyPos = vec2(room1.enemies[0].x, room1.enemies[0].y);
      const playerPos = room1.playerSpawn;

      const path = pf.findPath(enemyPos, playerPos, true);

      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toEqual(pf.gridToWorld(pf.worldToGrid(enemyPos).gx, pf.worldToGrid(enemyPos).gy));
      expect(path[path.length - 1]).toEqual(
        pf.gridToWorld(pf.worldToGrid(playerPos).gx, pf.worldToGrid(playerPos).gy)
      );

      for (const pt of path) {
        const { gx, gy } = pf.worldToGrid(pt);
        expect(pf.isWalkable(gx, gy)).toBe(true);
      }
    });
  });

  describe("Helper findNearestWalkable", () => {
    it("returns same cell center if position is already walkable", () => {
      const pf = new GridPathfinder();
      const result = pf.findNearestWalkable(vec2(35, 35));
      expect(result).toEqual(vec2(30, 30));
    });

    it("finds the nearest adjacent walkable cell if current cell is blocked", () => {
      const pf = new GridPathfinder();
      pf.setWalkable(2, 2, false);

      const blockedPos = vec2(50, 50); // cell (2, 2)
      const nearest = pf.findNearestWalkable(blockedPos, 2);

      expect(nearest).not.toBeNull();
      const grid = pf.worldToGrid(nearest!);
      expect(pf.isWalkable(grid.gx, grid.gy)).toBe(true);
      expect(Math.abs(grid.gx - 2) <= 1).toBe(true);
      expect(Math.abs(grid.gy - 2) <= 1).toBe(true);
    });
  });
});
