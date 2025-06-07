import { AchievementSystem, Achievement } from '@game/core/AchievementSystem';

describe('AchievementSystem', () => {
  let achievementSystem: AchievementSystem;
  let localStorageMock: any;

  beforeEach(() => {
    localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    global.localStorage = localStorageMock;
    
    achievementSystem = new AchievementSystem();
  });

  describe('initialization', () => {
    it('should initialize with all achievements locked except first-note', () => {
      const achievements = achievementSystem.getAchievements();
      
      expect(achievements.length).toBeGreaterThan(0);
      achievements.forEach(achievement => {
        expect(achievement.unlocked).toBe(false);
      });
    });

    it('should load saved achievements from localStorage', () => {
      const savedData = {
        stats: {
          totalNotesPlayed: 100,
          maxCombo: 20,
          totalPlayTime: 3600000,
          instrumentsUsed: ['synthBass', 'synthLead'],
          levelsCompleted: [1, 2],
          highScore: 5000,
          perfectNotes: 50,
          sessionsPlayed: 5,
          recordingsMade: 3
        },
        achievements: [
          { id: 'first-note', progress: 1, unlocked: true, unlockedAt: Date.now() }
        ]
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData));
      
      achievementSystem = new AchievementSystem();
      const stats = achievementSystem.getStats();
      
      expect(stats.totalNotesPlayed).toBe(100);
      expect(stats.maxCombo).toBe(20);
      expect(stats.instrumentsUsed).toEqual(['synthBass', 'synthLead']);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      expect(() => {
        achievementSystem = new AchievementSystem();
      }).not.toThrow();
    });
  });

  describe('stats tracking', () => {
    it('should track notes played with accuracy', () => {
      achievementSystem.notePlayedWithAccuracy(0.95);
      achievementSystem.notePlayedWithAccuracy(0.85);
      achievementSystem.notePlayedWithAccuracy(0.75);
      
      const stats = achievementSystem.getStats();
      expect(stats.totalNotesPlayed).toBe(3);
      expect(stats.perfectNotes).toBe(1); // Only first note was > 0.9
    });

    it('should track max combo', () => {
      achievementSystem.comboReached(10);
      achievementSystem.comboReached(5);
      achievementSystem.comboReached(15);
      
      const stats = achievementSystem.getStats();
      expect(stats.maxCombo).toBe(15);
    });

    it('should track unique instruments', () => {
      achievementSystem.instrumentUsed('synthBass');
      achievementSystem.instrumentUsed('synthLead');
      achievementSystem.instrumentUsed('synthBass'); // Duplicate
      
      const stats = achievementSystem.getStats();
      expect(stats.instrumentsUsed).toHaveLength(2);
      expect(stats.instrumentsUsed).toContain('synthBass');
      expect(stats.instrumentsUsed).toContain('synthLead');
    });

    it('should track completed levels', () => {
      achievementSystem.levelCompleted(1);
      achievementSystem.levelCompleted(2);
      achievementSystem.levelCompleted(1); // Duplicate
      
      const stats = achievementSystem.getStats();
      expect(stats.levelsCompleted).toHaveLength(2);
      expect(stats.levelsCompleted).toContain(1);
      expect(stats.levelsCompleted).toContain(2);
    });

    it('should track recordings made', () => {
      achievementSystem.recordingMade();
      achievementSystem.recordingMade();
      
      const stats = achievementSystem.getStats();
      expect(stats.recordingsMade).toBe(2);
    });

    it('should track high score', () => {
      achievementSystem.scoreReached(1000);
      achievementSystem.scoreReached(500);
      achievementSystem.scoreReached(1500);
      
      const stats = achievementSystem.getStats();
      expect(stats.highScore).toBe(1500);
    });

    it('should update stats cumulatively', () => {
      const updates = {
        totalNotesPlayed: 10,
        totalPlayTime: 5000,
        perfectNotes: 3,
        sessionsPlayed: 1
      };
      
      achievementSystem.updateStats(updates);
      achievementSystem.updateStats(updates);
      
      const stats = achievementSystem.getStats();
      expect(stats.totalNotesPlayed).toBe(20);
      expect(stats.totalPlayTime).toBe(10000);
      expect(stats.perfectNotes).toBe(6);
      expect(stats.sessionsPlayed).toBe(2);
    });
  });

  describe('achievement unlocking', () => {
    it('should unlock first-note achievement', () => {
      const unlockSpy = jest.fn();
      achievementSystem.on('achievementUnlocked', unlockSpy);
      
      achievementSystem.notePlayedWithAccuracy(0.5);
      
      expect(unlockSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'first-note',
          name: 'First Note',
          unlocked: true
        })
      );
    });

    it('should unlock combo-based achievements', () => {
      const unlockSpy = jest.fn();
      achievementSystem.on('achievementUnlocked', unlockSpy);
      
      achievementSystem.comboReached(20);
      
      expect(unlockSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'combo-master',
          name: 'Combo Master'
        })
      );
    });

    it('should unlock instrument-based achievements', () => {
      const unlockSpy = jest.fn();
      achievementSystem.on('achievementUnlocked', unlockSpy);
      
      achievementSystem.instrumentUsed('synthBass');
      achievementSystem.instrumentUsed('synthLead');
      achievementSystem.instrumentUsed('synthPad');
      
      expect(unlockSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'instrument-switcher',
          name: 'Instrument Switcher'
        })
      );
    });

    it('should unlock level-based achievements', () => {
      const unlockSpy = jest.fn();
      achievementSystem.on('achievementUnlocked', unlockSpy);
      
      achievementSystem.levelCompleted(1);
      
      expect(unlockSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'space-starter',
          name: 'Space Starter'
        })
      );
    });

    it('should unlock accuracy-based achievements', () => {
      const unlockSpy = jest.fn();
      achievementSystem.on('achievementUnlocked', unlockSpy);
      
      // Play 50 perfect notes
      for (let i = 0; i < 50; i++) {
        achievementSystem.notePlayedWithAccuracy(0.95);
      }
      
      expect(unlockSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'rhythm-royalty',
          name: 'Rhythm Royalty'
        })
      );
    });

    it('should not unlock same achievement twice', () => {
      const unlockSpy = jest.fn();
      achievementSystem.on('achievementUnlocked', unlockSpy);
      
      achievementSystem.notePlayedWithAccuracy(0.5);
      achievementSystem.notePlayedWithAccuracy(0.5);
      
      expect(unlockSpy).toHaveBeenCalledTimes(1);
    });

    it('should save progress after unlocking', () => {
      achievementSystem.notePlayedWithAccuracy(0.5);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cosmic-jam-achievements',
        expect.any(String)
      );
    });
  });

  describe('progress tracking', () => {
    it('should track progress towards achievements', () => {
      // Play 5 notes towards 10 note achievement
      for (let i = 0; i < 5; i++) {
        achievementSystem.notePlayedWithAccuracy(0.5);
      }
      
      const achievement = achievementSystem.getAchievements()
        .find(a => a.id === 'key-explorer');
      
      expect(achievement?.progress).toBe(5);
      expect(achievement?.maxProgress).toBe(10);
    });

    it('should calculate achievement progress percentage', () => {
      for (let i = 0; i < 5; i++) {
        achievementSystem.notePlayedWithAccuracy(0.5);
      }
      
      const progress = achievementSystem.getAchievementProgress('key-explorer');
      expect(progress).toBe(0.5); // 5/10
    });

    it('should return 0 progress for non-existent achievement', () => {
      const progress = achievementSystem.getAchievementProgress('fake-achievement');
      expect(progress).toBe(0);
    });

    it('should calculate total progress', () => {
      // Unlock one achievement
      achievementSystem.notePlayedWithAccuracy(0.5);
      
      const totalProgress = achievementSystem.getTotalProgress();
      const totalAchievements = achievementSystem.getAchievements().length;
      
      expect(totalProgress).toBe(1 / totalAchievements);
    });
  });

  describe('achievement queries', () => {
    it('should get achievements by category', () => {
      const beginnerAchievements = achievementSystem.getAchievementsByCategory('beginner');
      const intermediateAchievements = achievementSystem.getAchievementsByCategory('intermediate');
      const advancedAchievements = achievementSystem.getAchievementsByCategory('advanced');
      
      expect(beginnerAchievements.length).toBe(5);
      expect(intermediateAchievements.length).toBe(5);
      expect(advancedAchievements.length).toBe(5);
    });

    it('should get unlocked achievements', () => {
      achievementSystem.notePlayedWithAccuracy(0.5); // Unlock first-note
      
      const unlocked = achievementSystem.getUnlockedAchievements();
      expect(unlocked.length).toBe(1);
      expect(unlocked[0].id).toBe('first-note');
    });

    it('should include unlock timestamp', () => {
      const beforeUnlock = Date.now();
      achievementSystem.notePlayedWithAccuracy(0.5);
      const afterUnlock = Date.now();
      
      const achievement = achievementSystem.getAchievements()
        .find(a => a.id === 'first-note');
      
      expect(achievement?.unlockedAt).toBeGreaterThanOrEqual(beforeUnlock);
      expect(achievement?.unlockedAt).toBeLessThanOrEqual(afterUnlock);
    });
  });

  describe('reset', () => {
    it('should reset all progress and stats', () => {
      // Build up some progress
      achievementSystem.notePlayedWithAccuracy(0.5);
      achievementSystem.comboReached(20);
      achievementSystem.instrumentUsed('synthBass');
      
      achievementSystem.reset();
      
      const stats = achievementSystem.getStats();
      expect(stats.totalNotesPlayed).toBe(0);
      expect(stats.maxCombo).toBe(0);
      expect(stats.instrumentsUsed).toHaveLength(0);
      
      const achievements = achievementSystem.getAchievements();
      achievements.forEach(achievement => {
        expect(achievement.unlocked).toBe(false);
        expect(achievement.progress).toBe(0);
      });
    });

    it('should emit achievementsReset event', () => {
      const resetSpy = jest.fn();
      achievementSystem.on('achievementsReset', resetSpy);
      
      achievementSystem.reset();
      
      expect(resetSpy).toHaveBeenCalled();
    });

    it('should save reset state', () => {
      achievementSystem.reset();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cosmic-jam-achievements',
        expect.stringContaining('"totalNotesPlayed":0')
      );
    });
  });

  describe('edge cases', () => {
    it('should handle time-based achievements', () => {
      // Simulate 1 minute of play time
      achievementSystem.updateStats({ totalPlayTime: 60000 });
      
      const achievement = achievementSystem.getAchievements()
        .find(a => a.id === 'music-maker');
      
      expect(achievement?.unlocked).toBe(true);
    });

    it('should handle custom condition achievements', () => {
      const unlockSpy = jest.fn();
      achievementSystem.on('achievementUnlocked', unlockSpy);
      
      // Make 5 recordings
      for (let i = 0; i < 5; i++) {
        achievementSystem.recordingMade();
      }
      
      expect(unlockSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'performance-pro',
          name: 'Performance Pro'
        })
      );
    });

    it('should handle all instruments achievement', () => {
      const instruments = ['synthBass', 'synthLead', 'synthPad', 'fmBell', 'digitalDrum', 'arpeggiate'];
      
      instruments.forEach(instrument => {
        achievementSystem.instrumentUsed(instrument);
      });
      
      const achievement = achievementSystem.getAchievements()
        .find(a => a.id === 'rock-star');
      
      expect(achievement?.unlocked).toBe(true);
    });

    it('should handle all levels achievement', () => {
      [1, 2, 3, 4].forEach(level => {
        achievementSystem.levelCompleted(level);
      });
      
      const achievement = achievementSystem.getAchievements()
        .find(a => a.id === 'cosmic-conductor');
      
      expect(achievement?.unlocked).toBe(true);
    });
  });
});