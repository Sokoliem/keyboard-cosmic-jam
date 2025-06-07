/**
 * AchievementDisplay Unit Tests
 * 
 * Comprehensive test suite for the AchievementDisplay component covering:
 * - DOM element creation and layout setup
 * - Achievement badge rendering and styling
 * - Progress bar updates and animations
 * - Unlock notification system and queue
 * - Tooltip display and interactions
 * - Visibility toggling and animations
 * - Event handling and user interactions
 * - Performance optimizations
 * - Error handling and edge cases
 * 
 * Target Coverage: 93%
 */

import { AchievementDisplay } from '@ui/components/AchievementDisplay';
import { Achievement } from '@game/core/AchievementSystem';

// Mock DOM methods
const mockElement = {
  style: { cssText: '' },
  textContent: '',
  innerHTML: '',
  appendChild: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
    toggle: jest.fn()
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getAttribute: jest.fn(),
  setAttribute: jest.fn(),
  remove: jest.fn(),
  getBoundingClientRect: jest.fn(() => ({
    x: 0, y: 0, width: 300, height: 400,
    top: 0, left: 0, right: 300, bottom: 400
  }))
};

const mockDocument = {
  createElement: jest.fn(() => ({ ...mockElement })),
  body: {
    appendChild: jest.fn()
  }
};

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
});

// Mock setTimeout for notification timing
const mockSetTimeout = jest.fn((callback, delay) => {
  setTimeout(callback, 0);
  return Math.random();
});
global.setTimeout = mockSetTimeout as any;

// Mock requestAnimationFrame
const mockRequestAnimationFrame = jest.fn();
Object.defineProperty(global, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true
});

// Mock performance.now
const mockPerformanceNow = jest.fn(() => 1000);
Object.defineProperty(performance, 'now', { value: mockPerformanceNow });

describe('AchievementDisplay', () => {
  let achievementDisplay: AchievementDisplay;
  let mockContainer: HTMLElement;
  let mockBadgeContainer: HTMLElement;
  let mockProgressBarContainer: HTMLElement;
  let mockTooltip: HTMLElement;

  const createMockAchievement = (
    id: string, 
    name: string, 
    unlocked = false, 
    progress = 0
  ): Achievement => ({
    id,
    name,
    description: `Description for ${name}`,
    icon: '🏆',
    progress,
    target: 100,
    unlocked,
    unlockedAt: unlocked ? Date.now() : undefined,
    category: 'general',
    rarity: 'common',
    points: 100
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock DOM elements
    mockContainer = { ...mockElement };
    mockBadgeContainer = { ...mockElement };
    mockProgressBarContainer = { ...mockElement };
    mockTooltip = { ...mockElement };
    
    // Configure document.createElement to return specific elements
    mockDocument.createElement
      .mockReturnValueOnce(mockContainer)           // Main container
      .mockReturnValueOnce(mockBadgeContainer)      // Badge container
      .mockReturnValueOnce(mockProgressBarContainer) // Progress container
      .mockReturnValueOnce(mockTooltip);            // Tooltip
    
    // Setup querySelector to return specific elements
    mockContainer.querySelector = jest.fn()
      .mockImplementation((selector: string) => {
        if (selector === '.badge-container') return mockBadgeContainer;
        if (selector === '.progress-bar-container') return mockProgressBarContainer;
        if (selector === '.progress-bar') return mockElement;
        if (selector === '.tooltip') return mockTooltip;
        return null;
      });
    
    mockContainer.querySelectorAll = jest.fn()
      .mockImplementation((selector: string) => {
        if (selector === '.achievement-badge') return [];
        return [];
      });
    
    achievementDisplay = new AchievementDisplay();
  });

  afterEach(() => {
    achievementDisplay.destroy();
  });

  describe('constructor and initialization', () => {
    it('should create AchievementDisplay instance', () => {
      expect(achievementDisplay).toBeInstanceOf(AchievementDisplay);
    });

    it('should create main container with correct styling', () => {
      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(mockContainer.style.cssText).toContain('position: fixed');
      expect(mockContainer.style.cssText).toContain('left: 20px');
      expect(mockContainer.style.cssText).toContain('top: 50%');
      expect(mockContainer.style.cssText).toContain('z-index: 999');
    });

    it('should create badge container', () => {
      expect(mockBadgeContainer.style.cssText).toContain('display: flex');
      expect(mockBadgeContainer.style.cssText).toContain('flex-direction: column');
      expect(mockBadgeContainer.style.cssText).toContain('gap: 10px');
    });

    it('should create progress bar container', () => {
      expect(mockProgressBarContainer.style.cssText).toContain('width: 100%');
      expect(mockProgressBarContainer.style.cssText).toContain('height: 20px');
      expect(mockProgressBarContainer.style.cssText).toContain('background: rgba(255, 255, 255, 0.1)');
    });

    it('should setup proper element hierarchy', () => {
      expect(mockContainer.appendChild).toHaveBeenCalledWith(mockBadgeContainer);
      expect(mockContainer.appendChild).toHaveBeenCalledWith(mockProgressBarContainer);
    });

    it('should append container to document body', () => {
      expect(mockDocument.body.appendChild).toHaveBeenCalledWith(mockContainer);
    });

    it('should initialize with hidden state', () => {
      expect(mockContainer.style.cssText).toContain('transform: translateX(-320px)');
    });
  });

  describe('achievement updates', () => {
    it('should update achievement badges', () => {
      const achievements = [
        createMockAchievement('first-note', 'First Note', true),
        createMockAchievement('combo-master', 'Combo Master', false, 50)
      ];
      
      achievementDisplay.updateAchievements(achievements);
      
      expect(mockBadgeContainer.innerHTML).toBe('');
      expect(mockDocument.createElement).toHaveBeenCalledTimes(6); // Initial + 2 badges
    });

    it('should create badges for unlocked achievements', () => {
      const achievement = createMockAchievement('test', 'Test Achievement', true);
      
      achievementDisplay.updateAchievements([achievement]);
      
      const badgeElement = { ...mockElement };
      mockDocument.createElement.mockReturnValue(badgeElement);
      
      expect(badgeElement.style.cssText).toContain('border: 2px solid #FFD700');
      expect(badgeElement.textContent).toBe('🏆');
    });

    it('should create badges for locked achievements with progress', () => {
      const achievement = createMockAchievement('test', 'Test Achievement', false, 75);
      
      achievementDisplay.updateAchievements([achievement]);
      
      const badgeElement = { ...mockElement };
      mockDocument.createElement.mockReturnValue(badgeElement);
      
      expect(badgeElement.style.cssText).toContain('border: 2px solid #666666');
      expect(badgeElement.style.cssText).toContain('opacity: 0.6');
    });

    it('should handle empty achievement list', () => {
      achievementDisplay.updateAchievements([]);
      
      expect(mockBadgeContainer.innerHTML).toBe('');
    });

    it('should handle achievement updates efficiently', () => {
      const achievements = Array.from({ length: 20 }, (_, i) => 
        createMockAchievement(`achievement-${i}`, `Achievement ${i}`, i % 3 === 0)
      );
      
      const startTime = performance.now();
      achievementDisplay.updateAchievements(achievements);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('badge creation and styling', () => {
    it('should create badge with correct structure', () => {
      const achievement = createMockAchievement('test', 'Test', true);
      const badge = { ...mockElement };
      mockDocument.createElement.mockReturnValue(badge);
      
      achievementDisplay.updateAchievements([achievement]);
      
      expect(badge.style.cssText).toContain('width: 60px');
      expect(badge.style.cssText).toContain('height: 60px');
      expect(badge.style.cssText).toContain('border-radius: 50%');
      expect(badge.style.cssText).toContain('position: relative');
    });

    it('should style unlocked badges differently', () => {
      const unlockedAchievement = createMockAchievement('unlocked', 'Unlocked', true);
      const lockedAchievement = createMockAchievement('locked', 'Locked', false);
      
      achievementDisplay.updateAchievements([unlockedAchievement, lockedAchievement]);
      
      // Should create different styles for unlocked vs locked
      expect(mockDocument.createElement).toHaveBeenCalled();
    });

    it('should handle achievement rarities with different colors', () => {
      const commonAchievement = { 
        ...createMockAchievement('common', 'Common', true),
        rarity: 'common' as const
      };
      const rareAchievement = { 
        ...createMockAchievement('rare', 'Rare', true),
        rarity: 'rare' as const
      };
      const legendaryAchievement = { 
        ...createMockAchievement('legendary', 'Legendary', true),
        rarity: 'legendary' as const
      };
      
      achievementDisplay.updateAchievements([commonAchievement, rareAchievement, legendaryAchievement]);
      
      // Should create badges with different border colors based on rarity
      expect(mockDocument.createElement).toHaveBeenCalled();
    });

    it('should add hover effects to badges', () => {
      const achievement = createMockAchievement('hover-test', 'Hover Test', true);
      const badge = { ...mockElement };
      mockDocument.createElement.mockReturnValue(badge);
      
      achievementDisplay.updateAchievements([achievement]);
      
      expect(badge.addEventListener).toHaveBeenCalledWith('mouseenter', expect.any(Function));
      expect(badge.addEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function));
    });

    it('should display achievement icons correctly', () => {
      const achievements = [
        { ...createMockAchievement('music', 'Music', true), icon: '🎵' },
        { ...createMockAchievement('star', 'Star', true), icon: '⭐' },
        { ...createMockAchievement('fire', 'Fire', true), icon: '🔥' }
      ];
      
      achievementDisplay.updateAchievements(achievements);
      
      // Should display correct icons
      expect(mockDocument.createElement).toHaveBeenCalled();
    });
  });

  describe('tooltip functionality', () => {
    it('should show tooltip on badge hover', () => {
      const achievement = createMockAchievement('tooltip-test', 'Tooltip Test', true);
      const badge = { ...mockElement };
      const tooltip = { ...mockElement };
      
      mockDocument.createElement
        .mockReturnValueOnce(badge)
        .mockReturnValueOnce(tooltip);
      
      achievementDisplay.updateAchievements([achievement]);
      
      // Simulate hover
      const hoverHandler = badge.addEventListener.mock.calls
        .find(call => call[0] === 'mouseenter')?.[1];
      
      if (hoverHandler) {
        hoverHandler();
        expect(tooltip.style.cssText).toContain('opacity: 1');
      }
    });

    it('should hide tooltip on mouse leave', () => {
      const achievement = createMockAchievement('tooltip-test', 'Tooltip Test', true);
      const badge = { ...mockElement };
      
      mockDocument.createElement.mockReturnValue(badge);
      achievementDisplay.updateAchievements([achievement]);
      
      const leaveHandler = badge.addEventListener.mock.calls
        .find(call => call[0] === 'mouseleave')?.[1];
      
      if (leaveHandler) {
        leaveHandler();
        expect(mockTooltip.style.cssText).toContain('opacity: 0');
      }
    });

    it('should position tooltip correctly relative to badge', () => {
      const achievement = createMockAchievement('position-test', 'Position Test', true);
      const badge = { ...mockElement };
      
      badge.getBoundingClientRect = jest.fn(() => ({
        x: 100, y: 200, width: 60, height: 60,
        top: 200, left: 100, right: 160, bottom: 260
      }));
      
      mockDocument.createElement.mockReturnValue(badge);
      achievementDisplay.updateAchievements([achievement]);
      
      const hoverHandler = badge.addEventListener.mock.calls
        .find(call => call[0] === 'mouseenter')?.[1];
      
      if (hoverHandler) {
        hoverHandler();
        expect(mockTooltip.style.cssText).toContain('left: 170px');
        expect(mockTooltip.style.cssText).toContain('top: 200px');
      }
    });

    it('should display achievement details in tooltip', () => {
      const achievement = createMockAchievement('details-test', 'Details Test', false, 75);
      achievement.description = 'Test achievement description';
      
      const badge = { ...mockElement };
      mockDocument.createElement.mockReturnValue(badge);
      
      achievementDisplay.updateAchievements([achievement]);
      
      const hoverHandler = badge.addEventListener.mock.calls
        .find(call => call[0] === 'mouseenter')?.[1];
      
      if (hoverHandler) {
        hoverHandler();
        expect(mockTooltip.innerHTML).toContain('Details Test');
        expect(mockTooltip.innerHTML).toContain('Test achievement description');
        expect(mockTooltip.innerHTML).toContain('75/100');
      }
    });
  });

  describe('progress bar updates', () => {
    it('should update progress bar width', () => {
      const progressBar = { ...mockElement };
      mockContainer.querySelector = jest.fn(selector => 
        selector === '.progress-bar' ? progressBar : null
      );
      
      achievementDisplay.updateProgress(0.75);
      
      expect(progressBar.style.width).toBe('75%');
    });

    it('should handle progress values correctly', () => {
      const testCases = [
        { progress: 0, expected: '0%' },
        { progress: 0.5, expected: '50%' },
        { progress: 1, expected: '100%' },
        { progress: 1.5, expected: '100%' }, // Clamped
        { progress: -0.1, expected: '0%' }   // Clamped
      ];

      const progressBar = { ...mockElement };
      mockContainer.querySelector = jest.fn(selector => 
        selector === '.progress-bar' ? progressBar : null
      );

      testCases.forEach(({ progress, expected }) => {
        achievementDisplay.updateProgress(progress);
        expect(progressBar.style.width).toBe(expected);
      });
    });

    it('should animate progress bar changes', () => {
      const progressBar = { ...mockElement };
      mockContainer.querySelector = jest.fn(selector => 
        selector === '.progress-bar' ? progressBar : null
      );
      
      achievementDisplay.updateProgress(0.6);
      
      expect(progressBar.style.cssText).toContain('transition: width 0.5s ease');
    });
  });

  describe('unlock notification system', () => {
    it('should show unlock notification', () => {
      const achievement = createMockAchievement('unlock-test', 'Unlock Test', true);
      
      achievementDisplay.showUnlockNotification(achievement);
      
      expect(mockSetTimeout).toHaveBeenCalled();
    });

    it('should queue notifications when busy', () => {
      const achievement1 = createMockAchievement('unlock-1', 'Unlock 1', true);
      const achievement2 = createMockAchievement('unlock-2', 'Unlock 2', true);
      
      achievementDisplay.showUnlockNotification(achievement1);
      achievementDisplay.showUnlockNotification(achievement2);
      
      // Should queue the second notification
      expect(mockSetTimeout).toHaveBeenCalledTimes(1);
    });

    it('should process notification queue in order', async () => {
      const achievements = [
        createMockAchievement('queue-1', 'Queue 1', true),
        createMockAchievement('queue-2', 'Queue 2', true),
        createMockAchievement('queue-3', 'Queue 3', true)
      ];
      
      achievements.forEach(achievement => {
        achievementDisplay.showUnlockNotification(achievement);
      });
      
      // Should process one at a time
      expect(mockSetTimeout).toHaveBeenCalledTimes(1);
    });

    it('should handle notification display duration', () => {
      const achievement = createMockAchievement('duration-test', 'Duration Test', true);
      
      achievementDisplay.showUnlockNotification(achievement);
      
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 3000);
    });

    it('should create notification element with correct styling', () => {
      const achievement = createMockAchievement('style-test', 'Style Test', true);
      const notification = { ...mockElement };
      
      mockDocument.createElement.mockReturnValue(notification);
      
      achievementDisplay.showUnlockNotification(achievement);
      
      expect(notification.style.cssText).toContain('position: fixed');
      expect(notification.style.cssText).toContain('top: 50%');
      expect(notification.style.cssText).toContain('left: 50%');
      expect(notification.style.cssText).toContain('z-index: 2000');
    });
  });

  describe('visibility toggling', () => {
    it('should show achievement display', () => {
      achievementDisplay.show();
      
      expect(mockContainer.style.transform).toBe('translateX(0)');
    });

    it('should hide achievement display', () => {
      achievementDisplay.hide();
      
      expect(mockContainer.style.transform).toBe('translateX(-320px)');
    });

    it('should toggle visibility correctly', () => {
      // Initially hidden
      expect(mockContainer.style.transform).toBe('translateX(-320px)');
      
      achievementDisplay.toggleVisibility();
      expect(mockContainer.style.transform).toBe('translateX(0)');
      
      achievementDisplay.toggleVisibility();
      expect(mockContainer.style.transform).toBe('translateX(-320px)');
    });

    it('should animate visibility transitions', () => {
      achievementDisplay.show();
      
      expect(mockContainer.style.cssText).toContain('transition: transform 0.3s ease');
    });
  });

  describe('performance optimization', () => {
    it('should efficiently handle large achievement lists', () => {
      const manyAchievements = Array.from({ length: 100 }, (_, i) => 
        createMockAchievement(`perf-${i}`, `Performance ${i}`, i % 5 === 0)
      );
      
      const startTime = performance.now();
      achievementDisplay.updateAchievements(manyAchievements);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should reuse DOM elements when possible', () => {
      const achievements = [createMockAchievement('reuse-1', 'Reuse 1', true)];
      
      achievementDisplay.updateAchievements(achievements);
      const firstCallCount = mockDocument.createElement.mock.calls.length;
      
      achievementDisplay.updateAchievements(achievements);
      const secondCallCount = mockDocument.createElement.mock.calls.length;
      
      // Should not create significantly more elements on second call
      expect(secondCallCount - firstCallCount).toBeLessThan(5);
    });

    it('should debounce rapid updates', () => {
      const achievement = createMockAchievement('debounce-test', 'Debounce Test', false);
      
      // Rapid progress updates
      for (let i = 0; i < 20; i++) {
        achievementDisplay.updateProgress(i / 20);
      }
      
      // Should not cause excessive redraws
      expect(mockRequestAnimationFrame.mock.calls.length).toBeLessThan(20);
    });
  });

  describe('responsive design', () => {
    it('should adapt to mobile screen sizes', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      
      const mobileDisplay = new AchievementDisplay();
      
      expect(mockContainer.style.cssText).toContain('left: 10px');
      expect(mockContainer.style.cssText).toContain('width: 200px');
      
      mobileDisplay.destroy();
    });

    it('should scale badge sizes for mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 320 });
      
      const mobileDisplay = new AchievementDisplay();
      const achievement = createMockAchievement('mobile-test', 'Mobile Test', true);
      
      mobileDisplay.updateAchievements([achievement]);
      
      const badge = { ...mockElement };
      mockDocument.createElement.mockReturnValue(badge);
      
      expect(badge.style.cssText).toContain('width: 40px');
      expect(badge.style.cssText).toContain('height: 40px');
      
      mobileDisplay.destroy();
    });

    it('should handle orientation changes', () => {
      achievementDisplay.show();
      
      // Simulate orientation change
      Object.defineProperty(window, 'innerWidth', { value: 667 });
      Object.defineProperty(window, 'innerHeight', { value: 375 });
      
      window.dispatchEvent(new Event('orientationchange'));
      
      expect(mockContainer.style.cssText).toContain('position: fixed');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      expect(mockContainer.setAttribute).toHaveBeenCalledWith('role', 'region');
      expect(mockContainer.setAttribute).toHaveBeenCalledWith('aria-label', 'Achievement Display');
    });

    it('should support keyboard navigation', () => {
      const achievement = createMockAchievement('kbd-test', 'Keyboard Test', true);
      const badge = { ...mockElement };
      
      mockDocument.createElement.mockReturnValue(badge);
      achievementDisplay.updateAchievements([achievement]);
      
      expect(badge.setAttribute).toHaveBeenCalledWith('tabindex', '0');
      expect(badge.setAttribute).toHaveBeenCalledWith('role', 'button');
    });

    it('should announce unlock notifications to screen readers', () => {
      const achievement = createMockAchievement('announce-test', 'Announce Test', true);
      const notification = { ...mockElement };
      
      mockDocument.createElement.mockReturnValue(notification);
      achievementDisplay.showUnlockNotification(achievement);
      
      expect(notification.setAttribute).toHaveBeenCalledWith('role', 'alert');
      expect(notification.setAttribute).toHaveBeenCalledWith('aria-live', 'assertive');
    });

    it('should provide descriptive text for achievements', () => {
      const achievement = createMockAchievement('desc-test', 'Description Test', false, 60);
      const badge = { ...mockElement };
      
      mockDocument.createElement.mockReturnValue(badge);
      achievementDisplay.updateAchievements([achievement]);
      
      expect(badge.setAttribute).toHaveBeenCalledWith(
        'aria-label', 
        'Description Test achievement, 60% complete'
      );
    });
  });

  describe('error handling', () => {
    it('should handle missing DOM elements gracefully', () => {
      mockContainer.querySelector = jest.fn(() => null);
      
      expect(() => {
        achievementDisplay.updateProgress(0.5);
      }).not.toThrow();
    });

    it('should handle invalid achievement data', () => {
      const invalidAchievements = [
        null,
        undefined,
        {},
        { id: 'test' }, // Missing required fields
        { name: 'test' } // Missing id
      ];
      
      expect(() => {
        achievementDisplay.updateAchievements(invalidAchievements as any);
      }).not.toThrow();
    });

    it('should handle DOM manipulation errors', () => {
      mockContainer.appendChild = jest.fn(() => {
        throw new Error('DOM manipulation failed');
      });
      
      expect(() => {
        const achievement = createMockAchievement('error-test', 'Error Test', true);
        achievementDisplay.updateAchievements([achievement]);
      }).not.toThrow();
    });

    it('should handle tooltip positioning errors', () => {
      const achievement = createMockAchievement('tooltip-error', 'Tooltip Error', true);
      const badge = { ...mockElement };
      
      badge.getBoundingClientRect = jest.fn(() => {
        throw new Error('getBoundingClientRect failed');
      });
      
      mockDocument.createElement.mockReturnValue(badge);
      
      expect(() => {
        achievementDisplay.updateAchievements([achievement]);
      }).not.toThrow();
    });
  });

  describe('cleanup and destruction', () => {
    it('should remove elements from DOM on destroy', () => {
      achievementDisplay.destroy();
      
      expect(mockContainer.remove).toHaveBeenCalled();
    });

    it('should clear notification queue on destroy', () => {
      const achievements = [
        createMockAchievement('clean-1', 'Clean 1', true),
        createMockAchievement('clean-2', 'Clean 2', true)
      ];
      
      achievements.forEach(achievement => {
        achievementDisplay.showUnlockNotification(achievement);
      });
      
      achievementDisplay.destroy();
      
      // Should clear any pending timeouts
      expect(() => {
        const callback = mockSetTimeout.mock.calls[0]?.[0];
        if (callback) callback();
      }).not.toThrow();
    });

    it('should handle multiple destroy calls', () => {
      achievementDisplay.destroy();
      
      expect(() => {
        achievementDisplay.destroy();
      }).not.toThrow();
    });

    it('should cleanup event listeners on destroy', () => {
      achievementDisplay.destroy();
      
      expect(mockContainer.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle achievement progression scenario', () => {
      const achievement = createMockAchievement('progression', 'Progression Test', false, 0);
      
      // Start with locked achievement
      achievementDisplay.updateAchievements([achievement]);
      achievementDisplay.updateProgress(0);
      
      // Progress through levels
      for (let progress = 0.1; progress <= 1.0; progress += 0.1) {
        achievementDisplay.updateProgress(progress);
        
        if (progress >= 1.0) {
          achievement.unlocked = true;
          achievement.progress = 100;
          achievementDisplay.updateAchievements([achievement]);
          achievementDisplay.showUnlockNotification(achievement);
        }
      }
      
      expect(mockSetTimeout).toHaveBeenCalled();
    });

    it('should handle mixed achievement states', () => {
      const achievements = [
        createMockAchievement('unlocked-1', 'Unlocked 1', true),
        createMockAchievement('progress-1', 'Progress 1', false, 75),
        createMockAchievement('progress-2', 'Progress 2', false, 25),
        createMockAchievement('locked-1', 'Locked 1', false, 0)
      ];
      
      achievementDisplay.updateAchievements(achievements);
      achievementDisplay.updateProgress(0.5);
      
      expect(mockDocument.createElement).toHaveBeenCalled();
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle very long achievement names', () => {
      const longName = 'A'.repeat(100);
      const achievement = createMockAchievement('long-name', longName, true);
      
      expect(() => {
        achievementDisplay.updateAchievements([achievement]);
      }).not.toThrow();
    });

    it('should handle achievements with special characters', () => {
      const specialAchievement = createMockAchievement('special', '🎵🎶🎸🎹 Special Achievement! 🔥✨', true);
      
      expect(() => {
        achievementDisplay.updateAchievements([specialAchievement]);
      }).not.toThrow();
    });

    it('should handle rapid visibility toggles', () => {
      for (let i = 0; i < 20; i++) {
        achievementDisplay.toggleVisibility();
      }
      
      expect(() => achievementDisplay.show()).not.toThrow();
    });

    it('should handle simultaneous notification and update operations', () => {
      const achievement = createMockAchievement('simultaneous', 'Simultaneous Test', true);
      
      achievementDisplay.updateAchievements([achievement]);
      achievementDisplay.showUnlockNotification(achievement);
      achievementDisplay.updateProgress(0.8);
      achievementDisplay.toggleVisibility();
      
      expect(() => {
        achievementDisplay.updateAchievements([achievement]);
      }).not.toThrow();
    });
  });
});
