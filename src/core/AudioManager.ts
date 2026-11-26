type OscillatorShape = "sine" | "square" | "sawtooth" | "triangle";

interface ToneOptions {
  frequency: number;
  duration: number;
  shape?: OscillatorShape;
  volume?: number;
  slideTo?: number;
  delay?: number;
}

class AudioManager {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;

  public ensure(): void {
    if (this.context !== null) {
      if (this.context.state === "suspended") {
        void this.context.resume();
      }
      return;
    }

    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (AudioCtor === undefined) return;

    try {
      const context = new AudioCtor();
      const master = context.createGain();
      master.gain.value = 0.3;
      master.connect(context.destination);
      this.context = context;
      this.master = master;
    } catch {
      this.context = null;
      this.master = null;
    }
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master !== null && this.context !== null) {
      this.master.gain.setTargetAtTime(
        this.muted ? 0 : 0.3,
        this.context.currentTime,
        0.02,
      );
    }
    return this.muted;
  }

  public get isMuted(): boolean {
    return this.muted;
  }

  private tone(options: ToneOptions): void {
    if (this.context === null || this.master === null) return;

    const {
      frequency,
      duration,
      shape = "square",
      volume = 0.2,
      slideTo,
      delay = 0,
    } = options;
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = shape;
    oscillator.frequency.setValueAtTime(Math.max(30, frequency), start);
    if (slideTo !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(30, slideTo),
        start + duration,
      );
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  private noise(duration: number, volume: number, cutoff: number): void {
    if (this.context === null || this.master === null) return;

    const frameCount = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, frameCount, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.context.createBufferSource();
    source.buffer = buffer;

    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;

    const gain = this.context.createGain();
    const now = this.context.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(now);
    source.stop(now + duration);
  }

  public collect(combo: number): void {
    const step = combo % 12;
    const base = 520 * Math.pow(2, step / 12);
    this.tone({
      frequency: base,
      duration: 0.09,
      shape: "triangle",
      volume: 0.16,
    });
    this.tone({
      frequency: base * 1.5,
      duration: 0.14,
      shape: "sine",
      volume: 0.12,
      delay: 0.045,
    });
  }

  public jump(powered: boolean): void {
    this.tone({
      frequency: powered ? 300 : 360,
      slideTo: powered ? 760 : 620,
      duration: 0.16,
      shape: "square",
      volume: 0.1,
    });
  }

  public land(): void {
    this.tone({
      frequency: 180,
      slideTo: 90,
      duration: 0.09,
      shape: "sine",
      volume: 0.12,
    });
  }

  public shield(): void {
    this.tone({
      frequency: 260,
      slideTo: 680,
      duration: 0.25,
      shape: "triangle",
      volume: 0.13,
    });
    this.tone({
      frequency: 520,
      slideTo: 1040,
      duration: 0.3,
      shape: "sine",
      volume: 0.08,
      delay: 0.06,
    });
  }

  public dash(): void {
    this.noise(0.18, 0.13, 2200);
    this.tone({
      frequency: 680,
      slideTo: 160,
      duration: 0.2,
      shape: "sawtooth",
      volume: 0.08,
    });
  }

  public magnet(): void {
    for (let i = 0; i < 3; i += 1) {
      this.tone({
        frequency: 320 + i * 140,
        duration: 0.12,
        shape: "sine",
        volume: 0.1,
        delay: i * 0.07,
      });
    }
  }

  public hurt(): void {
    this.noise(0.25, 0.2, 900);
    this.tone({
      frequency: 180,
      slideTo: 55,
      duration: 0.32,
      shape: "sawtooth",
      volume: 0.16,
    });
  }

  public fever(): void {
    const notes = [523, 659, 784, 1046, 1318, 1568];
    notes.forEach((note, index) => {
      this.tone({
        frequency: note,
        duration: 0.14,
        shape: "square",
        volume: 0.09,
        delay: index * 0.055,
      });
      this.tone({
        frequency: note * 2,
        duration: 0.1,
        shape: "sine",
        volume: 0.05,
        delay: index * 0.055,
      });
    });
  }

  public wave(): void {
    const notes = [392, 523, 659, 784];
    notes.forEach((note, index) => {
      this.tone({
        frequency: note,
        duration: 0.18,
        shape: "triangle",
        volume: 0.11,
        delay: index * 0.09,
      });
    });
  }

  public gameOver(): void {
    const notes = [440, 349, 293, 220];
    notes.forEach((note, index) => {
      this.tone({
        frequency: note,
        duration: 0.32,
        shape: "sawtooth",
        volume: 0.08,
        delay: index * 0.16,
      });
    });
  }

  public select(): void {
    this.tone({
      frequency: 660,
      slideTo: 880,
      duration: 0.07,
      shape: "square",
      volume: 0.07,
    });
  }

  public ui(): void {
    this.tone({
      frequency: 440,
      duration: 0.06,
      shape: "sine",
      volume: 0.06,
    });
  }

  public start(): void {
    this.tone({
      frequency: 330,
      slideTo: 880,
      duration: 0.3,
      shape: "square",
      volume: 0.1,
    });
  }
}

export const audio = new AudioManager();
