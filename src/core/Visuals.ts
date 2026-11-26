import Phaser from "phaser";

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const FLOOR_Y = 652;

export const FONT_DISPLAY = '"Orbitron", "Segoe UI", sans-serif';
export const FONT_BODY = '"Rajdhani", "Segoe UI", sans-serif';

export const DEPTH = {
  background: -40,
  backGlow: -30,
  grid: -24,
  floor: -16,
  stars: -12,
  gems: 10,
  hazard: 16,
  slimeGlow: 19,
  slime: 20,
  shield: 22,
  trail: 18,
  fx: 40,
  rainbow: 80,
  flash: 90,
  hud: 100,
  feverBanner: 110,
  overlay: 200,
  vignette: 450,
  scanlines: 460,
} as const;

export interface NeoTexOptions {
  font?: string;
  weight?: string;
  align?: "left" | "center" | "right";
  letterSpacing?: number;
  glow?: string;
  glowBlur?: number;
  stroke?: string;
  strokeThickness?: number;
  alpha?: number;
}

export function neonText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size: number,
  color: string,
  options: NeoTexOptions = {},
): Phaser.GameObjects.Text {
  const object = scene.add.text(x, y, text, {
    fontFamily: options.font ?? FONT_DISPLAY,
    fontSize: `${size}px`,
    color,
    fontStyle: options.weight ?? "700",
    align: options.align ?? "left",
    stroke: options.stroke ?? "#000000",
    strokeThickness: options.strokeThickness ?? 0,
  });
  object.setAlpha(options.alpha ?? 1);

  if (options.letterSpacing !== undefined) {
    object.setLetterSpacing(options.letterSpacing);
  }

  if (options.glow !== undefined) {
    object.setShadow(
      0,
      0,
      options.glow,
      options.glowBlur ?? Math.max(8, Math.round(size * 0.45)),
      false,
      true,
    );
  }

  return object;
}

export function createBackdrop(
  scene: Phaser.Scene,
  options: { floor?: boolean; stars?: boolean } = {},
): void {
  const floor = options.floor ?? true;
  const stars = options.stars ?? true;

  scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "bg").setDepth(DEPTH.background);

  const orb = (
    x: number,
    y: number,
    tint: number,
    scale: number,
    alpha: number,
    duration: number,
    delay: number,
  ): void => {
    const image = scene.add
      .image(x, y, "glow")
      .setTint(tint)
      .setScale(scale)
      .setAlpha(alpha)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEPTH.backGlow);
    scene.tweens.add({
      targets: image,
      scale: scale * 1.16,
      alpha: alpha * 1.5,
      duration,
      delay,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  };

  orb(170, 140, 0x38f2ff, 3.4, 0.16, 5200, 0);
  orb(1100, 180, 0xff3ea5, 3.8, 0.14, 6100, 700);
  orb(650, 570, 0x9b7bff, 4.6, 0.1, 7000, 1200);
  orb(1010, 560, 0x45ff8f, 2.4, 0.08, 4800, 400);

  const grid = scene.add
    .tileSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, "grid")
    .setAlpha(0.34)
    .setDepth(DEPTH.grid);
  scene.tweens.add({
    targets: grid,
    tilePositionY: 84,
    duration: 7000,
    repeat: -1,
    ease: "Linear",
  });

  if (floor) {
    const floorGrid = scene.add.graphics().setDepth(DEPTH.floor);
    floorGrid.lineStyle(1, 0x38f2ff, 0.16);

    for (let i = 0; i < 7; i += 1) {
      const y = FLOOR_Y + i * i * 2.2;
      floorGrid.beginPath();
      floorGrid.moveTo(0, y);
      floorGrid.lineTo(GAME_WIDTH, y);
      floorGrid.strokePath();
    }

    for (let i = -9; i <= 9; i += 1) {
      floorGrid.beginPath();
      floorGrid.moveTo(GAME_WIDTH / 2 + i * 14, FLOOR_Y);
      floorGrid.lineTo(GAME_WIDTH / 2 + i * 138, GAME_HEIGHT);
      floorGrid.strokePath();
    }

    scene.add
      .image(GAME_WIDTH / 2, FLOOR_Y, "floor-glow")
      .setOrigin(0.5, 0)
      .setDepth(DEPTH.floor + 1);
  }

  if (stars) {
    scene.add
      .particles(0, 0, "spark", {
        x: { min: 0, max: GAME_WIDTH },
        y: { min: GAME_HEIGHT * 0.55, max: GAME_HEIGHT + 30 },
        lifespan: { min: 5000, max: 11000 },
        speedY: { min: -30, max: -8 },
        speedX: { min: -9, max: 9 },
        scale: { start: 0.42, end: 0.02 },
        alpha: { start: 0.62, end: 0 },
        quantity: 1,
        frequency: 150,
        tint: [0x38f2ff, 0xff3ea5, 0x9b7bff, 0xffc83d],
        blendMode: Phaser.BlendModes.ADD,
      })
      .setDepth(DEPTH.stars);
  }

  scene.add
    .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "vignette")
    .setDepth(DEPTH.vignette)
    .setAlpha(0.72);

  scene.add
    .tileSprite(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      "scanlines",
    )
    .setDepth(DEPTH.scanlines)
    .setAlpha(0.34);
}

export function drawPanel(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  accent: number,
): void {
  graphics.clear();
  graphics.fillStyle(0x060b18, 0.72);
  graphics.fillRoundedRect(x, y, width, height, 12);
  graphics.lineStyle(1, accent, 0.32);
  graphics.strokeRoundedRect(x, y, width, height, 12);
  graphics.lineStyle(1, 0xffffff, 0.05);
  graphics.strokeRoundedRect(x + 2, y + 2, width - 4, height - 4, 10);
}

export function shadeColor(color: number, amount: number): number {
  const r = Phaser.Math.Clamp(((color >> 16) & 0xff) + amount, 0, 255);
  const g = Phaser.Math.Clamp(((color >> 8) & 0xff) + amount, 0, 255);
  const b = Phaser.Math.Clamp((color & 0xff) + amount, 0, 255);
  return (r << 16) | (g << 8) | b;
}
