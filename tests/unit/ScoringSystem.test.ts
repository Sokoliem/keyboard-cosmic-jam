import { ScoringSystem, ScoreEvent, ScoreState } from '@game/core/ScoringSystem';

describe('ScoringSystem', () => {
  let scoringSystem: ScoringSystem;
  let mockTimestamp: number;

  beforeEach(() => {
    scoringSystem = new ScoringSystem();
    mockTimestamp = 1000;
    jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('notePressed', () => {
    it('should calculate base points correctly', () => {
      const scoreEvent = scoringSystem.notePressed(mockTimestamp);
      
      expect(scoreEvent.basePoints).toBeGreaterThanOrEqual(10);
      expect(scoreEvent.basePoints).toBeLessThanOrEqual(50);
    });

    it('should start combo at 1 for first note', () => {
      const scoreEvent = scoringSystem.notePressed();
      
      expect(scoreEvent.combo).toBe(1);
    });

    it('should increment combo for consecutive notes', () => {
      scoringSystem.notePressed();
      const scoreEvent2 = scoringSystem.notePressed();
      
      expect(scoreEvent2.combo).toBe(2);
    });

    it('should apply correct multipliers based on combo', () => {
      // Test different combo thresholds
      const testCases = [
        { notes: 1, expectedMultiplier: 1 },
        { notes: 5, expectedMultiplier: 1.5 },
        { notes: 10, expectedMultiplier: 2 },
        { notes: 20, expectedMultiplier: 3 },
        { notes: 30, expectedMultiplier: 5 }
      ];

      testCases.forEach(({ notes, expectedMultiplier }) => {
        scoringSystem.reset();
        
        for (let i = 0; i < notes - 1; i++) {
          scoringSystem.notePressed();
        }
        
        const scoreEvent = scoringSystem.notePressed();
        expect(scoreEvent.multiplier).toBe(expectedMultiplier);
      });
    });

    it('should calculate timing accuracy', () => {
      const scoreEvent = scoringSystem.notePressed(mockTimestamp);
      
      expect(scoreEvent.accuracy).toBeGreaterThanOrEqual(0);
      expect(scoreEvent.accuracy).toBeLessThanOrEqual(1);
    });

    it('should update total score', () => {
      const scoreEvent1 = scoringSystem.notePressed();
      const scoreEvent2 = scoringSystem.notePressed();
      
      const state = scoringSystem.getState();
      expect(state.totalScore).toBe(scoreEvent1.totalPoints + scoreEvent2.totalPoints);
    });

    it('should track accurate notes', () => {
      // Mock perfect timing
      scoringSystem.setBeatInterval(120); // 120 BPM
      
      // Simulate notes on beat
      for (let i = 0; i < 5; i++) {
        scoringSystem.notePressed(mockTimestamp + i * 500); // On beat at 120 BPM
      }
      
      const state = scoringSystem.getState();
      expect(state.accuracy).toBeGreaterThan(80); // Should have high accuracy
    });
  });

  describe('combo management', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should break combo after timeout', () => {
      scoringSystem.notePressed();
      scoringSystem.notePressed();
      
      expect(scoringSystem.getCombo()).toBe(2);
      
      // Fast-forward past combo timeout
      jest.advanceTimersByTime(2001);
      
      expect(scoringSystem.getCombo()).toBe(0);
    });

    it('should emit comboBreak event', () => {
      const comboBreakSpy = jest.fn();
      scoringSystem.on('comboBreak', comboBreakSpy);
      
      scoringSystem.notePressed();
      scoringSystem.notePressed();
      scoringSystem.notePressed();
      
      const previousCombo = scoringSystem.getCombo();
      
      jest.advanceTimersByTime(2001);
      
      expect(comboBreakSpy).toHaveBeenCalledWith(previousCombo);
    });

    it('should reset combo timer on each note', () => {
      scoringSystem.notePressed();
      
      jest.advanceTimersByTime(1500); // Not enough to break combo
      scoringSystem.notePressed();
      
      jest.advanceTimersByTime(1500); // Would break if timer wasn't reset
      
      expect(scoringSystem.getCombo()).toBe(2);
    });

    it('should force break combo', () => {
      scoringSystem.notePressed();
      scoringSystem.notePressed();
      
      expect(scoringSystem.getCombo()).toBe(2);
      
      scoringSystem.forceBreakCombo();
      
      expect(scoringSystem.getCombo()).toBe(0);
    });
  });

  describe('multiplier milestones', () => {
    it('should emit multiplierReached events', () => {
      const multiplierSpy = jest.fn();
      scoringSystem.on('multiplierReached', multiplierSpy);
      
      // Reach 5-note combo
      for (let i = 0; i < 5; i++) {
        scoringSystem.notePressed();
      }
      
      expect(multiplierSpy).toHaveBeenCalledWith({
        combo: 5,
        multiplier: 1.5,
        name: 'Warm'
      });
    });

    it('should emit milestone events for special combos', () => {
      const milestoneSpy = jest.fn();
      scoringSystem.on('milestone', milestoneSpy);
      
      // Reach 50-note combo
      for (let i = 0; i < 50; i++) {
        scoringSystem.notePressed();
      }
      
      expect(milestoneSpy).toHaveBeenCalledWith({
        type: 'combo',
        value: 50,
        name: 'Cosmic Combo!'
      });
    });
  });

  describe('state management', () => {
    it('should return correct state', () => {
      for (let i = 0; i < 10; i++) {
        scoringSystem.notePressed();
      }
      
      const state = scoringSystem.getState();
      
      expect(state).toMatchObject({
        totalScore: expect.any(Number),
        currentCombo: 10,
        maxCombo: 10,
        notesPlayed: 10,
        accuracy: expect.any(Number),
        multiplier: 2
      });
    });

    it('should track max combo', () => {
      // Build up combo
      for (let i = 0; i < 15; i++) {
        scoringSystem.notePressed();
      }
      
      // Force break
      scoringSystem.forceBreakCombo();
      
      // Build smaller combo
      for (let i = 0; i < 5; i++) {
        scoringSystem.notePressed();
      }
      
      const state = scoringSystem.getState();
      expect(state.maxCombo).toBe(15);
      expect(state.currentCombo).toBe(5);
    });

    it('should calculate accuracy percentage', () => {
      const state = scoringSystem.getState();
      
      expect(state.accuracy).toBeGreaterThanOrEqual(0);
      expect(state.accuracy).toBeLessThanOrEqual(100);
    });
  });

  describe('reset', () => {
    it('should reset all values', () => {
      // Build up some state
      for (let i = 0; i < 20; i++) {
        scoringSystem.notePressed();
      }
      
      scoringSystem.reset();
      
      const state = scoringSystem.getState();
      expect(state).toEqual({
        totalScore: 0,
        currentCombo: 0,
        maxCombo: 0,
        notesPlayed: 0,
        accuracy: 0,
        multiplier: 1
      });
    });

    it('should emit scoreReset event', () => {
      const resetSpy = jest.fn();
      scoringSystem.on('scoreReset', resetSpy);
      
      scoringSystem.reset();
      
      expect(resetSpy).toHaveBeenCalled();
    });

    it('should clear combo timer on reset', () => {
      jest.useFakeTimers();
      
      scoringSystem.notePressed();
      scoringSystem.reset();
      
      // Advance time - should not trigger combo break
      jest.advanceTimersByTime(3000);
      
      expect(scoringSystem.getCombo()).toBe(0);
      
      jest.useRealTimers();
    });
  });

  describe('beat synchronization', () => {
    it('should set beat interval from BPM', () => {
      scoringSystem.setBeatInterval(120); // 120 BPM
      
      // Beat interval should be 500ms (60000 / 120)
      // This affects timing accuracy calculations
      const scoreEvent = scoringSystem.notePressed(1000);
      
      expect(scoreEvent.accuracy).toBeDefined();
    });

    it('should calculate higher accuracy for notes on beat', () => {
      scoringSystem.setBeatInterval(60); // 60 BPM = 1000ms interval
      
      // Note exactly on beat
      const onBeat = scoringSystem.notePressed(1000);
      
      // Note off beat
      const offBeat = scoringSystem.notePressed(1250);
      
      expect(onBeat.accuracy).toBeGreaterThan(offBeat.accuracy);
    });
  });

  describe('event emissions', () => {
    it('should emit noteScored for each note', () => {
      const noteScoredSpy = jest.fn();
      scoringSystem.on('noteScored', noteScoredSpy);
      
      const scoreEvent = scoringSystem.notePressed();
      
      expect(noteScoredSpy).toHaveBeenCalledWith(scoreEvent);
    });

    it('should emit scoreUpdated after each note', () => {
      const scoreUpdatedSpy = jest.fn();
      scoringSystem.on('scoreUpdated', scoreUpdatedSpy);
      
      scoringSystem.notePressed();
      
      expect(scoreUpdatedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          totalScore: expect.any(Number),
          currentCombo: 1
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle rapid note presses', () => {
      const rapidNotes = 100;
      
      for (let i = 0; i < rapidNotes; i++) {
        scoringSystem.notePressed(mockTimestamp + i);
      }
      
      const state = scoringSystem.getState();
      expect(state.notesPlayed).toBe(rapidNotes);
      expect(state.currentCombo).toBe(rapidNotes);
    });

    it('should handle negative timestamps gracefully', () => {
      const scoreEvent = scoringSystem.notePressed(-1000);
      
      expect(scoreEvent).toBeDefined();
      expect(scoreEvent.totalPoints).toBeGreaterThan(0);
    });

    it('should maintain accuracy between 0 and 100', () => {
      for (let i = 0; i < 50; i++) {
        scoringSystem.notePressed(mockTimestamp + i * Math.random() * 1000);
      }
      
      const state = scoringSystem.getState();
      expect(state.accuracy).toBeGreaterThanOrEqual(0);
      expect(state.accuracy).toBeLessThanOrEqual(100);
    });
  });
});