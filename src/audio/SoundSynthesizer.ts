/**
 * Procedural Web Audio Sound Synthesizer for ChronoShot.
 *
 * Synthesizes all audio purely via the Web Audio API with zero external assets:
 * - Punchy revolver blast with explosive sub-bass and high-velocity crack
 * - Empty cylinder dry-fire click
 * - Mechanical cylinder reload ratchet and latch
 * - Bullet impact on obstacle
 * - Crystalline geometric unit shatter upon lethal hit
 * - Triumphant harmonic victory chime upon room clearance
 * - Triumphant high-energy cyberpunk upgrade chime
 * - Deep resonant boss defeat rumble, sub-bass sweep, and sparkle
 *
 * Dynamic Pitch Modulation:
 * Directly coupled to TimeGovernor.getTimeScale() [0.05 .. 1.0].
 * During 5% micro-creep, frequencies are pitch-shifted down into heavy,
 * time-dilated bass and durations are elongated, naturally rising to
 * crisp, punchy playback at full player sprint speed.
 */

export interface AudioContextLike {
  readonly state: AudioContextState | string;
  readonly currentTime: number;
  readonly destination: AudioNode;
  readonly sampleRate: number;
  resume(): Promise<void>;
  createOscillator(): OscillatorNode;
  createGain(): GainNode;
  createBiquadFilter(): BiquadFilterNode;
  createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer;
  createBufferSource(): AudioBufferSourceNode;
}

export class SoundSynthesizer {
  private context: AudioContextLike | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private isMuted: boolean = false;

  constructor(customContext?: AudioContextLike) {
    if (customContext) {
      this.context = customContext;
      this.initNodes();
    } else if (typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        try {
          this.context = new AudioCtx();
          this.initNodes();
        } catch {
          // Fallback gracefully if browser audio init fails
          this.context = null;
        }
      }
    }
  }

  private initNodes(): void {
    if (!this.context) return;

    try {
      this.masterGain = this.context.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.context.currentTime);
      this.masterGain.connect(this.context.destination);

      // Pre-generate 1-second white noise buffer for transients
      const sampleRate = this.context.sampleRate || 44100;
      const length = sampleRate;
      this.noiseBuffer = this.context.createBuffer(1, length, sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } catch {
      // Graceful fallback in environments without full Web Audio node support
    }
  }

  /**
   * Resumes the AudioContext if suspended by browser autoplay policies.
   */
  public async resume(): Promise<void> {
    if (this.context && this.context.state === "suspended") {
      try {
        await this.context.resume();
      } catch {
        // Ignore resume rejections before first user gesture
      }
    }
  }

  /**
   * Returns whether Web Audio is available and initialized.
   */
  public isAvailable(): boolean {
    return this.context !== null && this.masterGain !== null;
  }

  /**
   * Toggles master mute state.
   */
  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.context) {
      this.masterGain.gain.setValueAtTime(
        muted ? 0 : 0.35,
        this.context.currentTime
      );
    }
  }

  /**
   * Returns current mute state.
   */
  public get muted(): boolean {
    return this.isMuted;
  }

  /**
   * Computes the dynamic pitch modulation multiplier based on active timeScale [0.05 .. 1.0].
   * At 5% micro-creep: pitch is modulated down (~0.43x) into deep, slow-motion rumble.
   * At 100% full sprint: pitch reaches normal 1.0x.
   */
  public calculatePitch(timeScale: number = 1.0): number {
    const clamped = Math.max(0.01, Math.min(1.0, timeScale));
    return 0.35 + 0.65 * Math.pow(clamped, 0.7);
  }

  /**
   * Computes duration stretch multiplier based on active timeScale.
   * At 5% micro-creep: sound transients and tails stretch up to ~2.4x.
   * At 100% sprint: duration scale is 1.0x.
   */
  public calculateDuration(timeScale: number = 1.0): number {
    const clamped = Math.max(0.01, Math.min(1.0, timeScale));
    return 1.0 + (1.0 - clamped) * 1.5;
  }

  /**
   * Discharges revolver sound: punchy explosive transient and sub-bass boom.
   */
  public playFire(timeScale: number = 1.0): void {
    if (!this.context || !this.masterGain || this.isMuted) return;
    this.resume();

    const pitch = this.calculatePitch(timeScale);
    const dur = this.calculateDuration(timeScale);
    const t0 = this.context.currentTime;

    try {
      // 1. Transient noise crack
      if (this.noiseBuffer) {
        const noiseSource = this.context.createBufferSource();
        noiseSource.buffer = this.noiseBuffer;

        const filter = this.context.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1800 * pitch, t0);
        filter.Q.setValueAtTime(2.0, t0);

        const noiseGain = this.context.createGain();
        noiseGain.gain.setValueAtTime(0.7, t0);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.07 * dur);

        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        noiseSource.start(t0);
        noiseSource.stop(t0 + 0.07 * dur);
      }

      // 2. Punchy sub-bass oscillator thump
      const osc = this.context.createOscillator();
      const oscGain = this.context.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(240 * pitch, t0);
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(10, 42 * pitch),
        t0 + 0.15 * dur
      );

      oscGain.gain.setValueAtTime(0.9, t0);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15 * dur);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);

      osc.start(t0);
      osc.stop(t0 + 0.15 * dur);
    } catch {
      // Avoid interrupting gameplay loop on audio driver dropouts
    }
  }

  /**
   * Empty cylinder dry-fire click: sharp metallic hammer ping on empty chamber.
   */
  public playDryClick(timeScale: number = 1.0): void {
    if (!this.context || !this.masterGain || this.isMuted) return;
    this.resume();

    const pitch = this.calculatePitch(timeScale);
    const dur = this.calculateDuration(timeScale);
    const t0 = this.context.currentTime;

    try {
      // Dual high metallic pings
      const osc1 = this.context.createOscillator();
      const osc2 = this.context.createOscillator();
      const clickGain = this.context.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1600 * pitch, t0);

      osc2.type = "square";
      osc2.frequency.setValueAtTime(2400 * pitch, t0);

      clickGain.gain.setValueAtTime(0.4, t0);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.025 * dur);

      osc1.connect(clickGain);
      osc2.connect(clickGain);
      clickGain.connect(this.masterGain);

      osc1.start(t0);
      osc2.start(t0);
      osc1.stop(t0 + 0.025 * dur);
      osc2.stop(t0 + 0.025 * dur);
    } catch {
      // Ignore
    }
  }

  /**
   * Revolver reload sequence: mechanical cylinder clicks and solid latch lock.
   */
  public playReload(timeScale: number = 1.0): void {
    if (!this.context || !this.masterGain || this.isMuted) return;
    this.resume();

    const pitch = this.calculatePitch(timeScale);
    const dur = this.calculateDuration(timeScale);
    const t0 = this.context.currentTime;

    try {
      // 3 rapid ratcheting cylinder notches
      const clickOffsets = [0.02, 0.06, 0.1];
      for (let i = 0; i < clickOffsets.length; i++) {
        const ct = t0 + clickOffsets[i] * dur;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime((1200 + i * 220) * pitch, ct);

        gain.gain.setValueAtTime(0.28, ct);
        gain.gain.exponentialRampToValueAtTime(0.001, ct + 0.02 * dur);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(ct);
        osc.stop(ct + 0.02 * dur);
      }

      // Final cylinder lock latch
      const latchTime = t0 + 0.16 * dur;
      const latchOsc = this.context.createOscillator();
      const latchGain = this.context.createGain();

      latchOsc.type = "triangle";
      latchOsc.frequency.setValueAtTime(640 * pitch, latchTime);

      latchGain.gain.setValueAtTime(0.45, latchTime);
      latchGain.gain.exponentialRampToValueAtTime(0.001, latchTime + 0.04 * dur);

      latchOsc.connect(latchGain);
      latchGain.connect(this.masterGain);

      latchOsc.start(latchTime);
      latchOsc.stop(latchTime + 0.04 * dur);
    } catch {
      // Ignore
    }
  }

  /**
   * Synthesizes an individual chamber ratchet click when a round seats during reload.
   */
  public playChamberLoad(timeScale: number = 1.0, chamberIndex: number = 0): void {
    if (!this.context || !this.masterGain || this.isMuted) return;
    this.resume();

    const pitch = this.calculatePitch(timeScale);
    const dur = this.calculateDuration(timeScale);
    const t0 = this.context.currentTime;

    try {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime((1200 + (chamberIndex % 6) * 120) * pitch, t0);

      gain.gain.setValueAtTime(0.28, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.02 * dur);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t0);
      osc.stop(t0 + 0.02 * dur);
    } catch {
      // Ignore
    }
  }

  /**
   * Synthesizes the solid mechanical cylinder latch lock when reload completes.
   */
  public playReloadLatch(timeScale: number = 1.0): void {
    if (!this.context || !this.masterGain || this.isMuted) return;
    this.resume();

    const pitch = this.calculatePitch(timeScale);
    const dur = this.calculateDuration(timeScale);
    const t0 = this.context.currentTime;

    try {
      const latchOsc = this.context.createOscillator();
      const latchGain = this.context.createGain();

      latchOsc.type = "triangle";
      latchOsc.frequency.setValueAtTime(640 * pitch, t0);

      latchGain.gain.setValueAtTime(0.45, t0);
      latchGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.04 * dur);

      latchOsc.connect(latchGain);
      latchGain.connect(this.masterGain);

      latchOsc.start(t0);
      latchOsc.stop(t0 + 0.04 * dur);
    } catch {
      // Ignore
    }
  }

  /**
   * Projectile impact on solid obstacle: concrete/barrier thwack and ricochet crack.
   */
  public playImpact(timeScale: number = 1.0): void {
    if (!this.context || !this.masterGain || this.isMuted) return;
    this.resume();

    const pitch = this.calculatePitch(timeScale);
    const dur = this.calculateDuration(timeScale);
    const t0 = this.context.currentTime;

    try {
      // Noise component
      if (this.noiseBuffer) {
        const noiseSource = this.context.createBufferSource();
        noiseSource.buffer = this.noiseBuffer;

        const filter = this.context.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1000 * pitch, t0);

        const gain = this.context.createGain();
        gain.gain.setValueAtTime(0.45, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.05 * dur);

        noiseSource.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noiseSource.start(t0);
        noiseSource.stop(t0 + 0.05 * dur);
      }

      // Pitch sweep ping
      const osc = this.context.createOscillator();
      const oscGain = this.context.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(320 * pitch, t0);
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(10, 50 * pitch),
        t0 + 0.08 * dur
      );

      oscGain.gain.setValueAtTime(0.5, t0);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08 * dur);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);

      osc.start(t0);
      osc.stop(t0 + 0.08 * dur);
    } catch {
      // Ignore
    }
  }

  /**
   * Unit destruction crystalline impact: sparkling geometric shatter with crystalline harmonics.
   */
  public playShatter(timeScale: number = 1.0): void {
    if (!this.context || !this.masterGain || this.isMuted) return;
    this.resume();

    const pitch = this.calculatePitch(timeScale);
    const dur = this.calculateDuration(timeScale);
    const t0 = this.context.currentTime;

    try {
      // Triple crystalline resonant tones
      const freqs = [950, 1420, 2180];
      for (const f of freqs) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(f * pitch, t0);

        gain.gain.setValueAtTime(0.35, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.24 * dur);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t0);
        osc.stop(t0 + 0.24 * dur);
      }

      // High glass shimmer noise
      if (this.noiseBuffer) {
        const noiseSource = this.context.createBufferSource();
        noiseSource.buffer = this.noiseBuffer;

        const filter = this.context.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(2600 * pitch, t0);

        const gain = this.context.createGain();
        gain.gain.setValueAtTime(0.3, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18 * dur);

        noiseSource.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noiseSource.start(t0);
        noiseSource.stop(t0 + 0.18 * dur);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Room clear / exit gate unlocked victory chime: triumphant 4-note ascending chord arpeggio.
   */
  public playVictory(timeScale: number = 1.0): void {
    if (!this.context || !this.masterGain || this.isMuted) return;
    this.resume();

    const pitch = this.calculatePitch(timeScale);
    const t0 = this.context.currentTime;

    // C5, E5, G5, C6 triumphant ascending chime
    const chord = [523.25, 659.25, 783.99, 1046.5];
    const stagger = 0.08;

    try {
      for (let i = 0; i < chord.length; i++) {
        const noteTime = t0 + i * stagger;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(chord[i] * pitch, noteTime);

        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.linearRampToValueAtTime(0.38, noteTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.45);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Shield deflection metallic ping: high-frequency dual sine tones on shield impact.
   */
  public playShieldDeflect(timeScale: number = 1.0): void {
    if (!this.context || !this.masterGain || this.isMuted) return;
    this.resume();

    const pitch = this.calculatePitch(timeScale);
    const dur = this.calculateDuration(timeScale);
    const t0 = this.context.currentTime;

    try {
      const osc1 = this.context.createOscillator();
      const osc2 = this.context.createOscillator();
      const gain = this.context.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1800 * pitch, t0);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(2800 * pitch, t0);

      gain.gain.setValueAtTime(0.35, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.04 * dur);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(t0);
      osc2.start(t0);
      osc1.stop(t0 + 0.04 * dur);
      osc2.stop(t0 + 0.04 * dur);
    } catch {
      // Ignore
    }
  }

  /**
   * Shield break dispersion pop: resonant electric low-pass noise burst combined with descending pitch sweep.
   */
  public playShieldBreak(timeScale: number = 1.0): void {
    if (!this.context || !this.masterGain || this.isMuted) return;
    this.resume();

    const pitch = this.calculatePitch(timeScale);
    const dur = this.calculateDuration(timeScale);
    const t0 = this.context.currentTime;

    try {
      // Noise burst transient
      if (this.noiseBuffer) {
        const noiseSource = this.context.createBufferSource();
        noiseSource.buffer = this.noiseBuffer;

        const filter = this.context.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1400 * pitch, t0);
        filter.Q.setValueAtTime(3.0, t0);

        const noiseGain = this.context.createGain();
        noiseGain.gain.setValueAtTime(0.5, t0);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12 * dur);

        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        noiseSource.start(t0);
        noiseSource.stop(t0 + 0.12 * dur);
      }

      // Descending pitch sweep
      const osc = this.context.createOscillator();
      const oscGain = this.context.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800 * pitch, t0);
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(10, 80 * pitch),
        t0 + 0.18 * dur
      );

      oscGain.gain.setValueAtTime(0.4, t0);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18 * dur);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);

      osc.start(t0);
      osc.stop(t0 + 0.18 * dur);
    } catch {
      // Ignore
    }
  }

  /**
   * Sniper charging whine: ascending pitch sweep indicating active laser sightline lock.
   */
  public playSniperCharge(timeScale: number = 1.0): void {
    if (!this.context || !this.masterGain || this.isMuted) return;
    this.resume();

    const pitch = this.calculatePitch(timeScale);
    const dur = this.calculateDuration(timeScale);
    const t0 = this.context.currentTime;

    try {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(300 * pitch, t0);
      osc.frequency.exponentialRampToValueAtTime(
        1200 * pitch,
        t0 + 0.45 * dur
      );

      gain.gain.setValueAtTime(0.05, t0);
      gain.gain.linearRampToValueAtTime(0.3, t0 + 0.4 * dur);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45 * dur);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t0);
      osc.stop(t0 + 0.45 * dur);
    } catch {
      // Ignore
    }
  }

  /**
   * Tactical upgrade draft acquisition: triumphant high-energy cyberpunk chord/arpeggio.
   * Cascading C5, E5, G5, C6 arpeggio with rapid cascading attack and smooth exponential decays.
   */
  public playUpgradeChime(timeScale: number = 1.0): void {
    if (!this.context || !this.masterGain || this.isMuted) return;
    this.resume();

    const pitch = this.calculatePitch(timeScale);
    const dur = this.calculateDuration(timeScale);
    const t0 = this.context.currentTime;

    const chord = [523.25, 659.25, 783.99, 1046.5];
    const stagger = 0.05 * dur;
    const noteDuration = 0.35 * dur;

    try {
      for (let i = 0; i < chord.length; i++) {
        const noteTime = t0 + i * stagger;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = i % 2 === 0 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(chord[i] * pitch, noteTime);

        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.linearRampToValueAtTime(0.35, noteTime + 0.012 * dur);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteDuration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(noteTime);
        osc.stop(noteTime + noteDuration);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Milestone boss defeat cue: deep resonant explosion rumble,
   * descending sub-bass sweep, and high-frequency crystalline sparkle for boss shatter.
   */
  public playBossDefeat(timeScale: number = 1.0): void {
    if (!this.context || !this.masterGain || this.isMuted) return;
    this.resume();

    const pitch = this.calculatePitch(timeScale);
    const dur = this.calculateDuration(timeScale);
    const t0 = this.context.currentTime;

    try {
      // 1. Deep resonant explosion rumble (filtered noise)
      if (this.noiseBuffer) {
        const noiseSource = this.context.createBufferSource();
        noiseSource.buffer = this.noiseBuffer;

        const filter = this.context.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(260 * pitch, t0);
        filter.Q.setValueAtTime(3.5, t0);

        const noiseGain = this.context.createGain();
        noiseGain.gain.setValueAtTime(0.8, t0);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.55 * dur);

        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        noiseSource.start(t0);
        noiseSource.stop(t0 + 0.55 * dur);
      }

      // 2. Descending sub-bass sweep
      const subOsc = this.context.createOscillator();
      const subGain = this.context.createGain();

      subOsc.type = "triangle";
      subOsc.frequency.setValueAtTime(160 * pitch, t0);
      subOsc.frequency.exponentialRampToValueAtTime(
        Math.max(10, 26 * pitch),
        t0 + 0.6 * dur
      );

      subGain.gain.setValueAtTime(0.85, t0);
      subGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.6 * dur);

      subOsc.connect(subGain);
      subGain.connect(this.masterGain);

      subOsc.start(t0);
      subOsc.stop(t0 + 0.6 * dur);

      // 3. High-frequency sparkle for crystalline boss shatter
      const sparkleFreqs = [2000, 3200, 4400];
      for (let i = 0; i < sparkleFreqs.length; i++) {
        const sparkleTime = t0 + (0.04 + i * 0.04) * dur;
        const sparkleOsc = this.context.createOscillator();
        const sparkleGain = this.context.createGain();

        sparkleOsc.type = "sine";
        sparkleOsc.frequency.setValueAtTime(sparkleFreqs[i] * pitch, sparkleTime);

        sparkleGain.gain.setValueAtTime(0.3, sparkleTime);
        sparkleGain.gain.exponentialRampToValueAtTime(
          0.001,
          sparkleTime + 0.25 * dur
        );

        sparkleOsc.connect(sparkleGain);
        sparkleGain.connect(this.masterGain);

        sparkleOsc.start(sparkleTime);
        sparkleOsc.stop(sparkleTime + 0.25 * dur);
      }
    } catch {
      // Ignore
    }
  }
}

