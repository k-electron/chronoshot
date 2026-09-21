/**
 * Obstacle module for ChronoShot.
 *
 * Defines geometric cover obstacles (walls and pillars) that impede entity
 * movement, absorb high-speed projectiles, and obstruct enemy line-of-sight.
 */

import { AABB } from "../math/collision";
import { vec2 } from "../math/vector";

export interface Obstacle {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly bounds: AABB;
}

export function createObstacle(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number
): Obstacle {
  return {
    id,
    x,
    y,
    width,
    height,
    bounds: {
      min: vec2(x, y),
      max: vec2(x + width, y + height),
    },
  };
}

export function createPillar(id: string, cx: number, cy: number, size = 40): Obstacle {
  const half = size / 2;
  return createObstacle(id, cx - half, cy - half, size, size);
}
