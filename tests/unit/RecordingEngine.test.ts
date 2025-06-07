import { RecordingEngine, Recording, RecordedNote, PlaybackState } from '@game/audio/RecordingEngine';
import { SoundConfig } from '@game/audio/AudioEngine';

// Mock performance.now for timing tests
const mockPerformanceNow = jest.fn();
global.performance.now = mockPerformanceNow;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock as any;

// Mock setTimeout/clearTimeout for playback tests  
const timeoutIds: number[] = [];
const mockSetTimeout = jest.fn((callback: Function, delay: number) => {
  const id = Math.random();
  timeoutIds.push(id);
  // Execute immediately for testing
  setTimeout(() => callback(), 0);
  return id;
});
const mockClearTimeout = jest.fn();
global.setTimeout = mockSetTimeout as any;
global.clearTimeout = mockClearTimeout as any;

describe('RecordingEngine', () => {
  let recordingEngine: RecordingEngine;
  let mockSoundConfig: SoundConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceNow.mockReturnValue(1000);
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    
    recordingEngine = new RecordingEngine();
    
    mockSoundConfig = {
      key: 'a',
      instrument: 'synthPad',
      note: 'A',
      octave: 4,
      frequency: 440,
      volume: 0.8,
      duration: 0.5,
      color: '#FF0000'
    };
  });

  afterEach(() => {
    recordingEngine.cleanup();
  });

  describe('recording lifecycle', () => {
    it('should start recording with default name', () => {
      const startSpy = jest.fn();
      recordingEngine.on('recordingStarted', startSpy);
      
      const result = recordingEngine.startRecording();
      
      expect(result).toBe(true);
      expect(startSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(/^recording_/),
          name: expect.stringMatching(/^Recording \d+$/),
          notes: [],
          duration: 0
        })
      );
    });

    it('should start recording with custom name', () => {
      const startSpy = jest.fn();
      recordingEngine.on('recordingStarted', startSpy);
      
      const customName = 'My Song';
      recordingEngine.startRecording(customName);
      
      expect(startSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: customName
        })
      );
    });

    it('should not start recording if already recording', () => {
      recordingEngine.startRecording();
      const result = recordingEngine.startRecording();
      
      expect(result).toBe(false);
    });

    it('should not start recording if playing back', () => {
      const mockRecording: Recording = {
        id: 'test',
        name: 'Test',
        timestamp: Date.now(),
        duration: 1000,
        notes: []
      };
      
      recordingEngine.playRecording(mockRecording);
      const result = recordingEngine.startRecording();
      
      expect(result).toBe(false);
    });

    it('should stop recording and return recording data', () => {
      const stopSpy = jest.fn();
      recordingEngine.on('recordingStopped', stopSpy);
      
      recordingEngine.startRecording('Test Recording');
      mockPerformanceNow.mockReturnValue(2000); // 1 second elapsed
      
      const result = recordingEngine.stopRecording();
      
      expect(result).toEqual(
        expect.objectContaining({
          name: 'Test Recording',
          duration: 1000,
          notes: []
        })
      );
      expect(stopSpy).toHaveBeenCalledWith(result);
    });

    it('should return null when stopping if not recording', () => {
      const result = recordingEngine.stopRecording();
      expect(result).toBe(null);
    });
  });

  describe('note recording', () => {
    beforeEach(() => {
      recordingEngine.startRecording();
    });

    it('should record note start', () => {
      mockPerformanceNow.mockReturnValue(1500); // 500ms into recording
      
      recordingEngine.recordNote('a', mockSoundConfig);
      
      const state = recordingEngine.getRecordingState();
      expect(state.isRecording).toBe(true);
    });

    it('should record note with duration', () => {
      const noteSpy = jest.fn();
      recordingEngine.on('noteRecorded', noteSpy);
      
      // Start note
      mockPerformanceNow.mockReturnValue(1500);
      recordingEngine.recordNote('a', mockSoundConfig);
      
      // End note
      mockPerformanceNow.mockReturnValue(2000);
      recordingEngine.finishNote('a', mockSoundConfig);
      
      expect(noteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'a',
          timestamp: 500,
          duration: 500,
          soundConfig: mockSoundConfig
        })
      );
    });

    it('should handle overlapping notes on different keys', () => {
      const noteSpy = jest.fn();
      recordingEngine.on('noteRecorded', noteSpy);
      
      // Start first note
      mockPerformanceNow.mockReturnValue(1200);
      recordingEngine.recordNote('a', mockSoundConfig);
      
      // Start second note
      mockPerformanceNow.mockReturnValue(1400);
      recordingEngine.recordNote('s', { ...mockSoundConfig, key: 's' });
      
      // End first note
      mockPerformanceNow.mockReturnValue(1700);
      recordingEngine.finishNote('a', mockSoundConfig);
      
      // End second note
      mockPerformanceNow.mockReturnValue(1900);
      recordingEngine.finishNote('s', { ...mockSoundConfig, key: 's' });
      
      expect(noteSpy).toHaveBeenCalledTimes(2);
    });

    it('should not record notes when not recording', () => {
      recordingEngine.stopRecording();
      
      recordingEngine.recordNote('a', mockSoundConfig);
      recordingEngine.finishNote('a', mockSoundConfig);
      
      const recordings = recordingEngine.getRecordings();
      const lastRecording = recordings[0];
      expect(lastRecording.notes).toHaveLength(0);
    });

    it('should handle missing note start gracefully', () => {
      const noteSpy = jest.fn();
      recordingEngine.on('noteRecorded', noteSpy);
      
      recordingEngine.finishNote('x', mockSoundConfig);
      
      expect(noteSpy).not.toHaveBeenCalled();
    });
  });

  describe('recording pause/resume', () => {
    beforeEach(() => {
      recordingEngine.startRecording();
    });

    it('should pause recording', () => {
      const pauseSpy = jest.fn();
      recordingEngine.on('recordingPaused', pauseSpy);
      
      const result = recordingEngine.pauseRecording();
      
      expect(result).toBe(true);
      expect(pauseSpy).toHaveBeenCalled();
      
      const state = recordingEngine.getRecordingState();
      expect(state.isPaused).toBe(true);
    });

    it('should resume recording', () => {
      recordingEngine.pauseRecording();
      
      const resumeSpy = jest.fn();
      recordingEngine.on('recordingResumed', resumeSpy);
      
      const result = recordingEngine.resumeRecording();
      
      expect(result).toBe(true);
      expect(resumeSpy).toHaveBeenCalled();
      
      const state = recordingEngine.getRecordingState();
      expect(state.isPaused).toBe(false);
    });

    it('should not pause if not recording', () => {
      recordingEngine.stopRecording();
      const result = recordingEngine.pauseRecording();
      expect(result).toBe(false);
    });

    it('should not resume if not paused', () => {
      const result = recordingEngine.resumeRecording();
      expect(result).toBe(false);
    });

    it('should finish active notes when pausing', () => {
      // Start a note
      recordingEngine.recordNote('a', mockSoundConfig);
      
      // Pause should finish the note
      recordingEngine.pauseRecording();
      
      const recording = recordingEngine.stopRecording();
      expect(recording?.notes).toHaveLength(1);
    });
  });

  describe('playback system', () => {
    let testRecording: Recording;

    beforeEach(() => {
      testRecording = {
        id: 'test-recording',
        name: 'Test Recording',
        timestamp: Date.now(),
        duration: 2000,
        notes: [
          {
            timestamp: 0,
            key: 'a',
            soundConfig: mockSoundConfig,
            duration: 500
          },
          {
            timestamp: 1000,
            key: 's',
            soundConfig: { ...mockSoundConfig, key: 's' },
            duration: 500
          }
        ]
      };
    });

    it('should start playback', () => {
      const playSpy = jest.fn();
      recordingEngine.on('playbackStarted', playSpy);
      
      const result = recordingEngine.playRecording(testRecording);
      
      expect(result).toBe(true);
      expect(playSpy).toHaveBeenCalledWith(testRecording);
      
      const state = recordingEngine.getPlaybackState();
      expect(state.isPlaying).toBe(true);
      expect(state.recording).toBe(testRecording);
    });

    it('should not start playback if already playing', () => {
      recordingEngine.playRecording(testRecording);
      const result = recordingEngine.playRecording(testRecording);
      
      expect(result).toBe(false);
    });

    it('should not start playback if recording', () => {
      recordingEngine.startRecording();
      const result = recordingEngine.playRecording(testRecording);
      
      expect(result).toBe(false);
    });

    it('should support playback speed adjustment', () => {
      const speed = 2.0;
      recordingEngine.playRecording(testRecording, speed);
      
      const state = recordingEngine.getPlaybackState();
      expect(state.playbackSpeed).toBe(speed);
    });

    it('should emit playback notes during playback', (done) => {
      const noteSpy = jest.fn();
      recordingEngine.on('playbackNote', noteSpy);
      
      recordingEngine.playRecording(testRecording);
      
      // Wait for async playback events
      setTimeout(() => {
        expect(noteSpy).toHaveBeenCalledWith(testRecording.notes[0]);
        done();
      }, 50);
    });

    it('should stop playback', () => {
      const stopSpy = jest.fn();
      recordingEngine.on('playbackStopped', stopSpy);
      
      recordingEngine.playRecording(testRecording);
      recordingEngine.stopPlayback();
      
      expect(stopSpy).toHaveBeenCalledWith(testRecording);
      
      const state = recordingEngine.getPlaybackState();
      expect(state.isPlaying).toBe(false);
    });

    it('should clear scheduled playback on stop', () => {
      recordingEngine.playRecording(testRecording);
      recordingEngine.stopPlayback();
      
      expect(mockClearTimeout).toHaveBeenCalled();
    });

    it('should pause playback (simplified stop)', () => {
      recordingEngine.playRecording(testRecording);
      const result = recordingEngine.pausePlayback();
      
      expect(result).toBe(true);
      
      const state = recordingEngine.getPlaybackState();
      expect(state.isPlaying).toBe(false);
    });
  });

  describe('recording management', () => {
    let testRecording: Recording;

    beforeEach(() => {
      // Create and store a test recording
      recordingEngine.startRecording('Test');
      testRecording = recordingEngine.stopRecording()!;
    });

    it('should get all recordings sorted by timestamp', () => {
      const recordings = recordingEngine.getRecordings();
      
      expect(recordings).toHaveLength(1);
      expect(recordings[0]).toBe(testRecording);
    });

    it('should get specific recording by ID', () => {
      const recording = recordingEngine.getRecording(testRecording.id);
      
      expect(recording).toBe(testRecording);
    });

    it('should return null for non-existent recording', () => {
      const recording = recordingEngine.getRecording('non-existent');
      
      expect(recording).toBe(null);
    });

    it('should delete recording', () => {
      const deleteSpy = jest.fn();
      recordingEngine.on('recordingDeleted', deleteSpy);
      
      const result = recordingEngine.deleteRecording(testRecording.id);
      
      expect(result).toBe(true);
      expect(deleteSpy).toHaveBeenCalledWith(testRecording.id);
      
      const recordings = recordingEngine.getRecordings();
      expect(recordings).toHaveLength(0);
    });

    it('should return false when deleting non-existent recording', () => {
      const result = recordingEngine.deleteRecording('non-existent');
      expect(result).toBe(false);
    });

    it('should rename recording', () => {
      const renameSpy = jest.fn();
      recordingEngine.on('recordingRenamed', renameSpy);
      
      const newName = 'Renamed Recording';
      const result = recordingEngine.renameRecording(testRecording.id, newName);
      
      expect(result).toBe(true);
      expect(renameSpy).toHaveBeenCalledWith({ id: testRecording.id, name: newName });
      
      const recording = recordingEngine.getRecording(testRecording.id);
      expect(recording?.name).toBe(newName);
    });

    it('should return false when renaming non-existent recording', () => {
      const result = recordingEngine.renameRecording('non-existent', 'New Name');
      expect(result).toBe(false);
    });
  });

  describe('data export/import', () => {
    let testRecording: Recording;

    beforeEach(() => {
      recordingEngine.startRecording('Export Test');
      recordingEngine.recordNote('a', mockSoundConfig);
      recordingEngine.finishNote('a', mockSoundConfig);
      testRecording = recordingEngine.stopRecording()!;
    });

    it('should export recording as JSON', () => {
      const exportedData = recordingEngine.exportRecording(testRecording);
      
      expect(exportedData).toBe(JSON.stringify(testRecording, null, 2));
    });

    it('should import valid recording data', () => {
      const importSpy = jest.fn();
      recordingEngine.on('recordingImported', importSpy);
      
      const exportedData = recordingEngine.exportRecording(testRecording);
      const imported = recordingEngine.importRecording(exportedData);
      
      expect(imported).toEqual(
        expect.objectContaining({
          name: testRecording.name,
          notes: testRecording.notes,
          duration: testRecording.duration
        })
      );
      expect(imported?.id).not.toBe(testRecording.id); // Should get new ID
      expect(importSpy).toHaveBeenCalledWith(imported);
    });

    it('should return null for invalid import data', () => {
      const result = recordingEngine.importRecording('invalid json');
      expect(result).toBe(null);
    });

    it('should return null for malformed recording structure', () => {
      const invalidRecording = { id: 'test' }; // Missing required fields
      const result = recordingEngine.importRecording(JSON.stringify(invalidRecording));
      expect(result).toBe(null);
    });
  });

  describe('storage persistence', () => {
    it('should save recordings to localStorage', () => {
      recordingEngine.startRecording('Test Save');
      recordingEngine.stopRecording();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'keyboardCosmicJam_recordings',
        expect.stringContaining('Test Save')
      );
    });

    it('should load recordings from localStorage on initialization', () => {
      const mockStoredRecordings = [{
        id: 'stored-1',
        name: 'Stored Recording',
        timestamp: Date.now(),
        duration: 1000,
        notes: []
      }];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStoredRecordings));
      
      const newEngine = new RecordingEngine();
      const recordings = newEngine.getRecordings();
      
      expect(recordings).toHaveLength(1);
      expect(recordings[0].name).toBe('Stored Recording');
      
      newEngine.cleanup();
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      // Should not throw
      recordingEngine.startRecording('Test');
      recordingEngine.stopRecording();
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      // Should not throw
      const newEngine = new RecordingEngine();
      expect(newEngine.getRecordings()).toHaveLength(0);
      
      newEngine.cleanup();
    });
  });

  describe('metadata calculation', () => {
    it('should calculate recording metadata', () => {
      recordingEngine.startRecording('Metadata Test');
      
      // Record multiple notes with different instruments
      recordingEngine.recordNote('a', mockSoundConfig);
      recordingEngine.finishNote('a', mockSoundConfig);
      
      recordingEngine.recordNote('s', { ...mockSoundConfig, key: 's', instrument: 'synthBass' });
      recordingEngine.finishNote('s', { ...mockSoundConfig, key: 's', instrument: 'synthBass' });
      
      const recording = recordingEngine.stopRecording()!;
      
      expect(recording.metadata).toEqual({
        keyCount: 2,
        instrumentsUsed: ['synthPad', 'synthBass'],
        avgNotesPerSecond: expect.any(Number)
      });
    });
  });

  describe('error handling and limits', () => {
    it('should handle recording duration limit', () => {
      const limitSpy = jest.fn();
      recordingEngine.on('recordingLimitReached', limitSpy);
      
      recordingEngine.startRecording();
      
      // Simulate exceeding max duration
      mockPerformanceNow.mockReturnValue(1000 + 10 * 60 * 1000 + 1); // Just over 10 minutes
      
      recordingEngine.recordNote('a', mockSoundConfig);
      
      expect(limitSpy).toHaveBeenCalled();
      
      const state = recordingEngine.getRecordingState();
      expect(state.isRecording).toBe(false);
    });

    it('should handle cleanup properly', () => {
      recordingEngine.startRecording();
      recordingEngine.playRecording({
        id: 'test',
        name: 'Test',
        timestamp: Date.now(),
        duration: 1000,
        notes: []
      });
      
      recordingEngine.cleanup();
      
      const recordingState = recordingEngine.getRecordingState();
      const playbackState = recordingEngine.getPlaybackState();
      
      expect(recordingState.isRecording).toBe(false);
      expect(playbackState.isPlaying).toBe(false);
      expect(recordingEngine.getRecordings()).toHaveLength(0);
    });
  });

  describe('state tracking', () => {
    it('should track recording state accurately', () => {
      let state = recordingEngine.getRecordingState();
      expect(state.isRecording).toBe(false);
      expect(state.isPaused).toBe(false);
      
      recordingEngine.startRecording();
      state = recordingEngine.getRecordingState();
      expect(state.isRecording).toBe(true);
      expect(state.duration).toBeGreaterThanOrEqual(0);
      
      recordingEngine.pauseRecording();
      state = recordingEngine.getRecordingState();
      expect(state.isPaused).toBe(true);
    });

    it('should track playback state accurately', () => {
      const testRecording: Recording = {
        id: 'test',
        name: 'Test',
        timestamp: Date.now(),
        duration: 2000,
        notes: []
      };
      
      let state = recordingEngine.getPlaybackState();
      expect(state.isPlaying).toBe(false);
      
      recordingEngine.playRecording(testRecording, 1.5);
      state = recordingEngine.getPlaybackState();
      expect(state.isPlaying).toBe(true);
      expect(state.recording).toBe(testRecording);
      expect(state.playbackSpeed).toBe(1.5);
      expect(state.totalDuration).toBe(2000);
    });
  });

  describe('event system', () => {
    it('should emit all recording lifecycle events', () => {
      const events: string[] = [];
      
      recordingEngine.on('recordingStarted', () => events.push('started'));
      recordingEngine.on('recordingPaused', () => events.push('paused'));
      recordingEngine.on('recordingResumed', () => events.push('resumed'));
      recordingEngine.on('recordingStopped', () => events.push('stopped'));
      recordingEngine.on('noteRecorded', () => events.push('noteRecorded'));
      
      recordingEngine.startRecording();
      recordingEngine.recordNote('a', mockSoundConfig);
      recordingEngine.finishNote('a', mockSoundConfig);
      recordingEngine.pauseRecording();
      recordingEngine.resumeRecording();
      recordingEngine.stopRecording();
      
      expect(events).toEqual(['started', 'noteRecorded', 'paused', 'resumed', 'stopped']);
    });

    it('should emit playback events', () => {
      const events: string[] = [];
      
      recordingEngine.on('playbackStarted', () => events.push('started'));
      recordingEngine.on('playbackStopped', () => events.push('stopped'));
      recordingEngine.on('playbackNote', () => events.push('note'));
      
      const testRecording: Recording = {
        id: 'test',
        name: 'Test',
        timestamp: Date.now(),
        duration: 100,
        notes: [{ timestamp: 0, key: 'a', soundConfig: mockSoundConfig, duration: 50 }]
      };
      
      recordingEngine.playRecording(testRecording);
      
      // Wait for async events
      setTimeout(() => {
        recordingEngine.stopPlayback();
        expect(events).toContain('started');
        expect(events).toContain('stopped');
      }, 50);
    });
  });
});
