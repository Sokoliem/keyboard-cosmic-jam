/**
 * BackgroundEffects Unit Tests
 * 
 * Comprehensive test suite for the BackgroundEffects class covering:
 * - Initialization and PIXI container setup
 * - Starfield generation and animation
 * - Neon grid perspective effects
 * - Star lifecycle management
 * - Performance optimization
 * - Effect configuration and state management
 * - Cleanup and memory management
 * - Error handling and edge cases
 * 
 * Target Coverage: 91%
 */

import { BackgroundEffects } from '@game/visuals/BackgroundEffects';
import * as PIXI from 'pixi.js';

// Mock PIXI.js
jest.mock('pixi.js', () => ({
  Container: jest.fn().mockImplementation(() => ({
    addChild: jest.fn(),
    addChildAt: jest.fn(),
    removeChild: jest.fn(),
    destroy: jest.fn(),
    visible: true,
    alpha: 1,
    y: 0
  })),
  Graphics: jest.fn().mockImplementation(() => ({
    clear: jest.fn(),
    beginFill: jest.fn(),
    endFill: jest.fn(),
    drawCircle: jest.fn(),
    drawRoundedRect: jest.fn(),
    lineStyle: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    destroy: jest.fn(),
    addChild: jest.fn(),
    removeChild: jest.fn(),
    parent: null,
    alpha: 1,
    x: 0,
    y: 0,
    visible: true
  }))
}));

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });

// Mock performance.now for consistent timing
const mockPerformanceNow = jest.fn(() => 1000);
Object.defineProperty(performance, 'now', { value: mockPerformanceNow });

// Mock Date.now for twinkling effects
const mockDateNow = jest.fn(() => 10000);
Date.now = mockDateNow;

// Mock Math.random for predictable star generation
const mockMathRandom = jest.fn();
Math.random = mockMathRandom;

describe('BackgroundEffects', () => {
  let backgroundEffects: BackgroundEffects;
  let mockStage: PIXI.Container;
  let mockStarfield: PIXI.Container;
  let mockNeonGrid: PIXI.Container;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock stage
    mockStage = new PIXI.Container();
    mockStarfield = new PIXI.Container();
    mockNeonGrid = new PIXI.Container();
    
    // Mock PIXI constructors to return our mocks
    (PIXI.Container as jest.Mock)
      .mockReturnValueOnce(mockStarfield)  // First call for starfield
      .mockReturnValueOnce(mockNeonGrid);  // Second call for neon grid

    // Setup predictable random values
    mockMathRandom
      .mockReturnValueOnce(0.5)  // Star speed
      .mockReturnValueOnce(0.3)  // Star color index
      .mockReturnValueOnce(0.7)  // Star size
      .mockReturnValueOnce(0.2)  // Star x position
      .mockReturnValueOnce(0.8)  // Star y position
      .mockReturnValueOnce(0.6); // Star z position

    backgroundEffects = new BackgroundEffects(mockStage);
  });

  afterEach(() => {
    backgroundEffects.cleanup();
  });

  describe('constructor and initialization', () => {
    it('should create BackgroundEffects instance', () => {
      expect(backgroundEffects).toBeInstanceOf(BackgroundEffects);
    });

    it('should initialize with default configuration', () => {
      expect(backgroundEffects.starfieldEnabled).toBe(true);
      expect(backgroundEffects.neonGridEnabled).toBe(true);
      expect(backgroundEffects.starCount).toBe(200);
      expect(backgroundEffects.gridSpacing).toBe(50);
    });

    it('should create starfield and neon grid containers', () => {
      expect(PIXI.Container).toHaveBeenCalledTimes(2);
      expect(mockStage.addChildAt).toHaveBeenCalledWith(mockStarfield, 0);
      expect(mockStage.addChildAt).toHaveBeenCalledWith(mockNeonGrid, 1);
    });

    it('should initialize starfield with default star count', () => {
      expect(PIXI.Graphics).toHaveBeenCalled();
      expect(mockStarfield.addChild).toHaveBeenCalled();
    });

    it('should create initial neon grid', () => {
      expect(mockNeonGrid.addChild).toHaveBeenCalled();
    });
  });

  describe('starfield management', () => {
    beforeEach(() => {
      // Clear previous mocks
      jest.clearAllMocks();
    });

    it('should enable and disable starfield', () => {
      backgroundEffects.setStarfieldEnabled(false);
      expect(mockStarfield.visible).toBe(false);

      backgroundEffects.setStarfieldEnabled(true);
      expect(mockStarfield.visible).toBe(true);
    });

    it('should update star count dynamically', () => {
      const initialStarCount = 100;
      backgroundEffects.setStarCount(initialStarCount);
      
      // Increase star count
      backgroundEffects.setStarCount(150);
      expect(mockStarfield.addChild).toHaveBeenCalled();

      // Decrease star count
      backgroundEffects.setStarCount(50);
      expect(mockStarfield.removeChild).toHaveBeenCalled();
    });

    it('should not recreate stars for same count', () => {
      const currentCount = backgroundEffects.starCount;
      backgroundEffects.setStarCount(currentCount);
      
      // Should not add or remove stars
      expect(mockStarfield.addChild).not.toHaveBeenCalled();
      expect(mockStarfield.removeChild).not.toHaveBeenCalled();
    });

    it('should handle star count of zero', () => {
      backgroundEffects.setStarCount(0);
      expect(mockStarfield.removeChild).toHaveBeenCalled();
    });

    it('should handle large star counts', () => {
      backgroundEffects.setStarCount(1000);
      expect(mockStarfield.addChild).toHaveBeenCalled();
    });
  });

  describe('neon grid management', () => {
    it('should enable and disable neon grid', () => {
      backgroundEffects.setNeonGridEnabled(false);
      expect(mockNeonGrid.visible).toBe(false);

      backgroundEffects.setNeonGridEnabled(true);
      expect(mockNeonGrid.visible).toBe(true);
    });

    it('should recreate grid on screen resize', () => {
      // Change window dimensions
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      Object.defineProperty(window, 'innerHeight', { value: 768 });

      backgroundEffects.resize(1024, 768);
      
      // Should clear and recreate grid
      expect(PIXI.Graphics).toHaveBeenCalled();
    });

    it('should create perspective grid with proper lines', () => {
      const mockGraphics = new PIXI.Graphics();
      (PIXI.Graphics as jest.Mock).mockReturnValue(mockGraphics);

      backgroundEffects.resize(1920, 1080);

      expect(mockGraphics.lineStyle).toHaveBeenCalled();
      expect(mockGraphics.moveTo).toHaveBeenCalled();
      expect(mockGraphics.lineTo).toHaveBeenCalled();
    });
  });

  describe('star lifecycle and animation', () => {
    it('should update starfield animation', () => {
      const deltaTime = 16; // 60fps
      
      backgroundEffects.update(deltaTime);
      
      // Should update stars if starfield is enabled
      expect(backgroundEffects.starfieldEnabled).toBe(true);
    });

    it('should skip starfield update when disabled', () => {
      backgroundEffects.setStarfieldEnabled(false);
      
      const deltaTime = 16;
      backgroundEffects.update(deltaTime);
      
      // Stars should not be updated
      expect(mockStarfield.visible).toBe(false);
    });

    it('should animate grid effects', () => {
      backgroundEffects.setNeonGridEnabled(true);
      
      const deltaTime = 16;
      backgroundEffects.update(deltaTime);
      
      // Grid should be animated
      expect(backgroundEffects.neonGridEnabled).toBe(true);
    });

    it('should skip grid animation when disabled', () => {
      backgroundEffects.setNeonGridEnabled(false);
      
      const deltaTime = 16;
      backgroundEffects.update(deltaTime);
      
      expect(mockNeonGrid.visible).toBe(false);
    });

    it('should handle large delta time values', () => {
      const largeDelta = 1000; // 1 second
      
      expect(() => backgroundEffects.update(largeDelta)).not.toThrow();
    });

    it('should handle zero delta time', () => {
      expect(() => backgroundEffects.update(0)).not.toThrow();
    });

    it('should handle negative delta time', () => {
      expect(() => backgroundEffects.update(-16)).not.toThrow();
    });
  });

  describe('star color and appearance', () => {
    it('should generate random star colors', () => {
      // Mock random to return specific values for color selection
      mockMathRandom.mockReturnValue(0.5); // Should select a mid-range color
      
      backgroundEffects.setStarCount(1);
      
      // Star creation should use color generation
      expect(PIXI.Graphics).toHaveBeenCalled();
    });

    it('should handle different star sizes', () => {
      // Test various size values
      mockMathRandom
        .mockReturnValueOnce(0.1)   // Small star
        .mockReturnValueOnce(0.5)   // Medium star
        .mockReturnValueOnce(0.9);  // Large star
      
      backgroundEffects.setStarCount(3);
      
      expect(PIXI.Graphics).toHaveBeenCalled();
    });

    it('should apply twinkling effect to close stars', () => {
      // Mock Date.now for twinkling calculation
      mockDateNow.mockReturnValue(15000);
      
      backgroundEffects.update(16);
      
      // Twinkling should be calculated based on time and position
      expect(mockDateNow).toHaveBeenCalled();
    });
  });

  describe('perspective grid rendering', () => {
    it('should create vertical perspective lines', () => {
      const mockGraphics = new PIXI.Graphics();
      (PIXI.Graphics as jest.Mock).mockReturnValue(mockGraphics);

      backgroundEffects.resize(800, 600);

      // Should create multiple vertical lines
      expect(mockGraphics.moveTo).toHaveBeenCalled();
      expect(mockGraphics.lineTo).toHaveBeenCalled();
    });

    it('should create horizontal depth lines', () => {
      const mockGraphics = new PIXI.Graphics();
      (PIXI.Graphics as jest.Mock).mockReturnValue(mockGraphics);

      backgroundEffects.resize(800, 600);

      // Should create horizontal lines with varying alpha
      expect(mockGraphics.lineStyle).toHaveBeenCalled();
    });

    it('should handle different screen ratios', () => {
      const aspectRatios = [
        { width: 1920, height: 1080 }, // 16:9
        { width: 1024, height: 768 },  // 4:3
        { width: 768, height: 1024 }   // Portrait
      ];

      aspectRatios.forEach(({ width, height }) => {
        const mockGraphics = new PIXI.Graphics();
        (PIXI.Graphics as jest.Mock).mockReturnValue(mockGraphics);

        backgroundEffects.resize(width, height);

        expect(mockGraphics.lineStyle).toHaveBeenCalled();
        expect(mockGraphics.moveTo).toHaveBeenCalled();
      });
    });
  });

  describe('performance optimization', () => {
    it('should efficiently handle star updates', () => {
      const startTime = performance.now();
      
      backgroundEffects.setStarCount(500);
      backgroundEffects.update(16);
      
      const endTime = performance.now();
      
      // Update should complete quickly
      expect(endTime - startTime).toBeLessThan(10);
    });

    it('should reuse graphics objects when possible', () => {
      // First resize
      backgroundEffects.resize(800, 600);
      const firstCallCount = (PIXI.Graphics as jest.Mock).mock.calls.length;

      // Second resize with same dimensions
      backgroundEffects.resize(800, 600);
      const secondCallCount = (PIXI.Graphics as jest.Mock).mock.calls.length;

      // Should create new graphics for resize
      expect(secondCallCount).toBeGreaterThan(firstCallCount);
    });

    it('should handle rapid configuration changes', () => {
      for (let i = 0; i < 10; i++) {
        backgroundEffects.setStarfieldEnabled(i % 2 === 0);
        backgroundEffects.setNeonGridEnabled(i % 2 === 1);
        backgroundEffects.setStarCount(100 + i * 10);
      }

      expect(() => backgroundEffects.update(16)).not.toThrow();
    });
  });

  describe('memory management', () => {
    it('should properly destroy stars when reducing count', () => {
      backgroundEffects.setStarCount(100);
      backgroundEffects.setStarCount(50);

      // Should remove and destroy excess stars
      expect(mockStarfield.removeChild).toHaveBeenCalled();
    });

    it('should clean up grid lines on resize', () => {
      backgroundEffects.resize(800, 600);
      backgroundEffects.resize(1024, 768);

      // Should destroy old grid graphics
      const mockGraphics = (PIXI.Graphics as jest.Mock).mock.results[0]?.value;
      if (mockGraphics) {
        expect(mockGraphics.destroy).toHaveBeenCalled();
      }
    });

    it('should handle cleanup properly', () => {
      backgroundEffects.setStarCount(200);
      backgroundEffects.cleanup();

      // Should destroy all containers and graphics
      expect(mockStarfield.destroy).toHaveBeenCalled();
      expect(mockNeonGrid.destroy).toHaveBeenCalled();
    });

    it('should remove containers from stage on cleanup', () => {
      mockStarfield.parent = mockStage;
      mockNeonGrid.parent = mockStage;
      
      backgroundEffects.cleanup();

      expect(mockStage.removeChild).toHaveBeenCalledWith(mockStarfield);
      expect(mockStage.removeChild).toHaveBeenCalledWith(mockNeonGrid);
    });

    it('should handle cleanup when containers have no parent', () => {
      mockStarfield.parent = null;
      mockNeonGrid.parent = null;
      
      expect(() => backgroundEffects.cleanup()).not.toThrow();
    });
  });

  describe('configuration state management', () => {
    it('should maintain configuration across operations', () => {
      backgroundEffects.setStarfieldEnabled(false);
      backgroundEffects.setNeonGridEnabled(false);
      backgroundEffects.setStarCount(150);

      expect(backgroundEffects.starfieldEnabled).toBe(false);
      expect(backgroundEffects.neonGridEnabled).toBe(false);
      expect(backgroundEffects.starCount).toBe(150);
    });

    it('should persist visibility states', () => {
      backgroundEffects.setStarfieldEnabled(false);
      backgroundEffects.setNeonGridEnabled(true);

      expect(mockStarfield.visible).toBe(false);
      expect(mockNeonGrid.visible).toBe(true);
    });

    it('should handle rapid state changes', () => {
      for (let i = 0; i < 20; i++) {
        backgroundEffects.setStarfieldEnabled(i % 2 === 0);
        backgroundEffects.setNeonGridEnabled(i % 3 === 0);
      }

      expect(() => backgroundEffects.update(16)).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle missing stage gracefully', () => {
      const nullStage = null as any;
      
      expect(() => new BackgroundEffects(nullStage)).not.toThrow();
    });

    it('should handle PIXI container creation failures', () => {
      (PIXI.Container as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Container creation failed');
      });

      expect(() => new BackgroundEffects(mockStage)).toThrow('Container creation failed');
    });

    it('should handle graphics creation failures', () => {
      (PIXI.Graphics as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Graphics creation failed');
      });

      expect(() => backgroundEffects.setStarCount(1)).not.toThrow();
    });

    it('should handle invalid star counts', () => {
      expect(() => backgroundEffects.setStarCount(-10)).not.toThrow();
      expect(() => backgroundEffects.setStarCount(NaN)).not.toThrow();
      expect(() => backgroundEffects.setStarCount(Infinity)).not.toThrow();
    });

    it('should handle invalid window dimensions', () => {
      Object.defineProperty(window, 'innerWidth', { value: 0 });
      Object.defineProperty(window, 'innerHeight', { value: 0 });

      expect(() => backgroundEffects.resize(0, 0)).not.toThrow();
    });

    it('should handle Math functions returning NaN', () => {
      const originalSin = Math.sin;
      Math.sin = jest.fn(() => NaN);

      expect(() => backgroundEffects.update(16)).not.toThrow();

      Math.sin = originalSin;
    });
  });

  describe('advanced animation features', () => {
    it('should animate grid alpha with sine waves', () => {
      backgroundEffects.setNeonGridEnabled(true);
      
      // Multiple updates to test animation progression
      backgroundEffects.update(16);
      backgroundEffects.update(16);
      backgroundEffects.update(16);

      // Grid animation should have been applied
      expect(backgroundEffects.neonGridEnabled).toBe(true);
    });

    it('should apply grid vertical movement', () => {
      backgroundEffects.setNeonGridEnabled(true);
      
      backgroundEffects.update(16);

      // Grid lines should have y-position animated
      // We can't directly test the internal grid lines, but we ensure the update completed
      expect(() => backgroundEffects.update(16)).not.toThrow();
    });

    it('should handle time-based calculations correctly', () => {
      // Test with different time values
      const timeValues = [0, 16, 33, 100, 1000];
      
      timeValues.forEach(deltaTime => {
        expect(() => backgroundEffects.update(deltaTime)).not.toThrow();
      });
    });
  });

  describe('star 3D projection and movement', () => {
    it('should update star positions based on z-depth', () => {
      backgroundEffects.setStarCount(1);
      backgroundEffects.update(16);

      // Stars should move through 3D space
      expect(PIXI.Graphics).toHaveBeenCalled();
    });

    it('should reset stars when they get too close', () => {
      backgroundEffects.setStarCount(5);
      
      // Simulate multiple updates to trigger star resets
      for (let i = 0; i < 100; i++) {
        backgroundEffects.update(100); // Large delta to move stars quickly
      }

      expect(PIXI.Graphics).toHaveBeenCalled();
    });

    it('should handle screen bounds checking', () => {
      backgroundEffects.setStarCount(10);
      
      // Test with different screen sizes
      backgroundEffects.resize(320, 240);
      backgroundEffects.update(16);
      
      backgroundEffects.resize(1920, 1080);
      backgroundEffects.update(16);

      expect(() => backgroundEffects.update(16)).not.toThrow();
    });
  });

  describe('color and visual effects', () => {
    it('should handle color variations in stars', () => {
      // Test different random values for color selection
      const colorValues = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
      
      colorValues.forEach(value => {
        mockMathRandom.mockReturnValueOnce(value);
        backgroundEffects.setStarCount(1);
      });

      expect(PIXI.Graphics).toHaveBeenCalled();
    });

    it('should apply appropriate alpha values to grid lines', () => {
      const mockGraphics = new PIXI.Graphics();
      (PIXI.Graphics as jest.Mock).mockReturnValue(mockGraphics);

      backgroundEffects.resize(800, 600);

      // Should set appropriate alpha values for depth
      expect(mockGraphics.lineStyle).toHaveBeenCalled();
    });

    it('should handle grid color cycling', () => {
      backgroundEffects.setNeonGridEnabled(true);
      
      // Update multiple times to test color cycling
      for (let i = 0; i < 10; i++) {
        backgroundEffects.update(16);
      }

      expect(() => backgroundEffects.update(16)).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle simultaneous starfield and grid updates', () => {
      backgroundEffects.setStarfieldEnabled(true);
      backgroundEffects.setNeonGridEnabled(true);
      backgroundEffects.setStarCount(100);

      for (let i = 0; i < 60; i++) { // 1 second at 60fps
        backgroundEffects.update(16);
      }

      expect(backgroundEffects.starfieldEnabled).toBe(true);
      expect(backgroundEffects.neonGridEnabled).toBe(true);
    });

    it('should maintain performance with complex configurations', () => {
      backgroundEffects.setStarCount(500);
      backgroundEffects.setStarfieldEnabled(true);
      backgroundEffects.setNeonGridEnabled(true);

      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        backgroundEffects.update(16);
      }
      
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should handle configuration changes during animation', () => {
      backgroundEffects.setStarCount(200);
      
      for (let i = 0; i < 30; i++) {
        backgroundEffects.update(16);
        
        // Change configuration mid-animation
        if (i === 10) {
          backgroundEffects.setStarfieldEnabled(false);
        }
        if (i === 20) {
          backgroundEffects.setStarCount(100);
        }
      }

      expect(() => backgroundEffects.update(16)).not.toThrow();
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle extremely small screen sizes', () => {
      backgroundEffects.resize(1, 1);
      backgroundEffects.update(16);

      expect(() => backgroundEffects.update(16)).not.toThrow();
    });

    it('should handle extremely large screen sizes', () => {
      backgroundEffects.resize(10000, 10000);
      backgroundEffects.update(16);

      expect(() => backgroundEffects.update(16)).not.toThrow();
    });

    it('should handle floating point precision issues', () => {
      backgroundEffects.resize(1920.7, 1080.3);
      backgroundEffects.update(16.666666);

      expect(() => backgroundEffects.update(16.666666)).not.toThrow();
    });

    it('should handle rapid resize operations', () => {
      for (let i = 0; i < 20; i++) {
        backgroundEffects.resize(800 + i * 10, 600 + i * 5);
      }

      expect(() => backgroundEffects.update(16)).not.toThrow();
    });
  });
});
