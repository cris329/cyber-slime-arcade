import Phaser from "phaser";
import {
  ABILITY_CONFIG,
  type AbilityCooldowns,
  emptyCooldowns,
} from "../core/abilities";
import { audio } from "../core/AudioManager";
import { Fx } from "../core/Fx";
import { input } from "../core/InputHandler";
import {
  SKINS,
  STORAGE_KEYS,
  skinAt,
  writeStoredNumber,
} from "../core/SkinRegistry";
import type { GemStyle } from "../core/types";
import { padTwo } from "../core/utils";
import {
  DEPTH,
  FONT_BODY,
  FLOOR_Y,
  GAME_HEIGHT,
  GAME_WIDTH,
  createBackdrop,
  neonText,
} from "../core/Visuals";
import { GemField } from "../objects/GemField";
import { Slime } from "../objects/Slime";
import { GameHud } from "../ui/GameHud";

interface HazardEntity {
  sprite: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  phase: number;
}

export class GameScene extends Phaser.Scene {
  private slime!: Slime;
  private gems!: GemField;
  private fx!: Fx;
  private hud!: GameHud;

  private skinIndex = 0;
  private score = 0;
  private best = 0;
  private combo = 0;
  private comboBest = 0;
  private comboLeft = 0;
  private nextFeverAt = 10;
  private timeLeft = 35;
  private timeMax = 35;
  private wave = 1;
  private waveTarget = 10;
  private waveCollected = 0;
  private fever = false;
  private feverLeft = 0;
  private paused = false;
  private gameOver = false;
  private slamming = false;
  private elapsed = 0;
  private selectHeld = false;
  private lastVy = 0;
  private wasGrounded = true;

  private cooldowns: AbilityCooldowns = emptyCooldowns();
  private shieldLeft = 0;
  private magnetLeft = 0;
  private dashLeft = 0;
  private invuln = 0;

  private hazards: HazardEntity[] = [];
  private activeBanner: Phaser.GameObjects.Text[] = [];
  private activeBannerTween: Phaser.Tweens.Tween | null = null;

  public constructor() {
    super("Game");
  }

  public create(): void {
    this.resetState();
    this.skinIndex = this.registry.get("skinIndex") as number;
    this.best = this.registry.get("bestScore") as number;

    createBackdrop(this, { floor: true, stars: true });

    this.slime = new Slime(
      this,
      GAME_WIDTH / 2,
      470,
      skinAt(this.skinIndex),
    );

    this.gems = new GemField(
      this,
      () => ({ x: this.slime.x, y: this.slime.y }),
      (x, y, style) => {
        this.handleGem(x, y, style);
      },
    );

    this.fx = new Fx(this);
    this.hud = new GameHud(this, this.best, this.skinIndex);

    this.gems.ensure(8);
    this.spawnHazards(this.hazardTarget());

    this.cameras.main.fadeIn(360, 4, 3, 12);
    this.showBanner(
      `OLEADA ${padTwo(this.wave)}`,
      `RECOGE ${this.waveTarget} GEMAS ANTES DEL 00:00`,
      "#63ff9b",
    );

    audio.ensure();
    this.syncHud();
  }

  public update(_time: number, delta: number): void {
    input.update();

    if (this.gameOver) {
      this.fx.updateFever(delta, false);
      if (input.justPressed("start")) {
        this.restartRun();
      } else if (input.justPressed("select")) {
        this.returnToMenu();
      }
      return;
    }

    if (input.justPressed("select")) {
      this.cycleSkin();
    }

    if (input.justPressed("start")) {
      this.togglePause();
      return;
    }

    if (this.paused) return;

    if (input.isDown("select")) {
      if (!this.selectHeld && input.heldFor("select") > 1.05) {
        this.selectHeld = true;
        this.restartWave();
        return;
      }
    } else {
      this.selectHeld = false;
    }

    const dt = Math.min(delta / 1000, 0.05);
    this.elapsed += dt;

    this.updateTimers(dt);
    if (this.gameOver) return;

    this.updateSlime(dt);
    this.gems.update(dt, this.elapsed, this.magnetLeft > 0);
    this.updateHazards(dt);
    if (this.gameOver) return;

    this.fx.updateFever(delta, this.fever);
    this.syncHud();
  }

  private resetState(): void {
    this.hazards = [];
    this.activeBanner = [];
    this.activeBannerTween = null;
    this.score = 0;
    this.combo = 0;
    this.comboBest = 0;
    this.comboLeft = 0;
    this.nextFeverAt = 10;
    this.timeLeft = 35;
    this.timeMax = 35;
    this.wave = 1;
    this.waveTarget = 10;
    this.waveCollected = 0;
    this.fever = false;
    this.feverLeft = 0;
    this.paused = false;
    this.gameOver = false;
    this.slamming = false;
    this.elapsed = 0;
    this.selectHeld = false;
    this.lastVy = 0;
    this.wasGrounded = true;
    this.cooldowns = emptyCooldowns();
    this.shieldLeft = 0;
    this.magnetLeft = 0;
    this.dashLeft = 0;
    this.invuln = 0;
  }

  private updateTimers(dt: number): void {
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.endGame();
      return;
    }

    this.invuln = Math.max(0, this.invuln - dt);
    this.dashLeft = Math.max(0, this.dashLeft - dt);
    this.shieldLeft = Math.max(0, this.shieldLeft - dt);
    this.magnetLeft = Math.max(0, this.magnetLeft - dt);

    this.cooldowns.shield = Math.max(0, this.cooldowns.shield - dt);
    this.cooldowns.dash = Math.max(0, this.cooldowns.dash - dt);
    this.cooldowns.magnet = Math.max(0, this.cooldowns.magnet - dt);

    if (this.combo > 0) {
      this.comboLeft -= dt;
      if (this.comboLeft <= 0) {
        this.combo = 0;
        this.comboLeft = 0;
        this.nextFeverAt = 10;
      }
    }

    if (this.fever) {
      this.feverLeft -= dt;
      if (this.feverLeft <= 0) {
        this.endFever();
      }
    }
  }

  private updateSlime(dt: number): void {
    const left = input.isDown("dpadLeft");
    const right = input.isDown("dpadRight");
    const turbo = input.isDown("turboLeft") || input.isDown("turboRight");

    this.slime.move(left, right, turbo, this.dashLeft);

    const grounded = this.slime.grounded;
    if (grounded && !this.wasGrounded) {
      if (this.slamming) {
        this.slamming = false;
        this.shockwave();
      } else if (this.lastVy > 380) {
        this.fx.burst(this.slime.x, FLOOR_Y - 4, 0x9ffcff, 14);
        this.cameras.main.shake(110, 0.0035);
        audio.land();
      }
    }
    this.wasGrounded = grounded;
    this.lastVy = this.slime.velocity.y;

    if (input.justPressed("buttonA") || input.justPressed("dpadUp")) {
      const kind = this.slime.jump();
      if (kind !== null) {
        const air = kind === "air";
        this.fx.burst(
          this.slime.x,
          this.slime.y + 28,
          0xbfffe0,
          air ? 20 : 12,
        );
        this.fx.ring(
          this.slime.x,
          this.slime.y + 30,
          0x9ffcff,
          0.85,
          340,
          20,
        );
        audio.jump(air);
        input.rumble(air ? 55 : 35, air ? 0.35 : 0.2);
      }
    }

    if (input.justPressed("dpadDown") && !grounded) {
      this.slime.slam();
      this.slamming = true;
      this.fx.burst(this.slime.x, this.slime.y + 20, 0xff9ecb, 12);
      audio.dash();
      input.rumble(45, 0.3);
    }

    if (input.justPressed("buttonB")) {
      this.activateShield();
    }
    if (input.justPressed("buttonX")) {
      this.dash();
    }
    if (input.justPressed("buttonY")) {
      this.activateMagnet();
    }

    this.slime.updateVisual(this.elapsed, dt, {
      dashLeft: this.dashLeft,
      shieldLeft: this.shieldLeft,
      magnetLeft: this.magnetLeft,
      invuln: this.invuln,
      fever: this.fever,
      turbo,
    });
  }

  private activateShield(): void {
    if (this.cooldowns.shield > 0 || this.shieldLeft > 0) return;

    this.shieldLeft = ABILITY_CONFIG.shield.duration;
    this.cooldowns.shield = ABILITY_CONFIG.shield.cooldown;
    this.fx.burst(this.slime.x, this.slime.y, 0x9ffcff, 28);
    this.fx.ring(this.slime.x, this.slime.y, 0x38f2ff, 3.2, 380, 18);
    this.fx.flash(0x38f2ff, 0.08);
    audio.shield();
    input.rumble(80, 0.35);
  }

  private dash(): void {
    if (this.cooldowns.dash > 0) return;

    this.dashLeft = ABILITY_CONFIG.dash.duration;
    this.cooldowns.dash = ABILITY_CONFIG.dash.cooldown;
    this.invuln = Math.max(this.invuln, 0.42);
    this.slime.dash();

    this.fx.burst(this.slime.x, this.slime.y, 0xff9ecb, 24);
    this.fx.ring(this.slime.x, this.slime.y, 0xff3ea5, 2.2, 320, 16);
    this.cameras.main.shake(120, 0.004);
    audio.dash();
    input.rumble(70, 0.35);
  }

  private activateMagnet(): void {
    if (this.cooldowns.magnet > 0) return;

    this.magnetLeft = ABILITY_CONFIG.magnet.duration;
    this.cooldowns.magnet = ABILITY_CONFIG.magnet.cooldown;
    this.fx.ring(this.slime.x, this.slime.y, 0xffc83d, 9, 520, 24);
    this.fx.burst(this.slime.x, this.slime.y, 0xffc83d, 22);
    audio.magnet();
    input.rumble(70, 0.3);
  }

  private handleGem(x: number, y: number, style: GemStyle): void {
    this.combo += 1;
    this.comboBest = Math.max(this.comboBest, this.combo);
    this.comboLeft = 3.8;
    this.waveCollected += 1;
    this.timeLeft = Math.min(this.timeMax, this.timeLeft + 0.9);

    this.addScore(50, x, y, style.css);
    this.fx.burst(x, y, style.color, 24);
    this.fx.ring(x, y, style.color, 1.6, 320, 14);
    this.cameras.main.shake(80, 0.0022);
    audio.collect(this.combo);
    input.rumble(30, Math.min(0.55, 0.14 + this.combo * 0.012));

    if (this.fever) {
      this.feverLeft = Math.min(14, this.feverLeft + 0.7);
    } else if (this.combo >= this.nextFeverAt) {
      this.nextFeverAt = this.combo + 10;
      this.startFever();
    }

    if (this.waveCollected >= this.waveTarget) {
      this.completeWave();
    }
  }

  private addScore(points: number, x: number, y: number, color: string): number {
    const multiplier = this.fever ? 5 : 1;
    const gain = points * multiplier;
    this.score += gain;
    this.fx.floatingNumber(x, y, `+${gain}`, color);
    return gain;
  }

  private updateHazards(dt: number): void {
    for (let i = this.hazards.length - 1; i >= 0; i -= 1) {
      const hazard = this.hazards[i];
      if (hazard === undefined) continue;
      const sprite = hazard.sprite;

      sprite.x += hazard.vx * dt;
      sprite.y += hazard.vy * dt;
      sprite.rotation += dt * 1.6;

      const marginX = 64;
      const marginTop = 130;
      const marginBottom = 590;

      if (sprite.x < marginX) {
        sprite.x = marginX;
        hazard.vx = Math.abs(hazard.vx);
      } else if (sprite.x > GAME_WIDTH - marginX) {
        sprite.x = GAME_WIDTH - marginX;
        hazard.vx = -Math.abs(hazard.vx);
      }

      if (sprite.y < marginTop) {
        sprite.y = marginTop;
        hazard.vy = Math.abs(hazard.vy);
      } else if (sprite.y > marginBottom) {
        sprite.y = marginBottom;
        hazard.vy = -Math.abs(hazard.vy);
      }

      const pulse = 1 + Math.sin(this.elapsed * 4 + hazard.phase) * 0.06;
      sprite.setScale(0.68 * pulse);

      const distance = Phaser.Math.Distance.Between(
        sprite.x,
        sprite.y,
        this.slime.x,
        this.slime.y,
      );

      if (distance < 56) {
        if (this.dashLeft > 0 || this.shieldLeft > 0) {
          this.destroyHazard(hazard, 150);
        } else if (this.invuln <= 0) {
          this.damagePlayer();
          hazard.vx *= -1.4;
          hazard.vy *= -1.4;
        }
      }
    }
  }

  private damagePlayer(): void {
    if (this.invuln > 0 || this.gameOver) return;

    this.invuln = 1.5;
    this.combo = 0;
    this.comboLeft = 0;
    this.nextFeverAt = 10;
    this.timeLeft = Math.max(0, this.timeLeft - 4);
    this.score = Math.max(0, this.score - 100);

    this.cameras.main.shake(330, 0.011);
    this.fx.flash(0xff2450, 0.32);
    this.fx.burst(this.slime.x, this.slime.y, 0xff2450, 34);
    this.fx.ring(this.slime.x, this.slime.y, 0xff2450, 3.5, 420, 18);
    this.fx.floatingNumber(
      this.slime.x,
      this.slime.y - 40,
      "-4.0s",
      "#ff5f8a",
    );
    audio.hurt();
    input.rumble(320, 0.85);

    if (this.timeLeft <= 0) {
      this.endGame();
    }
  }

  private destroyHazard(hazard: HazardEntity, points: number): void {
    const index = this.hazards.indexOf(hazard);
    if (index < 0) return;

    const x = hazard.sprite.x;
    const y = hazard.sprite.y;
    this.hazards.splice(index, 1);
    hazard.sprite.destroy();

    this.addScore(points, x, y, "#ff9ecb");
    this.fx.burst(x, y, 0xff2b69, 20);
    this.fx.ring(x, y, 0xff2b69, 2.2, 280, 14);
    audio.collect(this.combo + 4);
    input.rumble(45, 0.3);

    this.spawnHazard();
  }

  private shockwave(): void {
    this.cameras.main.shake(240, 0.012);
    this.fx.flash(0x9ffcff, 0.16);
    this.fx.ring(this.slime.x, FLOOR_Y - 6, 0x9ffcff, 11, 440, 26);
    this.fx.burst(this.slime.x, FLOOR_Y - 8, 0xffffff, 36);
    audio.land();
    input.rumble(180, 0.6);

    const targets = this.hazards.filter((hazard) => {
      const distance = Phaser.Math.Distance.Between(
        hazard.sprite.x,
        hazard.sprite.y,
        this.slime.x,
        FLOOR_Y,
      );
      return distance < 270;
    });

    for (const hazard of targets) {
      this.destroyHazard(hazard, 180);
    }
  }

  private hazardTarget(): number {
    if (this.wave <= 1) return 0;
    return Math.min(6, Math.floor(this.wave / 2) + 1);
  }

  private spawnHazard(): void {
    if (this.hazards.length >= this.hazardTarget()) return;

    let x = 200;
    let y = 300;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      x = Phaser.Math.Between(100, GAME_WIDTH - 100);
      y = Phaser.Math.Between(150, 550);
      const distance = Phaser.Math.Distance.Between(
        x,
        y,
        this.slime.x,
        this.slime.y,
      );
      if (distance > 260) break;
    }

    const sprite = this.add
      .image(x, y, "hazard")
      .setScale(0)
      .setDepth(DEPTH.hazard)
      .setAlpha(0.95);

    this.tweens.add({
      targets: sprite,
      scaleX: 0.68,
      scaleY: 0.68,
      duration: 320,
      ease: "Back.easeOut",
    });

    this.hazards.push({
      sprite,
      vx: Phaser.Math.Between(70, 190) * (Math.random() > 0.5 ? 1 : -1),
      vy: Phaser.Math.Between(40, 140) * (Math.random() > 0.5 ? 1 : -1),
      phase: Math.random() * Math.PI * 2,
    });
  }

  private spawnHazards(count: number): void {
    for (const hazard of this.hazards) {
      hazard.sprite.destroy();
    }
    this.hazards = [];

    for (let i = 0; i < count; i += 1) {
      this.spawnHazard();
    }
  }

  private completeWave(): void {
    const bonus = 400 * this.wave;
    this.score += bonus;
    this.wave += 1;
    this.waveTarget = 8 + this.wave * 2;
    this.timeMax = Math.min(50, 32 + this.wave * 3);
    this.timeLeft = this.timeMax;
    this.waveCollected = 0;

    this.spawnHazards(this.hazardTarget());
    this.gems.ensure(8);

    this.fx.flash(0x63ff9b, 0.18);
    this.cameras.main.shake(240, 0.007);
    audio.wave();
    input.rumble(220, 0.55);
    this.showBanner(
      `OLEADA ${padTwo(this.wave)}`,
      `BONUS +${bonus} · META ${this.waveTarget} GEMAS`,
      "#ffc83d",
    );
    this.fx.floatingNumber(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      `+${bonus}`,
      "#ffc83d",
    );
  }

  private startFever(): void {
    this.fever = true;
    this.feverLeft = 9;
    this.fx.flash(0xffffff, 0.26);
    this.cameras.main.shake(320, 0.008);
    this.fx.burst(this.slime.x, this.slime.y, 0xffc83d, 44);
    this.fx.ring(this.slime.x, this.slime.y, 0xffc83d, 4, 520, 24);
    this.showBanner("COMBO x10", "MODO FIEBRE ACTIVADO", "#ffe066");
    audio.fever();
    input.rumble(280, 0.75);
  }

  private endFever(): void {
    if (!this.fever) return;
    this.fever = false;
    this.feverLeft = 0;
    audio.ui();
  }

  private syncHud(): void {
    this.hud.update({
      score: this.score,
      best: this.best,
      wave: this.wave,
      timeLeft: this.timeLeft,
      timeMax: this.timeMax,
      waveCollected: this.waveCollected,
      waveTarget: this.waveTarget,
      combo: this.combo,
      comboLeft: this.comboLeft,
      fever: this.fever,
      cooldowns: this.cooldowns,
      padConnected: input.isGamepadConnected,
      elapsed: this.elapsed,
    });
  }

  private cycleSkin(): void {
    this.skinIndex = (this.skinIndex + 1) % SKINS.length;
    const skin = skinAt(this.skinIndex);
    this.registry.set("skinIndex", this.skinIndex);
    writeStoredNumber(STORAGE_KEYS.skin, this.skinIndex);

    this.slime.applySkin(skin);
    this.hud.setSkin(skin);

    this.fx.burst(this.slime.x, this.slime.y, skin.color, 20);
    audio.select();
    input.rumble(50, 0.22);
  }

  private restartWave(): void {
    this.timeLeft = this.timeMax;
    this.combo = 0;
    this.comboLeft = 0;
    this.nextFeverAt = 10;
    this.waveCollected = 0;
    this.cooldowns = emptyCooldowns();
    this.shieldLeft = 0;
    this.magnetLeft = 0;
    this.dashLeft = 0;
    this.invuln = 0;
    this.slamming = false;
    this.endFever();

    this.gems.clear();
    this.gems.ensure(8);
    this.spawnHazards(this.hazardTarget());
    this.slime.reset(GAME_WIDTH / 2, 420);

    this.fx.flash(0x38f2ff, 0.2);
    audio.wave();
    input.rumble(150, 0.4);
    this.showBanner(
      "OLEADA REINICIADA",
      "MISMA META · TIEMPO COMPLETO",
      "#38f2ff",
    );
  }

  private togglePause(): void {
    if (this.gameOver) return;

    this.paused = !this.paused;
    if (this.paused) {
      this.physics.pause();
      this.slime.trail.stop();
      this.hud.setPaused(true, this.score);
      audio.ui();
    } else {
      this.physics.resume();
      this.hud.setPaused(false, this.score);
      audio.ui();
    }
  }

  private endGame(): void {
    if (this.gameOver) return;

    this.gameOver = true;
    this.timeLeft = 0;
    this.endFever();
    this.paused = false;
    this.slime.trail.stop();
    this.slime.shield.setVisible(false);
    this.physics.pause();

    const previousBest = this.best;
    const isRecord = this.score > previousBest;
    if (isRecord) {
      this.best = this.score;
      this.registry.set("bestScore", this.best);
      writeStoredNumber(STORAGE_KEYS.best, this.best);
    }

    this.syncHud();
    this.hud.hideFever();
    this.hud.showGameOver({
      score: this.score,
      best: this.best,
      wave: this.wave,
      comboBest: this.comboBest,
      isRecord,
    });

    this.fx.flash(0xff2450, 0.4);
    this.cameras.main.shake(420, 0.012);
    audio.gameOver();
    input.rumble(420, 0.9);
  }

  private restartRun(): void {
    this.cameras.main.flash(120, 99, 255, 155, false);
    audio.start();
    this.scene.restart();
  }

  private returnToMenu(): void {
    audio.ui();
    this.cameras.main.fadeOut(220, 4, 3, 12);
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        this.scene.start("Menu");
      },
    );
  }

  private clearBanner(): void {
    if (this.activeBannerTween !== null) {
      this.activeBannerTween.stop();
      this.activeBannerTween = null;
    }
    for (const text of this.activeBanner) {
      text.destroy();
    }
    this.activeBanner = [];
  }

  private showBanner(title: string, subtitle: string, color: string): void {
    this.clearBanner();

    const titleText = neonText(
      this,
      GAME_WIDTH / 2,
      252,
      title,
      34,
      color,
      {
        weight: "900",
        align: "center",
        glow: color,
        glowBlur: 20,
        letterSpacing: 4,
        stroke: "#05030f",
        strokeThickness: 3,
      },
    )
      .setOrigin(0.5)
      .setDepth(DEPTH.feverBanner)
      .setAlpha(0);

    const subtitleText = this.add
      .text(GAME_WIDTH / 2, 288, subtitle, {
        fontFamily: FONT_BODY,
        fontSize: "12px",
        color: "#b9d4df",
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.feverBanner)
      .setLetterSpacing(2.4)
      .setAlpha(0);

    const banner = [titleText, subtitleText];
    this.activeBanner = banner;
    this.activeBannerTween = this.tweens.add({
      targets: banner,
      alpha: 1,
      y: "-=8",
      duration: 230,
      hold: 900,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => {
        for (const text of banner) {
          text.destroy();
        }
        if (this.activeBanner === banner) {
          this.activeBanner = [];
          this.activeBannerTween = null;
        }
      },
    });
  }
}
