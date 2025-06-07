import { GameState, Recording } from '@game/core/GameState';

describe('GameState', () => {
  let gameState: GameState;
  let localStorageMock: any;

  beforeEach(() => {
    localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    global.localStorage = localStorageMock;
    
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    
    gameState = new GameState();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      expect(gameState.getCurrentMode()).toBe('menu');
      expect(gameState.getCurrentLevel()).toBe(0);
      expect(gameState.getUnlockedLevels()).toEqual([0]);
    });

    it('should load saved state from localStorage', () => {
      const savedState = {
        unlockedLevels: [0, 1, 2],
        settings: {
          volume: 0.5,
          effectsEnabled: false,
          instrument: 'synth-lead',
          visualTheme: 'space'
        },
        recordings: []
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));
      
      gameState = new GameState();
      
      expect(gameState.getUnlockedLevels()).toEqual([0, 1, 2]);
      expect(gameState.getSettings()).toMatchObject({
        volume: 0.5,
        effectsEnabled: false,
        instrument: 'synth-lead',
        visualTheme: 'space'
      });
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      expect(() => {
        gameState = new GameState();
      }).not.toThrow();
      
      // Should fall back to defaults
      expect(gameState.getUnlockedLevels()).toEqual([0]);
    });
  });

  describe('mode management', () => {
    it('should change mode', () => {
      const modeSpy = jest.fn();
      gameState.on('modeChanged', modeSpy);
      
      gameState.setMode('story');
      
      expect(gameState.getCurrentMode()).toBe('story');
      expect(modeSpy).toHaveBeenCalledWith('story');
    });

    it('should support all game modes', () => {
      const modes: Array<'menu' | 'story' | 'sandbox'> = ['menu', 'story', 'sandbox'];
      
      modes.forEach(mode => {
        gameState.setMode(mode);
        expect(gameState.getCurrentMode()).toBe(mode);
      });
    });
  });

  describe('level management', () => {
    it('should set unlocked level', () => {
      const levelSpy = jest.fn();
      gameState.on('levelChanged', levelSpy);
      
      gameState.setLevel(0);
      
      expect(gameState.getCurrentLevel()).toBe(0);
      expect(levelSpy).toHaveBeenCalledWith(0);
    });

    it('should not set locked level', () => {
      const levelSpy = jest.fn();
      gameState.on('levelChanged', levelSpy);
      
      gameState.setLevel(1);
      
      expect(gameState.getCurrentLevel()).toBe(0); // Should stay at 0
      expect(levelSpy).not.toHaveBeenCalled();
    });

    it('should unlock new level', () => {
      const unlockSpy = jest.fn();
      gameState.on('levelUnlocked', unlockSpy);
      
      gameState.unlockLevel(1);
      
      expect(gameState.getUnlockedLevels()).toContain(1);
      expect(unlockSpy).toHaveBeenCalledWith(1);
    });

    it('should not unlock already unlocked level', () => {
      const unlockSpy = jest.fn();
      gameState.on('levelUnlocked', unlockSpy);
      
      gameState.unlockLevel(0); // Already unlocked
      
      expect(unlockSpy).not.toHaveBeenCalled();
    });

    it('should save state after unlocking level', () => {
      gameState.unlockLevel(1);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cosmic-jam-state',
        expect.stringContaining('"unlockedLevels":[0,1]')
      );
    });
  });

  describe('settings management', () => {
    it('should update settings', () => {
      const settingsSpy = jest.fn();
      gameState.on('settingsChanged', settingsSpy);
      
      gameState.updateSettings({ volume: 0.3 });
      
      expect(gameState.getSettings().volume).toBe(0.3);
      expect(settingsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ volume: 0.3 })
      );
    });

    it('should merge settings updates', () => {
      const originalSettings = gameState.getSettings();
      
      gameState.updateSettings({ volume: 0.5 });
      
      const newSettings = gameState.getSettings();
      expect(newSettings.volume).toBe(0.5);
      expect(newSettings.effectsEnabled).toBe(originalSettings.effectsEnabled);
      expect(newSettings.instrument).toBe(originalSettings.instrument);
    });

    it('should save settings after update', () => {
      gameState.updateSettings({ instrument: 'synth-pad' });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cosmic-jam-state',
        expect.stringContaining('"instrument":"synth-pad"')
      );
    });
  });

  describe('input tracking', () => {
    it('should record key press', () => {
      const keySpy = jest.fn();
      gameState.on('keyPressed', keySpy);
      
      gameState.recordKeyPress('q');
      
      expect(keySpy).toHaveBeenCalledWith('q');
      expect(gameState.getSessionStats().keysPressed).toBe(1);
    });

    it('should record touch', () => {
      const touchSpy = jest.fn();
      gameState.on('touchRecorded', touchSpy);
      
      const touch = { x: 100, y: 200 };
      gameState.recordTouch(touch);
      
      expect(touchSpy).toHaveBeenCalledWith(touch);
      expect(gameState.getSessionStats().touchesRecorded).toBe(1);
    });

    it('should track sounds played', () => {
      gameState.addToRecording({ frequency: 440 });
      
      expect(gameState.getSessionStats().soundsPlayed).toBe(1);
    });
  });

  describe('recording functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start recording', () => {
      const startSpy = jest.fn();
      gameState.on('recordingStarted', startSpy);
      
      gameState.startRecording();
      
      expect(gameState.isRecordingActive()).toBe(true);
      expect(startSpy).toHaveBeenCalled();
    });

    it('should not start recording twice', () => {
      gameState.startRecording();
      const startSpy = jest.fn();
      gameState.on('recordingStarted', startSpy);
      
      gameState.startRecording();
      
      expect(startSpy).not.toHaveBeenCalled();
    });

    it('should record events during recording', () => {
      gameState.startRecording();
      
      jest.setSystemTime(1100);
      gameState.recordKeyPress('q');
      
      jest.setSystemTime(1200);
      gameState.recordTouch({ x: 50, y: 50 });
      
      const recording = gameState.stopRecording();
      
      expect(recording?.events).toHaveLength(2);
      expect(recording?.events[0]).toMatchObject({
        time: 100,
        type: 'key',
        data: { key: 'q' }
      });
      expect(recording?.events[1]).toMatchObject({
        time: 200,
        type: 'touch',
        data: { touch: { x: 50, y: 50 } }
      });
    });

    it('should stop recording and return recording', () => {
      const stopSpy = jest.fn();
      gameState.on('recordingStopped', stopSpy);
      
      gameState.startRecording();
      jest.setSystemTime(2000);
      
      const recording = gameState.stopRecording();
      
      expect(gameState.isRecordingActive()).toBe(false);
      expect(recording).toMatchObject({
        id: expect.stringContaining('rec_'),
        timestamp: 1000,
        duration: 1000,
        events: []
      });
      expect(stopSpy).toHaveBeenCalledWith(recording);
    });

    it('should return null when stopping without recording', () => {
      const recording = gameState.stopRecording();
      
      expect(recording).toBeNull();
    });

    it('should save recordings', () => {
      gameState.startRecording();
      gameState.recordKeyPress('q');
      gameState.stopRecording();
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(saved.recordings).toHaveLength(1);
    });

    it('should limit saved recordings to 5', () => {
      // Create 6 recordings
      for (let i = 0; i < 6; i++) {
        gameState.startRecording();
        gameState.recordKeyPress(`key${i}`);
        gameState.stopRecording();
      }
      
      const lastCall = localStorageMock.setItem.mock.calls.slice(-1)[0];
      const saved = JSON.parse(lastCall[1]);
      expect(saved.recordings).toHaveLength(5);
    });
  });

  describe('recording playback', () => {
    let recording: Recording;

    beforeEach(() => {
      jest.useFakeTimers();
      
      // Create a sample recording
      gameState.startRecording();
      jest.setSystemTime(1100);
      gameState.recordKeyPress('q');
      jest.setSystemTime(1200);
      gameState.recordTouch({ x: 100, y: 100 });
      recording = gameState.stopRecording()!;
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should play recording', () => {
      const playbackStartSpy = jest.fn();
      const playbackKeySpy = jest.fn();
      const playbackTouchSpy = jest.fn();
      const playbackCompleteSpy = jest.fn();
      
      gameState.on('playbackStarted', playbackStartSpy);
      gameState.on('playbackKey', playbackKeySpy);
      gameState.on('playbackTouch', playbackTouchSpy);
      gameState.on('playbackComplete', playbackCompleteSpy);
      
      gameState.playRecording(recording.id);
      
      expect(playbackStartSpy).toHaveBeenCalledWith(recording);
      
      // Fast forward to first event
      jest.advanceTimersByTime(100);
      expect(playbackKeySpy).toHaveBeenCalledWith('q');
      
      // Fast forward to second event
      jest.advanceTimersByTime(100);
      expect(playbackTouchSpy).toHaveBeenCalledWith({ x: 100, y: 100 });
      
      // Fast forward to completion
      jest.advanceTimersByTime(recording.duration - 200);
      expect(playbackCompleteSpy).toHaveBeenCalledWith(recording);
    });

    it('should handle non-existent recording', () => {
      const playbackStartSpy = jest.fn();
      gameState.on('playbackStarted', playbackStartSpy);
      
      gameState.playRecording('fake-id');
      
      expect(playbackStartSpy).not.toHaveBeenCalled();
    });
  });

  describe('session stats', () => {
    it('should track session duration', () => {
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(1000) // Constructor
        .mockReturnValueOnce(1000) // Session start
        .mockReturnValueOnce(5000); // Get stats
      
      gameState = new GameState();
      const stats = gameState.getSessionStats();
      
      expect(stats.sessionDuration).toBe(4000);
    });

    it('should accumulate stats', () => {
      gameState.recordKeyPress('q');
      gameState.recordKeyPress('w');
      gameState.recordTouch({ x: 0, y: 0 });
      gameState.addToRecording({});
      gameState.addToRecording({});
      gameState.addToRecording({});
      
      const stats = gameState.getSessionStats();
      
      expect(stats.keysPressed).toBe(2);
      expect(stats.touchesRecorded).toBe(1);
      expect(stats.soundsPlayed).toBe(3);
    });
  });

  describe('getters', () => {
    it('should get recordings', () => {
      gameState.startRecording();
      gameState.recordKeyPress('q');
      const recording = gameState.stopRecording()!;
      
      const recordings = gameState.getRecordings();
      expect(recordings).toHaveLength(1);
      expect(recordings[0].id).toBe(recording.id);
    });

    it('should return copy of settings', () => {
      const settings1 = gameState.getSettings();
      settings1.volume = 0;
      
      const settings2 = gameState.getSettings();
      expect(settings2.volume).toBe(0.8); // Original value unchanged
    });

    it('should return copy of recordings array', () => {
      gameState.startRecording();
      gameState.stopRecording();
      
      const recordings1 = gameState.getRecordings();
      recordings1.push({} as any);
      
      const recordings2 = gameState.getRecordings();
      expect(recordings2.length).toBe(1); // Original unchanged
    });
  });

  describe('update method', () => {
    it('should have update method for game loop', () => {
      expect(() => {
        gameState.update(16);
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle events without recording', () => {
      expect(() => {
        gameState.recordKeyPress('q');
        gameState.recordTouch({ x: 0, y: 0 });
      }).not.toThrow();
    });

    it('should handle empty recordings', () => {
      gameState.startRecording();
      const recording = gameState.stopRecording();
      
      expect(recording?.events).toHaveLength(0);
    });

    it('should handle localStorage errors', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage full');
      });
      
      gameState.updateSettings({ volume: 0.5 });
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save game state:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle load errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Access denied');
      });
      
      expect(() => {
        gameState = new GameState();
      }).not.toThrow();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load game state:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
  });
});