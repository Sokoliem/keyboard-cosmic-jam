import { ProgressionSystem, Unlockable, UnlockNotification } from '@game/core/ProgressionSystem';

describe('ProgressionSystem', () => {
  let progressionSystem: ProgressionSystem;
  let localStorageMock: any;

  beforeEach(() => {
    localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    global.localStorage = localStorageMock;
    
    progressionSystem = new ProgressionSystem();
  });

  describe('initialization', () => {
    it('should initialize with default unlocked items', () => {
      const unlocked = progressionSystem.getUnlockedItems();
      
      expect(unlocked.length).toBe(3); // synthBass, retro-pack, neon-theme
      expect(unlocked.some(item => item.id === 'synthBass')).toBe(true);
      expect(unlocked.some(item => item.id === 'retro-pack')).toBe(true);
      expect(unlocked.some(item => item.id === 'neon-theme')).toBe(true);
    });

    it('should load saved unlocks from localStorage', () => {
      const savedUnlocks = ['synthBass', 'synthLead', 'disco-lights'];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedUnlocks));
      
      progressionSystem = new ProgressionSystem();
      
      expect(progressionSystem.isUnlocked('synthLead')).toBe(true);
      expect(progressionSystem.isUnlocked('disco-lights')).toBe(true);
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      expect(() => {
        progressionSystem = new ProgressionSystem();
      }).not.toThrow();
    });
  });

  describe('unlock checking', () => {
    it('should unlock items based on level', () => {
      const unlockSpy = jest.fn();
      progressionSystem.on('itemUnlocked', unlockSpy);
      
      progressionSystem.checkUnlocks({ level: 1 });
      
      expect(unlockSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          unlockable: expect.objectContaining({
            id: 'synthLead',
            requiredLevel: 1
          }),
          reason: 'Reached level 1'
        })
      );
    });

    it('should unlock multiple items at once', () => {
      const unlockSpy = jest.fn();
      progressionSystem.on('itemUnlocked', unlockSpy);
      
      progressionSystem.checkUnlocks({ level: 2 });
      
      // Should unlock items for level 1 and 2
      const unlockedIds = unlockSpy.mock.calls.map(call => call[0].unlockable.id);
      expect(unlockedIds).toContain('synthLead');
      expect(unlockedIds).toContain('fmBell');
      expect(unlockedIds).toContain('animal-particles');
    });

    it('should unlock items based on achievements', () => {
      const unlockSpy = jest.fn();
      progressionSystem.on('itemUnlocked', unlockSpy);
      
      progressionSystem.checkUnlocks({ 
        achievements: ['rhythm-royalty', 'animal-whisperer'] 
      });
      
      // Should unlock digitalDrum (requires rhythm-royalty)
      expect(unlockSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          unlockable: expect.objectContaining({
            id: 'digitalDrum'
          }),
          reason: 'Earned required achievements'
        })
      );
    });

    it('should unlock items based on score', () => {
      const unlockSpy = jest.fn();
      progressionSystem.on('itemUnlocked', unlockSpy);
      
      progressionSystem.checkUnlocks({ score: 5000 });
      
      expect(unlockSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          unlockable: expect.objectContaining({
            id: 'silly-pack',
            requiredScore: 5000
          }),
          reason: 'Scored 5000 points'
        })
      );
    });

    it('should not unlock already unlocked items', () => {
      const unlockSpy = jest.fn();
      progressionSystem.on('itemUnlocked', unlockSpy);
      
      // First unlock
      progressionSystem.checkUnlocks({ level: 1 });
      unlockSpy.mockClear();
      
      // Try to unlock again
      progressionSystem.checkUnlocks({ level: 1 });
      
      expect(unlockSpy).not.toHaveBeenCalled();
    });

    it('should save progress after unlocking', () => {
      progressionSystem.checkUnlocks({ level: 1 });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cosmic-jam-unlocks',
        expect.any(String)
      );
    });
  });

  describe('unlock queue processing', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should process unlock notifications sequentially', async () => {
      const unlockSpy = jest.fn();
      progressionSystem.on('itemUnlocked', unlockSpy);
      
      progressionSystem.checkUnlocks({ level: 3 });
      
      // Multiple items should be queued
      expect(unlockSpy).toHaveBeenCalledTimes(1);
      
      // Wait for queue processing
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      expect(unlockSpy).toHaveBeenCalledTimes(2);
      
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      expect(unlockSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent unlock checks', async () => {
      progressionSystem.checkUnlocks({ level: 1 });
      progressionSystem.checkUnlocks({ score: 5000 });
      
      // Queue should contain all unlocks
      jest.runAllTimers();
      await Promise.resolve();
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('getters', () => {
    it('should get all unlockables', () => {
      const all = progressionSystem.getUnlockables();
      expect(all.length).toBeGreaterThan(0);
    });

    it('should get unlockables by type', () => {
      const instruments = progressionSystem.getUnlockables('instrument');
      const effects = progressionSystem.getUnlockables('effect');
      const sounds = progressionSystem.getUnlockables('sound');
      const themes = progressionSystem.getUnlockables('theme');
      
      expect(instruments.every(item => item.type === 'instrument')).toBe(true);
      expect(effects.every(item => item.type === 'effect')).toBe(true);
      expect(sounds.every(item => item.type === 'sound')).toBe(true);
      expect(themes.every(item => item.type === 'theme')).toBe(true);
    });

    it('should get unlocked items by type', () => {
      progressionSystem.checkUnlocks({ level: 1 });
      
      const unlockedInstruments = progressionSystem.getUnlockedItems('instrument');
      expect(unlockedInstruments.length).toBeGreaterThan(1); // synthBass + synthLead
    });

    it('should get locked items', () => {
      const locked = progressionSystem.getLockedItems();
      expect(locked.length).toBeGreaterThan(0);
      
      locked.forEach(item => {
        expect(item.unlocked).toBe(false);
      });
    });

    it('should calculate unlock progress', () => {
      const initialProgress = progressionSystem.getUnlockProgress();
      
      progressionSystem.checkUnlocks({ level: 4 });
      
      const newProgress = progressionSystem.getUnlockProgress();
      expect(newProgress).toBeGreaterThan(initialProgress);
    });
  });

  describe('manual unlocking', () => {
    it('should force unlock specific item', () => {
      const unlockSpy = jest.fn();
      progressionSystem.on('itemUnlocked', unlockSpy);
      
      progressionSystem.forceUnlock('synthPad');
      
      expect(progressionSystem.isUnlocked('synthPad')).toBe(true);
      expect(unlockSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          unlockable: expect.objectContaining({ id: 'synthPad' }),
          reason: 'Manually unlocked'
        })
      );
    });

    it('should not unlock already unlocked items', () => {
      const unlockSpy = jest.fn();
      progressionSystem.on('itemUnlocked', unlockSpy);
      
      progressionSystem.forceUnlock('synthBass'); // Already unlocked by default
      
      expect(unlockSpy).not.toHaveBeenCalled();
    });

    it('should save after force unlock', () => {
      progressionSystem.forceUnlock('synthPad');
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset to default unlocks', () => {
      // Unlock some items
      progressionSystem.checkUnlocks({ level: 4 });
      
      progressionSystem.reset();
      
      // Only defaults should be unlocked
      const unlocked = progressionSystem.getUnlockedItems();
      expect(unlocked.length).toBe(3);
      expect(unlocked.map(item => item.id)).toEqual(
        expect.arrayContaining(['synthBass', 'retro-pack', 'neon-theme'])
      );
    });

    it('should emit progressionReset event', () => {
      const resetSpy = jest.fn();
      progressionSystem.on('progressionReset', resetSpy);
      
      progressionSystem.reset();
      
      expect(resetSpy).toHaveBeenCalled();
    });

    it('should save after reset', () => {
      progressionSystem.reset();
      
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData).toEqual(['synthBass', 'retro-pack', 'neon-theme']);
    });
  });

  describe('unlock requirements', () => {
    it('should handle items with multiple achievement requirements', () => {
      const unlockSpy = jest.fn();
      progressionSystem.on('itemUnlocked', unlockSpy);
      
      // nature-pack requires animal-whisperer
      progressionSystem.checkUnlocks({ achievements: ['animal-whisperer'] });
      
      expect(unlockSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          unlockable: expect.objectContaining({ id: 'nature-pack' })
        })
      );
    });

    it('should not unlock if missing some achievements', () => {
      const unlockSpy = jest.fn();
      progressionSystem.on('itemUnlocked', unlockSpy);
      
      // world-pack requires cosmic-conductor
      progressionSystem.checkUnlocks({ achievements: ['some-other-achievement'] });
      
      const worldPackCall = unlockSpy.mock.calls.find(
        call => call[0].unlockable.id === 'world-pack'
      );
      expect(worldPackCall).toBeUndefined();
    });

    it('should handle mixed requirement types', () => {
      // Test that items with different requirement types work correctly
      const synthLead = progressionSystem.getUnlockables()
        .find(item => item.id === 'synthLead');
      const sillyPack = progressionSystem.getUnlockables()
        .find(item => item.id === 'silly-pack');
      const digitalDrum = progressionSystem.getUnlockables()
        .find(item => item.id === 'digitalDrum');
      
      expect(synthLead?.requiredLevel).toBeDefined();
      expect(sillyPack?.requiredScore).toBeDefined();
      expect(digitalDrum?.requiredAchievements).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle non-existent item checks', () => {
      expect(progressionSystem.isUnlocked('fake-item')).toBe(false);
    });

    it('should handle empty unlock checks', () => {
      const unlockSpy = jest.fn();
      progressionSystem.on('itemUnlocked', unlockSpy);
      
      progressionSystem.checkUnlocks({});
      
      expect(unlockSpy).not.toHaveBeenCalled();
    });

    it('should handle all types of unlockables', () => {
      const types = ['instrument', 'effect', 'sound', 'theme'];
      
      types.forEach(type => {
        const items = progressionSystem.getUnlockables(type);
        expect(items.length).toBeGreaterThan(0);
      });
    });

    it('should maintain consistent state after multiple operations', () => {
      // Perform various operations
      progressionSystem.checkUnlocks({ level: 2 });
      progressionSystem.forceUnlock('cosmic-finale');
      progressionSystem.checkUnlocks({ score: 10000 });
      
      // State should be consistent
      const progress = progressionSystem.getUnlockProgress();
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
      
      // Unlocked items should remain unlocked
      expect(progressionSystem.isUnlocked('synthLead')).toBe(true);
      expect(progressionSystem.isUnlocked('cosmic-finale')).toBe(true);
    });
  });
});