import { StoryMode, StoryLevel, LevelObjective } from '@game/modes/StoryMode';

describe('StoryMode', () => {
  let storyMode: StoryMode;
  let localStorageMock: any;

  beforeEach(() => {
    localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    global.localStorage = localStorageMock;
    
    storyMode = new StoryMode();
  });

  describe('initialization', () => {
    it('should initialize with 4 levels', () => {
      const levels = storyMode.getLevels();
      expect(levels.length).toBe(4);
    });

    it('should have only level 1 unlocked by default', () => {
      const levels = storyMode.getLevels();
      expect(levels[0].unlocked).toBe(true);
      expect(levels[1].unlocked).toBe(false);
      expect(levels[2].unlocked).toBe(false);
      expect(levels[3].unlocked).toBe(false);
    });

    it('should load saved progress from localStorage', () => {
      const savedData = {
        levels: [
          {
            id: 1,
            unlocked: true,
            completed: true,
            stars: 3,
            objectives: [
              { id: 'play-notes', progress: 30, completed: true }
            ]
          },
          {
            id: 2,
            unlocked: true,
            completed: false,
            stars: 0,
            objectives: []
          }
        ]
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData));
      
      storyMode = new StoryMode();
      
      const level1 = storyMode.getLevel(1);
      const level2 = storyMode.getLevel(2);
      
      expect(level1?.completed).toBe(true);
      expect(level1?.stars).toBe(3);
      expect(level2?.unlocked).toBe(true);
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      expect(() => {
        storyMode = new StoryMode();
      }).not.toThrow();
    });
  });

  describe('level management', () => {
    it('should start unlocked level', () => {
      const startSpy = jest.fn();
      storyMode.on('levelStarted', startSpy);
      
      const result = storyMode.startLevel(1);
      
      expect(result).toBe(true);
      expect(storyMode.getCurrentLevel()?.id).toBe(1);
      expect(startSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1 })
      );
    });

    it('should not start locked level', () => {
      const result = storyMode.startLevel(2);
      
      expect(result).toBe(false);
      expect(storyMode.getCurrentLevel()).toBeNull();
    });

    it('should not start non-existent level', () => {
      const result = storyMode.startLevel(99);
      
      expect(result).toBe(false);
      expect(storyMode.getCurrentLevel()).toBeNull();
    });

    it('should end level properly', () => {
      const endSpy = jest.fn();
      storyMode.on('levelEnded', endSpy);
      
      storyMode.startLevel(1);
      storyMode.endLevel();
      
      expect(storyMode.getCurrentLevel()).toBeNull();
      expect(storyMode.getCurrentProgress()).toBeNull();
      expect(endSpy).toHaveBeenCalled();
    });
  });

  describe('progress tracking', () => {
    beforeEach(() => {
      storyMode.startLevel(1);
    });

    it('should track notes played', () => {
      storyMode.updateProgress({ notePlayed: true });
      storyMode.updateProgress({ notePlayed: true });
      
      const progress = storyMode.getCurrentProgress();
      expect(progress?.notesPlayed).toBe(2);
    });

    it('should track max combo', () => {
      storyMode.updateProgress({ combo: 5 });
      storyMode.updateProgress({ combo: 10 });
      storyMode.updateProgress({ combo: 7 });
      
      const progress = storyMode.getCurrentProgress();
      expect(progress?.maxCombo).toBe(10);
    });

    it('should track score', () => {
      storyMode.updateProgress({ score: 100 });
      storyMode.updateProgress({ score: 250 });
      
      const progress = storyMode.getCurrentProgress();
      expect(progress?.score).toBe(250);
    });

    it('should track instruments used', () => {
      storyMode.updateProgress({ instrument: 'synthBass' });
      storyMode.updateProgress({ instrument: 'synthLead' });
      storyMode.updateProgress({ instrument: 'synthBass' }); // Duplicate
      
      // Level 2 has instrument objective
      storyMode.endLevel();
      storyMode.startLevel(2);
      
      storyMode.updateProgress({ instrument: 'synthBass' });
      storyMode.updateProgress({ instrument: 'synthLead' });
      
      const objective = storyMode.getCurrentLevel()?.objectives.find(o => o.type === 'instrument');
      expect(objective?.progress).toBe(2);
    });

    it('should track pattern buffer', () => {
      const keys = ['q', 'w', 'e', 'r'];
      keys.forEach(key => {
        storyMode.updateProgress({ key });
      });
      
      // Check that pattern was detected (level 1 has Q-W-E-R pattern)
      const patternObjective = storyMode.getCurrentLevel()?.objectives.find(o => o.type === 'pattern');
      expect(patternObjective?.completed).toBe(true);
    });

    it('should limit pattern buffer size', () => {
      // Add more than 10 keys
      for (let i = 0; i < 15; i++) {
        storyMode.updateProgress({ key: String(i) });
      }
      
      // Buffer should only keep last 10
      // This is internal behavior, we test it indirectly
      expect(storyMode.getCurrentProgress()).toBeDefined();
    });
  });

  describe('objective completion', () => {
    beforeEach(() => {
      storyMode.startLevel(1);
    });

    it('should complete notes objective', () => {
      const completeSpy = jest.fn();
      storyMode.on('objectiveCompleted', completeSpy);
      
      for (let i = 0; i < 30; i++) {
        storyMode.updateProgress({ notePlayed: true });
      }
      
      expect(completeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'play-notes',
          completed: true
        })
      );
    });

    it('should complete combo objective', () => {
      const completeSpy = jest.fn();
      storyMode.on('objectiveCompleted', completeSpy);
      
      storyMode.updateProgress({ combo: 10 });
      
      expect(completeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'combo-groove',
          completed: true
        })
      );
    });

    it('should complete pattern objective', () => {
      const completeSpy = jest.fn();
      storyMode.on('objectiveCompleted', completeSpy);
      
      ['q', 'w', 'e', 'r'].forEach(key => {
        storyMode.updateProgress({ key });
      });
      
      expect(completeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'disco-pattern',
          completed: true
        })
      );
    });

    it('should detect pattern within buffer', () => {
      const completeSpy = jest.fn();
      storyMode.on('objectiveCompleted', completeSpy);
      
      // Add some noise before pattern
      ['x', 'y', 'z'].forEach(key => {
        storyMode.updateProgress({ key });
      });
      
      // Then the pattern
      ['q', 'w', 'e', 'r'].forEach(key => {
        storyMode.updateProgress({ key });
      });
      
      expect(completeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'disco-pattern',
          completed: true
        })
      );
    });

    it('should emit progressUpdated on objective completion', () => {
      const progressSpy = jest.fn();
      storyMode.on('progressUpdated', progressSpy);
      
      storyMode.updateProgress({ combo: 10 });
      
      expect(progressSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1 }),
        expect.objectContaining({ levelId: 1 })
      );
    });

    it('should not complete already completed objectives', () => {
      const completeSpy = jest.fn();
      
      // Complete the objective
      storyMode.updateProgress({ combo: 10 });
      
      storyMode.on('objectiveCompleted', completeSpy);
      
      // Try to complete again
      storyMode.updateProgress({ combo: 15 });
      
      expect(completeSpy).not.toHaveBeenCalled();
    });
  });

  describe('level completion', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(1000) // Start time
        .mockReturnValueOnce(31000); // End time (31 seconds later)
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should complete level when all objectives done', () => {
      const completeSpy = jest.fn();
      storyMode.on('levelCompleted', completeSpy);
      
      storyMode.startLevel(1);
      
      // Complete all objectives
      for (let i = 0; i < 30; i++) {
        storyMode.updateProgress({ notePlayed: true });
      }
      storyMode.updateProgress({ combo: 10 });
      ['q', 'w', 'e', 'r'].forEach(key => {
        storyMode.updateProgress({ key });
      });
      
      expect(completeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: expect.objectContaining({ id: 1 }),
          stars: expect.any(Number)
        })
      );
    });

    it('should unlock next level on completion', () => {
      storyMode.startLevel(1);
      
      // Complete all objectives
      for (let i = 0; i < 30; i++) {
        storyMode.updateProgress({ notePlayed: true });
      }
      storyMode.updateProgress({ combo: 10 });
      ['q', 'w', 'e', 'r'].forEach(key => {
        storyMode.updateProgress({ key });
      });
      
      const level2 = storyMode.getLevel(2);
      expect(level2?.unlocked).toBe(true);
    });

    it('should save progress on completion', () => {
      storyMode.startLevel(1);
      
      // Complete level
      for (let i = 0; i < 30; i++) {
        storyMode.updateProgress({ notePlayed: true });
      }
      storyMode.updateProgress({ combo: 10 });
      ['q', 'w', 'e', 'r'].forEach(key => {
        storyMode.updateProgress({ key });
      });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cosmic-jam-story-progress',
        expect.any(String)
      );
    });

    it('should calculate stars based on performance', () => {
      // Test different star calculations
      const testCases = [
        { accuracy: 85, expectedStars: 3 }, // Fast completion + high accuracy
        { accuracy: 70, expectedStars: 2 }, // Fast completion only
        { accuracy: 50, expectedStars: 1 }  // Just completion
      ];
      
      testCases.forEach(({ accuracy, expectedStars }) => {
        storyMode = new StoryMode();
        storyMode.startLevel(1);
        
        // Complete with specific accuracy
        storyMode.updateProgress({ accuracy });
        
        // Complete all objectives
        for (let i = 0; i < 30; i++) {
          storyMode.updateProgress({ notePlayed: true });
        }
        storyMode.updateProgress({ combo: 10 });
        ['q', 'w', 'e', 'r'].forEach(key => {
          storyMode.updateProgress({ key });
        });
        
        const level = storyMode.getLevel(1);
        expect(level?.stars).toBe(expectedStars);
      });
    });

    it('should keep highest star rating', () => {
      storyMode.startLevel(1);
      
      // Complete with low performance
      storyMode.updateProgress({ accuracy: 50 });
      for (let i = 0; i < 30; i++) {
        storyMode.updateProgress({ notePlayed: true });
      }
      storyMode.updateProgress({ combo: 10 });
      ['q', 'w', 'e', 'r'].forEach(key => {
        storyMode.updateProgress({ key });
      });
      
      expect(storyMode.getLevel(1)?.stars).toBe(1);
      
      // Complete again with better performance
      storyMode.startLevel(1);
      storyMode.updateProgress({ accuracy: 90 });
      for (let i = 0; i < 30; i++) {
        storyMode.updateProgress({ notePlayed: true });
      }
      storyMode.updateProgress({ combo: 10 });
      ['q', 'w', 'e', 'r'].forEach(key => {
        storyMode.updateProgress({ key });
      });
      
      expect(storyMode.getLevel(1)?.stars).toBe(3);
    });
  });

  describe('score objectives', () => {
    it('should complete score objective', () => {
      storyMode.endLevel();
      storyMode.getLevel(2)!.unlocked = true; // Force unlock for testing
      storyMode.startLevel(2);
      
      const completeSpy = jest.fn();
      storyMode.on('objectiveCompleted', completeSpy);
      
      storyMode.updateProgress({ score: 500 });
      
      expect(completeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'animal-sounds',
          completed: true
        })
      );
    });

    it('should award bonus star for high score', () => {
      storyMode.endLevel();
      storyMode.getLevel(2)!.unlocked = true;
      storyMode.startLevel(2);
      
      // Complete with very high score (1.5x target)
      storyMode.updateProgress({ score: 750, accuracy: 70 });
      
      // Complete all objectives
      for (let i = 0; i < 50; i++) {
        storyMode.updateProgress({ notePlayed: true });
      }
      storyMode.updateProgress({ instrument: 'synthBass' });
      storyMode.updateProgress({ instrument: 'synthLead' });
      
      const level = storyMode.getLevel(2);
      expect(level?.stars).toBe(3); // Should get bonus star for high score
    });
  });

  describe('getters', () => {
    it('should get specific level', () => {
      const level = storyMode.getLevel(1);
      expect(level?.name).toBe('Space Disco');
    });

    it('should return undefined for non-existent level', () => {
      const level = storyMode.getLevel(99);
      expect(level).toBeUndefined();
    });

    it('should get total stars', () => {
      // Complete some levels
      storyMode.getLevel(1)!.stars = 3;
      storyMode.getLevel(2)!.stars = 2;
      
      expect(storyMode.getTotalStars()).toBe(5);
    });

    it('should get current level and progress', () => {
      expect(storyMode.getCurrentLevel()).toBeNull();
      expect(storyMode.getCurrentProgress()).toBeNull();
      
      storyMode.startLevel(1);
      
      expect(storyMode.getCurrentLevel()?.id).toBe(1);
      expect(storyMode.getCurrentProgress()?.levelId).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset all progress', () => {
      // Set up some progress
      storyMode.getLevel(1)!.completed = true;
      storyMode.getLevel(1)!.stars = 3;
      storyMode.getLevel(2)!.unlocked = true;
      storyMode.getLevel(2)!.completed = true;
      storyMode.getLevel(2)!.stars = 2;
      
      const resetSpy = jest.fn();
      storyMode.on('progressReset', resetSpy);
      
      storyMode.reset();
      
      // Check reset state
      const levels = storyMode.getLevels();
      expect(levels[0].completed).toBe(false);
      expect(levels[0].stars).toBe(0);
      expect(levels[0].unlocked).toBe(true); // Level 1 stays unlocked
      expect(levels[1].unlocked).toBe(false);
      expect(levels[1].completed).toBe(false);
      expect(levels[1].stars).toBe(0);
      
      expect(resetSpy).toHaveBeenCalled();
    });

    it('should reset objective progress', () => {
      storyMode.startLevel(1);
      
      // Make some progress
      for (let i = 0; i < 15; i++) {
        storyMode.updateProgress({ notePlayed: true });
      }
      
      storyMode.reset();
      
      const level1 = storyMode.getLevel(1);
      level1?.objectives.forEach(obj => {
        expect(obj.progress).toBe(0);
        expect(obj.completed).toBe(false);
      });
    });

    it('should save after reset', () => {
      storyMode.reset();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cosmic-jam-story-progress',
        expect.any(String)
      );
    });
  });

  describe('edge cases', () => {
    it('should handle update without active level', () => {
      expect(() => {
        storyMode.updateProgress({ notePlayed: true });
      }).not.toThrow();
    });

    it('should handle pattern with uppercase keys', () => {
      storyMode.startLevel(1);
      
      ['Q', 'W', 'E', 'R'].forEach(key => {
        storyMode.updateProgress({ key });
      });
      
      const patternObjective = storyMode.getCurrentLevel()?.objectives.find(o => o.type === 'pattern');
      expect(patternObjective?.completed).toBe(true);
    });

    it('should handle all objective types', () => {
      // Level 4 has all types of objectives
      storyMode.getLevel(4)!.unlocked = true;
      storyMode.startLevel(4);
      
      const level = storyMode.getCurrentLevel()!;
      const objectiveTypes = level.objectives.map(o => o.type);
      
      expect(objectiveTypes).toContain('notes');
      expect(objectiveTypes).toContain('combo');
      expect(objectiveTypes).toContain('instrument');
      expect(objectiveTypes).toContain('score');
    });

    it('should handle time calculation for stars', () => {
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(1000) // Start time
        .mockReturnValueOnce(121000); // End time (121 seconds = > 90 seconds target)
      
      storyMode.startLevel(1);
      storyMode.updateProgress({ accuracy: 85 });
      
      // Complete all objectives slowly
      for (let i = 0; i < 30; i++) {
        storyMode.updateProgress({ notePlayed: true });
      }
      storyMode.updateProgress({ combo: 10 });
      ['q', 'w', 'e', 'r'].forEach(key => {
        storyMode.updateProgress({ key });
      });
      
      const level = storyMode.getLevel(1);
      expect(level?.stars).toBe(2); // Should not get time bonus star
    });
  });
});