import { describe, expect, it } from "vitest";
import { GridPathfinder } from "./GridPathfinder";
import { createObstacle, createPillar } from "../entities/Obstacle";
import { vec2 } from "../math/vector";
import { createRoom1 } from "../levels/Room";

describe("GridPathfinder", () => {
  describe("Grid initialization & coordinate conversions", () => {
    it("initializes with default dimensions and cell size", () => {
      const pf = new GridPathfinder();
      expect(pf.width).toBe(960);
      expect(pf.height).toBe(640);
      expect(pf.cellSize).toBe(40);
      expect(pf.cols).toBe(24);
      expect(pf.rows).toBe(16);
    });

    it("initializes with custom dimensions", () => {
      const pf = new GridPathfinder(400, 200, 20);
      expect(pf.cols).toBe(20);
      expect(pf.rows).toBe(10);
    });

    it("converts world coordinates to grid indices correctly", () => {
      const pf = new GridPathfinder();
      expect(pf.worldToGrid(vec2(0, 0))).toEqual({ gx: 0, gy: 0 });
      expect(pf.worldToGrid(vec2(39.9, 39.9))).toEqual({ gx: 0, gy: 0 });
      expect(pf.worldToGrid(vec2(40, 80))).toEqual({ gx: 1, gy: 2 });
      expect(pf.worldToGrid(vec2(65, 105))).toEqual({ gx: 1, gy: 2 });
      expect(pf.worldToGrid(vec2(959, 639))).toEqual({ gx: 23, gy: 15 });
    });

    it("converts grid indices to cell center world coordinates correctly", () => {
      const pf = new GridPathfinder();
      expect(pf.gridToWorld(0, 0)).toEqual(vec2(20, 20));
      expect(pf.gridToWorld(1, 2)).toEqual(vec2(60, 100));
      expect(pf.gridToWorld(23, 15)).toEqual(vec2(940, 620));
    });

    it("validates grid boundary coordinates correctly", () => {
      const pf = new GridPathfinder();
      expect(pf.isValidGrid(0, 0)).toBe(true);
      expect(pf.isValidGrid(23, 15)).toBe(true);
      expect(pf.isValidGrid(-1, 0)).toBe(false);
      expect(pf.isValidGrid(0, -1)).toBe(false);
      expect(pf.isValidGrid(24, 0)).toBe(false);
      expect(pf.isValidGrid(0, 16)).toBe(false);
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
      expect(pf.isWalkable(30, 5)).toBe(false);
      expect(pf.isWalkable(5, 20)).toBe(false);
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

  describe("Obstacle clearance inflation (updateObstacles)", () => {
    it("blocks only the exact cells covered by an obstacle when clearance is 0", () => {
      const pf = new GridPathfinder();
      // 40x40 obstacle covering exactly cell (2, 2) [x: 80..120, y: 80..120]
      const obstacle = createObstacle("box", 80, 80, 40, 40);
      pf.updateObstacles([obstacle], 0);

      expect(pf.isWalkable(2, 2)).toBe(false);
      // Cardinal neighbors must remain walkable
      expect(pf.isWalkable(1, 2)).toBe(true);
      expect(pf.isWalkable(3, 2)).toBe(true);
      expect(pf.isWalkable(2, 1)).toBe(true);
      expect(pf.isWalkable(2, 3)).toBe(true);
    });

    it("inflates obstacle bounds by clearance radius into neighboring cells", () => {
      const pf = new GridPathfinder();
      // 40x40 obstacle at (80, 80). Clearance = 16.
      // Inflated bounds: [64, 136] x [64, 136]
      // This overlaps cells gx in [1, 2, 3] and gy in [1, 2, 3]
      const obstacle = createObstacle("box", 80, 80, 40, 40);
      pf.updateObstacles([obstacle], 16);

      // Core and clearance inflated cells must be impassable
      for (let gy = 1; gy <= 3; gy++) {
        for (let gx = 1; gx <= 3; gx++) {
          expect(pf.isWalkable(gx, gy)).toBe(false);
        }
      }

      // Cells beyond clearance inflation must remain walkable
      expect(pf.isWalkable(0, 2)).toBe(true);
      expect(pf.isWalkable(4, 2)).toBe(true);
      expect(pf.isWalkable(2, 0)).toBe(true);
      expect(pf.isWalkable(2, 4)).toBe(true);
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

      // Perimeter outer rows and cols are impassable
      for (let gx = 0; gx < pf.cols; gx++) {
        expect(pf.isWalkable(gx, 0)).toBe(false);
        expect(pf.isWalkable(gx, 15)).toBe(false);
      }
      for (let gy = 0; gy < pf.rows; gy++) {
        expect(pf.isWalkable(0, gy)).toBe(false);
        expect(pf.isWalkable(23, gy)).toBe(false);
      }

      // First inner row and col (gx = 1..22, gy = 1..14) remain walkable
      expect(pf.isWalkable(1, 1)).toBe(true);
      expect(pf.isWalkable(22, 1)).toBe(true);
      expect(pf.isWalkable(1, 14)).toBe(true);
      expect(pf.isWalkable(22, 14)).toBe(true);
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
      const pathWithStart = pf.findPath(vec2(60, 60), vec2(70, 70), true);
      expect(pathWithStart).toHaveLength(1);
      expect(pathWithStart[0]).toEqual(vec2(60, 60));

      const pathWithoutStart = pf.findPath(vec2(60, 60), vec2(70, 70), false);
      expect(pathWithoutStart).toHaveLength(0);
    });

    it("finds a straight horizontal path across open space", () => {
      const pf = new GridPathfinder();
      // Start: cell (1, 1) -> center (60, 60)
      // Target: cell (4, 1) -> center (180, 60)
      const path = pf.findPath(vec2(60, 60), vec2(180, 60), true);

      expect(path).toHaveLength(4);
      expect(path[0]).toEqual(vec2(60, 60));
      expect(path[1]).toEqual(vec2(100, 60));
      expect(path[2]).toEqual(vec2(140, 60));
      expect(path[3]).toEqual(vec2(180, 60));
    });

    it("finds a straight vertical path across open space", () => {
      const pf = new GridPathfinder();
      // Start: cell (2, 1) -> center (100, 60)
      // Target: cell (2, 4) -> center (100, 180)
      const path = pf.findPath(vec2(100, 60), vec2(100, 180), true);

      expect(path).toHaveLength(4);
      expect(path[0]).toEqual(vec2(100, 60));
      expect(path[1]).toEqual(vec2(100, 100));
      expect(path[2]).toEqual(vec2(100, 140));
      expect(path[3]).toEqual(vec2(100, 180));
    });

    it("finds a direct diagonal path across open space", () => {
      const pf = new GridPathfinder();
      // Start: cell (1, 1) -> center (60, 60)
      // Target: cell (4, 4) -> center (180, 180)
      const path = pf.findPath(vec2(60, 60), vec2(180, 180), true);

      expect(path).toHaveLength(4);
      expect(path[0]).toEqual(vec2(60, 60));
      expect(path[1]).toEqual(vec2(100, 100));
      expect(path[2]).toEqual(vec2(140, 140));
      expect(path[3]).toEqual(vec2(180, 180));
    });

    it("navigates around a blocking vertical wall obstacle", () => {
      const pf = new GridPathfinder();
      // Wall spanning col 3 from row 1 to row 3 (x: 120..160, y: 40..160)
      const wall = createObstacle("wall", 120, 40, 40, 120);
      pf.updateObstacles([wall], 0);

      // Verify col 3 rows 1..3 are blocked
      expect(pf.isWalkable(3, 1)).toBe(false);
      expect(pf.isWalkable(3, 2)).toBe(false);
      expect(pf.isWalkable(3, 3)).toBe(false);

      // Path from cell (1, 2) [60, 100] to cell (5, 2) [220, 100]
      const path = pf.findPath(vec2(60, 100), vec2(220, 100), true);

      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toEqual(vec2(60, 100));
      expect(path[path.length - 1]).toEqual(vec2(220, 100));

      // Assert no waypoint in the path steps into an impassable cell
      for (const pt of path) {
        const { gx, gy } = pf.worldToGrid(pt);
        expect(pf.isWalkable(gx, gy)).toBe(true);
      }
    });

    it("navigates around a pillar with clearance inflation", () => {
      const pf = new GridPathfinder();
      // Pillar at center (140, 100) with size 40 (covers cell gx = 3, gy = 2)
      const pillar = createPillar("pillar", 140, 100, 40);
      pf.updateObstacles([pillar], 16);

      // Center cell and clearance inflated neighbors are impassable
      expect(pf.isWalkable(3, 2)).toBe(false);
      expect(pf.isWalkable(2, 2)).toBe(false);
      expect(pf.isWalkable(4, 2)).toBe(false);

      // Path from (60, 100) [cell 1, 2] to (260, 100) [cell 6, 2]
      const path = pf.findPath(vec2(60, 100), vec2(260, 100), true);

      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toEqual(vec2(60, 100));
      expect(path[path.length - 1]).toEqual(vec2(260, 100));

      for (const pt of path) {
        const { gx, gy } = pf.worldToGrid(pt);
        expect(pf.isWalkable(gx, gy)).toBe(true);
      }
    });

    it("returns empty path when start or target is on an impassable cell", () => {
      const pf = new GridPathfinder();
      pf.setWalkable(2, 2, false);

      // Start on blocked cell
      expect(pf.findPath(vec2(100, 100), vec2(220, 220))).toEqual([]);

      // Target on blocked cell
      expect(pf.findPath(vec2(60, 60), vec2(100, 100))).toEqual([]);
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
      const path = pf.findPath(vec2(60, 60), vec2(100, 100));
      expect(path).toEqual([]);
    });

    it("prevents diagonal corner cutting around blocked obstacles", () => {
      const pf = new GridPathfinder();
      // Block cells (2, 1) and (1, 2)
      pf.setWalkable(2, 1, false);
      pf.setWalkable(1, 2, false);

      // Moving from (1, 1) [60, 60] to (2, 2) [100, 100] directly diagonally
      // would cut between the corners of (2, 1) and (1, 2)
      const path = pf.findPath(vec2(60, 60), vec2(100, 100), true);

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
      const result = pf.findNearestWalkable(vec2(65, 65));
      expect(result).toEqual(vec2(60, 60));
    });

    it("finds the nearest adjacent walkable cell if current cell is blocked", () => {
      const pf = new GridPathfinder();
      pf.setWalkable(2, 2, false);

      const blockedPos = vec2(100, 100); // cell (2, 2)
      const nearest = pf.findNearestWalkable(blockedPos, 2);

      expect(nearest).not.toBeNull();
      const grid = pf.worldToGrid(nearest!);
      expect(pf.isWalkable(grid.gx, grid.gy)).toBe(true);
      expect(Math.abs(grid.gx - 2) <= 1).toBe(true);
      expect(Math.abs(grid.gy - 2) <= 1).toBe(true);
    });
  });
});
