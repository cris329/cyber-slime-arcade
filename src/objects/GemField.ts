import Phaser from "phaser";
import { GEM_STYLES, gemAt } from "../core/SkinRegistry";
import type { GemStyle } from "../core/types";
import { DEPTH } from "../core/Visuals";

interface GemEntity {
  sprite: Phaser.GameObjects.Image;
  style: GemStyle;
  baseY: number;
  phase: number;
  age: number;
}

export interface PlayerPoint {
  x: number;
  y: number;
}

export class GemField {
  private readonly scene: Phaser.Scene;
  private readonly getPlayer: () => PlayerPoint;
  private readonly onCollect: (x: number, y: number, style: GemStyle) => void;
  private readonly gems: GemEntity[] = [];

  public constructor(
    scene: Phaser.Scene,
    getPlayer: () => PlayerPoint,
    onCollect: (x: number, y: number, style: GemStyle) => void,
  ) {
    this.scene = scene;
    this.getPlayer = getPlayer;
    this.onCollect = onCollect;
  }

  public ensure(count: number): void {
    while (this.gems.length < count) {
      this.spawn();
    }
  }

  public clear(): void {
    for (const gem of this.gems) {
      gem.sprite.destroy();
    }
    this.gems.length = 0;
  }

  public spawn(): void {
    if (this.gems.length >= 10) return;

    const styleIndex = Phaser.Math.Between(0, GEM_STYLES.length - 1);
    const style = gemAt(styleIndex);
    const player = this.getPlayer();

    let x = 640;
    let y = 300;

    for (let attempt = 0; attempt < 24; attempt += 1) {
      x = Phaser.Math.Between(84, 1196);
      y = Phaser.Math.Between(112, 566);

      if (Phaser.Math.Distance.Between(x, y, player.x, player.y) < 145) {
        continue;
      }

      let tooClose = false;
      for (const gem of this.gems) {
        if (
          Phaser.Math.Distance.Between(x, y, gem.sprite.x, gem.sprite.y) < 74
        ) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) break;
    }

    const sprite = this.scene.add
      .image(x, y, style.key)
      .setScale(0.01)
      .setDepth(DEPTH.gems);

    this.gems.push({
      sprite,
      style,
      baseY: y,
      phase: Math.random() * Math.PI * 2,
      age: 0,
    });
  }

  public update(
    delta: number,
    elapsed: number,
    magnetActive: boolean,
  ): void {
    const player = this.getPlayer();

    for (let i = this.gems.length - 1; i >= 0; i -= 1) {
      const gem = this.gems[i];
      if (gem === undefined) continue;

      gem.age += delta;
      const sprite = gem.sprite;

      if (magnetActive) {
        const dx = player.x - sprite.x;
        const dy = player.y - sprite.y;
        const distance = Math.max(1, Math.hypot(dx, dy));

        if (distance < 900) {
          const pull = 760 * delta + 320 * delta * (1 - distance / 900);
          sprite.x += (dx / distance) * pull;
          sprite.y += (dy / distance) * pull;
          gem.baseY = sprite.y;
          sprite.rotation += delta * 7;
        }
      } else {
        sprite.y = gem.baseY + Math.sin(elapsed * 1.9 + gem.phase) * 10;
        sprite.rotation = Math.sin(elapsed * 1.3 + gem.phase) * 0.2;
      }

      const growth = Phaser.Math.Easing.Back.Out(
        Phaser.Math.Clamp(gem.age / 0.3, 0, 1),
      );
      const pulse = 1 + Math.sin(elapsed * 3 + gem.phase) * 0.045;
      sprite.setScale(0.58 * growth * pulse);
      sprite.setAlpha(0.82 + Math.sin(elapsed * 2.4 + gem.phase) * 0.16);

      const distance = Phaser.Math.Distance.Between(
        sprite.x,
        sprite.y,
        player.x,
        player.y,
      );

      if (distance < 58 && gem.age > 0.08) {
        const x = sprite.x;
        const y = sprite.y;
        const style = gem.style;
        this.gems.splice(i, 1);
        sprite.destroy();
        this.onCollect(x, y, style);
        this.spawn();
      }
    }
  }
}
