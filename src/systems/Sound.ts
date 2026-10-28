/** Синтезированные звуки через WebAudio: без файлов, в духе минимализма. */
type Tone = { freq: number; to?: number; dur: number; type?: OscillatorType; vol?: number; delay?: number };

const STORAGE_KEY = 'muchineko.muted';

class SoundBank {
  private ctx?: AudioContext;
  muted = false;

  constructor() {
    try {
      this.muted = localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      /* хранилище недоступно — звук по умолчанию включён */
    }
  }

  /** Браузеры разрешают звук только после жеста пользователя. */
  unlock() {
    try {
      if (!this.ctx) this.ctx = new AudioContext();
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      /* без звука */
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem(STORAGE_KEY, this.muted ? '1' : '0');
    } catch {
      /* не страшно */
    }
    return this.muted;
  }

  private play(tones: Tone[]) {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    for (const t of tones) {
      const start = now + (t.delay ?? 0);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = t.type ?? 'triangle';
      osc.frequency.setValueAtTime(t.freq, start);
      if (t.to) osc.frequency.exponentialRampToValueAtTime(t.to, start + t.dur);
      gain.gain.setValueAtTime(t.vol ?? 0.16, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + t.dur);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + t.dur + 0.02);
    }
  }

  /** Чем тяжелее кот, тем ниже звук. */
  jump(weight: number) {
    const base = 540 - weight * 280;
    this.play([{ freq: base, to: base * 1.8, dur: 0.12 }]);
  }

  kibble() {
    this.play([{ freq: 1250 + Math.random() * 200, dur: 0.045, type: 'square', vol: 0.045 }]);
  }

  can() {
    this.play([
      { freq: 660, dur: 0.08, type: 'square', vol: 0.06 },
      { freq: 990, dur: 0.14, type: 'square', vol: 0.06, delay: 0.07 },
    ]);
  }

  toy() {
    [900, 700, 520].forEach((f, i) => this.play([{ freq: f, dur: 0.07, type: 'sine', vol: 0.12, delay: i * 0.06 }]));
  }

  land(weight: number) {
    if (weight < 0.6) return;
    this.play([{ freq: 130, to: 50, dur: 0.16, type: 'sine', vol: 0.3 * weight }]);
  }

  bounce(weight: number) {
    this.play([{ freq: 180 + weight * 60, to: 620, dur: 0.22, type: 'sine', vol: 0.22 }]);
  }

  snap() {
    this.play([
      { freq: 2200, to: 400, dur: 0.08, type: 'sawtooth', vol: 0.08 },
      { freq: 300, to: 90, dur: 0.4, type: 'sine', vol: 0.16, delay: 0.05 },
    ]);
  }

  scale(ok: boolean) {
    if (ok) this.play([{ freq: 520, dur: 0.1, vol: 0.12 }, { freq: 780, dur: 0.18, vol: 0.12, delay: 0.1 }, { freq: 140, to: 70, dur: 0.25, type: 'sine', vol: 0.25, delay: 0.3 }]);
    else this.play([{ freq: 300, dur: 0.12, type: 'square', vol: 0.06 }, { freq: 220, dur: 0.2, type: 'square', vol: 0.06, delay: 0.12 }]);
  }

  fall() {
    this.play([{ freq: 440, to: 80, dur: 0.6, type: 'sawtooth', vol: 0.07 }]);
  }

  bonk() {
    this.play([{ freq: 160, to: 60, dur: 0.25, type: 'square', vol: 0.12 }]);
  }

  goal() {
    [523, 659, 784, 1047].forEach((f, i) => this.play([{ freq: f, dur: 0.18, vol: 0.11, delay: i * 0.1 }]));
  }

  star(i: number) {
    this.play([{ freq: 880 + i * 220, dur: 0.16, type: 'sine', vol: 0.12 }]);
  }

  /** ぴょん: воздушный прыжок — короткий «пуф» и подъём. */
  airJump() {
    this.play([
      { freq: 700, to: 1500, dur: 0.1, type: 'sine', vol: 0.14 },
      { freq: 260, to: 120, dur: 0.12, type: 'triangle', vol: 0.08 },
    ]);
  }

  /** Ящик вдребезги. */
  smash(weight: number) {
    this.play([
      { freq: 120 + weight * 30, to: 45, dur: 0.22, type: 'square', vol: 0.16 },
      { freq: 900, to: 200, dur: 0.09, type: 'sawtooth', vol: 0.06 },
      { freq: 520, to: 260, dur: 0.08, type: 'sawtooth', vol: 0.05, delay: 0.06 },
    ]);
  }

  /** チリン: колокольчик. */
  bell() {
    this.play([
      { freq: 1760, dur: 0.5, type: 'sine', vol: 0.1 },
      { freq: 2637, dur: 0.35, type: 'sine', vol: 0.05 },
      { freq: 1760, dur: 0.4, type: 'sine', vol: 0.06, delay: 0.12 },
    ]);
  }

  checkpoint() {
    this.play([{ freq: 660, dur: 0.08, vol: 0.08 }, { freq: 990, dur: 0.12, vol: 0.08, delay: 0.08 }]);
  }

  click() {
    this.play([{ freq: 900, dur: 0.03, type: 'square', vol: 0.04 }]);
  }
}

export const sound = new SoundBank();
