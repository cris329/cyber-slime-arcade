import Phaser from "phaser";
import { buildTextures } from "../core/Textures";
import { SKINS, STORAGE_KEYS, readStoredNumber } from "../core/SkinRegistry";
import { FONT_BODY, FONT_DISPLAY, GAME_HEIGHT, GAME_WIDTH, neonText } from "../core/Visuals";

export class BootScene extends Phaser.Scene {
  public constructor() {
    super("Boot");
  }

  public create(): void {
    this.cameras.main.setBackgroundColor("#05030f");

    const title = neonText(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 12,
      "CYBER SLIME",
      44,
      "#e8fbff",
      { align: "center", glow: "#38f2ff", glowBlur: 24, letterSpacing: 5 },
    ).setOrigin(0.5);

    const subtitle = neonText(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 42,
      "INICIALIZANDO NUCLEO...",
      11,
      "#7c94a8",
      { font: FONT_BODY, weight: "600", align: "center", letterSpacing: 4 },
    ).setOrigin(0.5);

    this.tweens.add({
      targets: [title, subtitle],
      alpha: 0.35,
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const storedSkin = readStoredNumber(STORAGE_KEYS.skin, 0);
    const safeSkin =
      storedSkin >= 0 && storedSkin < SKINS.length ? storedSkin : 0;
    this.registry.set("skinIndex", safeSkin);
    this.registry.set(
      "bestScore",
      readStoredNumber(STORAGE_KEYS.best, 0),
    );

    buildTextures(this);
    void this.whenFontsReady().then(() => {
      this.scene.start("Menu");
    });
  }

  private async whenFontsReady(): Promise<void> {
    if (typeof document.fonts === "undefined") return;

    const timeout = new Promise<void>((resolve) => {
      window.setTimeout(resolve, 1600);
    });

    try {
      await Promise.race([
        Promise.all([
          document.fonts.load(`900 48px ${FONT_DISPLAY}`),
          document.fonts.load(`700 20px ${FONT_BODY}`),
          document.fonts.ready,
        ]),
        timeout,
      ]);
    } catch {
      // Remote fonts are optional; system fallbacks keep the game playable.
    }
  }
}
