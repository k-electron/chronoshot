import { UpgradeDefinition } from "../UpgradeDefinition";

export const extendedCylinder: UpgradeDefinition = {
  id: "extended-cylinder",
  name: "EXTENDED CYLINDER",
  archetype: "FIREPOWER // CAPACITY",
  description:
    "Expands revolver capacity by +2 chambers. Neutralize multiple heavily armored hostiles without mid-combat reload vulnerability.",
  statHighlight: "6 → 8 CHAMBERS",
  accentColor: "#00f0ff",
  tier: "standard",
  maxStacks: 1,
  modifiers: {
    magSizeBonus: 2,
  },
};
