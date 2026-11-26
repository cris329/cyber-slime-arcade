export const INPUT_ACTIONS = [
  "dpadUp",
  "dpadDown",
  "dpadLeft",
  "dpadRight",
  "buttonA",
  "buttonB",
  "buttonX",
  "buttonY",
  "turboLeft",
  "turboRight",
  "select",
  "start",
] as const;

export type InputAction = (typeof INPUT_ACTIONS)[number];

export interface RetroControllerInputs {
  dpadUp: boolean;
  dpadDown: boolean;
  dpadLeft: boolean;
  dpadRight: boolean;
  buttonA: boolean;
  buttonB: boolean;
  buttonX: boolean;
  buttonY: boolean;
  turboLeft: boolean;
  turboRight: boolean;
  select: boolean;
  start: boolean;
}

export interface GamepadConnectionInfo {
  connected: boolean;
  name: string | null;
}

export interface SlimeSkin {
  id: string;
  name: string;
  color: number;
  light: number;
  dark: number;
  accent: number;
  css: string;
  cssLight: string;
}

export interface GemStyle {
  key: string;
  color: number;
  css: string;
}

export interface AbilityState {
  shield: number;
  dash: number;
  magnet: number;
}
