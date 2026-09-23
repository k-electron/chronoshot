import { UpgradeDefinition } from "../UpgradeDefinition";

export const speedLoader: UpgradeDefinition = {
  id: "speed-loader",
  name: "SPEED LOADER",
  archetype: "TEMPO // CYCLING",
  description:
    "Halves ammunition cycle exposure from 30 ticks to 15 ticks. Enables aggressive repositioning and rapid tactical recovery under fire.",
  statHighlight: "+15 TICK RELOAD",
  accentColor: "#ffb703",
  tier: "standard",
  maxStacks: 1,
  modifiers: {
    reloadTickReduction: 15,
  },
};
