/**
 * GridPathfinder module for ChronoShot.
 *
 * Implements a high-performance 2D grid pathfinder using the A* algorithm
 * with 8-directional movement, diagonal corner-cutting prevention, and
 * obstacle clearance inflation to navigate combat units safely around arena geometry.
 */

import { Obstacle } from "../entities/Obstacle";
import { vec2, Vector2D } from "../math/vector";

/**
 * Lightweight binary min-heap priority queue for A* node indices.
 */
class PriorityQueue {
  private readonly heap: number[] = [];
  private readonly fScore: Float64Array;

  constructor(fScore: Float64Array) {
    this.fScore = fScore;
  }

  public push(node: number): void {
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  public pop(): number | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.bubbleDown(0);
    }
    return top;
  }

  public get size(): number {
    return this.heap.length;
  }

  public clear(): void {
    this.heap.length = 0;
  }

  private bubbleUp(idx: number): void {
    const node = this.heap[idx];
    const score = this.fScore[node];
    let currentIdx = idx;
    while (currentIdx > 0) {
      const parentIdx = (currentIdx - 1) >> 1;
      const parentNode = this.heap[parentIdx];
      if (score >= this.fScore[parentNode]) break;
      this.heap[currentIdx] = parentNode;
      currentIdx = parentIdx;
    }
    this.heap[currentIdx] = node;
  }

  private bubbleDown(idx: number): void {
    const node = this.heap[idx];
    const score = this.fScore[node];
    const length = this.heap.length;
    let currentIdx = idx;
    while (true) {
      const leftIdx = (currentIdx << 1) + 1;
      const rightIdx = leftIdx + 1;
      let smallestIdx = currentIdx;
      let smallestScore = score;

      if (leftIdx < length && this.fScore[this.heap[leftIdx]] < smallestScore) {
        smallestIdx = leftIdx;
        smallestScore = this.fScore[this.heap[leftIdx]];
      }
      if (rightIdx < length && this.fScore[this.heap[rightIdx]] < smallestScore) {
        smallestIdx = rightIdx;
        smallestScore = this.fScore[this.heap[rightIdx]];
      }

      if (smallestIdx === currentIdx) break;
      this.heap[currentIdx] = this.heap[smallestIdx];
      currentIdx = smallestIdx;
    }
    this.heap[currentIdx] = node;
  }
}

interface NeighborOffset {
  dx: number;
  dy: number;
  cost: number;
}

const SQRT2 = Math.SQRT2; // ~1.41421356

const NEIGHBORS: readonly NeighborOffset[] = [
  // 4 Cardinal directions (cost 1.0)
  { dx: 1, dy: 0, cost: 1.0 },
  { dx: -1, dy: 0, cost: 1.0 },
  { dx: 0, dy: 1, cost: 1.0 },
  { dx: 0, dy: -1, cost: 1.0 },
  // 4 Diagonal directions (cost ~1.414)
  { dx: 1, dy: 1, cost: SQRT2 },
  { dx: -1, dy: 1, cost: SQRT2 },
  { dx: 1, dy: -1, cost: SQRT2 },
  { dx: -1, dy: -1, cost: SQRT2 },
];

export class GridPathfinder {
  public readonly width: number;
  public readonly height: number;
  public readonly cellSize: number;
  public readonly cols: number;
  public readonly rows: number;

  /**
   * Grid walkability matrix: 1 = walkable, 0 = impassable.
   */
  private readonly grid: Uint8Array;

  constructor(width: number = 960, height: number = 640, cellSize: number = 40) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.cols = Math.floor(width / cellSize);
    this.rows = Math.floor(height / cellSize);
    this.grid = new Uint8Array(this.cols * this.rows);
    this.reset();
  }

  /**
   * Resets all grid cells to walkable (1).
   */
  public reset(): void {
    this.grid.fill(1);
  }

  /**
   * Converts world coordinates to grid cell indices.
   */
  public worldToGrid(pos: Vector2D): { gx: number; gy: number } {
    return {
      gx: Math.floor(pos.x / this.cellSize),
      gy: Math.floor(pos.y / this.cellSize),
    };
  }

  /**
   * Converts grid cell indices to world coordinates representing the center of the cell.
   */
  public gridToWorld(gx: number, gy: number): Vector2D {
    return vec2(
      (gx + 0.5) * this.cellSize,
      (gy + 0.5) * this.cellSize
    );
  }

  /**
   * Checks whether grid cell indices are within arena bounds.
   */
  public isValidGrid(gx: number, gy: number): boolean {
    return gx >= 0 && gx < this.cols && gy >= 0 && gy < this.rows;
  }

  /**
   * Checks whether a grid cell is within bounds and passable.
   */
  public isWalkable(gx: number, gy: number): boolean {
    if (!this.isValidGrid(gx, gy)) {
      return false;
    }
    return this.grid[gy * this.cols + gx] === 1;
  }

  /**
   * Sets walkability for a specific grid cell.
   */
  public setWalkable(gx: number, gy: number, walkable: boolean): void {
    if (this.isValidGrid(gx, gy)) {
      this.grid[gy * this.cols + gx] = walkable ? 1 : 0;
    }
  }

  /**
   * Marks grid cells covered by obstacles (with clearance radius inflation) as impassable.
   * Out-of-bounds obstacles or cells are clamped and handled cleanly.
   */
  public updateObstacles(obstacles: Obstacle[], clearanceRadius: number = 16): void {
    this.reset();
    const radius = Math.max(0, clearanceRadius);

    for (const obstacle of obstacles) {
      const ox = obstacle.bounds?.min?.x ?? obstacle.x;
      const oy = obstacle.bounds?.min?.y ?? obstacle.y;
      const ow = obstacle.bounds
        ? obstacle.bounds.max.x - obstacle.bounds.min.x
        : obstacle.width;
      const oh = obstacle.bounds
        ? obstacle.bounds.max.y - obstacle.bounds.min.y
        : obstacle.height;

      const minX = ox - radius;
      const minY = oy - radius;
      const maxX = ox + ow + radius;
      const maxY = oy + oh + radius;

      const startGx = Math.max(0, Math.floor(minX / this.cellSize));
      const endGx = Math.min(this.cols - 1, Math.floor((maxX - 1e-6) / this.cellSize));
      const startGy = Math.max(0, Math.floor(minY / this.cellSize));
      const endGy = Math.min(this.rows - 1, Math.floor((maxY - 1e-6) / this.cellSize));

      if (startGx > endGx || startGy > endGy) {
        continue;
      }

      for (let gy = startGy; gy <= endGy; gy++) {
        for (let gx = startGx; gx <= endGx; gx++) {
          this.grid[gy * this.cols + gx] = 0;
        }
      }
    }
  }

  /**
   * Finds a path from startPos to targetPos using A* search with 8-directional movement.
   * Diagonal corner cutting is prevented around blocked obstacles.
   *
   * @param startPos Starting world coordinates
   * @param targetPos Target world coordinates
   * @param includeStart Whether to include the start cell center as the first waypoint (default: true)
   * @returns Array of world waypoints (centers of path cells), or empty array if unreachable.
   */
  public findPath(
    startPos: Vector2D,
    targetPos: Vector2D,
    includeStart: boolean = true
  ): Vector2D[] {
    const start = this.worldToGrid(startPos);
    const target = this.worldToGrid(targetPos);

    if (!this.isValidGrid(start.gx, start.gy) || !this.isValidGrid(target.gx, target.gy)) {
      return [];
    }

    if (!this.isWalkable(start.gx, start.gy) || !this.isWalkable(target.gx, target.gy)) {
      return [];
    }

    if (start.gx === target.gx && start.gy === target.gy) {
      return includeStart ? [this.gridToWorld(start.gx, start.gy)] : [];
    }

    const numCells = this.cols * this.rows;
    const startIndex = start.gy * this.cols + start.gx;
    const targetIndex = target.gy * this.cols + target.gx;

    const gScore = new Float64Array(numCells);
    gScore.fill(Infinity);
    gScore[startIndex] = 0;

    const fScore = new Float64Array(numCells);
    fScore.fill(Infinity);
    fScore[startIndex] = this.heuristic(start.gx, start.gy, target.gx, target.gy);

    const cameFrom = new Int16Array(numCells);
    cameFrom.fill(-1);

    const closedSet = new Uint8Array(numCells);

    const openQueue = new PriorityQueue(fScore);
    openQueue.push(startIndex);

    while (openQueue.size > 0) {
      const currentIndex = openQueue.pop()!;

      if (currentIndex === targetIndex) {
        // Reconstruct path
        const path: Vector2D[] = [];
        let curr = targetIndex;
        while (curr !== -1) {
          const gx = curr % this.cols;
          const gy = Math.floor(curr / this.cols);
          path.push(this.gridToWorld(gx, gy));
          curr = cameFrom[curr];
        }
        path.reverse();

        if (!includeStart && path.length > 0) {
          path.shift();
        }

        return path;
      }

      if (closedSet[currentIndex] === 1) {
        continue;
      }
      closedSet[currentIndex] = 1;

      const currentGx = currentIndex % this.cols;
      const currentGy = Math.floor(currentIndex / this.cols);
      const currentG = gScore[currentIndex];

      for (let i = 0; i < NEIGHBORS.length; i++) {
        const n = NEIGHBORS[i];
        const ngx = currentGx + n.dx;
        const ngy = currentGy + n.dy;

        if (!this.isValidGrid(ngx, ngy) || !this.isWalkable(ngx, ngy)) {
          continue;
        }

        const neighborIndex = ngy * this.cols + ngx;
        if (closedSet[neighborIndex] === 1) {
          continue;
        }

        // Prevent diagonal corner cutting
        if (n.dx !== 0 && n.dy !== 0) {
          if (
            !this.isWalkable(currentGx + n.dx, currentGy) ||
            !this.isWalkable(currentGx, currentGy + n.dy)
          ) {
            continue;
          }
        }

        const tentativeG = currentG + n.cost;
        if (tentativeG < gScore[neighborIndex]) {
          cameFrom[neighborIndex] = currentIndex;
          gScore[neighborIndex] = tentativeG;
          const f = tentativeG + this.heuristic(ngx, ngy, target.gx, target.gy);
          fScore[neighborIndex] = f;
          openQueue.push(neighborIndex);
        }
      }
    }

    return [];
  }

  /**
   * Euclidean distance heuristic with slight tie-breaker for A*.
   */
  private heuristic(gx1: number, gy1: number, gx2: number, gy2: number): number {
    const dx = gx2 - gx1;
    const dy = gy2 - gy1;
    return Math.sqrt(dx * dx + dy * dy) * 1.0001;
  }

  /**
   * Finds the nearest walkable cell center within maxRadius grid steps of the given position.
   * Useful when an entity or target is located on or near an impassable boundary.
   */
  public findNearestWalkable(pos: Vector2D, maxRadius: number = 3): Vector2D | null {
    const { gx, gy } = this.worldToGrid(pos);
    if (this.isWalkable(gx, gy)) {
      return this.gridToWorld(gx, gy);
    }

    let bestDistSq = Infinity;
    let bestGx = -1;
    let bestGy = -1;

    for (let r = 1; r <= maxRadius; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const ngx = gx + dx;
          const ngy = gy + dy;
          if (this.isWalkable(ngx, ngy)) {
            const worldPos = this.gridToWorld(ngx, ngy);
            const distSq = (worldPos.x - pos.x) ** 2 + (worldPos.y - pos.y) ** 2;
            if (distSq < bestDistSq) {
              bestDistSq = distSq;
              bestGx = ngx;
              bestGy = ngy;
            }
          }
        }
      }
      if (bestGx !== -1) {
        return this.gridToWorld(bestGx, bestGy);
      }
    }

    return null;
  }
}
