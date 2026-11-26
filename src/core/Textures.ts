import Phaser from "phaser";
import { GEM_STYLES, SKINS } from "./SkinRegistry";
import type { GemStyle } from "./types";

type DrawCallback = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) => void;

function canvasTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: DrawCallback,
): void {
  if (scene.textures.exists(key)) return;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context === null) return;

  draw(context, width, height);
  scene.textures.addCanvas(key, canvas);
}

function hex(color: number, alpha = 1): string {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function glowTexture(scene: Phaser.Scene): void {
  canvasTexture(scene, "glow", 128, 128, (context, width, height) => {
    const gradient = context.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      width / 2,
    );
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.28, "rgba(255,255,255,0.7)");
    gradient.addColorStop(0.65, "rgba(255,255,255,0.16)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  });
}

function sparkTexture(scene: Phaser.Scene): void {
  canvasTexture(scene, "spark", 24, 24, (context, width, height) => {
    const center = width / 2;
    const gradient = context.createRadialGradient(
      center,
      center,
      0,
      center,
      center,
      center,
    );
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.3, "rgba(255,255,255,0.9)");
    gradient.addColorStop(0.7, "rgba(255,255,255,0.18)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.strokeStyle = "rgba(255,255,255,0.66)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(center, 2);
    context.lineTo(center, height - 2);
    context.moveTo(2, center);
    context.lineTo(width - 2, center);
    context.stroke();
  });
}

function backgroundTexture(scene: Phaser.Scene): void {
  canvasTexture(scene, "bg", 1280, 720, (context, width, height) => {
    const base = context.createLinearGradient(0, 0, 0, height);
    base.addColorStop(0, "#070316");
    base.addColorStop(0.48, "#0a0824");
    base.addColorStop(0.78, "#11051e");
    base.addColorStop(1, "#06030f");
    context.fillStyle = base;
    context.fillRect(0, 0, width, height);

    const glow = (
      x: number,
      y: number,
      radius: number,
      color: number,
      alpha: number,
    ): void => {
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, hex(color, alpha));
      gradient.addColorStop(0.55, hex(color, alpha * 0.35));
      gradient.addColorStop(1, hex(color, 0));
      context.fillStyle = gradient;
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    };

    glow(196, 176, 460, 0x38f2ff, 0.16);
    glow(1080, 130, 500, 0xff3ea5, 0.13);
    glow(640, 640, 560, 0x9b7bff, 0.16);
    glow(1030, 560, 320, 0x45ff8f, 0.08);

    context.save();
    context.globalAlpha = 0.12;
    context.strokeStyle = "#38f2ff";
    context.lineWidth = 1;
    for (let i = 0; i < 7; i += 1) {
      const y = 90 + i * 86;
      context.beginPath();
      context.moveTo(0, y);
      context.bezierCurveTo(320, y - 26, 960, y + 30, width, y - 8);
      context.stroke();
    }
    context.restore();

    const haze = context.createLinearGradient(0, height * 0.5, 0, height);
    haze.addColorStop(0, "rgba(56,242,255,0)");
    haze.addColorStop(1, "rgba(56,242,255,0.055)");
    context.fillStyle = haze;
    context.fillRect(0, height * 0.5, width, height * 0.5);
  });
}

function gridTexture(scene: Phaser.Scene): void {
  canvasTexture(scene, "grid", 84, 84, (context, width, height) => {
    context.strokeStyle = "rgba(56,242,255,0.17)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0.5, 0);
    context.lineTo(0.5, height);
    context.moveTo(0, 0.5);
    context.lineTo(width, 0.5);
    context.stroke();

    context.fillStyle = "rgba(255,62,165,0.35)";
    context.fillRect(0, 0, 2, 2);
    context.fillStyle = "rgba(56,242,255,0.28)";
    context.fillRect(width - 2, height - 2, 2, 2);
  });
}

function scanlinesTexture(scene: Phaser.Scene): void {
  canvasTexture(scene, "scanlines", 4, 4, (context, width, height) => {
    context.fillStyle = "rgba(0,0,0,0.42)";
    context.fillRect(0, 0, width, 1);
    context.fillStyle = "rgba(255,255,255,0.02)";
    context.fillRect(0, 2, width, 1);
    context.clearRect(0, height - 1, width, 1);
  });
}

function vignetteTexture(scene: Phaser.Scene): void {
  canvasTexture(scene, "vignette", 1280, 720, (context, width, height) => {
    const gradient = context.createRadialGradient(
      width / 2,
      height * 0.48,
      height * 0.28,
      width / 2,
      height * 0.5,
      height * 0.82,
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(0.62, "rgba(0,0,0,0.18)");
    gradient.addColorStop(1, "rgba(0,0,0,0.72)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  });
}

function rainbowTexture(scene: Phaser.Scene): void {
  canvasTexture(scene, "rainbow", 256, 256, (context, width, height) => {
    const gradient = context.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "#ff2fd1");
    gradient.addColorStop(0.16, "#ff005e");
    gradient.addColorStop(0.33, "#ff8a00");
    gradient.addColorStop(0.5, "#ffe600");
    gradient.addColorStop(0.66, "#4dff88");
    gradient.addColorStop(0.83, "#00e5ff");
    gradient.addColorStop(0.92, "#6b5cff");
    gradient.addColorStop(1, "#ff2fd1");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    const fade = context.createLinearGradient(0, 0, 0, height);
    fade.addColorStop(0, "rgba(0,0,0,0.4)");
    fade.addColorStop(0.45, "rgba(0,0,0,0)");
    fade.addColorStop(0.55, "rgba(0,0,0,0)");
    fade.addColorStop(1, "rgba(0,0,0,0.4)");
    context.fillStyle = fade;
    context.fillRect(0, 0, width, height);
  });
}

function floorTexture(scene: Phaser.Scene): void {
  canvasTexture(scene, "floor-glow", 1280, 150, (context, width, height) => {
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(56,242,255,0.44)");
    gradient.addColorStop(0.08, "rgba(56,242,255,0.16)");
    gradient.addColorStop(0.38, "rgba(255,62,165,0.06)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.fillStyle = "rgba(205,255,255,0.92)";
    context.fillRect(0, 2, width, 2);
    context.fillStyle = "rgba(56,242,255,0.4)";
    context.fillRect(0, 4, width, 5);
  });
}

function slimeTexture(
  scene: Phaser.Scene,
  skin: (typeof SKINS)[number],
): void {
  canvasTexture(scene, `slime_${skin.id}`, 128, 128, (context) => {
    context.translate(64, 68);

    context.save();
    context.shadowColor = hex(skin.color, 0.95);
    context.shadowBlur = 22;
    context.beginPath();
    context.moveTo(-48, 6);
    context.bezierCurveTo(-53, -27, -30, -51, 0, -50);
    context.bezierCurveTo(31, -51, 53, -28, 48, 5);
    context.bezierCurveTo(46, 33, 27, 48, 0, 48);
    context.bezierCurveTo(-27, 48, -46, 34, -48, 6);
    context.closePath();
    const body = context.createRadialGradient(-19, -28, 2, 0, 4, 66);
    body.addColorStop(0, hex(skin.light, 1));
    body.addColorStop(0.32, hex(skin.color, 1));
    body.addColorStop(0.8, hex(skin.dark, 1));
    body.addColorStop(1, hex(skin.dark, 0.95));
    context.fillStyle = body;
    context.fill();
    context.restore();

    context.strokeStyle = hex(skin.light, 0.5);
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(-48, 6);
    context.bezierCurveTo(-53, -27, -30, -51, 0, -50);
    context.bezierCurveTo(31, -51, 53, -28, 48, 5);
    context.bezierCurveTo(46, 33, 27, 48, 0, 48);
    context.bezierCurveTo(-27, 48, -46, 34, -48, 6);
    context.closePath();
    context.stroke();

    context.save();
    context.translate(-18, -25);
    context.rotate(-0.55);
    const shine = context.createRadialGradient(0, 0, 0, 0, 0, 18);
    shine.addColorStop(0, "rgba(255,255,255,0.85)");
    shine.addColorStop(0.5, "rgba(255,255,255,0.32)");
    shine.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = shine;
    context.beginPath();
    context.ellipse(0, 0, 19, 10, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();

    const eye = (x: number): void => {
      context.fillStyle = "#f6ffff";
      context.beginPath();
      context.ellipse(x, -5, 10.5, 14, 0, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = hex(skin.accent, 0.16);
      context.beginPath();
      context.ellipse(x, -5, 10.5, 14, 0, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = "#07101f";
      context.beginPath();
      context.ellipse(x + 1, -3, 5.2, 8.4, 0, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = "#ffffff";
      context.beginPath();
      context.ellipse(x - 1.8, -7.5, 2.1, 3.2, 0, 0, Math.PI * 2);
      context.fill();
    };

    eye(-14);
    eye(14);

    context.strokeStyle = "rgba(6,20,16,0.72)";
    context.lineWidth = 2.4;
    context.lineCap = "round";
    context.beginPath();
    context.arc(0, 20, 8, 0.22, Math.PI - 0.22);
    context.stroke();

    context.fillStyle = hex(skin.accent, 0.5);
    context.beginPath();
    context.ellipse(-28, 19, 5, 2.3, -0.2, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.ellipse(28, 19, 5, 2.3, 0.2, 0, Math.PI * 2);
    context.fill();
  });
}

function gemTexture(scene: Phaser.Scene, gem: GemStyle): void {
  canvasTexture(scene, gem.key, 84, 104, (context) => {
    const cx = 42;
    context.save();
    context.shadowColor = hex(gem.color, 0.95);
    context.shadowBlur = 22;

    const gradient = context.createLinearGradient(18, 12, 66, 92);
    gradient.addColorStop(0, "rgba(255,255,255,0.98)");
    gradient.addColorStop(0.22, hex(gem.color, 1));
    gradient.addColorStop(0.72, hex(gem.color, 0.78));
    gradient.addColorStop(1, "rgba(10,8,28,0.9)");

    context.beginPath();
    context.moveTo(cx, 8);
    context.lineTo(74, 36);
    context.lineTo(cx, 96);
    context.lineTo(10, 36);
    context.closePath();
    context.fillStyle = gradient;
    context.fill();
    context.restore();

    context.strokeStyle = "rgba(255,255,255,0.9)";
    context.lineWidth = 1.6;
    context.beginPath();
    context.moveTo(cx, 8);
    context.lineTo(74, 36);
    context.lineTo(cx, 96);
    context.lineTo(10, 36);
    context.closePath();
    context.stroke();

    context.strokeStyle = "rgba(255,255,255,0.4)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(10, 36);
    context.lineTo(74, 36);
    context.moveTo(cx, 8);
    context.lineTo(27, 36);
    context.lineTo(cx, 96);
    context.moveTo(cx, 8);
    context.lineTo(57, 36);
    context.lineTo(cx, 96);
    context.stroke();

    context.fillStyle = "rgba(255,255,255,0.62)";
    context.beginPath();
    context.moveTo(27, 35);
    context.lineTo(39, 16);
    context.lineTo(41, 35);
    context.closePath();
    context.fill();
  });
}

function hazardTexture(scene: Phaser.Scene): void {
  canvasTexture(scene, "hazard", 104, 104, (context) => {
    const cx = 52;
    const cy = 52;
    const points = 12;

    context.save();
    context.shadowColor = "rgba(255,30,92,0.95)";
    context.shadowBlur = 20;

    context.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const angle = (Math.PI * i) / points - Math.PI / 2;
      const radius = i % 2 === 0 ? 45 : 27;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    const gradient = context.createRadialGradient(cx - 8, cy - 10, 4, cx, cy, 48);
    gradient.addColorStop(0, "#ff8ab2");
    gradient.addColorStop(0.38, "#ff1f61");
    gradient.addColorStop(0.78, "#6d0735");
    gradient.addColorStop(1, "#1d0418");
    context.fillStyle = gradient;
    context.fill();
    context.restore();

    context.strokeStyle = "rgba(255,180,210,0.65)";
    context.lineWidth = 1.4;
    context.beginPath();
    context.arc(cx, cy, 26, 0, Math.PI * 2);
    context.stroke();

    context.fillStyle = "#ffd9e7";
    context.beginPath();
    context.arc(cx, cy, 6, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#ff2b69";
    context.beginPath();
    context.arc(cx, cy, 3, 0, Math.PI * 2);
    context.fill();
  });
}

function shieldTexture(scene: Phaser.Scene): void {
  canvasTexture(scene, "shield", 200, 200, (context) => {
    const cx = 100;
    const cy = 100;

    context.save();
    context.shadowColor = "rgba(90,245,255,0.9)";
    context.shadowBlur = 18;

    context.strokeStyle = "rgba(190,255,255,0.95)";
    context.lineWidth = 2.4;
    context.beginPath();
    context.arc(cx, cy, 86, 0, Math.PI * 2);
    context.stroke();

    context.strokeStyle = "rgba(56,242,255,0.42)";
    context.lineWidth = 1.4;
    context.setLineDash([12, 9]);
    context.beginPath();
    context.arc(cx, cy, 74, 0, Math.PI * 2);
    context.stroke();
    context.restore();

    context.setLineDash([]);
    const fill = context.createRadialGradient(cx, cy, 58, cx, cy, 92);
    fill.addColorStop(0, "rgba(56,242,255,0)");
    fill.addColorStop(0.78, "rgba(56,242,255,0.06)");
    fill.addColorStop(1, "rgba(56,242,255,0.22)");
    context.fillStyle = fill;
    context.beginPath();
    context.arc(cx, cy, 92, 0, Math.PI * 2);
    context.fill();
  });
}

export function buildTextures(scene: Phaser.Scene): void {
  glowTexture(scene);
  sparkTexture(scene);
  backgroundTexture(scene);
  gridTexture(scene);
  scanlinesTexture(scene);
  vignetteTexture(scene);
  rainbowTexture(scene);
  floorTexture(scene);
  hazardTexture(scene);
  shieldTexture(scene);

  for (const skin of SKINS) slimeTexture(scene, skin);
  for (const gem of GEM_STYLES) gemTexture(scene, gem);
}
