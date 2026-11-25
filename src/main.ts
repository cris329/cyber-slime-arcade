import Phaser from "phaser";
import "./style.css";
import { audio } from "./core/AudioManager";
import { input } from "./core/InputHandler";
import { mountTouchPlay } from "./core/TouchControls";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";
import { MenuScene } from "./scenes/MenuScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: 1280,
  height: 720,
  backgroundColor: "#05030f",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 1600 },
      debug: false,
    },
  },
  render: {
    antialias: true,
    powerPreference: "high-performance",
  },
  scene: [BootScene, MenuScene, GameScene],
};

const game = new Phaser.Game(config);
(window as Window & { cyberSlime?: Phaser.Game }).cyberSlime = game;

const status = document.getElementById("pad-status");
const label = document.getElementById("pad-label");
const name = document.getElementById("pad-name");

const touchScreen = window.matchMedia("(pointer: coarse)").matches;

mountTouchPlay();

input.onConnectionChange((info) => {
  if (status !== null) status.classList.toggle("on", info.connected);
  if (label !== null) label.textContent = info.connected ? "MANDO ON" : "MANDO OFF";
  if (name !== null) {
    const idleHint = touchScreen
      ? "Toca para jugar y desliza para mover"
      : "Pulsa un boton del mando";
    const labelText = info.connected
      ? (info.name ?? "Control detectado")
      : idleHint;
    name.textContent = labelText;
    name.title = labelText;
  }
});

const fullscreenButton = document.getElementById("fullscreen");

interface WebkitDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
}

interface WebkitElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

let nativeFullscreen = false;

function browserFullscreenElement(): Element | null {
  const doc = document as WebkitDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function screenIsFull(): boolean {
  return document.body.classList.contains("is-filled");
}

function syncFullscreenButton(): void {
  if (fullscreenButton === null) return;
  const on = screenIsFull();
  fullscreenButton.textContent = on ? "SALIR" : "PANTALLA COMPLETA";
  fullscreenButton.setAttribute("aria-pressed", on ? "true" : "false");
}

function fitAfterLayout(): void {
  requestAnimationFrame(() => {
    game.scale.refresh();
  });
}

async function enterFullScreen(): Promise<void> {
  document.body.classList.add("is-filled");
  syncFullscreenButton();
  fitAfterLayout();

  const root = document.documentElement as WebkitElement;
  try {
    if (typeof root.requestFullscreen === "function") {
      await root.requestFullscreen();
    } else {
      await root.webkitRequestFullscreen?.();
    }
  } catch {
    // En iPhone la pantalla completa queda en la pagina.
  }
}

async function leaveFullScreen(): Promise<void> {
  document.body.classList.remove("is-filled");
  syncFullscreenButton();
  fitAfterLayout();

  const doc = document as WebkitDocument;
  try {
    if (document.fullscreenElement !== null) {
      await document.exitFullscreen();
    } else {
      await doc.webkitExitFullscreen?.();
    }
  } catch {
    // Ya no estaba en pantalla completa del navegador.
  }
}

function onNativeFullscreenChange(): void {
  const active = browserFullscreenElement() !== null;
  if (nativeFullscreen && !active) {
    document.body.classList.remove("is-filled");
  }
  nativeFullscreen = active;
  syncFullscreenButton();
  fitAfterLayout();
}

fullscreenButton?.addEventListener("click", () => {
  audio.ensure();
  audio.ui();
  if (screenIsFull()) {
    void leaveFullScreen();
    return;
  }
  void enterFullScreen();
});

document.addEventListener("fullscreenchange", onNativeFullscreenChange);
document.addEventListener("webkitfullscreenchange", onNativeFullscreenChange);

const unlockAudio = (): void => {
  audio.ensure();
};

window.addEventListener("pointerdown", unlockAudio, { once: true });
window.addEventListener("keydown", unlockAudio, { once: true });
const gameRoot = document.getElementById("game");
const fitGame = (): void => {
  game.scale.refresh();
};

window.addEventListener("resize", fitGame);
window.visualViewport?.addEventListener("resize", fitGame);

if (gameRoot !== null && typeof ResizeObserver !== "undefined") {
  new ResizeObserver(fitGame).observe(gameRoot);
}
