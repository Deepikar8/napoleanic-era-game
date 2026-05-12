import { afterEach, describe, expect, it, vi } from 'vitest';

describe('sound', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('resumes a suspended audio context before playing', async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const resume = vi.fn().mockResolvedValue(undefined);

    class FakeAudioContext {
      state = 'suspended';
      currentTime = 0;
      destination = {};
      resume = resume;

      createOscillator() {
        return {
          frequency: {
            value: 0,
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          type: 'square',
          connect: vi.fn((node: unknown) => node),
          start: vi.fn(),
          stop: vi.fn(),
        };
      }

      createGain() {
        return {
          gain: {
            value: 0,
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn((node: unknown) => node),
        };
      }
    }

    Object.defineProperty(window, 'AudioContext', {
      value: FakeAudioContext,
      configurable: true,
    });

    const { playTurnDrum } = await import('../../src/sound');
    playTurnDrum();

    expect(resume).toHaveBeenCalledTimes(1);
  });
});
