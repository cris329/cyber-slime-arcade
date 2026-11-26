import Phaser from "phaser";
import "./style.css";
import { audio } from "./core/AudioManager";
import { input } from "./core/InputHandler";
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

input.onConnectionChange((info) => {
  if (status !== null) status.classList.toggle("on", info.connected);
  if (label !== null) label.textContent = info.connected ? "MANDO ON" : "MANDO OFF";
  if (name !== null) {
    const labelText = info.connected
      ? (info.name ?? "Control detectado")
      : "Pulsa un boton del mando";
    name.textContent = labelText;
    name.title = labelText;
  }
});

const shell = document.getElementById("game-shell");
const fullscreenButton = document.getElementById("fullscreen");

fullscreenButton?.addEventListener("click", () => {
  audio.ensure();
  audio.ui();

  if (document.fullscreenElement !== null) {
    void document.exitFullscreen();
    return;
  }

  if (shell !== null) {
    void shell.requestFullscreen().catch(() => undefined);
  }
});

document.addEventListener("fullscreenchange", () => {
  game.scale.refresh();
  if (fullscreenButton !== null) {
    fullscreenButton.textContent =
      document.fullscreenElement === null
        ? "PANTALLA COMPLETA"
        : "SALIR DE PANTALLA";
  }
});

const unlockAudio = (): void => {
  audio.ensure();
};

window.addEventListener("pointerdown", unlockAudio, { once: true });
window.addEventListener("keydown", unlockAudio, { once: true });
window.addEventListener("resize", () => {
  game.scale.refresh();
});
