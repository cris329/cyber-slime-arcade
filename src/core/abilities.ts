export const ABILITY_CONFIG = {
  shield: {
    label: "B",
    name: "ESCUDO",
    cooldown: 5.4,
    duration: 2.5,
    color: 0x38f2ff,
    css: "#38f2ff",
  },
  dash: {
    label: "X",
    name: "DASH",
    cooldown: 2.5,
    duration: 0.3,
    color: 0xff3ea5,
    css: "#ff3ea5",
  },
  magnet: {
    label: "Y",
    name: "IMAN",
    cooldown: 7.4,
    duration: 2.8,
    color: 0xffc83d,
    css: "#ffc83d",
  },
} as const;

export type AbilityKey = keyof typeof ABILITY_CONFIG;
export type AbilityCooldowns = Record<AbilityKey, number>;

export function emptyCooldowns(): AbilityCooldowns {
  return { shield: 0, dash: 0, magnet: 0 };
}
