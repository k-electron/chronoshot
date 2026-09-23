import { describe, expect, it, vi } from "vitest";
import { AudioContextLike, SoundSynthesizer } from "./SoundSynthesizer";

function createMockAudioContext(): {
  context: AudioContextLike;
  createdOscillators: Array<{
    type: string;
    frequency: {
      setValueAtTime: ReturnType<typeof vi.fn>;
      exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    connect: ReturnType<typeof vi.fn>;
  }>;
  createdGains: Array<{
    gain: {
      setValueAtTime: ReturnType<typeof vi.fn>;
      exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
      linearRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
    connect: ReturnType<typeof vi.fn>;
  }>;
  createdFilters: Array<{
    type: string;
    frequency: { setValueAtTime: ReturnType<typeof vi.fn> };
    Q: { setValueAtTime: ReturnType<typeof vi.fn> };
    connect: ReturnType<typeof vi.fn>;
  }>;
  createdBufferSources: Array<{
    buffer: AudioBuffer | null;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    connect: ReturnType<typeof vi.fn>;
  }>;
} {
  const createdOscillators: any[] = [];
  const createdGains: any[] = [];
  const createdFilters: any[] = [];
  const createdBufferSources: any[] = [];

  const mockDestination = {} as unknown as AudioNode;

  const context: AudioContextLike = {
    state: "suspended",
    currentTime: 0,
    sampleRate: 44100,
    destination: mockDestination,
    resume: vi.fn().mockResolvedValue(undefined),
    createGain: vi.fn().mockImplementation(() => {
      const g = {
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      };
      createdGains.push(g);
      return g as unknown as GainNode;
    }),
    createOscillator: vi.fn().mockImplementation(() => {
      const osc = {
        type: "sine",
        frequency: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        start: vi.fn(),
        stop: vi.fn(),
        connect: vi.fn(),
      };
      createdOscillators.push(osc);
      return osc as unknown as OscillatorNode;
    }),
    createBiquadFilter: vi.fn().mockImplementation(() => {
      const f = {
        type: "lowpass",
        frequency: { setValueAtTime: vi.fn() },
        Q: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
      };
      createdFilters.push(f);
      return f as unknown as BiquadFilterNode;
    }),
    createBuffer: vi.fn().mockImplementation((channels, length) => {
      return {
        numberOfChannels: channels,
        length,
        getChannelData: vi.fn().mockReturnValue(new Float32Array(length)),
      } as unknown as AudioBuffer;
    }),
    createBufferSource: vi.fn().mockImplementation(() => {
      const bs = {
        buffer: null,
        start: vi.fn(),
        stop: vi.fn(),
        connect: vi.fn(),
      };
      createdBufferSources.push(bs);
      return bs as unknown as AudioBufferSourceNode;
    }),
  };

  return {
    context,
    createdOscillators,
    createdGains,
    createdFilters,
    createdBufferSources,
  };
}

describe("SoundSynthesizer Pitch & Time Modulation", () => {
  it("computes dynamic pitch modulation tied to TimeGovernor timeScale", () => {
    const synth = new SoundSynthesizer();

    const pitchSprint = synth.calculatePitch(1.0);
    const pitchHalf = synth.calculatePitch(0.5);
    const pitchQuarter = synth.calculatePitch(0.25);
    const pitchMicroCreep = synth.calculatePitch(0.05);

    // Standard sprint reaches 1.0x normal pitch
    expect(pitchSprint).toBeCloseTo(1.0, 4);

    // 5% micro-creep drops into deep bass (< 0.45x)
    expect(pitchMicroCreep).toBeLessThan(0.45);
    expect(pitchMicroCreep).toBeGreaterThan(0.35);

    // Monotonically scales upward as player moves faster
    expect(pitchMicroCreep).toBeLessThan(pitchQuarter);
    expect(pitchQuarter).toBeLessThan(pitchHalf);
    expect(pitchHalf).toBeLessThan(pitchSprint);
  });

  it("computes duration dilation stretching sounds during slow-motion micro-creep", () => {
    const synth = new SoundSynthesizer();

    const durSprint = synth.calculateDuration(1.0);
    const durMicroCreep = synth.calculateDuration(0.05);

    expect(durSprint).toBeCloseTo(1.0, 4);
    // Transients and decay tails stretch over 2x longer when stationary
    expect(durMicroCreep).toBeGreaterThan(2.0);
  });

  it("safely handles headless Node environment without throwing", () => {
    const synth = new SoundSynthesizer();
    expect(synth.isAvailable()).toBe(false);

    // None of the audio trigger calls should throw when uninitialized
    expect(() => synth.playFire(0.05)).not.toThrow();
    expect(() => synth.playDryClick(0.5)).not.toThrow();
    expect(() => synth.playReload(1.0)).not.toThrow();
    expect(() => synth.playImpact(0.1)).not.toThrow();
    expect(() => synth.playShatter(0.05)).not.toThrow();
    expect(() => synth.playVictory(1.0)).not.toThrow();
    expect(() => synth.playShieldDeflect(0.5)).not.toThrow();
    expect(() => synth.playShieldBreak(0.5)).not.toThrow();
    expect(() => synth.playSniperCharge(0.5)).not.toThrow();
    expect(() => synth.playUpgradeChime(0.5)).not.toThrow();
    expect(() => synth.playBossDefeat(0.5)).not.toThrow();
    expect(() => synth.setMuted(true)).not.toThrow();
  });
});

describe("SoundSynthesizer Procedural Web Audio Generation", () => {
  it("synthesizes punchy revolver blast with pitch modulation", () => {
    const mock = createMockAudioContext();
    const synth = new SoundSynthesizer(mock.context);
    expect(synth.isAvailable()).toBe(true);

    mock.createdOscillators.length = 0;
    mock.createdBufferSources.length = 0;

    // Fire during full sprint
    synth.playFire(1.0);

    expect(mock.createdOscillators.length).toBeGreaterThanOrEqual(1);
    expect(mock.createdBufferSources.length).toBeGreaterThanOrEqual(1);

    const osc = mock.createdOscillators[0];
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(240, 1),
      0
    );
    expect(osc.start).toHaveBeenCalled();
    expect(osc.stop).toHaveBeenCalled();

    // Fire during 5% micro-creep
    mock.createdOscillators.length = 0;
    synth.playFire(0.05);

    const deepOsc = mock.createdOscillators[0];
    const deepPitch = synth.calculatePitch(0.05);
    expect(deepOsc.frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(240 * deepPitch, 1),
      0
    );
  });

  it("synthesizes empty cylinder dry-fire click", () => {
    const mock = createMockAudioContext();
    const synth = new SoundSynthesizer(mock.context);

    mock.createdOscillators.length = 0;
    synth.playDryClick(1.0);

    expect(mock.createdOscillators.length).toBeGreaterThanOrEqual(2);
    expect(mock.createdOscillators[0].start).toHaveBeenCalled();
    expect(mock.createdOscillators[1].start).toHaveBeenCalled();
  });

  it("synthesizes cylinder reload ratchet and latch", () => {
    const mock = createMockAudioContext();
    const synth = new SoundSynthesizer(mock.context);

    mock.createdOscillators.length = 0;
    synth.playReload(1.0);

    // 3 ratchet notches + 1 latch lock
    expect(mock.createdOscillators.length).toBe(4);
    for (const osc of mock.createdOscillators) {
      expect(osc.start).toHaveBeenCalled();
      expect(osc.stop).toHaveBeenCalled();
    }
  });

  it("synthesizes obstacle impact ricochet and thump", () => {
    const mock = createMockAudioContext();
    const synth = new SoundSynthesizer(mock.context);

    mock.createdOscillators.length = 0;
    mock.createdBufferSources.length = 0;

    synth.playImpact(1.0);

    expect(mock.createdOscillators.length).toBeGreaterThanOrEqual(1);
    expect(mock.createdBufferSources.length).toBeGreaterThanOrEqual(1);
  });

  it("synthesizes crystalline unit shatter", () => {
    const mock = createMockAudioContext();
    const synth = new SoundSynthesizer(mock.context);

    mock.createdOscillators.length = 0;
    synth.playShatter(1.0);

    // 3 harmonic crystal tones
    expect(mock.createdOscillators.length).toBe(3);
    for (const osc of mock.createdOscillators) {
      expect(osc.start).toHaveBeenCalled();
    }
  });

  it("synthesizes victorious 4-note chord chime on room completion", () => {
    const mock = createMockAudioContext();
    const synth = new SoundSynthesizer(mock.context);

    mock.createdOscillators.length = 0;
    synth.playVictory(1.0);

    // Triumphant 4-note ascending chord (C5, E5, G5, C6)
    expect(mock.createdOscillators.length).toBe(4);
    expect(mock.createdOscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(523.25, 1),
      0
    );
    expect(mock.createdOscillators[3].frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(1046.5, 1),
      expect.any(Number)
    );
  });

  it("resumes suspended audio context on playback", async () => {
    const mock = createMockAudioContext();
    const synth = new SoundSynthesizer(mock.context);

    await synth.resume();
    expect(mock.context.resume).toHaveBeenCalled();
  });

  it("synthesizes shield deflection metallic ping with pitch modulation", () => {
    const mock = createMockAudioContext();
    const synth = new SoundSynthesizer(mock.context);

    mock.createdOscillators.length = 0;
    synth.playShieldDeflect(1.0);

    // Dual metallic sine tones: 1800Hz & 2800Hz
    expect(mock.createdOscillators.length).toBe(2);
    expect(mock.createdOscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(1800, 1),
      0
    );
    expect(mock.createdOscillators[1].frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(2800, 1),
      0
    );
    expect(mock.createdOscillators[0].start).toHaveBeenCalled();
    expect(mock.createdOscillators[1].start).toHaveBeenCalled();

    // With micro-creep pitch scaling
    mock.createdOscillators.length = 0;
    synth.playShieldDeflect(0.05);
    const pitch = synth.calculatePitch(0.05);
    expect(mock.createdOscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(1800 * pitch, 1),
      0
    );
  });

  it("synthesizes shield break dispersion pop and pitch sweep", () => {
    const mock = createMockAudioContext();
    const synth = new SoundSynthesizer(mock.context);

    mock.createdOscillators.length = 0;
    mock.createdBufferSources.length = 0;

    synth.playShieldBreak(1.0);

    // Noise buffer source burst + descending oscillator sweep
    expect(mock.createdBufferSources.length).toBe(1);
    expect(mock.createdOscillators.length).toBe(1);

    const osc = mock.createdOscillators[0];
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(800, 1),
      0
    );
    expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(80, 1),
      expect.any(Number)
    );
    expect(osc.start).toHaveBeenCalled();
  });

  it("synthesizes sniper charging tone sweep", () => {
    const mock = createMockAudioContext();
    const synth = new SoundSynthesizer(mock.context);

    mock.createdOscillators.length = 0;
    synth.playSniperCharge(1.0);

    // Ascending pitch sweep: 300Hz to 1200Hz
    expect(mock.createdOscillators.length).toBe(1);
    const osc = mock.createdOscillators[0];
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(300, 1),
      0
    );
    expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(1200, 1),
      expect.any(Number)
    );
    expect(osc.start).toHaveBeenCalled();
  });

  it("synthesizes triumphant cyberpunk upgrade chime with pitch and duration scaling", () => {
    const mock = createMockAudioContext();
    const synth = new SoundSynthesizer(mock.context);

    mock.createdOscillators.length = 0;
    mock.createdGains.length = 0;
    synth.playUpgradeChime(1.0);

    // 4 ascending chord notes: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.5)
    expect(mock.createdOscillators.length).toBe(4);
    expect(mock.createdGains.length).toBe(4);

    expect(mock.createdOscillators[0].type).toBe("triangle");
    expect(mock.createdOscillators[1].type).toBe("sine");
    expect(mock.createdOscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(523.25, 1),
      0
    );
    expect(mock.createdOscillators[3].frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(1046.5, 1),
      expect.any(Number)
    );

    // Oscillators and gains should connect and start/stop
    for (const osc of mock.createdOscillators) {
      expect(osc.start).toHaveBeenCalled();
      expect(osc.stop).toHaveBeenCalled();
      expect(osc.connect).toHaveBeenCalled();
    }
    for (const g of mock.createdGains) {
      expect(g.connect).toHaveBeenCalled();
      expect(g.gain.setValueAtTime).toHaveBeenCalled();
      expect(g.gain.linearRampToValueAtTime).toHaveBeenCalled();
      expect(g.gain.exponentialRampToValueAtTime).toHaveBeenCalled();
    }

    // With micro-creep timeScale pitch and duration modulation
    mock.createdOscillators.length = 0;
    synth.playUpgradeChime(0.05);

    const pitch = synth.calculatePitch(0.05);
    expect(mock.createdOscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(523.25 * pitch, 1),
      0
    );
    expect(mock.createdOscillators[3].frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(1046.5 * pitch, 1),
      expect.any(Number)
    );
  });

  it("synthesizes deep boss defeat rumble, sub-bass sweep, and sparkle", () => {
    const mock = createMockAudioContext();
    const synth = new SoundSynthesizer(mock.context);

    mock.createdOscillators.length = 0;
    mock.createdBufferSources.length = 0;
    mock.createdFilters.length = 0;
    mock.createdGains.length = 0;

    synth.playBossDefeat(1.0);

    // 1 noise rumble buffer source + 1 filter + 1 sub-bass osc + 3 sparkle oscs
    expect(mock.createdBufferSources.length).toBe(1);
    expect(mock.createdFilters.length).toBe(1);
    expect(mock.createdOscillators.length).toBe(4);

    expect(mock.createdFilters[0].type).toBe("lowpass");
    expect(mock.createdFilters[0].frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(260, 1),
      0
    );

    // Sub-bass sweep
    const subOsc = mock.createdOscillators[0];
    expect(subOsc.type).toBe("triangle");
    expect(subOsc.frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(160, 1),
      0
    );
    expect(subOsc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(26, 1),
      expect.any(Number)
    );

    // Sparkle oscillators
    expect(mock.createdOscillators[1].frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(2000, 1),
      expect.any(Number)
    );
    expect(mock.createdOscillators[2].frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(3200, 1),
      expect.any(Number)
    );
    expect(mock.createdOscillators[3].frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(4400, 1),
      expect.any(Number)
    );

    for (const osc of mock.createdOscillators) {
      expect(osc.start).toHaveBeenCalled();
      expect(osc.stop).toHaveBeenCalled();
      expect(osc.connect).toHaveBeenCalled();
    }

    // Micro-creep pitch scaling
    mock.createdOscillators.length = 0;
    mock.createdFilters.length = 0;
    synth.playBossDefeat(0.05);

    const pitch = synth.calculatePitch(0.05);
    expect(mock.createdFilters[0].frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(260 * pitch, 1),
      0
    );
    expect(mock.createdOscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(160 * pitch, 1),
      0
    );
  });

  it("suppresses audio synthesis when muted", () => {
    const mock = createMockAudioContext();
    const synth = new SoundSynthesizer(mock.context);
    synth.setMuted(true);

    mock.createdOscillators.length = 0;
    mock.createdBufferSources.length = 0;

    synth.playShieldDeflect(1.0);
    synth.playShieldBreak(1.0);
    synth.playSniperCharge(1.0);
    synth.playUpgradeChime(1.0);
    synth.playBossDefeat(1.0);

    expect(mock.createdOscillators.length).toBe(0);
    expect(mock.createdBufferSources.length).toBe(0);
  });
});
