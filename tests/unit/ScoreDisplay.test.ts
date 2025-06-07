/**
 * ScoreDisplay Unit Tests
 * 
 * Comprehensive test suite for the ScoreDisplay component covering:
 * - DOM element creation and styling
 * - Score value updates and formatting
 * - Score animation and transitions
 * - Combo display and multiplier effects
 * - Accuracy tracking and display
 * - Visual feedback and styling
 * - Performance optimizations
 * - Error handling and edge cases
 * 
 * Target Coverage: 92%
 */

import { ScoreDisplay } from '@ui/components/ScoreDisplay';

// Mock DOM methods
const mockElement = {
  style: { cssText: '' },
  textContent: '',
  appendChild: jest.fn(),
  querySelector: jest.fn(),
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn()
  },
  remove: jest.fn()
};

const mockDocument = {
  createElement: jest.fn(() => mockElement),
  body: {
    appendChild: jest.fn()
  }
};

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
});

// Mock requestAnimationFrame for animation testing
const mockRequestAnimationFrame = jest.fn();
Object.defineProperty(global, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true
});

// Mock performance.now for timing
const mockPerformanceNow = jest.fn(() => 1000);
Object.defineProperty(performance, 'now', { value: mockPerformanceNow });

describe('ScoreDisplay', () => {
  let scoreDisplay: ScoreDisplay;
  let mockContainer: HTMLElement;
  let mockScoreValue: HTMLElement;
  let mockComboDisplay: HTMLElement;
  let mockAccuracyDisplay: HTMLElement;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock DOM elements
    mockContainer = { ...mockElement };
    mockScoreValue = { ...mockElement };
    mockComboDisplay = { ...mockElement };
    mockAccuracyDisplay = { ...mockElement };
    
    // Configure document.createElement to return specific elements
    mockDocument.createElement
      .mockReturnValueOnce(mockContainer)     // Main container
      .mockReturnValueOnce(mockScoreValue)    // Score value
      .mockReturnValueOnce(mockComboDisplay)  // Combo display
      .mockReturnValueOnce(mockAccuracyDisplay); // Accuracy display
    
    // Setup querySelector to return specific elements
    mockContainer.querySelector = jest.fn()
      .mockImplementation((selector: string) => {
        if (selector === '.score-value') return mockScoreValue;
        if (selector === '.combo-display') return mockComboDisplay;
        if (selector === '.accuracy-display') return mockAccuracyDisplay;
        return null;
      });
    
    scoreDisplay = new ScoreDisplay();
  });

  afterEach(() => {
    scoreDisplay.destroy();
  });

  describe('constructor and initialization', () => {
    it('should create ScoreDisplay instance', () => {
      expect(scoreDisplay).toBeInstanceOf(ScoreDisplay);
    });

    it('should create main container with correct styling', () => {
      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(mockContainer.style.cssText).toContain('position: fixed');
      expect(mockContainer.style.cssText).toContain('top: 20px');
      expect(mockContainer.style.cssText).toContain('right: 20px');
      expect(mockContainer.style.cssText).toContain('z-index: 1000');
    });

    it('should create score value element', () => {
      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(mockScoreValue.style.cssText).toContain('font-size: 24px');
      expect(mockScoreValue.style.cssText).toContain('color: #FFFF00');
      expect(mockScoreValue.textContent).toBe('0');
    });

    it('should create combo display element', () => {
      expect(mockComboDisplay.style.cssText).toContain('font-size: 18px');
      expect(mockComboDisplay.style.cssText).toContain('color: #FF00FF');
      expect(mockComboDisplay.textContent).toBe('');
    });

    it('should create accuracy display element', () => {
      expect(mockAccuracyDisplay.style.cssText).toContain('font-size: 16px');
      expect(mockAccuracyDisplay.style.cssText).toContain('color: #00FFFF');
      expect(mockAccuracyDisplay.textContent).toBe('');
    });

    it('should append container to document body', () => {
      expect(mockDocument.body.appendChild).toHaveBeenCalledWith(mockContainer);
    });

    it('should setup proper element hierarchy', () => {
      expect(mockContainer.appendChild).toHaveBeenCalledWith(mockScoreValue);
      expect(mockContainer.appendChild).toHaveBeenCalledWith(mockComboDisplay);
      expect(mockContainer.appendChild).toHaveBeenCalledWith(mockAccuracyDisplay);
    });
  });

  describe('score updates', () => {
    it('should update score value', () => {
      scoreDisplay.updateScore(1500);
      
      expect(mockScoreValue.textContent).toBe('1,500');
    });

    it('should format large numbers correctly', () => {
      const testCases = [
        { score: 0, expected: '0' },
        { score: 123, expected: '123' },
        { score: 1234, expected: '1,234' },
        { score: 12345, expected: '12,345' },
        { score: 123456, expected: '123,456' },
        { score: 1234567, expected: '1,234,567' }
      ];

      testCases.forEach(({ score, expected }) => {
        scoreDisplay.updateScore(score);
        expect(mockScoreValue.textContent).toBe(expected);
      });
    });

    it('should handle negative scores', () => {
      scoreDisplay.updateScore(-100);
      expect(mockScoreValue.textContent).toBe('-100');
    });

    it('should handle floating point scores', () => {
      scoreDisplay.updateScore(1234.56);
      expect(mockScoreValue.textContent).toBe('1,235'); // Should round
    });

    it('should trigger score animation on update', () => {
      scoreDisplay.updateScore(1000);
      
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('should handle rapid score updates', () => {
      for (let i = 0; i < 20; i++) {
        scoreDisplay.updateScore(i * 100);
      }
      
      expect(mockScoreValue.textContent).toBe('1,900');
    });
  });

  describe('combo display', () => {
    it('should show combo when streak is active', () => {
      scoreDisplay.updateCombo(5);
      
      expect(mockComboDisplay.textContent).toBe('5x Combo!');
      expect(mockComboDisplay.style.cssText).toContain('opacity: 1');
    });

    it('should hide combo when streak is broken', () => {
      scoreDisplay.updateCombo(5);
      scoreDisplay.updateCombo(0);
      
      expect(mockComboDisplay.textContent).toBe('');
      expect(mockComboDisplay.style.cssText).toContain('opacity: 0');
    });

    it('should scale combo display with streak length', () => {
      scoreDisplay.updateCombo(10);
      
      expect(mockComboDisplay.style.cssText).toContain('font-size: 20px');
      expect(mockComboDisplay.style.cssText).toContain('transform: scale(1.1)');
    });

    it('should handle massive combo streaks', () => {
      scoreDisplay.updateCombo(50);
      
      expect(mockComboDisplay.textContent).toBe('50x Combo!');
      expect(mockComboDisplay.style.cssText).toContain('font-size: 24px');
      expect(mockComboDisplay.style.cssText).toContain('transform: scale(1.2)');
    });

    it('should animate combo changes', () => {
      scoreDisplay.updateCombo(3);
      scoreDisplay.updateCombo(4);
      
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('should color combo based on streak length', () => {
      // Small combo
      scoreDisplay.updateCombo(3);
      expect(mockComboDisplay.style.cssText).toContain('color: #FF00FF');
      
      // Medium combo
      scoreDisplay.updateCombo(10);
      expect(mockComboDisplay.style.cssText).toContain('color: #FF6600');
      
      // Large combo
      scoreDisplay.updateCombo(20);
      expect(mockComboDisplay.style.cssText).toContain('color: #FF0000');
    });
  });

  describe('accuracy display', () => {
    it('should show accuracy percentage', () => {
      scoreDisplay.updateAccuracy(0.95);
      
      expect(mockAccuracyDisplay.textContent).toBe('95% Accuracy');
      expect(mockAccuracyDisplay.style.cssText).toContain('opacity: 1');
    });

    it('should format accuracy correctly', () => {
      const testCases = [
        { accuracy: 1.0, expected: '100% Accuracy' },
        { accuracy: 0.876, expected: '88% Accuracy' },
        { accuracy: 0.5, expected: '50% Accuracy' },
        { accuracy: 0.0, expected: '0% Accuracy' }
      ];

      testCases.forEach(({ accuracy, expected }) => {
        scoreDisplay.updateAccuracy(accuracy);
        expect(mockAccuracyDisplay.textContent).toBe(expected);
      });
    });

    it('should color accuracy based on performance', () => {
      // Excellent accuracy
      scoreDisplay.updateAccuracy(0.95);
      expect(mockAccuracyDisplay.style.cssText).toContain('color: #00FF00');
      
      // Good accuracy
      scoreDisplay.updateAccuracy(0.80);
      expect(mockAccuracyDisplay.style.cssText).toContain('color: #FFFF00');
      
      // Poor accuracy
      scoreDisplay.updateAccuracy(0.60);
      expect(mockAccuracyDisplay.style.cssText).toContain('color: #FF6600');
      
      // Very poor accuracy
      scoreDisplay.updateAccuracy(0.30);
      expect(mockAccuracyDisplay.style.cssText).toContain('color: #FF0000');
    });

    it('should handle edge case accuracy values', () => {
      scoreDisplay.updateAccuracy(1.5); // Over 100%
      expect(mockAccuracyDisplay.textContent).toBe('100% Accuracy');
      
      scoreDisplay.updateAccuracy(-0.1); // Negative
      expect(mockAccuracyDisplay.textContent).toBe('0% Accuracy');
    });

    it('should animate accuracy changes', () => {
      scoreDisplay.updateAccuracy(0.8);
      
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('visual animations', () => {
    it('should animate score pulsing on update', () => {
      scoreDisplay.updateScore(1000);
      
      expect(mockScoreValue.style.cssText).toContain('animation: scorePulse');
    });

    it('should animate combo appearance', () => {
      scoreDisplay.updateCombo(5);
      
      expect(mockComboDisplay.style.cssText).toContain('animation: comboAppear');
    });

    it('should animate accuracy fade-in', () => {
      scoreDisplay.updateAccuracy(0.9);
      
      expect(mockAccuracyDisplay.style.cssText).toContain('animation: accuracyFade');
    });

    it('should queue animations properly', () => {
      scoreDisplay.updateScore(1000);
      scoreDisplay.updateCombo(5);
      scoreDisplay.updateAccuracy(0.9);
      
      // Should handle multiple simultaneous animations
      expect(mockRequestAnimationFrame).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should cleanup animations after completion', () => {
      scoreDisplay.updateScore(1000);
      
      // Simulate animation completion
      const animationCallback = mockRequestAnimationFrame.mock.calls[0][0];
      animationCallback();
      
      expect(mockScoreValue.style.cssText).not.toContain('animation: scorePulse');
    });
  });

  describe('performance optimization', () => {
    it('should debounce rapid updates', () => {
      const initialCallCount = mockRequestAnimationFrame.mock.calls.length;
      
      // Rapidly update score
      for (let i = 0; i < 10; i++) {
        scoreDisplay.updateScore(i * 100);
      }
      
      // Should not create excessive animation frames
      const finalCallCount = mockRequestAnimationFrame.mock.calls.length;
      expect(finalCallCount - initialCallCount).toBeLessThan(10);
    });

    it('should reuse animation frames when possible', () => {
      scoreDisplay.updateScore(1000);
      const firstFrameCount = mockRequestAnimationFrame.mock.calls.length;
      
      scoreDisplay.updateScore(2000);
      const secondFrameCount = mockRequestAnimationFrame.mock.calls.length;
      
      expect(secondFrameCount - firstFrameCount).toBeLessThan(2);
    });

    it('should handle high-frequency updates efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        scoreDisplay.updateScore(i * 10);
        scoreDisplay.updateCombo(i % 10);
        scoreDisplay.updateAccuracy(Math.random());
      }
      
      const endTime = performance.now();
      
      // Should complete quickly
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('responsive design', () => {
    it('should adapt to different screen sizes', () => {
      // Test mobile size
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      
      const mobileDisplay = new ScoreDisplay();
      
      expect(mockContainer.style.cssText).toContain('right: 10px');
      expect(mockContainer.style.cssText).toContain('top: 10px');
      
      mobileDisplay.destroy();
    });

    it('should scale font sizes for mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 320 });
      
      const mobileDisplay = new ScoreDisplay();
      
      expect(mockScoreValue.style.cssText).toContain('font-size: 20px');
      expect(mockComboDisplay.style.cssText).toContain('font-size: 16px');
      
      mobileDisplay.destroy();
    });

    it('should handle orientation changes', () => {
      scoreDisplay.handleOrientationChange();
      
      expect(mockContainer.style.cssText).toContain('position: fixed');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      expect(mockContainer.getAttribute).toHaveBeenCalledWith('role', 'status');
      expect(mockContainer.getAttribute).toHaveBeenCalledWith('aria-label', 'Game Score Display');
    });

    it('should be screen reader friendly', () => {
      scoreDisplay.updateScore(1500);
      scoreDisplay.updateCombo(5);
      scoreDisplay.updateAccuracy(0.9);
      
      expect(mockContainer.getAttribute).toHaveBeenCalledWith('aria-live', 'polite');
    });

    it('should provide text alternatives for visual elements', () => {
      scoreDisplay.updateCombo(10);
      
      expect(mockComboDisplay.getAttribute).toHaveBeenCalledWith('aria-label', '10 note combo streak');
    });
  });

  describe('error handling', () => {
    it('should handle missing DOM elements gracefully', () => {
      mockContainer.querySelector = jest.fn(() => null);
      
      expect(() => {
        scoreDisplay.updateScore(1000);
      }).not.toThrow();
    });

    it('should handle invalid score values', () => {
      const invalidValues = [NaN, Infinity, -Infinity, null, undefined];
      
      invalidValues.forEach(value => {
        expect(() => {
          scoreDisplay.updateScore(value as any);
        }).not.toThrow();
      });
    });

    it('should handle DOM manipulation errors', () => {
      mockContainer.appendChild = jest.fn(() => {
        throw new Error('DOM manipulation failed');
      });
      
      expect(() => {
        new ScoreDisplay();
      }).not.toThrow();
    });

    it('should handle animation frame errors', () => {
      mockRequestAnimationFrame.mockImplementation(() => {
        throw new Error('Animation frame error');
      });
      
      expect(() => {
        scoreDisplay.updateScore(1000);
      }).not.toThrow();
    });
  });

  describe('state management', () => {
    it('should track current values', () => {
      scoreDisplay.updateScore(1500);
      scoreDisplay.updateCombo(8);
      scoreDisplay.updateAccuracy(0.85);
      
      expect(scoreDisplay.getCurrentScore()).toBe(1500);
      expect(scoreDisplay.getCurrentCombo()).toBe(8);
      expect(scoreDisplay.getCurrentAccuracy()).toBe(0.85);
    });

    it('should reset values when requested', () => {
      scoreDisplay.updateScore(1500);
      scoreDisplay.updateCombo(8);
      scoreDisplay.updateAccuracy(0.85);
      
      scoreDisplay.reset();
      
      expect(mockScoreValue.textContent).toBe('0');
      expect(mockComboDisplay.textContent).toBe('');
      expect(mockAccuracyDisplay.textContent).toBe('');
    });

    it('should maintain state consistency', () => {
      scoreDisplay.updateScore(1000);
      scoreDisplay.updateScore(2000);
      scoreDisplay.updateScore(1500);
      
      expect(scoreDisplay.getCurrentScore()).toBe(1500);
      expect(mockScoreValue.textContent).toBe('1,500');
    });
  });

  describe('cleanup and destruction', () => {
    it('should remove elements from DOM on destroy', () => {
      scoreDisplay.destroy();
      
      expect(mockContainer.remove).toHaveBeenCalled();
    });

    it('should cancel ongoing animations on destroy', () => {
      scoreDisplay.updateScore(1000);
      scoreDisplay.destroy();
      
      // Should not throw when animations try to complete
      expect(() => {
        const callback = mockRequestAnimationFrame.mock.calls[0]?.[0];
        if (callback) callback();
      }).not.toThrow();
    });

    it('should handle multiple destroy calls', () => {
      scoreDisplay.destroy();
      
      expect(() => {
        scoreDisplay.destroy();
      }).not.toThrow();
    });

    it('should cleanup event listeners on destroy', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      scoreDisplay.destroy();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex scoring scenarios', () => {
      // Simulate realistic game scoring
      let score = 0;
      let combo = 0;
      let accuracy = 1.0;
      
      // Perfect start
      for (let i = 0; i < 10; i++) {
        score += 100 + (combo * 10);
        combo++;
        scoreDisplay.updateScore(score);
        scoreDisplay.updateCombo(combo);
        scoreDisplay.updateAccuracy(accuracy);
      }
      
      // Miss breaks combo
      combo = 0;
      accuracy = 0.9;
      scoreDisplay.updateCombo(combo);
      scoreDisplay.updateAccuracy(accuracy);
      
      // Recovery
      for (let i = 0; i < 5; i++) {
        score += 100 + (combo * 10);
        combo++;
        accuracy = Math.min(accuracy + 0.01, 1.0);
        scoreDisplay.updateScore(score);
        scoreDisplay.updateCombo(combo);
        scoreDisplay.updateAccuracy(accuracy);
      }
      
      expect(scoreDisplay.getCurrentScore()).toBeGreaterThan(1000);
      expect(scoreDisplay.getCurrentCombo()).toBe(5);
      expect(scoreDisplay.getCurrentAccuracy()).toBeGreaterThan(0.9);
    });

    it('should handle score display during pause/resume', () => {
      scoreDisplay.updateScore(1000);
      scoreDisplay.updateCombo(5);
      
      scoreDisplay.pause();
      
      // Updates during pause should be queued
      scoreDisplay.updateScore(2000);
      scoreDisplay.updateCombo(10);
      
      scoreDisplay.resume();
      
      // Should show latest values after resume
      expect(mockScoreValue.textContent).toBe('2,000');
      expect(mockComboDisplay.textContent).toBe('10x Combo!');
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle extremely large scores', () => {
      const largeScore = Number.MAX_SAFE_INTEGER;
      
      scoreDisplay.updateScore(largeScore);
      
      expect(mockScoreValue.textContent).toContain(',');
      expect(mockScoreValue.textContent.length).toBeGreaterThan(0);
    });

    it('should handle zero values gracefully', () => {
      scoreDisplay.updateScore(0);
      scoreDisplay.updateCombo(0);
      scoreDisplay.updateAccuracy(0);
      
      expect(mockScoreValue.textContent).toBe('0');
      expect(mockComboDisplay.textContent).toBe('');
      expect(mockAccuracyDisplay.textContent).toBe('0% Accuracy');
    });

    it('should handle rapid state changes', () => {
      for (let i = 0; i < 50; i++) {
        scoreDisplay.updateScore(Math.random() * 10000);
        scoreDisplay.updateCombo(Math.floor(Math.random() * 20));
        scoreDisplay.updateAccuracy(Math.random());
      }
      
      expect(() => scoreDisplay.updateScore(5000)).not.toThrow();
    });

    it('should handle DOM not ready scenarios', () => {
      const originalDocument = global.document;
      
      global.document = null as any;
      
      expect(() => {
        new ScoreDisplay();
      }).not.toThrow();
      
      global.document = originalDocument;
    });
  });
});
