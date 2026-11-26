import Phaser from "phaser";
import { audio } from "../core/AudioManager";
import { input } from "../core/InputHandler";
import {
  GEM_STYLES,
  SKINS,
  STORAGE_KEYS,
  skinAt,
  writeStoredNumber,
} from "../core/SkinRegistry";
import {
  DEPTH,
  FONT_BODY,
  GAME_WIDTH,
  createBackdrop,
  neonText,
} from "../core/Visuals";

interface OrbitGem {
  sprite: Phaser.GameObjects.Image;
  angle: number;
  radius: number;
  speed: number;
}

export class MenuScene extends Phaser.Scene {
  private skinIndex = 0;
  private mascot!: Phaser.GameObjects.Image;
  private mascotGlow!: Phaser.GameObjects.Image;
  private mascotShadow!: Phaser.GameObjects.Ellipse;
  private skinText!: Phaser.GameObjects.Text;
  private orbitGems: OrbitGem[] = [];
  private sparkEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private launching = false;
  private elapsed = 0;

  public constructor() {
    super("Menu");
  }

  public create(): void {
    this.launching = false;
    this.elapsed = 0;
    this.orbitGems = [];
    this.skinIndex = this.registry.get("skinIndex") as number;
    const best = this.registry.get("bestScore") as number;
    const skin = skinAt(this.skinIndex);

    createBackdrop(this, { floor: true, stars: true });

    this.add
      .text(GAME_WIDTH - 54, 44, "SISTEMA // ONLINE", {
        fontFamily: FONT_BODY,
        fontSize: "12px",
        color: "#7c94a8",
      })
      .setOrigin(1, 0.5)
      .setAlpha(0.8)
      .setLetterSpacing(3);

    this.add
      .text(GAME_WIDTH - 54, 64, "PHASER 3 · TYPESCRIPT · GAMEPAD API", {
        fontFamily: FONT_BODY,
        fontSize: "10px",
        color: "#4d6475",
      })
      .setOrigin(1, 0.5)
      .setAlpha(0.8)
      .setLetterSpacing(1.2);

    this.createMascot(`slime_${skin.id}`, skin.color, skin.accent);

    this.sparkEmitter = this.add
      .particles(0, 0, "spark", {
        lifespan: { min: 320, max: 900 },
        speed: { min: 60, max: 420 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.85, end: 0 },
        alpha: { start: 0.9, end: 0 },
        rotate: { min: 0, max: 360 },
        gravityY: 320,
        tint: [0x38f2ff, 0xff3ea5, 0xffc83d, 0x63ff9b, 0xffffff],
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      })
      .setDepth(DEPTH.fx);

    this.createTitle();
    this.createStartPrompt();
    this.createFooter(best);

    this.cameras.main.fadeIn(420, 4, 3, 12);
    audio.ensure();
  }

  private createMascot(texture: string, color: number, accent: number): void {
    const cx = 300;
    const cy = 448;

    const halo = this.add
      .image(cx, cy, "glow")
      .setTint(color)
      .setScale(3.7)
      .setAlpha(0.26)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEPTH.backGlow + 2);
    this.tweens.add({
      targets: halo,
      scale: 4.2,
      alpha: 0.4,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const rings = this.add.graphics().setPosition(cx, cy).setDepth(DEPTH.backGlow + 1);
    rings.lineStyle(1, 0x38f2ff, 0.25);
    rings.strokeCircle(0, 0, 224);
    rings.lineStyle(1, 0xff3ea5, 0.18);
    rings.strokeCircle(0, 0, 188);
    rings.lineStyle(1, 0xffffff, 0.08);
    rings.strokeCircle(0, 0, 256);
    this.tweens.add({
      targets: rings,
      rotation: Math.PI * 2,
      duration: 42000,
      repeat: -1,
      ease: "Linear",
    });

    const orbitCount = 5;
    for (let i = 0; i < orbitCount; i += 1) {
      const gemStyle = GEM_STYLES[i % GEM_STYLES.length] ?? GEM_STYLES[0]!;
      const angle = (Math.PI * 2 * i) / orbitCount - Math.PI / 2;
      const radius = 196 + (i % 3) * 30;
      const sprite = this.add
        .image(cx, cy, gemStyle.key)
        .setScale(0.62 + (i % 2) * 0.14)
        .setDepth(i % 2 === 0 ? DEPTH.slime + 4 : DEPTH.slime - 1)
        .setAlpha(0.92);
      this.tweens.add({
        targets: sprite,
        scaleX: sprite.scaleX * 1.13,
        scaleY: sprite.scaleY * 1.13,
        duration: 900 + i * 130,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.orbitGems.push({
        sprite,
        angle,
        radius,
        speed: 0.24 + i * 0.035,
      });
    }

    this.mascotShadow = this.add
      .ellipse(cx, 566, 170, 24, 0x000000, 0.42)
      .setDepth(DEPTH.slime - 2);
    this.tweens.add({
      targets: this.mascotShadow,
      scaleX: 0.86,
      alpha: 0.26,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.mascotGlow = this.add
      .image(cx, cy + 4, "glow")
      .setTint(color)
      .setScale(1.8)
      .setAlpha(0.5)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEPTH.slimeGlow);
    this.tweens.add({
      targets: this.mascotGlow,
      scale: 2,
      alpha: 0.72,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.mascot = this.add
      .image(cx, cy, texture)
      .setScale(1.9)
      .setDepth(DEPTH.slime);

    const sparkle = this.add
      .image(cx + 72, cy - 86, "spark")
      .setTint(accent)
      .setScale(0.8)
      .setAlpha(0.9)
      .setDepth(DEPTH.fx)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: sparkle,
      alpha: 0.12,
      scale: 0.35,
      duration: 780,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.tweens.add({
      targets: this.mascot,
      y: cy - 18,
      scaleX: 1.98,
      scaleY: 1.75,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private createTitle(): void {
    neonText(this, 620, 88, "INSERTA ENERGIA // SISTEMA LISTO", 10, "#7c94a8", {
      font: FONT_BODY,
      weight: "600",
      letterSpacing: 3.4,
    });

    const cyber = neonText(this, 616, 104, "CYBER", 74, "#effdff", {
      weight: "900",
      glow: "#38f2ff",
      glowBlur: 26,
      letterSpacing: 5,
      stroke: "#0a2a33",
      strokeThickness: 3,
    });

    const slime = neonText(this, 612, 186, "SLIME", 96, "#63ff9b", {
      weight: "900",
      glow: "#2dff88",
      glowBlur: 30,
      letterSpacing: 3,
      stroke: "#052b18",
      strokeThickness: 3,
    });
    slime.setShadow(5, 4, "#ff3ea5", 0, false, true);

    neonText(this, 622, 298, "A R C A D E", 20, "#ff3ea5", {
      weight: "700",
      glow: "#ff3ea5",
      glowBlur: 14,
      letterSpacing: 2,
    });

    const divider = this.add.graphics();
    divider.lineStyle(1, 0x38f2ff, 0.3);
    divider.beginPath();
    divider.moveTo(622, 344);
    divider.lineTo(1208, 344);
    divider.strokePath();
    divider.fillStyle(0x38f2ff, 0.85);
    divider.fillCircle(622, 344, 2.5);
    divider.fillStyle(0xff3ea5, 0.85);
    divider.fillCircle(1208, 344, 2.5);

    this.add
      .text(
        624,
        365,
        "Un slime elastico. Gemas flotantes.\nUn reloj que no perdona.",
        {
          fontFamily: FONT_BODY,
          fontSize: "20px",
          color: "#a9c7d3",
          lineSpacing: 5,
        },
      )
      .setAlpha(0.94);

    const rows: readonly [string, string, string][] = [
      ["OBJETIVO", "RECOGE GEMAS ANTES DEL 00:00", "#63ff9b"],
      ["FIEBRE", "COMBO 10 ENCIENDE EL MULTIPLICADOR x5", "#ffc83d"],
      ["MANDO", "D-PAD · A/B/X/Y · TURBO · SELECT · START", "#38f2ff"],
    ];

    rows.forEach((row, index) => {
      const y = 438 + index * 28;
      neonText(this, 624, y, row[0], 10, row[2], {
        weight: "700",
        letterSpacing: 2.4,
        glow: row[2],
        glowBlur: 6,
      });
      this.add
        .text(730, y - 1, row[1], {
          fontFamily: FONT_BODY,
          fontSize: "13px",
          color: "#7f9aac",
        })
        .setLetterSpacing(1.2);
    });

    this.tweens.add({
      targets: [cyber, slime],
      y: "-=2",
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private createStartPrompt(): void {
    const x = 626;
    const y = 534;
    const width = 440;
    const height = 72;

    const panel = this.add.graphics();
    panel.fillStyle(0x071823, 0.7);
    panel.fillRoundedRect(x, y, width, height, 12);
    panel.lineStyle(1, 0x63ff9b, 0.5);
    panel.strokeRoundedRect(x, y, width, height, 12);
    panel.lineStyle(1, 0x38f2ff, 0.16);
    panel.strokeRoundedRect(x + 3, y + 3, width - 6, height - 6, 10);

    const primary = neonText(this, x + 22, y + 15, "START / ENTER", 22, "#effdff", {
      weight: "900",
      glow: "#63ff9b",
      glowBlur: 14,
      letterSpacing: 1.6,
    });

    const secondary = neonText(
      this,
      x + 24,
      y + 45,
      "INICIAR OLEADA",
      10,
      "#63ff9b",
      { weight: "700", letterSpacing: 3.2 },
    );

    this.add
      .text(x + width - 20, y + 45, "A TAMBIEN INICIA", {
        fontFamily: FONT_BODY,
        fontSize: "10px",
        color: "#728b9c",
      })
      .setOrigin(1, 0)
      .setLetterSpacing(1.4);

    this.tweens.add({
      targets: [primary, secondary],
      alpha: 0.35,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const zone = this.add
      .zone(x + width / 2, y + height / 2, width, height)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    zone.on("pointerover", () => {
      panel.clear();
      panel.fillStyle(0x0b2a31, 0.82);
      panel.fillRoundedRect(x, y, width, height, 12);
      panel.lineStyle(1, 0x63ff9b, 0.9);
      panel.strokeRoundedRect(x, y, width, height, 12);
    });
    zone.on("pointerout", () => {
      panel.clear();
      panel.fillStyle(0x071823, 0.7);
      panel.fillRoundedRect(x, y, width, height, 12);
      panel.lineStyle(1, 0x63ff9b, 0.5);
      panel.strokeRoundedRect(x, y, width, height, 12);
      panel.lineStyle(1, 0x38f2ff, 0.16);
      panel.strokeRoundedRect(x + 3, y + 3, width - 6, height - 6, 10);
    });
    zone.on("pointerdown", () => {
      this.launchGame();
    });

    neonText(this, 1066, 646, "SELECT  ·  CAMBIA DE SKIN", 9, "#526d7e", {
      font: FONT_BODY,
      weight: "600",
      letterSpacing: 2,
    }).setOrigin(1, 0.5);
  }

  private createFooter(best: number): void {
    const skin = skinAt(this.skinIndex);

    const footerPanel = this.add.graphics().setDepth(-2);
    footerPanel.fillStyle(0x03060f, 0.97);
    footerPanel.fillRect(28, 610, 1224, 50);
    footerPanel.lineStyle(1, 0x38f2ff, 0.16);
    footerPanel.lineBetween(28, 610, 1252, 610);

    const swatch = this.add
      .image(58, 638, "glow")
      .setTint(skin.color)
      .setScale(0.24)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEPTH.hud);

    neonText(this, 78, 620, "SKIN ACTUAL", 8, "#526d7e", {
      font: FONT_BODY,
      weight: "600",
      letterSpacing: 2.4,
    });

    this.skinText = neonText(this, 78, 634, skin.name, 14, skin.css, {
      weight: "700",
      glow: skin.css,
      glowBlur: 8,
      letterSpacing: 1.4,
    });

    this.add
      .text(GAME_WIDTH - 54, 620, "RECORD LOCAL", {
        fontFamily: FONT_BODY,
        fontSize: "9px",
        color: "#526d7e",
      })
      .setOrigin(1, 0.5)
      .setLetterSpacing(2.2);

    const bestValue = neonText(
      this,
      GAME_WIDTH - 54,
      638,
      best.toString().padStart(6, "0"),
      18,
      "#ffc83d",
      { weight: "700", glow: "#ffc83d", glowBlur: 10, letterSpacing: 1.5 },
    );
    bestValue.setOrigin(1, 0.5);

    this.add
      .text(GAME_WIDTH - 160, 638, "BEST", {
        fontFamily: FONT_BODY,
        fontSize: "9px",
        color: "#526d7e",
      })
      .setOrigin(1, 0.5)
      .setLetterSpacing(2);

    this.tweens.add({
      targets: swatch,
      scale: 0.32,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

  }

  private cycleSkin(): void {
    this.skinIndex = (this.skinIndex + 1) % SKINS.length;
    const skin = skinAt(this.skinIndex);
    this.registry.set("skinIndex", this.skinIndex);
    writeStoredNumber(STORAGE_KEYS.skin, this.skinIndex);

    this.mascot.setTexture(`slime_${skin.id}`);
    this.mascotGlow.setTint(skin.color);
    this.skinText.setText(skin.name).setColor(skin.css).setShadow(
      0,
      0,
      skin.css,
      8,
      false,
      true,
    );

    this.sparkEmitter.explode(26, 300, 440);
    audio.select();
    input.rumble(60, 0.25);
  }

  private launchGame(): void {
    if (this.launching) return;
    this.launching = true;

    audio.ensure();
    audio.start();
    input.rumble(160, 0.5);

    const skin = skinAt(this.skinIndex);
    this.sparkEmitter.explode(48, 300, 440);
    this.cameras.main.flash(140, 99, 255, 155, false);
    this.add
      .image(300, 440, "glow")
      .setTint(skin.color)
      .setScale(2)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEPTH.fx)
      .setAlpha(0.9);

    this.cameras.main.fadeOut(260, 4, 3, 12);
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        this.scene.start("Game");
      },
    );
  }

  public update(_time: number, delta: number): void {
    input.update();
    const dt = Math.min(delta / 1000, 0.05);
    this.elapsed += dt;

    for (const gem of this.orbitGems) {
      gem.angle += gem.speed * dt;
      const cx = 300 + Math.cos(gem.angle) * gem.radius;
      const cy = 448 + Math.sin(gem.angle) * gem.radius * 0.52;
      gem.sprite.setPosition(cx, cy);
      gem.sprite.setRotation(gem.angle * 0.55);
      gem.sprite.setAlpha(
        0.7 + 0.3 * Math.sin(this.elapsed * 2.6 + gem.radius),
      );
    }

    if (input.justPressed("select")) {
      this.cycleSkin();
      return;
    }

    if (input.justPressed("start") || input.justPressed("buttonA")) {
      this.launchGame();
    }
  }
}
