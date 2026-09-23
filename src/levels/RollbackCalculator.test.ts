import { describe, expect, it } from "vitest";
import { computeRollbackTarget } from "./RollbackCalculator";

describe("RollbackCalculator", () => {
  it("routes Rooms 1 through 5 (Sector 1) to Room 1", () => {
    for (let r = 1; r <= 5; r++) {
      const target = computeRollbackTarget(r, false);
      expect(target.roomNumber).toBe(1);
      expect(target.roomIndex).toBe(0);
      expect(target.requiredAugmentationCount).toBe(0);
    }
  });

  it("routes Rooms 6 through 10 (Sector 2) to Room 5 (Goliath-01)", () => {
    for (let r = 6; r <= 10; r++) {
      const target = computeRollbackTarget(r, false);
      expect(target.roomNumber).toBe(5);
      expect(target.roomIndex).toBe(4);
      expect(target.bossName).toBe("GOLIATH-01");
      expect(target.requiredAugmentationCount).toBe(0);
    }
  });

  it("routes Rooms 11 through 15 (Sector 3) to Room 10 (Chrono-Weaver)", () => {
    for (let r = 11; r <= 15; r++) {
      const target = computeRollbackTarget(r, false);
      expect(target.roomNumber).toBe(10);
      expect(target.roomIndex).toBe(9);
      expect(target.bossName).toBe("CHRONO-WEAVER");
      expect(target.requiredAugmentationCount).toBe(1);
    }
  });

  it("routes Rooms 16 through 20 (Sector 4) to Room 15 (Vektor-Prime)", () => {
    for (let r = 16; r <= 20; r++) {
      const target = computeRollbackTarget(r, false);
      expect(target.roomNumber).toBe(15);
      expect(target.roomIndex).toBe(14);
      expect(target.bossName).toBe("VEKTOR-PRIME");
      expect(target.requiredAugmentationCount).toBe(2);
    }
  });

  it("routes Endless Mode to Room 20 (Chrono-Zenith)", () => {
    const targetEndless = computeRollbackTarget(21, true);
    expect(targetEndless.roomNumber).toBe(20);
    expect(targetEndless.roomIndex).toBe(19);
    expect(targetEndless.bossName).toBe("CHRONO-ZENITH");
    expect(targetEndless.requiredAugmentationCount).toBe(3);

    // Also handles arbitrary high room numbers in endless
    const highRoomTarget = computeRollbackTarget(99, true);
    expect(highRoomTarget.roomNumber).toBe(20);
  });
});
