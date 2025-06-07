import { AudioEngine, SoundConfig } from '@game/audio/AudioEngine';

describe('AudioEngine', () => {
  let audioEngine: AudioEngine;
  let mockAudioContext: any;
  let mockOscillator: any;
  let mockGainNode: any;
  let mockFilterNode: any;
  let mockBufferSource: any;

  beforeEach(() => {
    // Setup mock oscillator
    mockOscillator = {
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      frequency: { value: 440 },
      type: 'sine'
    };

    // Setup mock gain node
    mockGainNode = {
      connect: jest.fn(),
      gain: {
        value: 1,
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn()
      }
    };

    // Setup mock filter node
    mockFilterNode = {
      connect: jest.fn(),
      frequency: { value: 440 },
      Q: { value: 1 },
      type: 'lowpass'
    };

    // Setup mock buffer source
    mockBufferSource = {
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      buffer: null,
      loop: false
    };

    // Setup mock audio context
    mockAudioContext = {
      currentTime: 0,
      state: 'running',
      createOscillator: jest.fn(() => ({ ...mockOscillator })),
      createGain: jest.fn(() => ({ ...mockGainNode })),
      createBiquadFilter: jest.fn(() => ({ ...mockFilterNode })),
      createBufferSource: jest.fn(() => ({ ...mockBufferSource })),
      createBuffer: jest.fn((channels, size, rate) => ({
        getChannelData: jest.fn(() => new Float32Array(size))
      })),
      destination: {},
      sampleRate: 44100,
      resume: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined)
    };

    // Mock AudioContext constructor
    global.AudioContext = jest.fn(() => mockAudioContext) as any;
    (global as any).webkitAudioContext = jest.fn(() => mockAudioContext);

    audioEngine = new AudioEngine();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize without creating audio context', async () => {
      await audioEngine.initialize();
      
      expect(global.AudioContext).not.toHaveBeenCalled();
      expect(audioEngine['isInitialized']).toBe(true);
    });

    it('should emit initialized event', async () => {
      const initSpy = jest.fn();
      audioEngine.on('initialized', initSpy);
      
      await audioEngine.initialize();
      
      expect(initSpy).toHaveBeenCalled();
    });

    it('should not initialize twice', async () => {
      const initSpy = jest.fn();
      audioEngine.on('initialized', initSpy);
      
      await audioEngine.initialize();
      await audioEngine.initialize();
      
      expect(initSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('audio context creation', () => {
    beforeEach(async () => {
      await audioEngine.initialize();
    });

    it('should create audio context on first sound', async () => {
      await audioEngine.playKeySound('q');
      
      expect(global.AudioContext).toHaveBeenCalled();
    });

    it('should resume suspended context', async () => {
      mockAudioContext.state = 'suspended';
      
      await audioEngine.playKeySound('q');
      
      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    it('should emit audioContextReady event', async () => {
      const readySpy = jest.fn();
      audioEngine.on('audioContextReady', readySpy);
      
      await audioEngine.playKeySound('q');
      
      expect(readySpy).toHaveBeenCalled();
    });

    it('should reuse existing context', async () => {
      await audioEngine.playKeySound('q');
      const createCount = (global.AudioContext as jest.Mock).mock.calls.length;
      
      await audioEngine.playKeySound('w');
      
      expect((global.AudioContext as jest.Mock).mock.calls.length).toBe(createCount);
    });

    it('should handle audio context creation failure', async () => {
      (global.AudioContext as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Audio context failed');
      });
      
      const result = await audioEngine.playKeySound('q');
      
      expect(result).toBeNull();
    });
  });

  describe('playing sounds', () => {
    beforeEach(async () => {
      await audioEngine.initialize();
    });

    it('should play key sound and return config', async () => {
      const result = await audioEngine.playKeySound('q');
      
      expect(result).toMatchObject({
        key: 'q',
        instrument: expect.any(String),
        note: expect.any(String),
        octave: expect.any(Number),
        frequency: expect.any(Number),
        volume: 0.8,
        duration: 0.5,
        color: expect.any(String)
      });
    });

    it('should return null for unmapped key', async () => {
      const result = await audioEngine.playKeySound('`');
      
      expect(result).toBeNull();
    });

    it('should emit soundPlayed event', async () => {
      const soundSpy = jest.fn();
      audioEngine.on('soundPlayed', soundSpy);
      
      await audioEngine.playKeySound('q');
      
      expect(soundSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'q',
          frequency: expect.any(Number)
        })
      );
    });

    it('should not play sound if not initialized', async () => {
      audioEngine = new AudioEngine(); // Reset without initialization
      
      const result = await audioEngine.playKeySound('q');
      
      expect(result).toBeNull();
    });
  });

  describe('instrument switching', () => {
    beforeEach(async () => {
      await audioEngine.initialize();
    });

    it('should use current instrument override', async () => {
      audioEngine.setCurrentInstrument('synthLead');
      
      const result = await audioEngine.playKeySound('q');
      
      expect(result?.instrument).toBe('synthLead');
    });

    it('should emit instrumentChanged event', () => {
      const changeSpy = jest.fn();
      audioEngine.on('instrumentChanged', changeSpy);
      
      audioEngine.setCurrentInstrument('fmBell');
      
      expect(changeSpy).toHaveBeenCalledWith('fmBell');
    });

    it('should get current instrument', () => {
      audioEngine.setCurrentInstrument('synthPad');
      
      expect(audioEngine.getCurrentInstrument()).toBe('synthPad');
    });

    it('should clear instrument override with null', () => {
      audioEngine.setCurrentInstrument('synthPad');
      audioEngine.setCurrentInstrument(null);
      
      expect(audioEngine.getCurrentInstrument()).toBeNull();
    });
  });

  describe('sound types', () => {
    beforeEach(async () => {
      await audioEngine.initialize();
    });

    it('should play synth sound', async () => {
      await audioEngine.playKeySound('q'); // synthBass is synth type
      
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockFilterNode);
      expect(mockFilterNode.connect).toHaveBeenCalledWith(mockGainNode);
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    it('should configure synth envelope', async () => {
      await audioEngine.playKeySound('q');
      
      // Check ADSR envelope calls
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0, 0);
      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalled();
    });

    it('should play FM sound', async () => {
      audioEngine.setCurrentInstrument('fmBell');
      await audioEngine.playKeySound('q');
      
      // FM synthesis uses 2 oscillators
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
    });

    it('should play noise sound for drums', async () => {
      audioEngine.setCurrentInstrument('digitalDrum');
      await audioEngine.playKeySound('q');
      
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
      expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, expect.any(Number), 44100);
    });

    it('should use drum frequencies for digitalDrum', async () => {
      audioEngine.setCurrentInstrument('digitalDrum');
      const result = await audioEngine.playKeySound('q');
      
      // Should use special drum frequency, not note frequency
      expect(result?.frequency).toBeDefined();
      expect(result?.instrument).toBe('digitalDrum');
    });
  });

  describe('zone sounds', () => {
    beforeEach(async () => {
      await audioEngine.initialize();
    });

    it('should play zone sound using first key', async () => {
      const zone = { keys: ['a', 's', 'd'] };
      
      const result = await audioEngine.playZoneSound(zone);
      
      expect(result?.key).toBe('a');
    });

    it('should return null for zone without keys', async () => {
      const zone = {};
      
      const result = await audioEngine.playZoneSound(zone);
      
      expect(result).toBeNull();
    });

    it('should return null for empty keys array', async () => {
      const zone = { keys: [] };
      
      const result = await audioEngine.playZoneSound(zone);
      
      expect(result).toBeNull();
    });
  });

  describe('volume control', () => {
    it('should set master volume', () => {
      const volumeSpy = jest.fn();
      audioEngine.on('volumeChanged', volumeSpy);
      
      audioEngine.setMasterVolume(0.5);
      
      expect(volumeSpy).toHaveBeenCalledWith(0.5);
    });

    it('should clamp volume between 0 and 1', () => {
      audioEngine.setMasterVolume(2);
      expect(audioEngine['masterVolume']).toBe(1);
      
      audioEngine.setMasterVolume(-1);
      expect(audioEngine['masterVolume']).toBe(0);
    });

    it('should use master volume in sound config', async () => {
      await audioEngine.initialize();
      audioEngine.setMasterVolume(0.3);
      
      const result = await audioEngine.playKeySound('q');
      
      expect(result?.volume).toBe(0.3);
    });
  });

  describe('filter configuration', () => {
    beforeEach(async () => {
      await audioEngine.initialize();
    });

    it('should configure lowpass filter for kick drum', async () => {
      audioEngine.setCurrentInstrument('digitalDrum');
      await audioEngine.playKeySound('q'); // Low frequency drum
      
      expect(mockFilterNode.type).toBe('lowpass');
      expect(mockFilterNode.frequency.value).toBe(100);
    });

    it('should configure highpass filter for hi-hat', async () => {
      audioEngine.setCurrentInstrument('digitalDrum');
      await audioEngine.playKeySound('u'); // High frequency drum
      
      expect(mockFilterNode.type).toBe('highpass');
      expect(mockFilterNode.frequency.value).toBe(1000);
    });

    it('should configure bandpass filter for snare', async () => {
      audioEngine.setCurrentInstrument('digitalDrum');
      await audioEngine.playKeySound('w'); // Mid frequency drum
      
      expect(mockFilterNode.type).toBe('bandpass');
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await audioEngine.initialize();
    });

    it('should handle unknown instrument gracefully', async () => {
      audioEngine.setCurrentInstrument('unknownInstrument');
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = await audioEngine.playKeySound('q');
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown instrument: unknownInstrument');
      expect(result).toBeDefined(); // Still returns config
      
      consoleWarnSpy.mockRestore();
    });

    it('should handle sound playback errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockOscillator.start.mockImplementationOnce(() => {
        throw new Error('Playback failed');
      });
      
      await audioEngine.playKeySound('q');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error playing sound:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should close audio context on cleanup', async () => {
      await audioEngine.initialize();
      await audioEngine.playKeySound('q');
      
      audioEngine.cleanup();
      
      expect(mockAudioContext.close).toHaveBeenCalled();
      expect(audioEngine['context']).toBeNull();
      expect(audioEngine['isInitialized']).toBe(false);
    });

    it('should handle cleanup without context', () => {
      expect(() => {
        audioEngine.cleanup();
      }).not.toThrow();
    });
  });

  describe('update method', () => {
    it('should have update method for game loop', () => {
      expect(() => {
        audioEngine.update(16);
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    beforeEach(async () => {
      await audioEngine.initialize();
    });

    it('should handle webkit audio context fallback', async () => {
      (global.AudioContext as any) = undefined;
      
      await audioEngine.playKeySound('q');
      
      expect((global as any).webkitAudioContext).toHaveBeenCalled();
    });

    it('should handle FM synthesis parameters', async () => {
      audioEngine.setCurrentInstrument('fmBell');
      await audioEngine.playKeySound('q');
      
      // Check modulator configuration
      const calls = mockAudioContext.createOscillator.mock.calls;
      expect(calls.length).toBe(2); // Carrier and modulator
    });

    it('should limit drum duration', async () => {
      audioEngine.setCurrentInstrument('digitalDrum');
      await audioEngine.playKeySound('q');
      
      // Drums should have max 500ms duration
      const stopCall = mockBufferSource.stop.mock.calls[0];
      expect(stopCall[0]).toBeLessThanOrEqual(0.5);
    });

    it('should generate noise buffer correctly', async () => {
      audioEngine.setCurrentInstrument('digitalDrum');
      const bufferData = new Float32Array(4410); // 100ms at 44100Hz
      
      mockAudioContext.createBuffer.mockReturnValueOnce({
        getChannelData: jest.fn(() => bufferData)
      });
      
      await audioEngine.playKeySound('q');
      
      // Check that noise data was generated
      expect(bufferData.some(v => v !== 0)).toBe(true);
    });
  });
});