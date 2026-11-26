import Phaser from "phaser";
import type { SlimeSkin } from "../core/types";
import {
  DEPTH,
  FLOOR_Y,
  GAME_HEIGHT,
  GAME_WIDTH,
} from "../core/Visuals";

export interface SlimeVisualState {
  dashLeft: number;
  shieldLeft: number;
  magnetLeft: number;
  invuln: number;
  fever: boolean;
  turbo: boolean;
}

export type JumpKind = "ground" | "air";

export class Slime {
  public readonly body: Phaser.Physics.Arcade.Sprite;
  public readonly visual: Phaser.GameObjects.Image;
  public readonly glow: Phaser.GameObjects.Image;
  public readonly shield: Phaser.GameObjects.Image;
  public readonly trail: Phaser.GameObjects.Particles.ParticleEmitter;

  private readonly shadow: Phaser.GameObjects.Ellipse;
  private skin: SlimeSkin;
  private trailOn = false;
  private facing = 1;
  private airJumps = 1;

  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    skin: SlimeSkin,
  ) {
    this.skin = skin;

    scene.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.body = scene.physics.add
      .sprite(x, y, `slime_${skin.id}`)
      .setVisible(false)
      .setDepth(5);
    this.body.setCollideWorldBounds(true);
    this.body.setBounce(0.82, 0.82);

    const body = this.body.body as Phaser.Physics.Arcade.Body;
    body.setCircle(42, 22, 22);
    body.setDragX(520);
    body.setMaxVelocity(760, 2300);

    const floor = scene.add.rectangle(
      GAME_WIDTH / 2,
      706,
      GAME_WIDTH,
      108,
      0x000000,
      0,
    );
    scene.physics.add.existing(floor, true);
    scene.physics.add.collider(this.body, floor);

    this.shadow = scene.add
      .ellipse(x, FLOOR_Y + 4, 110, 20, 0x000000, 0.38)
      .setDepth(DEPTH.floor + 2);

    this.glow = scene.add
      .image(x, y + 2, "glow")
      .setTint(skin.color)
      .setScale(1.5)
      .setAlpha(0.48)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEPTH.slimeGlow);

    this.visual = scene.add
      .image(x, y + 2, `slime_${skin.id}`)
      .setScale(0.86)
      .setDepth(DEPTH.slime);

    this.shield = scene.add
      .image(x, y, "shield")
      .setTint(0xa9fbff)
      .setScale(0.78)
      .setAlpha(0)
      .setVisible(false)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEPTH.shield);

    this.trail = scene.add
      .particles(0, 0, "spark", {
        lifespan: { min: 180, max: 440 },
        speed: { min: 10, max: 80 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.62, end: 0 },
        alpha: { start: 0.68, end: 0 },
        quantity: 2,
        frequency: 34,
        tint: [skin.color, skin.light, skin.accent],
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      })
      .setDepth(DEPTH.trail);
    this.trail.startFollow(this.visual);
  }

  public get x(): number {
    return this.body.x;
  }

  public get y(): number {
    return this.body.y;
  }

  public get velocity(): Phaser.Math.Vector2 {
    const body = this.body.body as Phaser.Physics.Arcade.Body;
    return body.velocity;
  }

  public get grounded(): boolean {
    const body = this.body.body as Phaser.Physics.Arcade.Body;
    return body.blocked.down || body.touching.down;
  }

  public move(
    left: boolean,
    right: boolean,
    turbo: boolean,
    dashLeft: number,
  ): void {
    const body = this.body.body as Phaser.Physics.Arcade.Body;
    const speedBoost = turbo ? 1.55 : 1;

    if (left !== right) {
      const direction = right ? 1 : -1;
      this.facing = direction;
      body.setAccelerationX(direction * 2900 * speedBoost);
      this.visual.setFlipX(direction < 0);
    } else {
      body.setAccelerationX(0);
    }

    body.setMaxVelocity(
      dashLeft > 0 ? 1250 : 540 * speedBoost,
      2300,
    );

    if (dashLeft > 0) {
      body.setVelocityX(this.facing * 1180);
      body.setAccelerationX(0);
    }
  }

  public jump(): JumpKind | null {
    const body = this.body.body as Phaser.Physics.Arcade.Body;

    if (this.grounded) {
      this.airJumps = 1;
      body.setVelocityY(-1010);
      return "ground";
    }

    if (this.airJumps > 0) {
      this.airJumps -= 1;
      body.setVelocityY(-890);
      return "air";
    }

    return null;
  }

  public slam(): void {
    const body = this.body.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(1500);
    body.setAccelerationX(0);
  }

  public dash(): void {
    const body = this.body.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(this.facing * 1180);
    body.setVelocityY(body.velocity.y * 0.25);
  }

  public getFacing(): number {
    return this.facing;
  }

  public reset(x: number, y: number): void {
    const body = this.body.body as Phaser.Physics.Arcade.Body;
    this.body.setPosition(x, y);
    body.setVelocity(0, -300);
    body.setAccelerationX(0);
    this.airJumps = 1;
    this.visual.setPosition(x, y + 2);
    this.glow.setPosition(x, y + 2);
    this.shadow.setPosition(x, FLOOR_Y + 4);
  }

  public applySkin(skin: SlimeSkin): void {
    this.skin = skin;
    this.visual.setTexture(`slime_${skin.id}`);
    this.body.setTexture(`slime_${skin.id}`);
    this.glow.setTint(skin.color);
    this.trail.setParticleTint([skin.color, skin.light, skin.accent]);
  }

  public updateVisual(
    elapsed: number,
    delta: number,
    state: SlimeVisualState,
  ): void {
    const body = this.body.body as Phaser.Physics.Arcade.Body;
    const speed = Math.abs(body.velocity.y);
    const stretch = Phaser.Math.Clamp(speed / 2400, 0, 0.2);
    const grounded = this.grounded;

    let targetX = 0.86 * (1 - stretch);
    let targetY = 0.86 * (1 + stretch);

    if (grounded) {
      const wobble = Math.sin(elapsed * 9) * 0.035;
      targetX = 0.86 * (1 + wobble);
      targetY = 0.86 * (1 - wobble);
    }

    this.visual.scaleX = Phaser.Math.Linear(
      this.visual.scaleX,
      targetX,
      0.24,
    );
    this.visual.scaleY = Phaser.Math.Linear(
      this.visual.scaleY,
      targetY,
      0.24,
    );

    const targetRotation = Phaser.Math.Clamp(
      body.velocity.x / 6000,
      -0.13,
      0.13,
    );
    this.visual.rotation = Phaser.Math.Linear(
      this.visual.rotation,
      targetRotation,
      0.18,
    );

    const drawY = this.body.y + 2;
    this.visual.setPosition(this.body.x, drawY);
    this.glow.setPosition(this.body.x, drawY);
    this.glow.setScale(1.46 + Math.sin(elapsed * 4.2) * 0.07);
    this.glow.setAlpha(0.4 + Math.sin(elapsed * 3.1) * 0.08);
    this.glow.setTint(state.magnetLeft > 0 ? 0xffc83d : this.skin.color);

    if (state.invuln > 0) {
      this.visual.setAlpha(
        0.55 + 0.45 * Math.abs(Math.sin(elapsed * 24)),
      );
      this.visual.setTint(0xff7a9c);
    } else {
      this.visual.setAlpha(1);
      this.visual.clearTint();
    }

    const height = Phaser.Math.Clamp(
      (FLOOR_Y - (this.body.y + 42)) / 360,
      0,
      1,
    );
    this.shadow.setPosition(this.body.x, FLOOR_Y + 4);
    this.shadow.setScale(1 - height * 0.45, 1 - height * 0.4);
    this.shadow.setAlpha(0.38 * (1 - height * 0.75));

    if (state.shieldLeft > 0) {
      this.shield.setVisible(true);
      this.shield.setPosition(this.body.x, drawY);
      this.shield.setRotation(this.shield.rotation + delta * 1.4);
      this.shield.setAlpha(0.66 + Math.sin(elapsed * 8) * 0.12);
      this.shield.setScale(0.78 + Math.sin(elapsed * 6) * 0.025);
    } else {
      this.shield.setVisible(false).setAlpha(0);
    }

    this.setTrail(
      state.turbo || state.dashLeft > 0 || state.fever,
    );
  }

  private setTrail(active: boolean): void {
    if (active === this.trailOn) return;
    this.trailOn = active;
    if (active) this.trail.start();
    else this.trail.stop();
  }
}
