import { UpgradeDefinition } from "../UpgradeDefinition";

export const reactiveShield: UpgradeDefinition = {
  id: "reactive-shield",
  name: "REACTIVE SHIELD",
  archetype: "DEFENSE // RESILIENCE",
  description:
    "Deploys a kinetic deflection barrier that absorbs 1 lethal projectile impact per room before shattering. Crucial for permadeath runs.",
  statHighlight: "+1 SHIELD HIT BUFFER",
  accentColor: "#06d6a0",
  tier: "standard",
  maxStacks: 1,
  modifiers: {
    shieldChargesBonus: 1,
  },
};
