import { describe, expect, it } from "vitest";
import { ScratchVectorPool, sharedMovementScratchPool } from "./MovementBehavior";

describe("MovementBehavior & ScratchVectorPool", () => {
  it("initializes pool with requested capacity", () => {
    const pool = new ScratchVectorPool(8);
    expect(pool.capacity).toBe(8);
    expect(pool.allocatedCount).toBe(0);
  });

  it("acquires scratch vectors with specified coordinates", () => {
    const pool = new ScratchVectorPool(4);
    const v1 = pool.acquire(10, 20);
    const v2 = pool.acquire(30, 40);

    expect(v1.x).toBe(10);
    expect(v1.y).toBe(20);
    expect(v2.x).toBe(30);
    expect(v2.y).toBe(40);
    expect(pool.allocatedCount).toBe(2);
  });

  it("expands pool dynamically if allocations exceed initial capacity", () => {
    const pool = new ScratchVectorPool(2);
    pool.acquire(1, 1);
    pool.acquire(2, 2);
    expect(pool.capacity).toBe(2);

    // 3rd acquisition expands capacity
    const v3 = pool.acquire(3, 3);
    expect(v3.x).toBe(3);
    expect(v3.y).toBe(3);
    expect(pool.capacity).toBeGreaterThan(2);
    expect(pool.allocatedCount).toBe(3);
  });

  it("reuses vector objects after reset without creating new object instances", () => {
    const pool = new ScratchVectorPool(4);
    const firstRef = pool.acquire(100, 200);

    pool.reset();
    expect(pool.allocatedCount).toBe(0);

    const secondRef = pool.acquire(300, 400);
    // Identical object reference reused
    expect(secondRef).toBe(firstRef);
    expect(secondRef.x).toBe(300);
    expect(secondRef.y).toBe(400);
  });

  it("provides shared movement scratch vector pool", () => {
    expect(sharedMovementScratchPool).toBeDefined();
    sharedMovementScratchPool.reset();
    const vec = sharedMovementScratchPool.acquire(5, 10);
    expect(vec.x).toBe(5);
    expect(vec.y).toBe(10);
    sharedMovementScratchPool.reset();
  });
});
