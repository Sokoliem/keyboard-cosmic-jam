import { GameEngine, GameEngineConfig } from '@game/core/GameEngine';
import { AudioEngine } from '@game/audio/AudioEngine';
import { VisualEngine } from '@game/visuals/VisualEngine';
import { InputManager } from '@game/core/InputManager';
import { RecordingEngine, Recording } from '@game/audio/RecordingEngine';
import { GameState } from '@game/core/GameState';
import { ScoringSystem } from '@game/core/ScoringSystem';
import { AchievementSystem } from '@game/core/AchievementSystem';
import { ProgressionSystem } from '@game/core/ProgressionSystem';
import { StoryMode } from '@game/modes/StoryMode';

// Mock all dependencies
jest.mock('@game/audio/AudioEngine');
jest.mock('@game/visuals/VisualEngine');
jest.mock('@game/core/InputManager');
jest.mock('@game/audio/RecordingEngine');
jest.mock('@game/core/GameState');
jest.mock('@game/core/ScoringSystem');
jest.mock('@game/core/AchievementSystem');
jest.mock('@game/core/ProgressionSystem');
jest.mock('@game/modes/StoryMode');

// Mock requestAnimationFrame/cancelAnimationFrame
const mockAnimationFrame = jest.fn();
const mockCancelAnimationFrame = jest.fn();
global.requestAnimationFrame = mockAnimationFrame;
global.cancelAnimationFrame = mockCancelAnimationFrame;

describe('GameEngine', () => {
  let gameEngine: GameEngine;
  let mockAudioEngine: jest.Mocked<AudioEngine>;
  let mockVisualEngine: jest.Mocked<VisualEngine>;
  let mockInputManager: jest.Mocked<InputManager>;
  let mockRecordingEngine: jest.Mocked<RecordingEngine>;
  let mockGameState: jest.Mocked<GameState>;
  let mockScoringSystem: jest.Mocked<ScoringSystem>;
  let mockAchievementSystem: jest.Mocked<AchievementSystem>;
  let mockProgressionSystem: jest.Mocked<ProgressionSystem>;
  let mockStoryMode: jest.Mocked<StoryMode>;
  let config: GameEngineConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mocked instances
    mockAudioEngine = {
      initialize: jest.fn().mockResolvedValue(undefined),
      playKeySound: jest.fn().mockResolvedValue({
        key: 'a',
        instrument: 'synthPad',
        note: 'A',
        octave: 4,
        frequency: 440,
        volume: 0.8,
        duration: 0.5,
        color: '#FF0000'
      }),
      playZoneSound: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
      cleanup: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
      removeAllListeners: jest.fn()
    } as any;

    mockVisualEngine = {
      initialize: jest.fn().mockResolvedValue(undefined),
      triggerKeyEffect: jest.fn(),
      triggerTouchEffect: jest.fn(),
      triggerMultiplierEffect: jest.fn(),
      triggerCelebrationEffect: jest.fn(),
      showTouchZones: jest.fn(),
      updateTouchZones: jest.fn(),
      removeEffect: jest.fn(),
      update: jest.fn(),
      cleanup: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
      removeAllListeners: jest.fn()
    } as any;

    mockInputManager = {
      initialize: jest.fn(),
      getTouchZone: jest.fn().mockReturnValue({
        keys: ['a'],
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        instrument: 'synthPad',
        color: '#FF0000'
      }),
      getTouchZones: jest.fn().mockReturnValue([]),
      cleanup: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
      removeAllListeners: jest.fn()
    } as any;

    mockRecordingEngine = {
      recordNote: jest.fn(),
      finishNote: jest.fn(),
      startRecording: jest.fn().mockReturnValue(true),
      stopRecording: jest.fn().mockReturnValue({
        id: 'test-recording',
        name: 'Test Recording',
        timestamp: Date.now(),
        duration: 1000,
        notes: []
      }),
      pauseRecording: jest.fn().mockReturnValue(true),
      resumeRecording: jest.fn().mockReturnValue(true),
      playRecording: jest.fn().mockReturnValue(true),
      stopPlayback: jest.fn(),
      getRecordings: jest.fn().mockReturnValue([]),
      deleteRecording: jest.fn().mockReturnValue(true),
      renameRecording: jest.fn().mockReturnValue(true),
      exportRecording: jest.fn().mockReturnValue('{}'),
      importRecording: jest.fn().mockReturnValue(null),
      on: jest.fn(),
      emit: jest.fn(),
      removeAllListeners: jest.fn()
    } as any;

    mockGameState = {
      recordKeyPress: jest.fn(),
      recordTouch: jest.fn(),
      addToRecording: jest.fn(),
      getCurrentMode: jest.fn().mockReturnValue('sandbox'),
      update: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
      removeAllListeners: jest.fn()
    } as any;

    mockScoringSystem = {
      notePressed: jest.fn().mockReturnValue({
        basePoints: 100,
        comboMultiplier: 1.0,
        accuracyMultiplier: 1.0,
        totalPoints: 100,
        combo: 1,
        accuracy: 1.0,
        timestamp: Date.now()
      }),
      reset: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
      removeAllListeners: jest.fn()
    } as any;

    mockAchievementSystem = {
      notePlayedWithAccuracy: jest.fn(),
      comboReached: jest.fn(),
      scoreReached: jest.fn(),
      recordingMade: jest.fn(),
      instrumentUsed: jest.fn(),
      updateStats: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
      removeAllListeners: jest.fn()
    } as any;

    mockProgressionSystem = {
      on: jest.fn(),
      emit: jest.fn(),
      removeAllListeners: jest.fn()
    } as any;

    mockStoryMode = {
      updateProgress: jest.fn(),
      startLevel: jest.fn().mockReturnValue(true),
      endLevel: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
      removeAllListeners: jest.fn()
    } as any;

    // Mock constructors
    (AudioEngine as jest.Mock).mockImplementation(() => mockAudioEngine);
    (VisualEngine as jest.Mock).mockImplementation(() => mockVisualEngine);
    (InputManager as jest.Mock).mockImplementation(() => mockInputManager);
    (RecordingEngine as jest.Mock).mockImplementation(() => mockRecordingEngine);
    (GameState as jest.Mock).mockImplementation(() => mockGameState);
    (ScoringSystem as jest.Mock).mockImplementation(() => mockScoringSystem);
    (AchievementSystem as jest.Mock).mockImplementation(() => mockAchievementSystem);
    (ProgressionSystem as jest.Mock).mockImplementation(() => mockProgressionSystem);
    (StoryMode as jest.Mock).mockImplementation(() => mockStoryMode);

    config = {
      audioEngine: mockAudioEngine,
      visualEngine: mockVisualEngine,
      inputManager: mockInputManager,
      recordingEngine: mockRecordingEngine
    };

    gameEngine = new GameEngine(config);
  });

  afterEach(() => {
    gameEngine.stop();
  });

  describe('initialization', () => {
    it('should initialize with provided engines', () => {
      expect(gameEngine.getAudioEngine()).toBe(mockAudioEngine);
      expect(gameEngine.getVisualEngine()).toBe(mockVisualEngine);
      expect(gameEngine.getInputManager()).toBe(mockInputManager);
      expect(gameEngine.getRecordingEngine()).toBe(mockRecordingEngine);
    });

    it('should create default recording engine if not provided', () => {
      const configWithoutRecording = {
        audioEngine: mockAudioEngine,
        visualEngine: mockVisualEngine,
        inputManager: mockInputManager
      };
      
      const engine = new GameEngine(configWithoutRecording);
      expect(engine.getRecordingEngine()).toBeDefined();
      
      engine.stop();
    });

    it('should setup all subsystems', () => {
      expect(GameState).toHaveBeenCalled();
      expect(ScoringSystem).toHaveBeenCalled();
      expect(AchievementSystem).toHaveBeenCalled();
      expect(ProgressionSystem).toHaveBeenCalled();
      expect(StoryMode).toHaveBeenCalled();
    });

    it('should setup event listeners', () => {
      expect(mockInputManager.on).toHaveBeenCalledWith('keyPress', expect.any(Function));
      expect(mockInputManager.on).toHaveBeenCalledWith('keyRelease', expect.any(Function));
      expect(mockInputManager.on).toHaveBeenCalledWith('touchPress', expect.any(Function));
      expect(mockInputManager.on).toHaveBeenCalledWith('touchRelease', expect.any(Function));
    });
  });

  describe('game lifecycle', () => {
    it('should start all systems', async () => {
      await gameEngine.start();
      
      expect(mockAudioEngine.initialize).toHaveBeenCalled();
      expect(mockVisualEngine.initialize).toHaveBeenCalled();
      expect(mockInputManager.initialize).toHaveBeenCalled();
      expect(mockAnimationFrame).toHaveBeenCalled();
    });

    it('should not start if already running', async () => {
      await gameEngine.start();
      const initCalls = mockAudioEngine.initialize.mock.calls.length;
      
      await gameEngine.start(); // Second call
      
      expect(mockAudioEngine.initialize).toHaveBeenCalledTimes(initCalls);
    });

    it('should handle initialization failures', async () => {
      mockAudioEngine.initialize.mockRejectedValueOnce(new Error('Audio init failed'));
      
      await expect(gameEngine.start()).rejects.toThrow('Audio init failed');
    });

    it('should stop all systems', async () => {
      await gameEngine.start();
      gameEngine.stop();
      
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
      expect(mockAudioEngine.cleanup).toHaveBeenCalled();
      expect(mockVisualEngine.cleanup).toHaveBeenCalled();
      expect(mockInputManager.cleanup).toHaveBeenCalled();
    });

    it('should emit game lifecycle events', async () => {
      const startSpy = jest.fn();
      const stopSpy = jest.fn();
      
      gameEngine.on('gameStarted', startSpy);
      gameEngine.on('gameStopped', stopSpy);
      
      await gameEngine.start();
      gameEngine.stop();
      
      expect(startSpy).toHaveBeenCalled();
      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('input handling', () => {
    beforeEach(async () => {
      await gameEngine.start();
    });

    it('should handle key press events', async () => {
      const keyPressHandler = mockInputManager.on.mock.calls.find(
        call => call[0] === 'keyPress'
      )?.[1];

      await keyPressHandler?.('a');

      expect(mockAudioEngine.playKeySound).toHaveBeenCalledWith('a');
      expect(mockGameState.recordKeyPress).toHaveBeenCalledWith('a');
      expect(mockRecordingEngine.recordNote).toHaveBeenCalled();
      expect(mockVisualEngine.triggerKeyEffect).toHaveBeenCalled();
    });

    it('should handle key release events', () => {
      const keyReleaseHandler = mockInputManager.on.mock.calls.find(
        call => call[0] === 'keyRelease'
      )?.[1];

      keyReleaseHandler?.('a');

      expect(mockRecordingEngine.finishNote).toHaveBeenCalledWith('a', expect.any(Object));
    });

    it('should handle touch press events', async () => {
      const touchPressHandler = mockInputManager.on.mock.calls.find(
        call => call[0] === 'touchPress'
      )?.[1];

      const touch = { x: 100, y: 100 };
      await touchPressHandler?.(touch);

      expect(mockInputManager.getTouchZone).toHaveBeenCalledWith(touch);
      expect(mockAudioEngine.playZoneSound).toHaveBeenCalled();
      expect(mockGameState.recordTouch).toHaveBeenCalledWith(touch);
    });

    it('should handle touch release events', () => {
      const touchReleaseHandler = mockInputManager.on.mock.calls.find(
        call => call[0] === 'touchRelease'
      )?.[1];

      const touch = { x: 100, y: 100 };
      touchReleaseHandler?.(touch);

      expect(mockInputManager.getTouchZone).toHaveBeenCalledWith(touch);
      expect(mockRecordingEngine.finishNote).toHaveBeenCalled();
    });

    it('should ignore invalid touch zones', async () => {
      mockInputManager.getTouchZone.mockReturnValueOnce(null);
      
      const touchPressHandler = mockInputManager.on.mock.calls.find(
        call => call[0] === 'touchPress'
      )?.[1];

      await touchPressHandler?.({ x: 100, y: 100 });

      expect(mockAudioEngine.playZoneSound).not.toHaveBeenCalled();
    });
  });

  describe('scoring system integration', () => {
    beforeEach(async () => {
      await gameEngine.start();
    });

    it('should track score on note events', async () => {
      const keyPressHandler = mockInputManager.on.mock.calls.find(
        call => call[0] === 'keyPress'
      )?.[1];

      await keyPressHandler?.('a');

      expect(mockScoringSystem.notePressed).toHaveBeenCalled();
    });

    it('should emit scoring events', () => {
      const scoringSpy = jest.fn();
      gameEngine.on('noteScored', scoringSpy);

      // Simulate scoring system event
      const scoringHandler = mockScoringSystem.on.mock.calls.find(
        call => call[0] === 'noteScored'
      )?.[1];
      
      const scoreEvent = { totalPoints: 100, combo: 1 };
      scoringHandler?.(scoreEvent);

      expect(scoringSpy).toHaveBeenCalledWith(scoreEvent);
    });

    it('should trigger visual effects on score events', () => {
      const multiplierHandler = mockScoringSystem.on.mock.calls.find(
        call => call[0] === 'multiplierReached'
      )?.[1];
      
      const multiplierData = { multiplier: 2, threshold: 10 };
      multiplierHandler?.(multiplierData);

      expect(mockVisualEngine.triggerMultiplierEffect).toHaveBeenCalledWith(multiplierData);
    });

    it('should handle score milestones', () => {
      const milestoneHandler = mockScoringSystem.on.mock.calls.find(
        call => call[0] === 'milestone'
      )?.[1];
      
      const milestoneData = { type: 'score', value: 1000 };
      milestoneHandler?.(milestoneData);

      expect(mockVisualEngine.triggerCelebrationEffect).toHaveBeenCalledWith(milestoneData);
    });
  });

  describe('achievement system integration', () => {
    beforeEach(async () => {
      await gameEngine.start();
    });

    it('should track achievements on score updates', () => {
      const scoreHandler = mockScoringSystem.on.mock.calls.find(
        call => call[0] === 'scoreUpdated'
      )?.[1];
      
      const scoreState = { totalScore: 500, currentCombo: 5 };
      scoreHandler?.(scoreState);

      expect(mockAchievementSystem.comboReached).toHaveBeenCalledWith(5);
      expect(mockAchievementSystem.scoreReached).toHaveBeenCalledWith(500);
    });

    it('should trigger visual celebrations for achievements', () => {
      const achievementHandler = mockAchievementSystem.on.mock.calls.find(
        call => call[0] === 'achievementUnlocked'
      )?.[1];
      
      const achievement = { name: 'First Notes', description: 'Play 10 notes' };
      achievementHandler?.(achievement);

      expect(mockVisualEngine.triggerCelebrationEffect).toHaveBeenCalledWith({
        type: 'achievement',
        value: 1,
        name: achievement.name
      });
    });

    it('should track instrument usage for achievements', async () => {
      const keyPressHandler = mockInputManager.on.mock.calls.find(
        call => call[0] === 'keyPress'
      )?.[1];

      await keyPressHandler?.('a');

      expect(mockAchievementSystem.instrumentUsed).toHaveBeenCalledWith('synthPad');
    });
  });

  describe('story mode integration', () => {
    beforeEach(async () => {
      await gameEngine.start();
      mockGameState.getCurrentMode.mockReturnValue('story');
    });

    it('should update story progress on note events', async () => {
      const keyPressHandler = mockInputManager.on.mock.calls.find(
        call => call[0] === 'keyPress'
      )?.[1];

      await keyPressHandler?.('a');

      expect(mockStoryMode.updateProgress).toHaveBeenCalledWith({
        notePlayed: true,
        key: 'a',
        instrument: 'synthPad'
      });
    });

    it('should start story levels', () => {
      const result = gameEngine.startStoryLevel(1);

      expect(mockStoryMode.startLevel).toHaveBeenCalledWith(1);
      expect(mockScoringSystem.reset).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should end story levels', () => {
      gameEngine.endStoryLevel();

      expect(mockStoryMode.endLevel).toHaveBeenCalled();
    });
  });

  describe('recording functionality', () => {
    it('should start recording', () => {
      const result = gameEngine.startRecording('Test Recording');

      expect(mockRecordingEngine.startRecording).toHaveBeenCalledWith('Test Recording');
      expect(result).toBe(true);
    });

    it('should stop recording', () => {
      const recording = gameEngine.stopRecording();

      expect(mockRecordingEngine.stopRecording).toHaveBeenCalled();
      expect(recording).toBeDefined();
    });

    it('should pause and resume recording', () => {
      expect(gameEngine.pauseRecording()).toBe(true);
      expect(gameEngine.resumeRecording()).toBe(true);

      expect(mockRecordingEngine.pauseRecording).toHaveBeenCalled();
      expect(mockRecordingEngine.resumeRecording).toHaveBeenCalled();
    });

    it('should play recordings', () => {
      const recording: Recording = {
        id: 'test',
        name: 'Test',
        timestamp: Date.now(),
        duration: 1000,
        notes: []
      };

      const result = gameEngine.playRecording(recording, 1.5);

      expect(mockRecordingEngine.playRecording).toHaveBeenCalledWith(recording, 1.5);
      expect(result).toBe(true);
    });

    it('should manage recording collection', () => {
      gameEngine.getRecordings();
      gameEngine.deleteRecording('test-id');
      gameEngine.renameRecording('test-id', 'New Name');

      expect(mockRecordingEngine.getRecordings).toHaveBeenCalled();
      expect(mockRecordingEngine.deleteRecording).toHaveBeenCalledWith('test-id');
      expect(mockRecordingEngine.renameRecording).toHaveBeenCalledWith('test-id', 'New Name');
    });

    it('should handle recording events', () => {
      const recordingStartSpy = jest.fn();
      const recordingStopSpy = jest.fn();
      
      gameEngine.on('recordingStarted', recordingStartSpy);
      gameEngine.on('recordingStopped', recordingStopSpy);

      // Simulate recording engine events
      const startHandler = mockRecordingEngine.on.mock.calls.find(
        call => call[0] === 'recordingStarted'
      )?.[1];
      const stopHandler = mockRecordingEngine.on.mock.calls.find(
        call => call[0] === 'recordingStopped'
      )?.[1];

      const recording = { id: 'test', name: 'Test' };
      startHandler?.(recording);
      stopHandler?.(recording);

      expect(recordingStartSpy).toHaveBeenCalledWith(recording);
      expect(recordingStopSpy).toHaveBeenCalledWith(recording);
    });
  });

  describe('game loop', () => {
    beforeEach(async () => {
      await gameEngine.start();
    });

    it('should run game loop when started', () => {
      expect(mockAnimationFrame).toHaveBeenCalled();
    });

    it('should update all systems in game loop', () => {
      const gameLoopCallback = mockAnimationFrame.mock.calls[0][0];
      
      // Simulate time passage
      jest.spyOn(performance, 'now').mockReturnValue(1000);
      gameLoopCallback(1000);

      expect(mockAudioEngine.update).toHaveBeenCalledWith(expect.any(Number));
      expect(mockVisualEngine.update).toHaveBeenCalledWith(expect.any(Number));
      expect(mockGameState.update).toHaveBeenCalledWith(expect.any(Number));
      expect(mockAchievementSystem.updateStats).toHaveBeenCalledWith({
        totalPlayTime: expect.any(Number)
      });
    });

    it('should continue loop when running', () => {
      const gameLoopCallback = mockAnimationFrame.mock.calls[0][0];
      
      gameLoopCallback(1000);

      expect(mockAnimationFrame).toHaveBeenCalledTimes(2); // Initial + continuation
    });

    it('should stop loop when not running', () => {
      const gameLoopCallback = mockAnimationFrame.mock.calls[0][0];
      
      gameEngine.stop();
      gameLoopCallback(1000);

      // Should not continue the loop
      expect(mockAnimationFrame).toHaveBeenCalledTimes(1); // Only initial
    });
  });

  describe('touch zone management', () => {
    beforeEach(async () => {
      await gameEngine.start();
    });

    it('should setup touch zone display', () => {
      expect(mockInputManager.getTouchZones).toHaveBeenCalled();
      expect(mockVisualEngine.showTouchZones).toHaveBeenCalled();
    });

    it('should handle window resize for touch zones', () => {
      const resizeEvent = new Event('resize');
      
      // Simulate resize
      window.dispatchEvent(resizeEvent);
      
      // Wait for timeout
      setTimeout(() => {
        expect(mockInputManager.initialize).toHaveBeenCalled();
        expect(mockVisualEngine.updateTouchZones).toHaveBeenCalled();
      }, 150);
    });
  });

  describe('error handling', () => {
    it('should handle audio system errors gracefully', async () => {
      mockAudioEngine.playKeySound.mockRejectedValueOnce(new Error('Audio error'));
      
      await gameEngine.start();
      
      const keyPressHandler = mockInputManager.on.mock.calls.find(
        call => call[0] === 'keyPress'
      )?.[1];

      // Should not throw
      await expect(keyPressHandler?.('a')).resolves.toBeUndefined();
    });

    it('should handle missing sound results', async () => {
      mockAudioEngine.playKeySound.mockResolvedValueOnce(null);
      
      await gameEngine.start();
      
      const keyPressHandler = mockInputManager.on.mock.calls.find(
        call => call[0] === 'keyPress'
      )?.[1];

      await keyPressHandler?.('a');

      // Should still record key press even if no sound
      expect(mockGameState.recordKeyPress).toHaveBeenCalledWith('a');
    });

    it('should handle touch zone errors', async () => {
      mockInputManager.getTouchZone.mockImplementationOnce(() => {
        throw new Error('Touch zone error');
      });
      
      await gameEngine.start();
      
      const touchPressHandler = mockInputManager.on.mock.calls.find(
        call => call[0] === 'touchPress'
      )?.[1];

      // Should not throw
      await expect(touchPressHandler?.({ x: 0, y: 0 })).resolves.toBeUndefined();
    });
  });

  describe('event system integration', () => {
    it('should handle audio system events', () => {
      const soundPlayedHandler = mockAudioEngine.on.mock.calls.find(
        call => call[0] === 'soundPlayed'
      )?.[1];
      
      const soundData = { frequency: 440, instrument: 'synthPad' };
      soundPlayedHandler?.(soundData);

      expect(mockGameState.addToRecording).toHaveBeenCalledWith(soundData);
    });

    it('should handle visual system events', () => {
      const effectCompleteHandler = mockVisualEngine.on.mock.calls.find(
        call => call[0] === 'effectComplete'
      )?.[1];
      
      const effectId = 'effect-123';
      effectCompleteHandler?.(effectId);

      expect(mockVisualEngine.removeEffect).toHaveBeenCalledWith(effectId);
    });

    it('should handle playback events', async () => {
      await gameEngine.start();
      
      const playbackNoteHandler = mockRecordingEngine.on.mock.calls.find(
        call => call[0] === 'playbackNote'
      )?.[1];
      
      const recordedNote = { key: 'a', timestamp: 0 };
      await playbackNoteHandler?.(recordedNote);

      expect(mockAudioEngine.playKeySound).toHaveBeenCalledWith('a');
      expect(mockVisualEngine.triggerKeyEffect).toHaveBeenCalled();
    });
  });

  describe('system getters', () => {
    it('should provide access to all systems', () => {
      expect(gameEngine.getState()).toBe(mockGameState);
      expect(gameEngine.getScoringSystem()).toBe(mockScoringSystem);
      expect(gameEngine.getAchievementSystem()).toBe(mockAchievementSystem);
      expect(gameEngine.getStoryMode()).toBe(mockStoryMode);
    });

    it('should reset score system', () => {
      gameEngine.resetScore();
      expect(mockScoringSystem.reset).toHaveBeenCalled();
    });
  });

  describe('data export/import', () => {
    it('should export recordings', () => {
      const recording: Recording = {
        id: 'test',
        name: 'Test',
        timestamp: Date.now(),
        duration: 1000,
        notes: []
      };

      const result = gameEngine.exportRecording(recording);

      expect(mockRecordingEngine.exportRecording).toHaveBeenCalledWith(recording);
      expect(result).toBe('{}');
    });

    it('should import recordings', () => {
      const recordingData = '{"id":"test","name":"Test"}';
      
      gameEngine.importRecording(recordingData);

      expect(mockRecordingEngine.importRecording).toHaveBeenCalledWith(recordingData);
    });
  });

  describe('performance considerations', () => {
    it('should handle rapid input without lag', async () => {
      await gameEngine.start();
      
      const keyPressHandler = mockInputManager.on.mock.calls.find(
        call => call[0] === 'keyPress'
      )?.[1];

      // Simulate rapid key presses
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(keyPressHandler?.('a'));
      }

      await Promise.all(promises);

      expect(mockAudioEngine.playKeySound).toHaveBeenCalledTimes(10);
      expect(mockGameState.recordKeyPress).toHaveBeenCalledTimes(10);
    });

    it('should maintain consistent timing in game loop', () => {
      const timestamps = [1000, 1016, 1032, 1048]; // 60 FPS timing
      let callIndex = 0;
      
      jest.spyOn(performance, 'now').mockImplementation(() => {
        return timestamps[callIndex++] || timestamps[timestamps.length - 1];
      });

      const gameLoopCallback = mockAnimationFrame.mock.calls[0][0];
      
      gameLoopCallback(timestamps[1]);
      gameLoopCallback(timestamps[2]);
      gameLoopCallback(timestamps[3]);

      // Each update should receive approximately 16ms delta
      expect(mockAudioEngine.update).toHaveBeenCalledWith(16);
      expect(mockVisualEngine.update).toHaveBeenCalledWith(16);
      expect(mockGameState.update).toHaveBeenCalledWith(16);
    });
  });

  describe('memory management', () => {
    it('should cleanup all systems on stop', () => {
      gameEngine.stop();

      expect(mockAudioEngine.cleanup).toHaveBeenCalled();
      expect(mockVisualEngine.cleanup).toHaveBeenCalled();
      expect(mockInputManager.cleanup).toHaveBeenCalled();
    });

    it('should not create duplicate initialization', async () => {
      await gameEngine.start();
      await gameEngine.start(); // Second start call

      expect(mockAudioEngine.initialize).toHaveBeenCalledTimes(1);
      expect(mockVisualEngine.initialize).toHaveBeenCalledTimes(1);
      expect(mockInputManager.initialize).toHaveBeenCalledTimes(1);
    });

    it('should handle stop when not running', () => {
      expect(() => gameEngine.stop()).not.toThrow();
      expect(mockCancelAnimationFrame).not.toHaveBeenCalled();
    });
  });
});
