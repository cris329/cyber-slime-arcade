import {
  INPUT_ACTIONS,
  type GamepadConnectionInfo,
  type InputAction,
  type RetroControllerInputs,
} from "./types";

type ConnectionListener = (info: GamepadConnectionInfo) => void;

const KEY_ACTIONS: Readonly<Record<string, InputAction>> = {
  ArrowUp: "dpadUp",
  KeyW: "dpadUp",
  ArrowDown: "dpadDown",
  KeyS: "dpadDown",
  ArrowLeft: "dpadLeft",
  KeyA: "dpadLeft",
  ArrowRight: "dpadRight",
  KeyD: "dpadRight",
  Space: "buttonA",
  KeyZ: "buttonA",
  KeyB: "buttonB",
  KeyK: "buttonB",
  KeyX: "buttonX",
  KeyL: "buttonX",
  KeyY: "buttonY",
  KeyJ: "buttonY",
  ShiftLeft: "turboLeft",
  ShiftRight: "turboRight",
  Tab: "select",
  Enter: "start",
  NumpadEnter: "start",
};

function blankInputs(): RetroControllerInputs {
  return {
    dpadUp: false,
    dpadDown: false,
    dpadLeft: false,
    dpadRight: false,
    buttonA: false,
    buttonB: false,
    buttonX: false,
    buttonY: false,
    turboLeft: false,
    turboRight: false,
    select: false,
    start: false,
  };
}

function buttonPressed(pad: Gamepad, index: number): boolean {
  return pad.buttons[index]?.pressed === true;
}

function buttonValue(pad: Gamepad, index: number): number {
  return pad.buttons[index]?.value ?? 0;
}

function axis(pad: Gamepad, index: number): number {
  const value = pad.axes[index];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readPad(pad: Gamepad): RetroControllerInputs {
  const x = axis(pad, 0);
  const y = axis(pad, 1);
  const threshold = 0.42;

  return {
    dpadUp: y < -threshold || buttonPressed(pad, 12),
    dpadDown: y > threshold || buttonPressed(pad, 13),
    dpadLeft: x < -threshold || buttonPressed(pad, 14),
    dpadRight: x > threshold || buttonPressed(pad, 15),
    buttonA: buttonPressed(pad, 0),
    buttonB: buttonPressed(pad, 1),
    buttonX: buttonPressed(pad, 2),
    buttonY: buttonPressed(pad, 3),
    turboLeft: buttonPressed(pad, 4) || buttonValue(pad, 6) > 0.35,
    turboRight: buttonPressed(pad, 5) || buttonValue(pad, 7) > 0.35,
    select: buttonPressed(pad, 8),
    start: buttonPressed(pad, 9),
  };
}

export class InputHandler {
  private padIndex: number | null = null;
  private padName: string | null = null;
  private connected = false;

  private state: RetroControllerInputs = blankInputs();
  private previous: RetroControllerInputs = blankInputs();
  private pointer: RetroControllerInputs = blankInputs();
  private pulseState: RetroControllerInputs = blankInputs();
  private readonly heldSince = new Map<InputAction, number>();
  private readonly keys = new Set<string>();
  private readonly listeners = new Set<ConnectionListener>();

  private readonly onGamepadConnected = (event: GamepadEvent): void => {
    this.padIndex = event.gamepad.index;
    this.padName = event.gamepad.id;
    this.connected = true;
    this.notifyConnection();
  };

  private readonly onGamepadDisconnected = (event: GamepadEvent): void => {
    if (this.padIndex === event.gamepad.index) {
      this.padIndex = null;
      this.padName = null;
      this.connected = false;
      this.notifyConnection();
    }
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const action = KEY_ACTIONS[event.code];
    if (action !== undefined) {
      event.preventDefault();
      this.keys.add(event.code);
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
  };

  private readonly onBlur = (): void => {
    this.keys.clear();
    this.pointer = blankInputs();
    this.pulseState = blankInputs();
    this.state = blankInputs();
    this.previous = blankInputs();
    this.heldSince.clear();
  };

  constructor() {
    if (typeof window === "undefined") return;

    window.addEventListener("gamepadconnected", this.onGamepadConnected);
    window.addEventListener("gamepaddisconnected", this.onGamepadDisconnected);
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
  }

  public update(): void {
    this.previous = { ...this.state };

    const pad = this.findPad();
    const padInputs = pad === null ? blankInputs() : readPad(pad);
    const keyboardInputs = blankInputs();

    for (const code of this.keys) {
      const action = KEY_ACTIONS[code];
      if (action !== undefined) keyboardInputs[action] = true;
    }

    for (const action of INPUT_ACTIONS) {
      this.state[action] =
        padInputs[action] ||
        keyboardInputs[action] ||
        this.pointer[action] ||
        this.pulseState[action];
    }

    this.pulseState = blankInputs();

    const now = performance.now();
    for (const action of INPUT_ACTIONS) {
      if (this.state[action] && !this.previous[action]) {
        this.heldSince.set(action, now);
      } else if (!this.state[action]) {
        this.heldSince.delete(action);
      }
    }

    const nextConnected = pad !== null;
    const nextName = pad?.id ?? null;
    if (nextConnected !== this.connected || nextName !== this.padName) {
      this.connected = nextConnected;
      this.padName = nextName;
      this.notifyConnection();
    }
  }

  public setPointer(action: InputAction, down: boolean): void {
    this.pointer[action] = down;
  }

  public pulse(action: InputAction): void {
    this.pulseState[action] = true;
  }

  public isDown(action: InputAction): boolean {
    return this.state[action];
  }

  public justPressed(action: InputAction): boolean {
    return this.state[action] && !this.previous[action];
  }

  public heldFor(action: InputAction): number {
    const since = this.heldSince.get(action);
    return since === undefined ? 0 : (performance.now() - since) / 1000;
  }

  public get isGamepadConnected(): boolean {
    return this.connected;
  }

  public get gamepadName(): string | null {
    return this.padName;
  }

  public onConnectionChange(listener: ConnectionListener): () => void {
    this.listeners.add(listener);
    listener({ connected: this.connected, name: this.padName });
    return () => {
      this.listeners.delete(listener);
    };
  }

  public rumble(duration = 120, strength = 0.5): void {
    const pad = this.findPad();
    if (pad === null) return;

    type HapticActuator = {
      playEffect?: (
        type: string,
        params: {
          duration: number;
          startDelay: number;
          strongMagnitude: number;
          weakMagnitude: number;
        },
      ) => Promise<unknown>;
    };

    const actuator = (pad as Gamepad & { vibrationActuator?: HapticActuator })
      .vibrationActuator;
    const result = actuator?.playEffect?.("dual-rumble", {
      duration,
      startDelay: 0,
      strongMagnitude: Math.min(1, Math.max(0, strength)),
      weakMagnitude: Math.min(1, Math.max(0, strength * 0.7)),
    });
    void result?.catch(() => undefined);
  }

  private findPad(): Gamepad | null {
    if (typeof navigator.getGamepads !== "function") return null;

    let pads: readonly (Gamepad | null)[];
    try {
      pads = navigator.getGamepads();
    } catch {
      return null;
    }

    if (this.padIndex !== null) {
      const connectedPad = pads[this.padIndex];
      if (connectedPad !== null && connectedPad !== undefined) {
        this.padName = connectedPad.id;
        return connectedPad;
      }
      this.padIndex = null;
    }

    for (const pad of pads) {
      if (pad !== null) {
        this.padIndex = pad.index;
        this.padName = pad.id;
        return pad;
      }
    }

    return null;
  }

  private notifyConnection(): void {
    const info: GamepadConnectionInfo = {
      connected: this.connected,
      name: this.padName,
    };
    for (const listener of this.listeners) listener(info);
  }
}

export const input = new InputHandler();
