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
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
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
      gain.gain.setValueAtTime(t.vol ?? 0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + t.dur);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + t.dur + 0.02);
    }
  }

  /** Чем тяжелее кот, тем ниже звук прыжка. */
  jump(weight: number) {
    const base = 520 - weight * 260;
    this.play([{ freq: base, to: base * 1.8, dur: 0.12 }]);
  }

  kibble() {
    this.play([{ freq: 1200 + Math.random() * 200, dur: 0.05, type: 'square', vol: 0.05 }]);
  }

  can() {
    this.play([
      { freq: 660, dur: 0.09, type: 'square', vol: 0.07 },
      { freq: 990, dur: 0.14, type: 'square', vol: 0.07, delay: 0.08 },
    ]);
  }

  land(weight: number) {
    if (weight < 0.67) return;
    this.play([{ freq: 120, to: 50, dur: 0.16, type: 'sine', vol: 0.35 }]);
  }

  fall() {
    this.play([{ freq: 440, to: 80, dur: 0.6, type: 'sawtooth', vol: 0.08 }]);
  }

  goal() {
    [523, 659, 784, 1047].forEach((f, i) => this.play([{ freq: f, dur: 0.18, vol: 0.12, delay: i * 0.1 }]));
  }
}

export const sound = new SoundBank();
