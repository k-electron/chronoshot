/**
 * RollbackCalculator module for ChronoShot.
 *
 * Implements cascading boss checkpoint resolution:
 * - Sector 1 (Rooms 1–5): Falls back to Room 1 (Basic Cover).
 * - Sector 2 (Rooms 6–10): Falls back to Room 5 (Goliath-01 Aegis Colossus).
 * - Sector 3 (Rooms 11–15): Falls back to Room 10 (Chrono-Weaver Temporal Anchor).
 * - Sector 4 (Rooms 16–20): Falls back to Room 15 (Vektor-Prime Phase Sovereign).
 * - Endless Survival Mode (Room 21+): Falls back to Room 20 (Chrono-Zenith Zero Sovereign).
 */

export interface RollbackTarget {
  readonly roomNumber: number;
  readonly roomIndex: number;
  readonly bossName: string;
  readonly loadoutDescription: string;
  readonly requiredAugmentationCount: number;
}

/**
 * Computes the cascading rollback target based on current room number and endless mode state.
 */
export function computeRollbackTarget(
  currentRoomNumber: number,
  isEndless: boolean
): RollbackTarget {
  if (isEndless || currentRoomNumber > 20) {
    return {
      roomNumber: 20,
      roomIndex: 19,
      bossName: "CHRONO-ZENITH",
      loadoutDescription: "Restores Sector 4 loadout (3 Augmentations)",
      requiredAugmentationCount: 3,
    };
  }

  if (currentRoomNumber <= 5) {
    return {
      roomNumber: 1,
      roomIndex: 0,
      bossName: "BASIC COVER",
      loadoutDescription: "Full expedition reset (0 Augmentations)",
      requiredAugmentationCount: 0,
    };
  }

  if (currentRoomNumber <= 10) {
    return {
      roomNumber: 5,
      roomIndex: 4,
      bossName: "GOLIATH-01",
      loadoutDescription: "Restores Sector 1 entry loadout (0 Augmentations)",
      requiredAugmentationCount: 0,
    };
  }

  if (currentRoomNumber <= 15) {
    return {
      roomNumber: 10,
      roomIndex: 9,
      bossName: "CHRONO-WEAVER",
      loadoutDescription: "Restores Sector 2 entry loadout (1 Augmentation)",
      requiredAugmentationCount: 1,
    };
  }

  return {
    roomNumber: 15,
    roomIndex: 14,
    bossName: "VEKTOR-PRIME",
    loadoutDescription: "Restores Sector 3 entry loadout (2 Augmentations)",
    requiredAugmentationCount: 2,
  };
}
