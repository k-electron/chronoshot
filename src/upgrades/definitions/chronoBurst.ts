import { UpgradeDefinition } from "../UpgradeDefinition";

export const chronoBurst: UpgradeDefinition = {
  id: "chrono-burst",
  name: "CHRONO BURST",
  archetype: "BALLISTICS // ACCELERATION",
  description:
    "Accelerates projectile muzzle velocity by +30%, compressing travel time and eliminating hostile evasion windows.",
  statHighlight: "+30% BULLET VELOCITY",
  accentColor: "#f72585",
  tier: "rare",
  maxStacks: 1,
  modifiers: {
    bulletSpeedMultiplier: 1.3,
  },
};
