import { UpgradeDefinition } from "../UpgradeDefinition";

export const phaseDeflector: UpgradeDefinition = {
  id: "phase-deflector",
  name: "PHASE DEFLECTOR",
  archetype: "TACTICAL // OMNI-SHIELD",
  description:
    "Reinforces player kinetic deflector matrix with +2 shield charge hit buffers replenished at the start of each room.",
  statHighlight: "+2 SHIELD HIT BUFFER",
  accentColor: "#4cc9f0",
  tier: "overclock",
  maxStacks: 1,
  modifiers: {
    shieldChargesBonus: 2,
  },
};
