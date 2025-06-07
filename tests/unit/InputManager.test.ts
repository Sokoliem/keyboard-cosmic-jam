/**
 * InputManager Unit Tests
 * 
 * Comprehensive test suite for the InputManager class covering:
 * - Initialization and setup
 * - Keyboard event handling
 * - Touch event handling
 * - Touch zone generation and management
 * - Layout creation (keyboard and grid)
 * - Device detection and adaptive behavior
 * - Event emission and listeners
 * - Cleanup and memory management
 * - Error handling and edge cases
 * 
 * Target Coverage: 92%
 */

import { InputManager, TouchZone } from '@game/core/InputManager';
import { getKeyMapping } from '@game/data/KeyMappings';

// Mock dependencies
jest.mock('@utils/EventEmitter');
jest.mock('@game/data/KeyMappings');

// Mock DOM elements and methods
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
const mockGetElementById = jest.fn();

// Mock window and document
Object.defineProperty(window, 'addEventListener', { value: mockAddEventListener });
Object.defineProperty(window, 'removeEventListener', { value: mockRemoveEventListener });
Object.defineProperty(document, 'getElementById', { value: mockGetElementById });

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
Object.defineProperty(window, 'screen', { 
  value: { width: 1920, height: 1080 }, 
  writable: true 
});

// Mock touch events
Object.defineProperty(window, 'ontouchstart', { value: undefined, writable: true });

// Mock navigator
Object.defineProperty(navigator, 'userAgent', { 
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 
  writable: true 
});

// Mock app element
const mockAppElement = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

describe('InputManager', () => {
  let inputManager: InputManager;
  let mockGetKeyMapping: jest.MockedFunction<typeof getKeyMapping>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup key mapping mock
    mockGetKeyMapping = getKeyMapping as jest.MockedFunction<typeof getKeyMapping>;
    mockGetKeyMapping.mockImplementation((key: string) => {
      const mappings = {
        '1': { instrument: 'digitalDrum', note: 'kick', displayName: '1 - Kick', color: '#FF0000' },
        '2': { instrument: 'digitalDrum', note: 'snare', displayName: '2 - Snare', color: '#FF4000' },
        '3': { instrument: 'digitalDrum', note: 'hihat', displayName: '3 - Hi-Hat', color: '#FF8000' },
        'a': { instrument: 'synthPad', note: 'C', displayName: 'A - Pad C', color: '#00FF00' },
        's': { instrument: 'synthPad', note: 'D', displayName: 'S - Pad D', color: '#40FF00' },
        'd': { instrument: 'synthPad', note: 'E', displayName: 'D - Pad E', color: '#80FF00' },
        'q': { instrument: 'synthLead', note: 'C', displayName: 'Q - Lead C', color: '#0000FF' },
        'w': { instrument: 'synthLead', note: 'D', displayName: 'W - Lead D', color: '#4000FF' },
        'z': { instrument: 'synthBass', note: 'C', displayName: 'Z - Bass C', color: '#FF00FF' },
        ' ': { instrument: 'fmBell', note: 'C', displayName: 'Space - Magic Bell', color: '#00FFFF' },
        'enter': { instrument: 'arpeggiate', note: 'C', displayName: 'Enter - Power!', color: '#FFFF00' }
      };
      return mappings[key] || null;
    });

    mockGetElementById.mockReturnValue(mockAppElement);
    inputManager = new InputManager();
  });

  afterEach(() => {
    inputManager.cleanup();
  });

  describe('constructor and initialization', () => {
    it('should create InputManager instance', () => {
      expect(inputManager).toBeInstanceOf(InputManager);
    });

    it('should initialize with empty key map and touch zones', () => {
      const touchZones = inputManager.getTouchZones();
      expect(touchZones).toEqual([]);
    });

    it('should setup event listeners on initialization', () => {
      inputManager.initialize();

      expect(window.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
      expect(mockAppElement.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false });
      expect(mockAppElement.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
      expect(mockAppElement.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: false });
      expect(mockAppElement.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(mockAppElement.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });

    it('should handle missing app element gracefully', () => {
      mockGetElementById.mockReturnValue(null);
      const manager = new InputManager();
      
      expect(() => manager.initialize()).not.toThrow();
    });
  });

  describe('keyboard event handling', () => {
    beforeEach(() => {
      inputManager.initialize();
    });

    it('should handle keydown events', () => {
      const emitSpy = jest.spyOn(inputManager, 'emit');
      const event = new KeyboardEvent('keydown', { key: 'a', repeat: false });
      
      // Simulate keydown
      const keydownHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'keydown')[1];
      keydownHandler(event);

      expect(emitSpy).toHaveBeenCalledWith('keyPress', 'a');
    });

    it('should handle keyup events', () => {
      const emitSpy = jest.spyOn(inputManager, 'emit');
      const event = new KeyboardEvent('keyup', { key: 'a' });
      
      // Simulate keydown first, then keyup
      const keydownHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'keydown')[1];
      const keyupHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'keyup')[1];
      
      keydownHandler(new KeyboardEvent('keydown', { key: 'a', repeat: false }));
      keyupHandler(event);

      expect(emitSpy).toHaveBeenCalledWith('keyRelease', 'a');
    });

    it('should ignore repeat keydown events', () => {
      const emitSpy = jest.spyOn(inputManager, 'emit');
      const event = new KeyboardEvent('keydown', { key: 'a', repeat: true });
      
      const keydownHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'keydown')[1];
      keydownHandler(event);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should handle uppercase and lowercase keys consistently', () => {
      const emitSpy = jest.spyOn(inputManager, 'emit');
      
      const keydownHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'keydown')[1];
      keydownHandler(new KeyboardEvent('keydown', { key: 'A', repeat: false }));

      expect(emitSpy).toHaveBeenCalledWith('keyPress', 'a');
    });

    it('should track key state correctly', () => {
      const keydownHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'keydown')[1];
      const keyupHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'keyup')[1];
      
      // Press key
      keydownHandler(new KeyboardEvent('keydown', { key: 'a', repeat: false }));
      
      // Press same key again (should be ignored)
      const emitSpy = jest.spyOn(inputManager, 'emit');
      keydownHandler(new KeyboardEvent('keydown', { key: 'a', repeat: false }));
      expect(emitSpy).not.toHaveBeenCalled();

      // Release key
      emitSpy.mockClear();
      keyupHandler(new KeyboardEvent('keyup', { key: 'a' }));
      expect(emitSpy).toHaveBeenCalledWith('keyRelease', 'a');
    });

    it('should handle special keys', () => {
      const emitSpy = jest.spyOn(inputManager, 'emit');
      const keydownHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'keydown')[1];
      
      // Test space key
      keydownHandler(new KeyboardEvent('keydown', { key: ' ', repeat: false }));
      expect(emitSpy).toHaveBeenCalledWith('keyPress', ' ');

      // Test enter key
      emitSpy.mockClear();
      keydownHandler(new KeyboardEvent('keydown', { key: 'Enter', repeat: false }));
      expect(emitSpy).toHaveBeenCalledWith('keyPress', 'enter');
    });
  });

  describe('touch event handling', () => {
    beforeEach(() => {
      inputManager.initialize();
    });

    it('should handle touchstart events', () => {
      const emitSpy = jest.spyOn(inputManager, 'emit');
      
      // Create touch zones first
      inputManager.getTouchZones(); // This will generate zones
      
      const touchstartHandler = mockAppElement.addEventListener.mock.calls.find(call => call[0] === 'touchstart')[1];
      const mockTouch = { identifier: 1, clientX: 100, clientY: 100 };
      const mockEvent = { 
        preventDefault: jest.fn(),
        changedTouches: [mockTouch]
      };
      
      touchstartHandler(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith('touchPress', { x: 100, y: 100 });
    });

    it('should handle touchend events', () => {
      const emitSpy = jest.spyOn(inputManager, 'emit');
      
      const touchstartHandler = mockAppElement.addEventListener.mock.calls.find(call => call[0] === 'touchstart')[1];
      const touchendHandler = mockAppElement.addEventListener.mock.calls.find(call => call[0] === 'touchend')[1];
      
      const mockTouch = { identifier: 1, clientX: 100, clientY: 100 };
      
      // Start touch
      touchstartHandler({ 
        preventDefault: jest.fn(),
        changedTouches: [mockTouch]
      });

      // End touch
      const mockEndEvent = { 
        preventDefault: jest.fn(),
        changedTouches: [mockTouch]
      };
      touchendHandler(mockEndEvent);

      expect(emitSpy).toHaveBeenCalledWith('touchRelease', { x: 100, y: 100 });
    });

    it('should handle touchmove events', () => {
      const touchmoveHandler = mockAppElement.addEventListener.mock.calls.find(call => call[0] === 'touchmove')[1];
      const mockEvent = { preventDefault: jest.fn() };
      
      expect(() => touchmoveHandler(mockEvent)).not.toThrow();
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle multiple simultaneous touches', () => {
      const emitSpy = jest.spyOn(inputManager, 'emit');
      const touchstartHandler = mockAppElement.addEventListener.mock.calls.find(call => call[0] === 'touchstart')[1];
      
      const mockTouches = [
        { identifier: 1, clientX: 100, clientY: 100 },
        { identifier: 2, clientX: 200, clientY: 200 }
      ];
      
      touchstartHandler({ 
        preventDefault: jest.fn(),
        changedTouches: mockTouches
      });

      expect(emitSpy).toHaveBeenCalledTimes(2);
      expect(emitSpy).toHaveBeenCalledWith('touchPress', { x: 100, y: 100 });
      expect(emitSpy).toHaveBeenCalledWith('touchPress', { x: 200, y: 200 });
    });
  });

  describe('mouse event handling', () => {
    beforeEach(() => {
      inputManager.initialize();
    });

    it('should handle mousedown events', () => {
      const emitSpy = jest.spyOn(inputManager, 'emit');
      const mousedownHandler = mockAppElement.addEventListener.mock.calls.find(call => call[0] === 'mousedown')[1];
      
      const mockEvent = { clientX: 300, clientY: 400 };
      mousedownHandler(mockEvent);

      expect(emitSpy).toHaveBeenCalledWith('touchPress', { x: 300, y: 400 });
    });

    it('should handle mouseup events', () => {
      const emitSpy = jest.spyOn(inputManager, 'emit');
      const mouseupHandler = mockAppElement.addEventListener.mock.calls.find(call => call[0] === 'mouseup')[1];
      
      const mockEvent = { clientX: 300, clientY: 400 };
      mouseupHandler(mockEvent);

      expect(emitSpy).toHaveBeenCalledWith('touchRelease', { x: 300, y: 400 });
    });
  });

  describe('touch zone generation', () => {
    beforeEach(() => {
      inputManager.initialize();
    });

    it('should generate keyboard layout for landscape mode', () => {
      // Set landscape dimensions
      Object.defineProperty(window, 'innerWidth', { value: 1920 });
      Object.defineProperty(window, 'innerHeight', { value: 1080 });
      
      const newManager = new InputManager();
      newManager.initialize();
      const touchZones = newManager.getTouchZones();
      
      expect(touchZones.length).toBeGreaterThan(0);
      expect(touchZones.some(zone => zone.keys.includes('1'))).toBe(true);
      expect(touchZones.some(zone => zone.keys.includes('a'))).toBe(true);
      expect(touchZones.some(zone => zone.keys.includes(' '))).toBe(true);
    });

    it('should generate grid layout for portrait mode', () => {
      // Set portrait dimensions
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      Object.defineProperty(window, 'innerHeight', { value: 1024 });
      
      const newManager = new InputManager();
      newManager.initialize();
      const touchZones = newManager.getTouchZones();
      
      expect(touchZones.length).toBeGreaterThan(0);
      // Grid layout should have more compact arrangement
      expect(touchZones.some(zone => zone.id.startsWith('grid_'))).toBe(true);
    });

    it('should create zones with proper bounds', () => {
      const touchZones = inputManager.getTouchZones();
      
      touchZones.forEach(zone => {
        expect(zone.bounds).toBeDefined();
        expect(zone.bounds.x).toBeGreaterThanOrEqual(0);
        expect(zone.bounds.y).toBeGreaterThanOrEqual(0);
        expect(zone.bounds.width).toBeGreaterThan(0);
        expect(zone.bounds.height).toBeGreaterThan(0);
      });
    });

    it('should assign colors and instruments to zones', () => {
      const touchZones = inputManager.getTouchZones();
      
      const zoneWithMapping = touchZones.find(zone => zone.keys.includes('1'));
      if (zoneWithMapping) {
        expect(zoneWithMapping.instrument).toBe('digitalDrum');
        expect(zoneWithMapping.color).toBe('#FF0000');
      }
    });

    it('should create unique zone IDs', () => {
      const touchZones = inputManager.getTouchZones();
      const ids = touchZones.map(zone => zone.id);
      const uniqueIds = [...new Set(ids)];
      
      expect(ids.length).toBe(uniqueIds.length);
    });

    it('should handle space bar with special width in grid layout', () => {
      // Set portrait mode
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      Object.defineProperty(window, 'innerHeight', { value: 1024 });
      
      const newManager = new InputManager();
      newManager.initialize();
      const touchZones = newManager.getTouchZones();
      
      const spaceZone = touchZones.find(zone => zone.keys.includes(' '));
      if (spaceZone) {
        // Space should be wider than regular keys
        const regularZone = touchZones.find(zone => zone.keys.includes('a'));
        if (regularZone) {
          expect(spaceZone.bounds.width).toBeGreaterThan(regularZone.bounds.width);
        }
      }
    });
  });

  describe('touch zone detection', () => {
    beforeEach(() => {
      inputManager.initialize();
    });

    it('should find correct touch zone for given point', () => {
      const touchZones = inputManager.getTouchZones();
      
      if (touchZones.length > 0) {
        const zone = touchZones[0];
        const point = {
          x: zone.bounds.x + zone.bounds.width / 2,
          y: zone.bounds.y + zone.bounds.height / 2
        };
        
        const foundZone = inputManager.getTouchZone(point);
        expect(foundZone).toBe(zone);
      }
    });

    it('should return null for point outside all zones', () => {
      const point = { x: -100, y: -100 };
      const foundZone = inputManager.getTouchZone(point);
      
      expect(foundZone).toBeNull();
    });

    it('should handle edge cases correctly', () => {
      const touchZones = inputManager.getTouchZones();
      
      if (touchZones.length > 0) {
        const zone = touchZones[0];
        
        // Test exact edge
        const edgePoint = {
          x: zone.bounds.x + zone.bounds.width,
          y: zone.bounds.y + zone.bounds.height
        };
        
        const foundZone = inputManager.getTouchZone(edgePoint);
        expect(foundZone).toBe(zone);
      }
    });
  });

  describe('label generation', () => {
    beforeEach(() => {
      inputManager.initialize();
    });

    it('should generate short labels for mobile', () => {
      const touchZones = inputManager.getTouchZones();
      
      const kickZone = touchZones.find(zone => zone.keys.includes('1'));
      if (kickZone) {
        expect(kickZone.label).toBe('Kick');
      }

      const spaceZone = touchZones.find(zone => zone.keys.includes(' '));
      if (spaceZone) {
        expect(spaceZone.label).toBe('Bell');
      }
    });

    it('should handle unknown display names', () => {
      mockGetKeyMapping.mockImplementation((key: string) => {
        if (key === 'unknown') {
          return { 
            instrument: 'test', 
            note: 'C', 
            displayName: 'Unknown Key', 
            color: '#FFFFFF' 
          };
        }
        return null;
      });

      // This is internal logic, but we can test the behavior through touch zones
      const newManager = new InputManager();
      newManager.initialize();
      
      // The unknown key shouldn't appear in touch zones since getKeyMapping returns null
      expect(() => newManager.getTouchZones()).not.toThrow();
    });
  });

  describe('window resize handling', () => {
    it('should regenerate touch zones on window resize', () => {
      inputManager.initialize();
      const originalZones = inputManager.getTouchZones();
      
      // Change window dimensions
      Object.defineProperty(window, 'innerWidth', { value: 800 });
      Object.defineProperty(window, 'innerHeight', { value: 1200 });
      
      // Create new manager to test new dimensions
      const newManager = new InputManager();
      newManager.initialize();
      const newZones = newManager.getTouchZones();
      
      // Should have different layout due to different dimensions
      expect(newZones).not.toEqual(originalZones);
      newManager.cleanup();
    });
  });

  describe('cleanup', () => {
    it('should remove all event listeners on cleanup', () => {
      inputManager.initialize();
      inputManager.cleanup();

      expect(window.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
      expect(mockAppElement.removeEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(mockAppElement.removeEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function));
      expect(mockAppElement.removeEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
      expect(mockAppElement.removeEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(mockAppElement.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });

    it('should clear key map and active touches', () => {
      inputManager.initialize();
      
      // Add some state
      const keydownHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'keydown')[1];
      keydownHandler(new KeyboardEvent('keydown', { key: 'a', repeat: false }));
      
      inputManager.cleanup();
      
      // State should be cleared - we can't directly access private members,
      // but we can verify behavior after cleanup
      expect(() => inputManager.getTouchZones()).not.toThrow();
    });

    it('should handle cleanup when app element is missing', () => {
      mockGetElementById.mockReturnValue(null);
      const manager = new InputManager();
      manager.initialize();
      
      expect(() => manager.cleanup()).not.toThrow();
    });

    it('should be safe to call cleanup multiple times', () => {
      inputManager.initialize();
      inputManager.cleanup();
      
      expect(() => inputManager.cleanup()).not.toThrow();
    });
  });

  describe('event emission', () => {
    beforeEach(() => {
      inputManager.initialize();
    });

    it('should emit events with correct data', () => {
      const emitSpy = jest.spyOn(inputManager, 'emit');
      const keydownHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'keydown')[1];
      
      keydownHandler(new KeyboardEvent('keydown', { key: 'a', repeat: false }));

      expect(emitSpy).toHaveBeenCalledWith('keyPress', 'a');
      expect(emitSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle event emission errors gracefully', () => {
      const emitSpy = jest.spyOn(inputManager, 'emit');
      emitSpy.mockImplementation(() => {
        throw new Error('Emission error');
      });

      const keydownHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'keydown')[1];
      
      expect(() => {
        keydownHandler(new KeyboardEvent('keydown', { key: 'a', repeat: false }));
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle invalid key events', () => {
      inputManager.initialize();
      const keydownHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'keydown')[1];
      
      // Test with null/undefined key
      const invalidEvent = { key: null, repeat: false };
      expect(() => keydownHandler(invalidEvent)).not.toThrow();
    });

    it('should handle invalid touch events', () => {
      inputManager.initialize();
      const touchstartHandler = mockAppElement.addEventListener.mock.calls.find(call => call[0] === 'touchstart')[1];
      
      // Test with invalid touch data
      const invalidEvent = { 
        preventDefault: jest.fn(),
        changedTouches: [{ identifier: null, clientX: null, clientY: null }]
      };
      
      expect(() => touchstartHandler(invalidEvent)).not.toThrow();
    });

    it('should handle key mapping failures', () => {
      mockGetKeyMapping.mockImplementation(() => {
        throw new Error('Mapping error');
      });

      const newManager = new InputManager();
      expect(() => newManager.initialize()).not.toThrow();
      
      newManager.cleanup();
    });
  });

  describe('performance considerations', () => {
    it('should not create excessive touch zones', () => {
      inputManager.initialize();
      const touchZones = inputManager.getTouchZones();
      
      // Should have reasonable number of zones (not thousands)
      expect(touchZones.length).toBeLessThan(100);
      expect(touchZones.length).toBeGreaterThan(0);
    });

    it('should efficiently find touch zones', () => {
      inputManager.initialize();
      const touchZones = inputManager.getTouchZones();
      
      if (touchZones.length > 0) {
        const point = {
          x: touchZones[0].bounds.x + 10,
          y: touchZones[0].bounds.y + 10
        };
        
        const startTime = performance.now();
        inputManager.getTouchZone(point);
        const endTime = performance.now();
        
        // Should be fast (under 1ms for reasonable number of zones)
        expect(endTime - startTime).toBeLessThan(1);
      }
    });
  });

  describe('device compatibility', () => {
    it('should handle different screen sizes', () => {
      const testSizes = [
        { width: 320, height: 568 },   // iPhone 5
        { width: 768, height: 1024 },  // iPad
        { width: 1920, height: 1080 }  // Desktop
      ];

      testSizes.forEach(size => {
        Object.defineProperty(window, 'innerWidth', { value: size.width });
        Object.defineProperty(window, 'innerHeight', { value: size.height });
        
        const manager = new InputManager();
        manager.initialize();
        const zones = manager.getTouchZones();
        
        expect(zones.length).toBeGreaterThan(0);
        zones.forEach(zone => {
          expect(zone.bounds.x + zone.bounds.width).toBeLessThanOrEqual(size.width);
          expect(zone.bounds.y + zone.bounds.height).toBeLessThanOrEqual(size.height);
        });
        
        manager.cleanup();
      });
    });

    it('should adapt layout based on orientation', () => {
      // Test landscape
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      Object.defineProperty(window, 'innerHeight', { value: 768 });
      
      const landscapeManager = new InputManager();
      landscapeManager.initialize();
      const landscapeZones = landscapeManager.getTouchZones();
      
      // Test portrait
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      Object.defineProperty(window, 'innerHeight', { value: 1024 });
      
      const portraitManager = new InputManager();
      portraitManager.initialize();
      const portraitZones = portraitManager.getTouchZones();
      
      // Should have different layouts
      expect(landscapeZones.map(z => z.id).sort()).not.toEqual(portraitZones.map(z => z.id).sort());
      
      landscapeManager.cleanup();
      portraitManager.cleanup();
    });
  });

  describe('integration scenarios', () => {
    it('should handle rapid key presses correctly', () => {
      inputManager.initialize();
      const emitSpy = jest.spyOn(inputManager, 'emit');
      const keydownHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'keydown')[1];
      const keyupHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'keyup')[1];
      
      // Rapid key sequence
      const keys = ['a', 's', 'd', 'f'];
      keys.forEach(key => {
        keydownHandler(new KeyboardEvent('keydown', { key, repeat: false }));
      });
      
      expect(emitSpy).toHaveBeenCalledTimes(keys.length);
      
      // Release all keys
      emitSpy.mockClear();
      keys.forEach(key => {
        keyupHandler(new KeyboardEvent('keyup', { key }));
      });
      
      expect(emitSpy).toHaveBeenCalledTimes(keys.length);
    });

    it('should handle simultaneous touch and keyboard input', () => {
      inputManager.initialize();
      const emitSpy = jest.spyOn(inputManager, 'emit');
      
      // Keyboard input
      const keydownHandler = mockAddEventListener.mock.calls.find(call => call[0] === 'keydown')[1];
      keydownHandler(new KeyboardEvent('keydown', { key: 'a', repeat: false }));
      
      // Touch input
      const touchstartHandler = mockAppElement.addEventListener.mock.calls.find(call => call[0] === 'touchstart')[1];
      touchstartHandler({ 
        preventDefault: jest.fn(),
        changedTouches: [{ identifier: 1, clientX: 100, clientY: 100 }]
      });
      
      expect(emitSpy).toHaveBeenCalledWith('keyPress', 'a');
      expect(emitSpy).toHaveBeenCalledWith('touchPress', { x: 100, y: 100 });
    });
  });
});
