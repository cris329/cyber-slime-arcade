import type { GemStyle, SlimeSkin } from "./types";

export const SKINS: readonly SlimeSkin[] = [
  {
    id: "neon",
    name: "NEON VERDE",
    color: 0x45ff8f,
    light: 0xd8ffe5,
    dark: 0x078b52,
    accent: 0xbcff4d,
    css: "#45ff8f",
    cssLight: "#d8ffe5",
  },
  {
    id: "glitch",
    name: "MAGENTA GLITCH",
    color: 0xff3ea5,
    light: 0xffd9ee,
    dark: 0x8f0e57,
    accent: 0x38f2ff,
    css: "#ff3ea5",
    cssLight: "#ffd9ee",
  },
  {
    id: "vortex",
    name: "CIAN VORTEX",
    color: 0x32e7ff,
    light: 0xdcfbff,
    dark: 0x086c9c,
    accent: 0x9b7bff,
    css: "#32e7ff",
    cssLight: "#dcfbff",
  },
  {
    id: "amber",
    name: "AMBAR CORE",
    color: 0xffb52e,
    light: 0xfff1c9,
    dark: 0xa34d00,
    accent: 0xff3ea5,
    css: "#ffb52e",
    cssLight: "#fff1c9",
  },
  {
    id: "void",
    name: "VIOLETA VOID",
    color: 0x9b7bff,
    light: 0xeee4ff,
    dark: 0x4a22b8,
    accent: 0x45ff8f,
    css: "#9b7bff",
    cssLight: "#eee4ff",
  },
];

export function skinAt(index: number): SlimeSkin {
  const length = SKINS.length;
  const normalized = ((index % length) + length) % length;
  return SKINS[normalized] ?? SKINS[0]!;
}

export const GEM_STYLES: readonly GemStyle[] = [
  { key: "gem_cyan", color: 0x38f2ff, css: "#38f2ff" },
  { key: "gem_pink", color: 0xff3ea5, css: "#ff3ea5" },
  { key: "gem_gold", color: 0xffc83d, css: "#ffc83d" },
  { key: "gem_lime", color: 0x63ff9b, css: "#63ff9b" },
];

export function gemAt(index: number): GemStyle {
  const length = GEM_STYLES.length;
  const normalized = ((index % length) + length) % length;
  return GEM_STYLES[normalized] ?? GEM_STYLES[0]!;
}

export const STORAGE_KEYS = {
  best: "cyber-slime-best-v1",
  skin: "cyber-slime-skin-v1",
} as const;

export function readStoredNumber(key: string, fallback: number): number {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredNumber(key: string, value: number): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Storage can be disabled; the game keeps working in-memory.
  }
}
