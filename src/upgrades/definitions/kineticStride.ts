import { UpgradeDefinition } from "../UpgradeDefinition";

export const kineticStride: UpgradeDefinition = {
  id: "kinetic-stride",
  name: "KINETIC STRIDE",
  archetype: "MOBILITY // EVASION",
  description:
    "Overclocks tactical locomotion servomotors, accelerating base movement velocity by +25% for swift flanking.",
  statHighlight: "+25% MOVEMENT SPEED",
  accentColor: "#9d4edd",
  tier: "rare",
  maxStacks: 1,
  modifiers: {
    speedMultiplier: 1.25,
  },
};
