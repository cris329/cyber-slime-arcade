import Phaser from "phaser";
import {
  ABILITY_CONFIG,
  type AbilityCooldowns,
  type AbilityKey,
} from "../core/abilities";
import { skinAt } from "../core/SkinRegistry";
import type { SlimeSkin } from "../core/types";
import { formatScore, padTwo } from "../core/utils";
import {
  DEPTH,
  FONT_BODY,
  FONT_DISPLAY,
  GAME_HEIGHT,
  GAME_WIDTH,
  drawPanel,
  neonText,
} from "../core/Visuals";

export interface HudSnapshot {
  score: number;
  best: number;
  wave: number;
  timeLeft: number;
  timeMax: number;
  waveCollected: number;
  waveTarget: number;
  combo: number;
  comboLeft: number;
  fever: boolean;
  cooldowns: AbilityCooldowns;
  padConnected: boolean;
  elapsed: number;
}

export interface GameOverSnapshot {
  score: number;
  best: number;
  wave: number;
  comboBest: number;
  isRecord: boolean;
}

interface AbilityUi {
  key: AbilityKey;
  bar: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  x: number;
  y: number;
}

export class GameHud {
  private readonly scene: Phaser.Scene;
  private readonly hud: Phaser.GameObjects.Container;

  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly bestText: Phaser.GameObjects.Text;
  private readonly waveText: Phaser.GameObjects.Text;
  private readonly timerText: Phaser.GameObjects.Text;
  private readonly gemText: Phaser.GameObjects.Text;
  private readonly comboText: Phaser.GameObjects.Text;
  private readonly multiplierText: Phaser.GameObjects.Text;
  private readonly padText: Phaser.GameObjects.Text;
  private readonly skinText: Phaser.GameObjects.Text;
  private readonly skinSwatch: Phaser.GameObjects.Image;
  private readonly timerBarFill: Phaser.GameObjects.Graphics;
  private readonly comboBarFill: Phaser.GameObjects.Graphics;
  private readonly feverTitle: Phaser.GameObjects.Text;
  private readonly feverSubtitle: Phaser.GameObjects.Text;
  private readonly abilityUi: AbilityUi[] = [];

  private readonly pauseOverlay: Phaser.GameObjects.Container;
  private readonly pauseScoreText: Phaser.GameObjects.Text;
  private readonly gameOverOverlay: Phaser.GameObjects.Container;
  private readonly gameOverScoreText: Phaser.GameObjects.Text;
  private readonly gameOverInfoText: Phaser.GameObjects.Text;
  private readonly gameOverRecordText: Phaser.GameObjects.Text;

  private lastPadStatus = "";

  public constructor(scene: Phaser.Scene, best: number, skinIndex: number) {
    this.scene = scene;
    this.hud = scene.add.container(0, 0).setDepth(DEPTH.hud);

    const leftPanel = scene.add.graphics();
    drawPanel(leftPanel, 28, 24, 330, 132, 0x38f2ff);
    const centerPanel = scene.add.graphics();
    drawPanel(centerPanel, 436, 20, 408, 136, 0x63ff9b);
    const rightPanel = scene.add.graphics();
    drawPanel(rightPanel, 922, 24, 330, 132, 0xff3ea5);

    const bars = scene.add.graphics();
    bars.fillStyle(0xffffff, 0.07);
    bars.fillRoundedRect(486, 94, 308, 10, 5);
    bars.fillStyle(0xffffff, 0.06);
    bars.fillRoundedRect(934, 96, 300, 8, 4);

    const footer = scene.add.graphics().setDepth(DEPTH.floor + 1);
    footer.fillStyle(0x03060f, 0.97);
    footer.fillRect(28, 640, 1224, 72);
    footer.lineStyle(1, 0x38f2ff, 0.14);
    footer.lineBetween(28, 640, 1252, 640);

    this.scoreText = neonText(scene, 46, 50, "000000", 38, "#effdff", {
      weight: "900",
      glow: "#38f2ff",
      glowBlur: 14,
      letterSpacing: 1.2,
    });
    this.bestText = neonText(
      scene,
      110,
      104,
      formatScore(best),
      13,
      "#ffc83d",
      { weight: "700", glow: "#ffc83d", glowBlur: 7, letterSpacing: 1.4 },
    );

    this.waveText = neonText(
      scene,
      GAME_WIDTH / 2,
      32,
      "OLEADA 01",
      11,
      "#63ff9b",
      {
        weight: "700",
        align: "center",
        letterSpacing: 3.2,
        glow: "#63ff9b",
        glowBlur: 6,
      },
    ).setOrigin(0.5, 0);

    this.timerText = neonText(
      scene,
      GAME_WIDTH / 2,
      50,
      "35.0",
      34,
      "#effdff",
      {
        weight: "900",
        align: "center",
        glow: "#38f2ff",
        glowBlur: 14,
        letterSpacing: 1.6,
      },
    ).setOrigin(0.5, 0);

    this.gemText = scene.add
      .text(GAME_WIDTH / 2, 113, "GEMAS 0 / 10", {
        fontFamily: FONT_BODY,
        fontSize: "11px",
        color: "#8fb3c4",
      })
      .setOrigin(0.5, 0)
      .setLetterSpacing(2.2);

    this.comboText = neonText(scene, 934, 49, "00", 36, "#ff7cc2", {
      weight: "900",
      glow: "#ff3ea5",
      glowBlur: 14,
      letterSpacing: 1,
    });

    this.multiplierText = neonText(scene, 1234, 43, "x1", 27, "#ffc83d", {
      weight: "900",
      glow: "#ffc83d",
      glowBlur: 12,
      align: "right",
    }).setOrigin(1, 0);

    this.padText = scene.add
      .text(1234, 118, "TECLADO", {
        fontFamily: FONT_BODY,
        fontSize: "9px",
        color: "#7c94a8",
      })
      .setOrigin(1, 0)
      .setLetterSpacing(2.2);

    this.timerBarFill = scene.add.graphics();
    this.comboBarFill = scene.add.graphics();

    const skin = skinAt(skinIndex);
    this.skinSwatch = scene.add
      .image(46, 678, "glow")
      .setTint(skin.color)
      .setScale(0.19)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.skinText = neonText(scene, 68, 670, skin.name, 11, skin.css, {
      weight: "700",
      glow: skin.css,
      glowBlur: 6,
      letterSpacing: 1.4,
    });

    this.feverTitle = neonText(
      scene,
      GAME_WIDTH / 2,
      174,
      "MODO FIEBRE",
      30,
      "#ffe066",
      {
        weight: "900",
        align: "center",
        glow: "#ff3ea5",
        glowBlur: 22,
        letterSpacing: 4,
        stroke: "#3a061d",
        strokeThickness: 3,
      },
    )
      .setOrigin(0.5)
      .setAlpha(0);

    this.feverSubtitle = neonText(
      scene,
      GAME_WIDTH / 2,
      208,
      "MULTIPLICADOR x5 · CORRE",
      11,
      "#ff9ecb",
      {
        weight: "700",
        align: "center",
        glow: "#ff3ea5",
        glowBlur: 8,
        letterSpacing: 3,
      },
    )
      .setOrigin(0.5)
      .setAlpha(0);

    this.hud.add([
      leftPanel,
      centerPanel,
      rightPanel,
      bars,
      this.scoreText,
      this.bestText,
      this.waveText,
      this.timerText,
      this.gemText,
      this.comboText,
      this.multiplierText,
      this.padText,
      this.timerBarFill,
      this.comboBarFill,
      neonText(scene, 46, 35, "PUNTOS", 9, "#7c9aab", {
        weight: "600",
        letterSpacing: 3.2,
      }),
      neonText(scene, 46, 92, "MEJOR", 8, "#5f7b8c", {
        weight: "600",
        letterSpacing: 2.4,
      }),
      neonText(scene, 934, 35, "COMBO", 9, "#a77c92", {
        weight: "600",
        letterSpacing: 3,
      }),
      neonText(scene, 1234, 74, "MULTIPLICADOR", 7, "#5f7b8c", {
        weight: "600",
        align: "right",
        letterSpacing: 1.8,
      }).setOrigin(1, 0),
      scene.add
        .text(934, 76, "RACHA", {
          fontFamily: FONT_BODY,
          fontSize: "8px",
          color: "#5f7b8c",
        })
        .setLetterSpacing(2),
      this.skinSwatch,
      this.skinText,
      scene.add
        .text(68, 686, window.matchMedia("(pointer: coarse)").matches
          ? "DESLIZA PARA MOVER EL SLIME"
          : "SELECT CAMBIA · MANTEN REINICIA", {
          fontFamily: FONT_BODY,
          fontSize: "8px",
          color: "#526d7e",
        })
        .setLetterSpacing(1.2),
      scene.add
        .text(GAME_WIDTH / 2, 699, window.matchMedia("(pointer: coarse)").matches ? "" : "START PAUSA", {
          fontFamily: FONT_BODY,
          fontSize: "8px",
          color: "#526d7e",
        })
        .setOrigin(0.5)
        .setLetterSpacing(2.4),
      scene.add
        .text(
          GAME_WIDTH / 2,
          624,
          "A SALTO · B ESCUDO · X DASH · Y IMAN · TURBO VELOCIDAD",
          {
            fontFamily: FONT_BODY,
            fontSize: "8px",
            color: "#476072",
          },
        )
        .setOrigin(0.5)
        .setLetterSpacing(1.6),
      this.feverTitle,
      this.feverSubtitle,
    ]);

    const abilityKeys: readonly AbilityKey[] = ["shield", "dash", "magnet"];
    abilityKeys.forEach((key, index) => {
      const config = ABILITY_CONFIG[key];
      const x = 930 + index * 108;
      const y = 658;
      const bar = scene.add.graphics();
      const label = scene.add
        .text(x, y, `${config.label} ${config.name}`, {
          fontFamily: FONT_DISPLAY,
          fontSize: "8px",
          color: config.css,
        })
        .setLetterSpacing(1.2);
      const icon = scene.add
        .text(x + 92, y, "LISTO", {
          fontFamily: FONT_BODY,
          fontSize: "7px",
          color: "#526d7e",
        })
        .setOrigin(1, 0)
        .setLetterSpacing(1);
      this.hud.add([bar, label, icon]);
      this.abilityUi.push({ key, bar, label, x, y });
    });

    this.hud.setAlpha(0);
    scene.tweens.add({
      targets: this.hud,
      alpha: 1,
      duration: 420,
      ease: "Quad.easeOut",
    });

    const pauseElements = this.createPauseOverlay();
    this.pauseOverlay = pauseElements.overlay;
    this.pauseScoreText = pauseElements.scoreText;

    const gameOverElements = this.createGameOverOverlay();
    this.gameOverOverlay = gameOverElements.overlay;
    this.gameOverScoreText = gameOverElements.scoreText;
    this.gameOverInfoText = gameOverElements.infoText;
    this.gameOverRecordText = gameOverElements.recordText;
  }

  public update(snapshot: HudSnapshot): void {
    this.scoreText.setText(formatScore(snapshot.score));
    this.bestText.setText(formatScore(snapshot.best));
    this.waveText.setText(`OLEADA ${padTwo(snapshot.wave)}`);

    const seconds = Math.max(0, snapshot.timeLeft).toFixed(1);
    this.timerText.setText(seconds);
    this.timerText.setColor(
      snapshot.timeLeft <= 8
        ? "#ff6aa8"
        : snapshot.fever
          ? "#ffe066"
          : "#effdff",
    );
    this.timerText.setScale(
      snapshot.timeLeft <= 8
        ? 1 + Math.sin(snapshot.elapsed * 9) * 0.03
        : 1,
    );

    this.gemText.setText(
      `GEMAS ${snapshot.waveCollected} / ${snapshot.waveTarget}`,
    );
    this.comboText.setText(padTwo(snapshot.combo));
    this.comboText.setColor(snapshot.fever ? "#ffe066" : "#ff7cc2");
    this.multiplierText.setText(`x${snapshot.fever ? 5 : 1}`);
    this.multiplierText.setColor(snapshot.fever ? "#ffe066" : "#ffc83d");
    this.scoreText.setColor(snapshot.fever ? "#ffe066" : "#effdff");

    const timerRatio = Phaser.Math.Clamp(
      snapshot.timeLeft / snapshot.timeMax,
      0,
      1,
    );
    const timerColor =
      timerRatio > 0.5
        ? 0x38f2ff
        : timerRatio > 0.24
          ? 0xffc83d
          : 0xff3ea5;

    this.timerBarFill.clear();
    this.timerBarFill.fillStyle(timerColor, 0.92);
    if (timerRatio > 0) {
      this.timerBarFill.fillRoundedRect(
        486,
        94,
        Math.max(2, 308 * timerRatio),
        10,
        5,
      );
    }

    const comboRatio = Phaser.Math.Clamp(snapshot.comboLeft / 3.8, 0, 1);
    this.comboBarFill.clear();
    this.comboBarFill.fillStyle(snapshot.fever ? 0xffe066 : 0xff3ea5, 0.9);
    if (snapshot.combo > 0) {
      this.comboBarFill.fillRoundedRect(
        934,
        96,
        Math.max(2, 300 * comboRatio),
        8,
        4,
      );
    }

    const padStatus = snapshot.padConnected ? "MANDO ON" : "TECLADO";
    if (padStatus !== this.lastPadStatus) {
      this.lastPadStatus = padStatus;
      this.padText.setText(padStatus);
      this.padText.setColor(snapshot.padConnected ? "#63ff9b" : "#7c94a8");
    }

    for (const ability of this.abilityUi) {
      const config = ABILITY_CONFIG[ability.key];
      const remaining = snapshot.cooldowns[ability.key];
      const ratio = Phaser.Math.Clamp(
        1 - remaining / config.cooldown,
        0,
        1,
      );

      ability.bar.clear();
      ability.bar.fillStyle(0xffffff, 0.07);
      ability.bar.fillRoundedRect(ability.x, ability.y + 18, 92, 4, 2);
      ability.bar.fillStyle(
        ratio >= 1 ? config.color : 0x627b8a,
        ratio >= 1 ? 0.95 : 0.6,
      );
      if (ratio > 0) {
        ability.bar.fillRoundedRect(
          ability.x,
          ability.y + 18,
          Math.max(2, 92 * ratio),
          4,
          2,
        );
      }
      ability.label.setAlpha(ratio >= 1 ? 1 : 0.42);
    }

    const feverTarget = snapshot.fever ? 1 : 0;
    this.feverTitle.setAlpha(
      Phaser.Math.Linear(this.feverTitle.alpha, feverTarget, 0.09),
    );
    this.feverSubtitle.setAlpha(
      Phaser.Math.Linear(this.feverSubtitle.alpha, feverTarget, 0.09),
    );
    if (snapshot.fever) {
      this.feverTitle.setScale(
        1 + Math.sin(snapshot.elapsed * 8) * 0.035,
      );
      this.feverSubtitle.setScale(
        1 + Math.sin(snapshot.elapsed * 6) * 0.02,
      );
    }
  }

  public setSkin(skin: SlimeSkin): void {
    this.skinSwatch.setTint(skin.color);
    this.skinText
      .setText(skin.name)
      .setColor(skin.css)
      .setShadow(0, 0, skin.css, 6, false, true);
  }

  public hideFever(): void {
    this.feverTitle.setAlpha(0);
    this.feverSubtitle.setAlpha(0);
  }

  public setPaused(visible: boolean, score: number): void {
    if (visible) {
      this.pauseScoreText.setText(`PUNTOS ${formatScore(score)}`);
      this.pauseOverlay.setVisible(true);
    } else {
      this.pauseOverlay.setVisible(false);
    }
  }

  public showGameOver(info: GameOverSnapshot): void {
    this.gameOverScoreText.setText(formatScore(info.score));
    this.gameOverInfoText.setText(
      `OLEADA ${padTwo(info.wave)}  ·  MEJOR COMBO ${padTwo(info.comboBest)}`,
    );
    this.gameOverRecordText.setText(
      info.isRecord ? "NUEVO RECORD" : `RECORD ${formatScore(info.best)}`,
    );
    this.gameOverRecordText.setColor(
      info.isRecord ? "#ffc83d" : "#7c94a8",
    );

    this.gameOverOverlay.setVisible(true).setAlpha(0);
    this.scene.tweens.add({
      targets: this.gameOverOverlay,
      alpha: 1,
      duration: 260,
      ease: "Quad.easeOut",
    });
  }

  private createPauseOverlay(): {
    overlay: Phaser.GameObjects.Container;
    scoreText: Phaser.GameObjects.Text;
  } {
    const dim = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x02030a,
      0.62,
    );
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x070d1b, 0.92);
    panel.fillRoundedRect(390, 220, 500, 280, 16);
    panel.lineStyle(1, 0x38f2ff, 0.55);
    panel.strokeRoundedRect(390, 220, 500, 280, 16);

    const title = neonText(
      this.scene,
      GAME_WIDTH / 2,
      260,
      "PAUSA",
      48,
      "#effdff",
      {
        weight: "900",
        align: "center",
        glow: "#38f2ff",
        glowBlur: 24,
        letterSpacing: 8,
      },
    ).setOrigin(0.5, 0);

    const hint = neonText(
      this.scene,
      GAME_WIDTH / 2,
      340,
      "START / ENTER PARA CONTINUAR",
      12,
      "#63ff9b",
      {
        weight: "700",
        align: "center",
        glow: "#63ff9b",
        glowBlur: 8,
        letterSpacing: 2.2,
      },
    ).setOrigin(0.5, 0);

    const scoreText = this.scene.add
      .text(GAME_WIDTH / 2, 392, "PUNTOS 000000", {
        fontFamily: FONT_BODY,
        fontSize: "14px",
        color: "#8fb3c4",
      })
      .setOrigin(0.5, 0)
      .setLetterSpacing(2.2);

    const extra = this.scene.add
      .text(
        GAME_WIDTH / 2,
        430,
        "SELECT: SKIN  ·  MANTEN SELECT: REINICIAR OLEADA",
        {
          fontFamily: FONT_BODY,
          fontSize: "10px",
          color: "#526d7e",
        },
      )
      .setOrigin(0.5, 0)
      .setLetterSpacing(1.6);

    const overlay = this.scene.add
      .container(0, 0, [dim, panel, title, hint, scoreText, extra])
      .setDepth(DEPTH.overlay)
      .setVisible(false);

    return { overlay, scoreText };
  }

  private createGameOverOverlay(): {
    overlay: Phaser.GameObjects.Container;
    scoreText: Phaser.GameObjects.Text;
    infoText: Phaser.GameObjects.Text;
    recordText: Phaser.GameObjects.Text;
  } {
    const dim = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x03020a,
      0.8,
    );
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x090715, 0.95);
    panel.fillRoundedRect(352, 170, 576, 366, 18);
    panel.lineStyle(1, 0xff3ea5, 0.6);
    panel.strokeRoundedRect(352, 170, 576, 366, 18);
    panel.lineStyle(1, 0x38f2ff, 0.18);
    panel.strokeRoundedRect(356, 174, 568, 358, 15);

    const title = neonText(
      this.scene,
      GAME_WIDTH / 2,
      206,
      "TIEMPO AGOTADO",
      38,
      "#ff6aa8",
      {
        weight: "900",
        align: "center",
        glow: "#ff3ea5",
        glowBlur: 22,
        letterSpacing: 3.4,
      },
    ).setOrigin(0.5, 0);

    const label = this.scene.add
      .text(GAME_WIDTH / 2, 278, "PUNTUACION FINAL", {
        fontFamily: FONT_BODY,
        fontSize: "10px",
        color: "#7c94a8",
      })
      .setOrigin(0.5, 0)
      .setLetterSpacing(3);

    const scoreText = neonText(
      this.scene,
      GAME_WIDTH / 2,
      296,
      "000000",
      56,
      "#effdff",
      {
        weight: "900",
        align: "center",
        glow: "#38f2ff",
        glowBlur: 24,
        letterSpacing: 3,
      },
    ).setOrigin(0.5, 0);

    const infoText = this.scene.add
      .text(GAME_WIDTH / 2, 376, "OLEADA 01 · MEJOR COMBO 00", {
        fontFamily: FONT_BODY,
        fontSize: "14px",
        color: "#9bb8c8",
      })
      .setOrigin(0.5, 0)
      .setLetterSpacing(2);

    const recordText = neonText(
      this.scene,
      GAME_WIDTH / 2,
      408,
      "RECORD 000000",
      15,
      "#ffc83d",
      {
        weight: "700",
        align: "center",
        glow: "#ffc83d",
        glowBlur: 10,
        letterSpacing: 2.4,
      },
    ).setOrigin(0.5, 0);

    const hint = this.scene.add
      .text(
        GAME_WIDTH / 2,
        460,
        window.matchMedia("(pointer: coarse)").matches
          ? "TOCA PARA JUGAR OTRA VEZ"
          : "START: REINICIAR     ·     SELECT: MENU",
        {
          fontFamily: FONT_BODY,
          fontSize: "11px",
          color: "#63ff9b",
        },
      )
      .setOrigin(0.5, 0)
      .setLetterSpacing(2.6);

    const overlay = this.scene.add
      .container(0, 0, [
        dim,
        panel,
        title,
        label,
        scoreText,
        infoText,
        recordText,
        hint,
      ])
      .setDepth(DEPTH.overlay)
      .setVisible(false);

    return { overlay, scoreText, infoText, recordText };
  }
}
