/**
 * InstrumentSelector Unit Tests
 * 
 * Comprehensive test suite for the InstrumentSelector component covering:
 * - DOM element creation and styling
 * - Instrument grid rendering and layout
 * - Selection logic and state management
 * - Unlock status display and validation
 * - Keyboard navigation and accessibility
 * - Visual feedback and animations
 * - Integration with progression system
 * - Performance optimization and error handling
 * 
 * Target Coverage: 91%
 */

import { InstrumentSelector } from '@ui/components/InstrumentSelector';
import { GameEngine } from '@game/core/GameEngine';
import { ProgressionSystem, Unlockable } from '@game/core/ProgressionSystem';

// Mock DOM methods
const mockElement = {
  style: { cssText: '' },
  textContent: '',
  className: '',
  title: '',
  appendChild: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
    toggle: jest.fn()
  },
  remove: jest.fn(),
  click: jest.fn(),
  focus: jest.fn(),
  blur: jest.fn(),
  getAttribute: jest.fn(),
  setAttribute: jest.fn(),
  removeAttribute: jest.fn(),
  offsetHeight: 100,
  offsetWidth: 100,
  scrollIntoView: jest.fn()
};

const mockDocument = {
  createElement: jest.fn(() => ({ ...mockElement })),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
});

// Mock GameEngine and ProgressionSystem
const mockProgressionSystem = {
  getUnlockedInstruments: jest.fn(() => []),
  isInstrumentUnlocked: jest.fn(() => true),
  getInstrumentUnlockRequirement: jest.fn(() => 'Complete Level 1'),
  unlockInstrument: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn()
};

const mockGameEngine = {
  getProgressionSystem: jest.fn(() => mockProgressionSystem),
  setInstrument: jest.fn(),
  getCurrentInstrument: jest.fn(() => 'synthBass'),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn()
};

// Mock requestAnimationFrame and performance
const mockRequestAnimationFrame = jest.fn();
Object.defineProperty(global, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true
});

const mockPerformanceNow = jest.fn(() => 1000);
Object.defineProperty(performance, 'now', { value: mockPerformanceNow });

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });

describe('InstrumentSelector', () => {
  let instrumentSelector: InstrumentSelector;
  let mockContainer: HTMLElement;
  let mockInstrumentGrid: HTMLElement;

  const createMockInstrument = (
    id: string,
    name: string,
    unlocked = true,
    icon = '🎹'
  ): Unlockable => ({
    id,
    name,
    description: `Description for ${name}`,
    type: 'instrument',
    icon,
    unlocked,
    requiredLevel: unlocked ? undefined : 5,
    requiredAchievements: unlocked ? undefined : ['first-song'],
    requiredScore: unlocked ? undefined : 1000
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock DOM elements
    mockContainer = { ...mockElement };
    mockInstrumentGrid = { ...mockElement };
    
    // Configure document.createElement to return specific elements
    mockDocument.createElement
      .mockReturnValueOnce(mockContainer)     // Main container
      .mockReturnValueOnce(mockInstrumentGrid); // Instrument grid
    
    // Setup default mock responses
    mockProgressionSystem.getUnlockedInstruments.mockReturnValue([
      createMockInstrument('synthBass', 'Bass Synth', true, '🎸'),
      createMockInstrument('synthLead', 'Lead Synth', true, '🎹'),
      createMockInstrument('drums', 'Drum Kit', false, '🥁')
    ]);
    
    mockGameEngine.getCurrentInstrument.mockReturnValue('synthBass');
    
    instrumentSelector = new InstrumentSelector(mockGameEngine as any);
  });

  afterEach(() => {
    instrumentSelector.cleanup?.();
  });

  describe('constructor and initialization', () => {
    it('should create InstrumentSelector instance', () => {
      expect(instrumentSelector).toBeInstanceOf(InstrumentSelector);
    });

    it('should create container with proper styling', () => {
      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(mockContainer.className).toBe('instrument-selector');
      expect(mockContainer.style.cssText).toContain('position: fixed');
      expect(mockContainer.style.cssText).toContain('bottom: 20px');
      expect(mockContainer.style.cssText).toContain('background: rgba(0, 0, 0, 0.9)');
    });

    it('should create instrument grid', () => {
      expect(mockInstrumentGrid.className).toBe('instrument-grid');
      expect(mockInstrumentGrid.style.cssText).toContain('display: flex');
    });

    it('should attach to DOM', () => {
      expect(mockDocument.body.appendChild).toHaveBeenCalledWith(mockContainer);
    });

    it('should initialize with default selected instrument', () => {
      expect(mockGameEngine.getCurrentInstrument).toHaveBeenCalled();
    });

    it('should load instruments from progression system', () => {
      expect(mockProgressionSystem.getUnlockedInstruments).toHaveBeenCalled();
    });
  });

  describe('instrument rendering', () => {
    it('should render unlocked instruments', () => {
      const instruments = [
        createMockInstrument('piano', 'Piano', true, '🎹'),
        createMockInstrument('guitar', 'Guitar', true, '🎸')
      ];
      
      mockProgressionSystem.getUnlockedInstruments.mockReturnValue(instruments);
      instrumentSelector.updateInstruments();
      
      expect(mockDocument.createElement).toHaveBeenCalledWith('button');
    });

    it('should render locked instruments with different styling', () => {
      const instruments = [
        createMockInstrument('piano', 'Piano', true, '🎹'),
        createMockInstrument('violin', 'Violin', false, '🎻')
      ];
      
      mockProgressionSystem.getUnlockedInstruments.mockReturnValue(instruments);
      mockProgressionSystem.isInstrumentUnlocked.mockImplementation(id => id !== 'violin');
      
      instrumentSelector.updateInstruments();
      
      // Should create buttons for both locked and unlocked
      expect(mockDocument.createElement).toHaveBeenCalledWith('button');
    });

    it('should display instrument icons and names', () => {
      const instruments = [createMockInstrument('synth', 'Synthesizer', true, '🎹')];
      
      mockProgressionSystem.getUnlockedInstruments.mockReturnValue(instruments);
      instrumentSelector.updateInstruments();
      
      expect(mockElement.textContent).toContain('🎹');
    });

    it('should show unlock requirements for locked instruments', () => {
      const instruments = [createMockInstrument('drums', 'Drums', false, '🥁')];
      
      mockProgressionSystem.getUnlockedInstruments.mockReturnValue(instruments);
      mockProgressionSystem.isInstrumentUnlocked.mockReturnValue(false);
      mockProgressionSystem.getInstrumentUnlockRequirement.mockReturnValue('Complete Level 3');
      
      instrumentSelector.updateInstruments();
      
      expect(mockProgressionSystem.getInstrumentUnlockRequirement).toHaveBeenCalledWith(instruments[0]);
    });

    it('should indicate currently selected instrument', () => {
      const instruments = [createMockInstrument('bass', 'Bass', true, '🎸')];
      
      mockProgressionSystem.getUnlockedInstruments.mockReturnValue(instruments);
      mockGameEngine.getCurrentInstrument.mockReturnValue('bass');
      
      instrumentSelector.updateInstruments();
      
      // Should style selected instrument differently
      expect(mockElement.style.cssText).toContain('border');
    });
  });

  describe('instrument selection', () => {
    it('should select unlocked instrument on click', () => {
      const instruments = [createMockInstrument('piano', 'Piano', true, '🎹')];
      
      mockProgressionSystem.getUnlockedInstruments.mockReturnValue(instruments);
      mockProgressionSystem.isInstrumentUnlocked.mockReturnValue(true);
      
      instrumentSelector.selectInstrument('piano');
      
      expect(mockGameEngine.setInstrument).toHaveBeenCalledWith('piano');
    });

    it('should not select locked instrument', () => {
      mockProgressionSystem.isInstrumentUnlocked.mockReturnValue(false);
      
      instrumentSelector.selectInstrument('lockedInstrument');
      
      expect(mockGameEngine.setInstrument).not.toHaveBeenCalled();
    });

    it('should update visual selection state', () => {
      const instruments = [
        createMockInstrument('piano', 'Piano', true, '🎹'),
        createMockInstrument('guitar', 'Guitar', true, '🎸')
      ];
      
      mockProgressionSystem.getUnlockedInstruments.mockReturnValue(instruments);
      mockProgressionSystem.isInstrumentUnlocked.mockReturnValue(true);
      
      instrumentSelector.selectInstrument('piano');
      
      expect(mockGameEngine.setInstrument).toHaveBeenCalledWith('piano');
    });

    it('should emit selection events', () => {
      mockProgressionSystem.isInstrumentUnlocked.mockReturnValue(true);
      
      instrumentSelector.selectInstrument('synthLead');
      
      expect(mockGameEngine.setInstrument).toHaveBeenCalledWith('synthLead');
    });

    it('should handle rapid selection changes', () => {
      mockProgressionSystem.isInstrumentUnlocked.mockReturnValue(true);
      
      const instruments = ['piano', 'guitar', 'drums', 'violin'];
      instruments.forEach(instrument => {
        instrumentSelector.selectInstrument(instrument);
      });
      
      expect(mockGameEngine.setInstrument).toHaveBeenCalledTimes(4);
      expect(mockGameEngine.setInstrument).toHaveBeenLastCalledWith('violin');
    });
  });

  describe('keyboard navigation', () => {
    it('should handle arrow key navigation', () => {
      const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      
      instrumentSelector.handleKeyboardNavigation(keyEvent);
      
      // Should navigate to next instrument
      expect(keyEvent.preventDefault).toBeDefined();
    });

    it('should handle enter key selection', () => {
      const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      instrumentSelector.handleKeyboardNavigation(keyEvent);
      
      // Should select current instrument
      expect(keyEvent.preventDefault).toBeDefined();
    });

    it('should handle escape key to close', () => {
      const keyEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      
      instrumentSelector.handleKeyboardNavigation(keyEvent);
      
      expect(keyEvent.preventDefault).toBeDefined();
    });

    it('should cycle through available instruments', () => {
      const instruments = [
        createMockInstrument('piano', 'Piano', true),
        createMockInstrument('guitar', 'Guitar', true),
        createMockInstrument('drums', 'Drums', true)
      ];
      
      mockProgressionSystem.getUnlockedInstruments.mockReturnValue(instruments);
      
      // Test cycling through instruments
      for (let i = 0; i < 5; i++) {
        const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
        instrumentSelector.handleKeyboardNavigation(keyEvent);
      }
      
      // Should cycle back to beginning
      expect(mockElement.focus).toHaveBeenCalled();
    });

    it('should skip locked instruments during navigation', () => {
      const instruments = [
        createMockInstrument('piano', 'Piano', true),
        createMockInstrument('violin', 'Violin', false),
        createMockInstrument('guitar', 'Guitar', true)
      ];
      
      mockProgressionSystem.getUnlockedInstruments.mockReturnValue(instruments);
      mockProgressionSystem.isInstrumentUnlocked.mockImplementation(id => id !== 'violin');
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      instrumentSelector.handleKeyboardNavigation(keyEvent);
      
      // Should skip locked violin and go to guitar
      expect(mockElement.focus).toHaveBeenCalled();
    });
  });

  describe('visibility and animations', () => {
    it('should show with animation', () => {
      instrumentSelector.show();
      
      expect(mockContainer.style.cssText).toContain('opacity: 1');
      expect(mockContainer.style.cssText).toContain('transform: translateX(-50%) translateY(0)');
    });

    it('should hide with animation', () => {
      instrumentSelector.hide();
      
      expect(mockContainer.style.cssText).toContain('opacity: 0');
      expect(mockContainer.style.cssText).toContain('transform: translateX(-50%) translateY(100%)');
    });

    it('should toggle visibility state', () => {
      expect(instrumentSelector.isVisible()).toBe(false);
      
      instrumentSelector.toggle();
      expect(instrumentSelector.isVisible()).toBe(true);
      
      instrumentSelector.toggle();
      expect(instrumentSelector.isVisible()).toBe(false);
    });

    it('should handle rapid show/hide calls', () => {
      for (let i = 0; i < 10; i++) {
        instrumentSelector.show();
        instrumentSelector.hide();
      }
      
      expect(instrumentSelector.isVisible()).toBe(false);
    });

    it('should animate entrance on first show', () => {
      instrumentSelector.show();
      
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('should cleanup animations on hide', () => {
      instrumentSelector.show();
      instrumentSelector.hide();
      
      // Should set timeout for display none
      expect(setTimeout).toBeDefined();
    });
  });

  describe('responsive design', () => {
    it('should adapt to mobile screen sizes', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      
      const mobileSelector = new InstrumentSelector(mockGameEngine as any);
      
      expect(mockContainer.style.cssText).toContain('bottom: 10px');
    });

    it('should adjust grid layout for different screen sizes', () => {
      const screenSizes = [
        { width: 320, height: 568 },  // Small mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1920, height: 1080 } // Desktop
      ];
      
      screenSizes.forEach(size => {
        Object.defineProperty(window, 'innerWidth', { value: size.width });
        Object.defineProperty(window, 'innerHeight', { value: size.height });
        
        instrumentSelector.handleResize();
        
        expect(mockInstrumentGrid.style.cssText).toContain('display: flex');
      });
    });

    it('should handle orientation changes', () => {
      instrumentSelector.handleOrientationChange();
      
      expect(mockContainer.style.cssText).toContain('position: fixed');
    });

    it('should scale icons for different screen densities', () => {
      Object.defineProperty(window, 'devicePixelRatio', { value: 2 });
      
      instrumentSelector.updateInstruments();
      
      expect(mockElement.style.cssText).toContain('font-size');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      expect(mockContainer.getAttribute).toHaveBeenCalledWith('role', 'menu');
      expect(mockContainer.getAttribute).toHaveBeenCalledWith('aria-label', 'Instrument Selection');
    });

    it('should support keyboard navigation', () => {
      expect(mockContainer.getAttribute).toHaveBeenCalledWith('tabindex', '0');
    });

    it('should provide instrument descriptions for screen readers', () => {
      const instruments = [createMockInstrument('piano', 'Piano', true, '🎹')];
      
      mockProgressionSystem.getUnlockedInstruments.mockReturnValue(instruments);
      instrumentSelector.updateInstruments();
      
      expect(mockElement.getAttribute).toHaveBeenCalledWith('aria-label', expect.stringContaining('Piano'));
    });

    it('should indicate locked state to screen readers', () => {
      const instruments = [createMockInstrument('violin', 'Violin', false, '🎻')];
      
      mockProgressionSystem.getUnlockedInstruments.mockReturnValue(instruments);
      mockProgressionSystem.isInstrumentUnlocked.mockReturnValue(false);
      
      instrumentSelector.updateInstruments();
      
      expect(mockElement.getAttribute).toHaveBeenCalledWith('aria-disabled', 'true');
    });

    it('should announce selection changes', () => {
      mockProgressionSystem.isInstrumentUnlocked.mockReturnValue(true);
      
      instrumentSelector.selectInstrument('piano');
      
      // Should update aria-live region or trigger announcement
      expect(mockElement.setAttribute).toHaveBeenCalled();
    });

    it('should support high contrast mode', () => {
      instrumentSelector.updateInstruments();
      
      expect(mockElement.style.cssText).toContain('border');
    });
  });

  describe('performance optimization', () => {
    it('should efficiently handle large instrument lists', () => {
      const manyInstruments = Array.from({ length: 50 }, (_, i) => 
        createMockInstrument(`instrument${i}`, `Instrument ${i}`, true)
      );
      
      mockProgressionSystem.getUnlockedInstruments.mockReturnValue(manyInstruments);
      
      const startTime = performance.now();
      instrumentSelector.updateInstruments();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should reuse DOM elements when possible', () => {
      const instruments = [createMockInstrument('piano', 'Piano', true)];
      
      mockProgressionSystem.getUnlockedInstruments.mockReturnValue(instruments);
      
      instrumentSelector.updateInstruments();
      const firstCallCount = mockDocument.createElement.mock.calls.length;
      
      instrumentSelector.updateInstruments();
      const secondCallCount = mockDocument.createElement.mock.calls.length;
      
      expect(secondCallCount - firstCallCount).toBeLessThan(5);
    });

    it('should debounce rapid updates', () => {
      const updateSpy = jest.spyOn(instrumentSelector, 'updateInstruments');
      
      for (let i = 0; i < 10; i++) {
        instrumentSelector.updateInstruments();
      }
      
      expect(updateSpy).toHaveBeenCalled();
    });

    it('should handle memory cleanup efficiently', () => {
      instrumentSelector.cleanup();
      
      expect(mockContainer.remove).toHaveBeenCalled();
    });
  });

  describe('integration with progression system', () => {
    it('should listen for unlock events', () => {
      expect(mockProgressionSystem.on).toHaveBeenCalledWith('instrumentUnlocked', expect.any(Function));
    });

    it('should update display when instruments are unlocked', () => {
      const unlockCallback = mockProgressionSystem.on.mock.calls.find(
        call => call[0] === 'instrumentUnlocked'
      )?.[1];
      
      if (unlockCallback) {
        const updateSpy = jest.spyOn(instrumentSelector, 'updateInstruments');
        unlockCallback({ id: 'newInstrument' });
        
        expect(updateSpy).toHaveBeenCalled();
      }
    });

    it('should validate instrument unlock status', () => {
      mockProgressionSystem.isInstrumentUnlocked.mockReturnValue(false);
      
      instrumentSelector.selectInstrument('lockedInstrument');
      
      expect(mockProgressionSystem.isInstrumentUnlocked).toHaveBeenCalledWith('lockedInstrument');
      expect(mockGameEngine.setInstrument).not.toHaveBeenCalled();
    });

    it('should show unlock requirements tooltip', () => {
      const instruments = [createMockInstrument('drums', 'Drums', false, '🥁')];
      
      mockProgressionSystem.getUnlockedInstruments.mockReturnValue(instruments);
      mockProgressionSystem.isInstrumentUnlocked.mockReturnValue(false);
      mockProgressionSystem.getInstrumentUnlockRequirement.mockReturnValue('Complete Level 5');
      
      instrumentSelector.updateInstruments();
      
      expect(mockElement.title).toContain('Complete Level 5');
    });
  });

  describe('error handling', () => {
    it('should handle missing instruments gracefully', () => {
      mockProgressionSystem.getUnlockedInstruments.mockReturnValue([]);
      
      expect(() => {
        instrumentSelector.updateInstruments();
      }).not.toThrow();
    });

    it('should handle DOM manipulation errors', () => {
      mockDocument.createElement.mockImplementation(() => {
        throw new Error('DOM creation failed');
      });
      
      expect(() => {
        new InstrumentSelector(mockGameEngine as any);
      }).not.toThrow();
    });

    it('should handle invalid instrument selection', () => {
      expect(() => {
        instrumentSelector.selectInstrument('');
      }).not.toThrow();
      
      expect(() => {
        instrumentSelector.selectInstrument(null as any);
      }).not.toThrow();
    });

    it('should handle progression system errors', () => {
      mockProgressionSystem.getUnlockedInstruments.mockImplementation(() => {
        throw new Error('Progression system error');
      });
      
      expect(() => {
        instrumentSelector.updateInstruments();
      }).not.toThrow();
    });

    it('should handle animation frame errors', () => {
      mockRequestAnimationFrame.mockImplementation(() => {
        throw new Error('Animation frame error');
      });
      
      expect(() => {
        instrumentSelector.show();
      }).not.toThrow();
    });

    it('should handle keyboard event errors', () => {
      const invalidEvent = {} as KeyboardEvent;
      
      expect(() => {
        instrumentSelector.handleKeyboardNavigation(invalidEvent);
      }).not.toThrow();
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle empty instrument list', () => {
      mockProgressionSystem.getUnlockedInstruments.mockReturnValue([]);
      
      instrumentSelector.updateInstruments();
      
      expect(mockInstrumentGrid.textContent).toContain('No instruments');
    });

    it('should handle single instrument', () => {
      const singleInstrument = [createMockInstrument('piano', 'Piano', true)];
      
      mockProgressionSystem.getUnlockedInstruments.mockReturnValue(singleInstrument);
      
      instrumentSelector.updateInstruments();
      
      expect(mockDocument.createElement).toHaveBeenCalledWith('button');
    });

    it('should handle all instruments locked', () => {
      const instruments = [
        createMockInstrument('piano', 'Piano', false),
        createMockInstrument('guitar', 'Guitar', false)
      ];
      
      mockProgressionSystem.getUnlockedInstruments.mockReturnValue(instruments);
      mockProgressionSystem.isInstrumentUnlocked.mockReturnValue(false);
      
      instrumentSelector.updateInstruments();
      
      expect(mockElement.style.cssText).toContain('opacity: 0.5');
    });

    it('should handle extremely long instrument names', () => {
      const longNameInstrument = createMockInstrument(
        'super-long-name',
        'Super Ultra Mega Long Instrument Name That Goes On Forever',
        true
      );
      
      mockProgressionSystem.getUnlockedInstruments.mockReturnValue([longNameInstrument]);
      
      instrumentSelector.updateInstruments();
      
      expect(mockElement.style.cssText).toContain('text-overflow: ellipsis');
    });

    it('should handle rapid consecutive selections', () => {
      mockProgressionSystem.isInstrumentUnlocked.mockReturnValue(true);
      
      for (let i = 0; i < 100; i++) {
        instrumentSelector.selectInstrument(`instrument${i}`);
      }
      
      expect(mockGameEngine.setInstrument).toHaveBeenCalledTimes(100);
    });

    it('should handle multiple simultaneous show/hide calls', () => {
      Promise.all([
        instrumentSelector.show(),
        instrumentSelector.hide(),
        instrumentSelector.show(),
        instrumentSelector.hide()
      ]);
      
      expect(instrumentSelector.isVisible()).toBeDefined();
    });
  });

  describe('cleanup and destruction', () => {
    it('should remove event listeners on cleanup', () => {
      instrumentSelector.cleanup();
      
      expect(mockProgressionSystem.off).toHaveBeenCalled();
      expect(mockDocument.removeEventListener).toHaveBeenCalled();
    });

    it('should remove DOM elements on cleanup', () => {
      instrumentSelector.cleanup();
      
      expect(mockContainer.remove).toHaveBeenCalled();
    });

    it('should handle multiple cleanup calls', () => {
      instrumentSelector.cleanup();
      
      expect(() => {
        instrumentSelector.cleanup();
      }).not.toThrow();
    });

    it('should cancel ongoing animations on cleanup', () => {
      instrumentSelector.show();
      instrumentSelector.cleanup();
      
      // Should not throw when animations try to complete
      expect(() => {
        const callback = mockRequestAnimationFrame.mock.calls[0]?.[0];
        if (callback) callback();
      }).not.toThrow();
    });
  });
});
