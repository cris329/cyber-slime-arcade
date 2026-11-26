import Phaser from "phaser";
import {
  DEPTH,
  FONT_DISPLAY,
  GAME_HEIGHT,
  GAME_WIDTH,
} from "./Visuals";

export class Fx {
  private readonly scene: Phaser.Scene;
  private readonly sparks: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly flashRect: Phaser.GameObjects.Rectangle;
  private readonly rainbow: Phaser.GameObjects.TileSprite;

  public constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.sparks = scene.add
      .particles(0, 0, "spark", {
        lifespan: { min: 280, max: 820 },
        speed: { min: 70, max: 430 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.9, end: 0 },
        alpha: { start: 1, end: 0 },
        rotate: { min: 0, max: 360 },
        gravityY: 360,
        tint: [0x38f2ff, 0xff3ea5, 0xffc83d, 0x63ff9b, 0xffffff],
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      })
      .setDepth(DEPTH.fx);

    this.flashRect = scene.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0xffffff,
        0,
      )
      .setDepth(DEPTH.flash)
      .setScrollFactor(0);

    this.rainbow = scene.add
      .tileSprite(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        "rainbow",
      )
      .setDepth(DEPTH.rainbow)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  public burst(
    x: number,
    y: number,
    color: number,
    count: number,
    tintWithWhite = true,
  ): void {
    this.sparks.setParticleTint(
      tintWithWhite ? [color, 0xffffff] : [color],
    );
    this.sparks.explode(count, x, y);
  }

  public ring(
    x: number,
    y: number,
    color: number,
    endScale: number,
    duration: number,
    startRadius = 18,
  ): void {
    const ring = this.scene.add
      .circle(x, y, startRadius, color, 0)
      .setStrokeStyle(Math.max(2, startRadius * 0.1), color, 0.92)
      .setDepth(DEPTH.fx - 1);

    this.scene.tweens.add({
      targets: ring,
      scaleX: endScale,
      scaleY: endScale,
      alpha: 0,
      duration,
      ease: "Cubic.easeOut",
      onComplete: () => {
        ring.destroy();
      },
    });
  }

  public floatingNumber(
    x: number,
    y: number,
    label: string,
    color: string,
  ): void {
    const text = this.scene.add
      .text(x, y, label, {
        fontFamily: FONT_DISPLAY,
        fontSize: "21px",
        color,
        fontStyle: "900",
        stroke: "#05030f",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.fx + 4)
      .setShadow(0, 0, color, 12, false, true);

    this.scene.tweens.add({
      targets: text,
      y: y - 74,
      alpha: 0,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 860,
      ease: "Cubic.easeOut",
      onComplete: () => {
        text.destroy();
      },
    });
  }

  public flash(color: number, alpha: number, duration = 240): void {
    this.scene.tweens.killTweensOf(this.flashRect);
    this.flashRect.setFillStyle(color, 1).setAlpha(alpha);
    this.scene.tweens.add({
      targets: this.flashRect,
      alpha: 0,
      duration,
      ease: "Quad.easeOut",
    });
  }

  public updateFever(delta: number, fever: boolean): void {
    const target = fever ? 0.12 : 0;
    this.rainbow.setAlpha(
      Phaser.Math.Linear(this.rainbow.alpha, target, 0.055),
    );
    this.rainbow.tilePositionX += 0.08 * delta;
    this.rainbow.tilePositionY += 0.02 * delta;
  }
}
