/**
 * 2D Collision and Raycasting mathematics module for ChronoShot.
 *
 * Implements exact continuous intersection tests for high-velocity projectiles,
 * cover obstacles, line-of-sight checks, and circular entity hitboxes.
 */

import {
  Vector2D,
  vec2,
  vecCross,
  vecDistance,
  vecDot,
  vecLength,
  vecLengthSq,
  vecNormalize,
  vecScale,
  vecSub,
} from "./vector";

export interface RayIntersection {
  point: Vector2D;
  distance: number;
  normal: Vector2D;
  t: number;
  u?: number;
}

export interface LineSegment {
  start: Vector2D;
  end: Vector2D;
}

export interface Circle {
  center: Vector2D;
  radius: number;
}

export interface AABB {
  min: Vector2D;
  max: Vector2D;
}

const EPSILON = 1e-7;

/**
 * Tests ray intersection against a 2D line segment.
 *
 * Ray: R(t) = origin + t * dir, where t >= 0 and t <= maxDistance
 * Segment: S(u) = segStart + u * (segEnd - segStart), where 0 <= u <= 1
 *
 * @param rayOrigin Starting position of the ray
 * @param rayDir Direction vector of the ray (expected to be normalized)
 * @param segStart Start point of the line segment
 * @param segEnd End point of the line segment
 * @param maxDistance Maximum distance to trace (default: Infinity)
 * @returns RayIntersection object if a hit occurs, otherwise null.
 */
export function rayIntersectsSegment(
  rayOrigin: Vector2D,
  rayDir: Vector2D,
  segStart: Vector2D,
  segEnd: Vector2D,
  maxDistance = Infinity
): RayIntersection | null {
  const segVec = vecSub(segEnd, segStart);
  const cross = vecCross(rayDir, segVec);

  // If cross product is ~0, ray and segment are parallel / collinear
  if (Math.abs(cross) < EPSILON) {
    return null;
  }

  const startDiff = vecSub(segStart, rayOrigin);
  const t = vecCross(startDiff, segVec) / cross;
  const u = vecCross(startDiff, rayDir) / cross;

  if (t >= 0 && t <= maxDistance && u >= 0 && u <= 1) {
    const point = vec2(rayOrigin.x + rayDir.x * t, rayOrigin.y + rayDir.y * t);

    // Compute surface normal facing incoming ray
    // Candidate segment normal: (-dy, dx)
    const normalCandidate = vecNormalize(vec2(-segVec.y, segVec.x));
    const normal =
      vecDot(rayDir, normalCandidate) <= 0
        ? normalCandidate
        : vecScale(normalCandidate, -1);

    return {
      point,
      distance: t,
      normal,
      t,
      u,
    };
  }

  return null;
}

/**
 * Tests intersection between two finite line segments [p1, p2] and [q1, q2].
 * Returns intersection point or null if they do not intersect.
 */
export function segmentIntersectsSegment(
  p1: Vector2D,
  p2: Vector2D,
  q1: Vector2D,
  q2: Vector2D
): Vector2D | null {
  const r = vecSub(p2, p1);
  const s = vecSub(q2, q1);
  const rxs = vecCross(r, s);

  if (Math.abs(rxs) < EPSILON) {
    return null;
  }

  const qp = vecSub(q1, p1);
  const t = vecCross(qp, s) / rxs;
  const u = vecCross(qp, r) / rxs;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return vec2(p1.x + t * r.x, p1.y + t * r.y);
  }

  return null;
}

/**
 * Tests ray intersection against a circle (used for unit hitboxes).
 *
 * @param rayOrigin Origin of ray
 * @param rayDir Normalized ray direction
 * @param circleCenter Center of circle
 * @param radius Circle radius
 * @param maxDistance Maximum ray distance
 */
export function rayIntersectsCircle(
  rayOrigin: Vector2D,
  rayDir: Vector2D,
  circleCenter: Vector2D,
  radius: number,
  maxDistance = Infinity
): RayIntersection | null {
  const m = vecSub(rayOrigin, circleCenter);
  const b = vecDot(m, rayDir);
  const c = vecDot(m, m) - radius * radius;

  // Ray origin is outside circle and ray points away
  if (c > 0 && b > 0) {
    return null;
  }

  const discriminant = b * b - c;
  if (discriminant < 0) {
    return null; // Ray misses circle
  }

  let t = -b - Math.sqrt(discriminant);

  // If t < 0, ray started inside circle
  if (t < 0) {
    t = -b + Math.sqrt(discriminant);
  }

  if (t >= 0 && t <= maxDistance) {
    const point = vec2(rayOrigin.x + rayDir.x * t, rayOrigin.y + rayDir.y * t);
    const normal = vecNormalize(vecSub(point, circleCenter));

    return {
      point,
      distance: t,
      normal,
      t,
    };
  }

  return null;
}

/**
 * Computes the closest point on a line segment to an arbitrary point.
 */
export function closestPointOnSegment(
  point: Vector2D,
  segStart: Vector2D,
  segEnd: Vector2D
): Vector2D {
  const segVec = vecSub(segEnd, segStart);
  const segLenSq = vecLengthSq(segVec);

  if (segLenSq < EPSILON) {
    return { ...segStart };
  }

  const t = Math.max(0, Math.min(1, vecDot(vecSub(point, segStart), segVec) / segLenSq));
  return vec2(segStart.x + segVec.x * t, segStart.y + segVec.y * t);
}

/**
 * Checks if a circle intersects with a finite line segment.
 */
export function circleIntersectsSegment(
  circleCenter: Vector2D,
  radius: number,
  segStart: Vector2D,
  segEnd: Vector2D
): boolean {
  const closest = closestPointOnSegment(circleCenter, segStart, segEnd);
  return vecDistance(circleCenter, closest) <= radius;
}

/**
 * Tests ray intersection against an Axis-Aligned Bounding Box (AABB).
 * Useful for solid wall obstacles.
 */
export function rayIntersectsAABB(
  rayOrigin: Vector2D,
  rayDir: Vector2D,
  min: Vector2D,
  max: Vector2D,
  maxDistance = Infinity
): RayIntersection | null {
  let tMin = 0;
  let tMax = maxDistance;
  let hitNormal = vec2(0, 0);

  // X slab
  if (Math.abs(rayDir.x) < EPSILON) {
    if (rayOrigin.x < min.x || rayOrigin.x > max.x) {
      return null;
    }
  } else {
    const invDirX = 1 / rayDir.x;
    let t1 = (min.x - rayOrigin.x) * invDirX;
    let t2 = (max.x - rayOrigin.x) * invDirX;
    let normalNear = vec2(-Math.sign(rayDir.x), 0);

    if (t1 > t2) {
      const temp = t1;
      t1 = t2;
      t2 = temp;
      normalNear = vec2(Math.sign(rayDir.x), 0);
    }

    if (t1 > tMin) {
      tMin = t1;
      hitNormal = normalNear;
    }
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) {
      return null;
    }
  }

  // Y slab
  if (Math.abs(rayDir.y) < EPSILON) {
    if (rayOrigin.y < min.y || rayOrigin.y > max.y) {
      return null;
    }
  } else {
    const invDirY = 1 / rayDir.y;
    let t1 = (min.y - rayOrigin.y) * invDirY;
    let t2 = (max.y - rayOrigin.y) * invDirY;
    let normalNear = vec2(0, -Math.sign(rayDir.y));

    if (t1 > t2) {
      const temp = t1;
      t1 = t2;
      t2 = temp;
      normalNear = vec2(0, Math.sign(rayDir.y));
    }

    if (t1 > tMin) {
      tMin = t1;
      hitNormal = normalNear;
    }
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) {
      return null;
    }
  }

  if (tMin >= 0 && tMin <= maxDistance) {
    return {
      point: vec2(rayOrigin.x + rayDir.x * tMin, rayOrigin.y + rayDir.y * tMin),
      distance: tMin,
      normal: hitNormal,
      t: tMin,
    };
  }

  return null;
}

export interface CircleAABBCollision {
  collided: boolean;
  normal: Vector2D;
  depth: number;
  contactPoint: Vector2D;
}

/**
 * Tests collision between a circular entity and an Axis-Aligned Bounding Box (AABB).
 * Computes penetration depth and separation normal pointing away from the box.
 */
export function testCircleAABB(
  circleCenter: Vector2D,
  radius: number,
  min: Vector2D,
  max: Vector2D
): CircleAABBCollision | null {
  const clampedX = Math.max(min.x, Math.min(circleCenter.x, max.x));
  const clampedY = Math.max(min.y, Math.min(circleCenter.y, max.y));

  const dx = circleCenter.x - clampedX;
  const dy = circleCenter.y - clampedY;
  const distSq = dx * dx + dy * dy;

  if (distSq > radius * radius) {
    return null;
  }

  if (distSq > EPSILON) {
    const dist = Math.sqrt(distSq);
    const normal = vec2(dx / dist, dy / dist);
    const depth = radius - dist;
    return {
      collided: true,
      normal,
      depth,
      contactPoint: vec2(clampedX, clampedY),
    };
  }

  // Center is strictly inside the AABB - find closest face to resolve
  const dLeft = circleCenter.x - min.x;
  const dRight = max.x - circleCenter.x;
  const dTop = circleCenter.y - min.y;
  const dBottom = max.y - circleCenter.y;
  const minOverlap = Math.min(dLeft, dRight, dTop, dBottom);

  let normal = vec2(0, -1);
  let contactPoint = vec2(circleCenter.x, min.y);

  if (minOverlap === dLeft) {
    normal = vec2(-1, 0);
    contactPoint = vec2(min.x, circleCenter.y);
  } else if (minOverlap === dRight) {
    normal = vec2(1, 0);
    contactPoint = vec2(max.x, circleCenter.y);
  } else if (minOverlap === dTop) {
    normal = vec2(0, -1);
    contactPoint = vec2(circleCenter.x, min.y);
  } else {
    normal = vec2(0, 1);
    contactPoint = vec2(circleCenter.x, max.y);
  }

  return {
    collided: true,
    normal,
    depth: radius + minOverlap,
    contactPoint,
  };
}

/**
 * Checks whether an entity with a circular hitbox of the given radius can
 * navigate in a straight line from `from` to `to` without colliding with obstacles.
 *
 * Uses continuous swept-circle testing against obstacle AABBs (Minkowski sum expansion):
 * 1. Checks if the starting position already overlaps an obstacle.
 * 2. Checks if the straight segment intersects the expanded obstacle bounds.
 * 3. Checks corner vertex circles of radius `radius`.
 *
 * @param from Starting position of entity center
 * @param to Target position of entity center
 * @param radius Hitbox radius of the moving entity
 * @param obstacles Array of obstacles with AABB bounds
 * @returns true if the corridor is completely unobstructed, false otherwise
 */
export function hasNavigationClearance(
  from: Vector2D,
  to: Vector2D,
  radius: number,
  obstacles: readonly { bounds: AABB }[]
): boolean {
  const diff = vecSub(to, from);
  const dist = vecLength(diff);

  if (dist < 1e-4) {
    return true;
  }

  const dir = vecScale(diff, 1 / dist);

  for (const obstacle of obstacles) {
    const { min, max } = obstacle.bounds;

    // 1. If start position is in contact with obstacle, check departure direction
    const contact = testCircleAABB(from, radius, min, max);
    if (contact && contact.collided) {
      // If entity center is strictly inside obstacle AABB, clearance is blocked
      if (
        from.x >= min.x &&
        from.x <= max.x &&
        from.y >= min.y &&
        from.y <= max.y
      ) {
        return false;
      }
      // If moving into obstacle (opposing normal), clearance is blocked
      if (vecDot(dir, contact.normal) < -0.05) {
        return false;
      }
      // Moving away or along tangent: this obstacle does not obstruct departure
      continue;
    }

    // 2. Broad-phase: check if ray hits bounding box of Minkowski sum
    const broadMin = vec2(min.x - radius, min.y - radius);
    const broadMax = vec2(max.x + radius, max.y + radius);
    const broadHit = rayIntersectsAABB(from, dir, broadMin, broadMax, dist);

    if (!broadHit) {
      continue;
    }

    // 3. Narrow-phase: Minkowski sum is the union of two central boxes + 4 corner circles.
    // Check horizontal expansion box [min.x, max.x] x [min.y - radius, max.y + radius]
    const boxYMin = vec2(min.x, min.y - radius);
    const boxYMax = vec2(max.x, max.y + radius);
    if (rayIntersectsAABB(from, dir, boxYMin, boxYMax, dist) !== null) {
      return false;
    }

    // Check vertical expansion box [min.x - radius, max.x + radius] x [min.y, max.y]
    const boxXMin = vec2(min.x - radius, min.y);
    const boxXMax = vec2(max.x + radius, max.y);
    if (rayIntersectsAABB(from, dir, boxXMin, boxXMax, dist) !== null) {
      return false;
    }

    // Check 4 corner circles
    if (
      circleIntersectsSegment(min, radius, from, to) ||
      circleIntersectsSegment(vec2(max.x, min.y), radius, from, to) ||
      circleIntersectsSegment(vec2(min.x, max.y), radius, from, to) ||
      circleIntersectsSegment(max, radius, from, to)
    ) {
      return false;
    }
  }

  return true;
}

