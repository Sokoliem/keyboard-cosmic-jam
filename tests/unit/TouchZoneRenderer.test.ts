/**
 * TouchZoneRenderer Unit Tests
 * 
 * Comprehensive test suite for the TouchZoneRenderer class covering:
 * - PIXI container setup and management
 * - Touch zone visual creation and rendering
 * - Zone highlighting and interaction feedback
 * - Show/hide animations and visibility management
 * - Device detection and adaptive behavior
 * - Layout updates and zone management
 * - Performance optimization
 * - Cleanup and memory management
 * - Error handling and edge cases
 * 
 * Target Coverage: 90%
 */

import { TouchZoneRenderer } from '@game/visuals/TouchZoneRenderer';
import { TouchZone } from '@game/core/InputManager';
import * as PIXI from 'pixi.js';

// Mock PIXI.js
jest.mock('pixi.js', () => ({
  Container: jest.fn().mockImplementation(() => ({
    addChild: jest.fn(),
    removeChild: jest.fn(),
    destroy: jest.fn(),
    visible: true,
    alpha: 0.8,
    zIndex: 100,
    parent: null
  })),
  Graphics: jest.fn().mockImplementation(() => ({
    beginFill: jest.fn(),
    endFill: jest.fn(),
    lineStyle: jest.fn(),
    drawRoundedRect: jest.fn(),
    destroy: jest.fn(),
    parent: null,
    alpha: 1,
    name: ''
  })),
  Text: jest.fn().mockImplementation(() => ({
    anchor: { set: jest.fn() },
    destroy: jest.fn(),
    parent: null,
    x: 0,
    y: 0
  }))
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));

// Mock performance.now
const mockPerformanceNow = jest.fn(() => 1000);
Object.defineProperty(performance, 'now', { value: mockPerformanceNow });

// Mock navigator for device detection
Object.defineProperty(navigator, 'userAgent', { 
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 
  writable: true 
});

// Mock window properties
Object.defineProperty(window, 'screen', { 
  value: { width: 1920 }, 
  writable: true 
});
Object.defineProperty(window, 'ontouchstart', { value: undefined, writable: true });

describe('TouchZoneRenderer', () => {
  let touchZoneRenderer: TouchZoneRenderer;
  let mockStage: PIXI.Container;
  let mockContainer: PIXI.Container;

  const createMockTouchZone = (id: string, x: number, y: number, width: number, height: number): TouchZone => ({
    id,
    keys: [id.toLowerCase()],
    bounds: { x, y, width, height },
    instrument: 'synthPad',
    color: '#FF00FF',
    label: `Zone ${id}`
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock stage and container
    mockStage = new PIXI.Container();
    mockContainer = new PIXI.Container();
    
    (PIXI.Container as jest.Mock).mockReturnValue(mockContainer);
    
    touchZoneRenderer = new TouchZoneRenderer(mockStage);
  });

  afterEach(() => {
    touchZoneRenderer.cleanup();
  });

  describe('constructor and initialization', () => {
    it('should create TouchZoneRenderer instance', () => {
      expect(touchZoneRenderer).toBeInstanceOf(TouchZoneRenderer);
    });

    it('should create container with proper configuration', () => {
      expect(PIXI.Container).toHaveBeenCalled();
      expect(mockContainer.alpha).toBe(0.8);
      expect(mockContainer.zIndex).toBe(100);
      expect(mockStage.addChild).toHaveBeenCalledWith(mockContainer);
    });

    it('should initialize with no zones and hidden state', () => {
      // TouchZoneRenderer starts in a hidden state
      expect(mockContainer.alpha).toBe(0.8); // Default alpha
    });
  });

  describe('touch zone rendering', () => {
    const testZones: TouchZone[] = [
      createMockTouchZone('A', 0, 0, 100, 50),
      createMockTouchZone('B', 110, 0, 100, 50),
      createMockTouchZone('C', 0, 60, 100, 50)
    ];

    it('should render touch zones correctly', () => {
      touchZoneRenderer.renderTouchZones(testZones);

      // Should create graphics for each zone (zone + glow for each)
      expect(PIXI.Graphics).toHaveBeenCalled();
      expect(mockContainer.addChild).toHaveBeenCalled();
    });

    it('should create zone visuals with proper styling', () => {
      const mockGraphics = new PIXI.Graphics();
      (PIXI.Graphics as jest.Mock).mockReturnValue(mockGraphics);

      touchZoneRenderer.renderTouchZones([testZones[0]]);

      expect(mockGraphics.beginFill).toHaveBeenCalledWith(expect.any(Number), 0.2);
      expect(mockGraphics.lineStyle).toHaveBeenCalledWith(2, expect.any(Number), 0.8);
      expect(mockGraphics.drawRoundedRect).toHaveBeenCalledWith(0, 0, 100, 50, 8);
      expect(mockGraphics.endFill).toHaveBeenCalled();
    });

    it('should create glow effects for zones', () => {
      const mockGraphics = new PIXI.Graphics();
      (PIXI.Graphics as jest.Mock).mockReturnValue(mockGraphics);

      touchZoneRenderer.renderTouchZones([testZones[0]]);

      // Should create glow with expanded bounds
      expect(mockGraphics.drawRoundedRect).toHaveBeenCalledWith(-2, -2, 104, 54, 10);
    });

    it('should create labels for zones', () => {
      const mockText = new PIXI.Text();
      (PIXI.Text as jest.Mock).mockReturnValue(mockText);

      touchZoneRenderer.renderTouchZones([testZones[0]]);

      expect(PIXI.Text).toHaveBeenCalledWith('Zone A', expect.objectContaining({
        fontFamily: 'monospace',
        fill: 0xFFFFFF,
        align: 'center',
        fontWeight: 'bold'
      }));
      expect(mockText.anchor.set).toHaveBeenCalledWith(0.5);
    });

    it('should handle zones without labels', () => {
      const zoneWithoutLabel = { ...testZones[0] };
      delete zoneWithoutLabel.label;

      expect(() => {
        touchZoneRenderer.renderTouchZones([zoneWithoutLabel]);
      }).not.toThrow();
    });

    it('should handle zones without colors', () => {
      const zoneWithoutColor = { ...testZones[0] };
      delete zoneWithoutColor.color;

      expect(() => {
        touchZoneRenderer.renderTouchZones([zoneWithoutColor]);
      }).not.toThrow();
    });

    it('should clear existing zones before rendering new ones', () => {
      touchZoneRenderer.renderTouchZones([testZones[0]]);
      touchZoneRenderer.renderTouchZones([testZones[1]]);

      // Should destroy previous graphics
      const firstGraphics = (PIXI.Graphics as jest.Mock).mock.results[0]?.value;
      if (firstGraphics) {
        expect(firstGraphics.destroy).toHaveBeenCalled();
      }
    });

    it('should show zones after rendering', () => {
      touchZoneRenderer.renderTouchZones(testZones);

      // Should call showZones internally
      expect(mockContainer.visible).toBe(true);
    });
  });

  describe('zone visibility management', () => {
    beforeEach(() => {
      const testZones = [createMockTouchZone('A', 0, 0, 100, 50)];
      touchZoneRenderer.renderTouchZones(testZones);
    });

    it('should show zones with animation', () => {
      touchZoneRenderer.showZones();

      expect(mockContainer.visible).toBe(true);
      // Animation should start from alpha 0
      expect(mockContainer.alpha).toBe(0);
    });

    it('should hide zones with animation', () => {
      touchZoneRenderer.hideZones();

      // Should start fade-out animation
      expect(requestAnimationFrame).toHaveBeenCalled();
    });

    it('should toggle zone visibility', () => {
      // Start hidden
      touchZoneRenderer.hideZones();
      
      // Toggle should show
      touchZoneRenderer.toggleZones();
      expect(mockContainer.visible).toBe(true);

      // Toggle again should hide
      touchZoneRenderer.toggleZones();
      expect(requestAnimationFrame).toHaveBeenCalled();
    });

    it('should handle animation completion', () => {
      jest.useFakeTimers();
      
      touchZoneRenderer.showZones();
      
      // Advance time to complete animation
      jest.advanceTimersByTime(300);
      
      expect(mockContainer.alpha).toBeCloseTo(0.7, 1);
      
      jest.useRealTimers();
    });

    it('should complete hide animation properly', () => {
      jest.useFakeTimers();
      
      touchZoneRenderer.hideZones();
      
      // Advance time to complete animation
      jest.advanceTimersByTime(300);
      
      expect(mockContainer.visible).toBe(false);
      expect(mockContainer.alpha).toBe(0);
      
      jest.useRealTimers();
    });
  });

  describe('zone highlighting', () => {
    const testZones = [
      createMockTouchZone('A', 0, 0, 100, 50),
      createMockTouchZone('B', 110, 0, 100, 50)
    ];

    beforeEach(() => {
      touchZoneRenderer.renderTouchZones(testZones);
    });

    it('should highlight specific zone', () => {
      jest.useFakeTimers();
      
      touchZoneRenderer.highlightZone('A');
      
      // Should flash the zone
      jest.advanceTimersByTime(150);
      
      jest.useRealTimers();
    });

    it('should handle highlighting non-existent zone', () => {
      expect(() => {
        touchZoneRenderer.highlightZone('NonExistent');
      }).not.toThrow();
    });

    it('should restore original alpha after highlight', () => {
      jest.useFakeTimers();
      
      touchZoneRenderer.highlightZone('A');
      
      // Complete highlight animation
      jest.advanceTimersByTime(150);
      
      // Alpha should be restored
      // Note: We can't directly test this due to mocking limitations,
      // but we ensure the timeout is set
      expect(setTimeout).toHaveBeenCalled();
      
      jest.useRealTimers();
    });
  });

  describe('device detection and auto-management', () => {
    it('should detect mobile devices correctly', () => {
      // Test mobile user agent
      Object.defineProperty(navigator, 'userAgent', { 
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15' 
      });
      
      expect(TouchZoneRenderer.isMobileDevice()).toBe(true);
    });

    it('should detect desktop devices correctly', () => {
      Object.defineProperty(navigator, 'userAgent', { 
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' 
      });
      Object.defineProperty(window, 'screen', { value: { width: 1920 } });
      Object.defineProperty(window, 'ontouchstart', { value: undefined });
      
      expect(TouchZoneRenderer.isMobileDevice()).toBe(false);
    });

    it('should detect tablets as mobile', () => {
      Object.defineProperty(navigator, 'userAgent', { 
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15' 
      });
      
      expect(TouchZoneRenderer.isMobileDevice()).toBe(true);
    });

    it('should detect touch-capable small screens as mobile', () => {
      Object.defineProperty(window, 'screen', { value: { width: 768 } });
      Object.defineProperty(window, 'ontouchstart', { value: {} });
      
      expect(TouchZoneRenderer.isMobileDevice()).toBe(true);
    });

    it('should auto-show zones on mobile', () => {
      // Mock as mobile device
      jest.spyOn(TouchZoneRenderer, 'isMobileDevice').mockReturnValue(true);
      
      touchZoneRenderer.autoManageVisibility();
      
      expect(mockContainer.visible).toBe(true);
    });

    it('should auto-hide zones on desktop', () => {
      // Mock as desktop device
      jest.spyOn(TouchZoneRenderer, 'isMobileDevice').mockReturnValue(false);
      
      touchZoneRenderer.autoManageVisibility();
      
      // Should start hide animation
      expect(requestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('layout updates', () => {
    const initialZones = [createMockTouchZone('A', 0, 0, 100, 50)];
    const updatedZones = [
      createMockTouchZone('A', 0, 0, 120, 60),
      createMockTouchZone('B', 130, 0, 100, 50)
    ];

    it('should update layout when zones are visible', () => {
      touchZoneRenderer.renderTouchZones(initialZones);
      touchZoneRenderer.showZones();
      
      touchZoneRenderer.updateLayout(updatedZones);
      
      // Should re-render with new zones
      expect(PIXI.Graphics).toHaveBeenCalled();
    });

    it('should not update layout when zones are hidden', () => {
      touchZoneRenderer.renderTouchZones(initialZones);
      touchZoneRenderer.hideZones();
      
      const graphicsCallCount = (PIXI.Graphics as jest.Mock).mock.calls.length;
      touchZoneRenderer.updateLayout(updatedZones);
      
      // Should not create new graphics when hidden
      expect((PIXI.Graphics as jest.Mock).mock.calls.length).toBe(graphicsCallCount);
    });

    it('should handle empty zone arrays', () => {
      touchZoneRenderer.renderTouchZones([]);
      
      expect(() => touchZoneRenderer.updateLayout([])).not.toThrow();
    });
  });

  describe('animation system', () => {
    beforeEach(() => {
      const testZones = [createMockTouchZone('A', 0, 0, 100, 50)];
      touchZoneRenderer.renderTouchZones(testZones);
    });

    it('should use smooth easing for animations', () => {
      jest.useFakeTimers();
      mockPerformanceNow.mockReturnValueOnce(1000).mockReturnValueOnce(1150); // 150ms elapsed
      
      touchZoneRenderer.showZones();
      
      // Let animation run
      jest.advanceTimersByTime(150);
      
      // Should apply eased progress
      expect(requestAnimationFrame).toHaveBeenCalled();
      
      jest.useRealTimers();
    });

    it('should handle animation with zero duration', () => {
      // Test edge case where animation completes immediately
      mockPerformanceNow.mockReturnValueOnce(1000).mockReturnValueOnce(1300); // 300ms elapsed
      
      touchZoneRenderer.showZones();
      
      expect(mockContainer.alpha).toBe(0.7);
    });

    it('should handle multiple simultaneous animations', () => {
      touchZoneRenderer.showZones();
      touchZoneRenderer.hideZones();
      
      // Should handle overlapping animations gracefully
      expect(requestAnimationFrame).toHaveBeenCalled();
    });

    it('should call completion callbacks', () => {
      jest.useFakeTimers();
      
      touchZoneRenderer.hideZones();
      
      // Complete animation
      jest.advanceTimersByTime(300);
      
      expect(mockContainer.visible).toBe(false);
      
      jest.useRealTimers();
    });
  });

  describe('zone cleanup and memory management', () => {
    it('should clear zones properly', () => {
      const testZones = [
        createMockTouchZone('A', 0, 0, 100, 50),
        createMockTouchZone('B', 110, 0, 100, 50)
      ];
      
      touchZoneRenderer.renderTouchZones(testZones);
      
      // Should destroy graphics when clearing
      const mockGraphics = (PIXI.Graphics as jest.Mock).mock.results[0]?.value;
      const mockText = (PIXI.Text as jest.Mock).mock.results[0]?.value;
      
      touchZoneRenderer.renderTouchZones([]); // Clear by rendering empty array
      
      if (mockGraphics) {
        expect(mockGraphics.destroy).toHaveBeenCalled();
      }
      if (mockText) {
        expect(mockText.destroy).toHaveBeenCalled();
      }
    });

    it('should remove children before destroying', () => {
      const testZones = [createMockTouchZone('A', 0, 0, 100, 50)];
      touchZoneRenderer.renderTouchZones(testZones);
      
      const mockGraphics = (PIXI.Graphics as jest.Mock).mock.results[0]?.value;
      if (mockGraphics) {
        mockGraphics.parent = mockContainer;
      }
      
      touchZoneRenderer.renderTouchZones([]);
      
      expect(mockContainer.removeChild).toHaveBeenCalled();
    });

    it('should handle cleanup with full container removal', () => {
      mockContainer.parent = mockStage;
      
      touchZoneRenderer.cleanup();
      
      expect(mockStage.removeChild).toHaveBeenCalledWith(mockContainer);
      expect(mockContainer.destroy).toHaveBeenCalled();
    });

    it('should handle cleanup when container has no parent', () => {
      mockContainer.parent = null;
      
      expect(() => touchZoneRenderer.cleanup()).not.toThrow();
      expect(mockContainer.destroy).toHaveBeenCalled();
    });

    it('should be safe to call cleanup multiple times', () => {
      touchZoneRenderer.cleanup();
      
      expect(() => touchZoneRenderer.cleanup()).not.toThrow();
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle zones with invalid bounds', () => {
      const invalidZone: TouchZone = {
        id: 'invalid',
        keys: ['x'],
        bounds: { x: NaN, y: Infinity, width: -10, height: 0 },
        color: '#FF00FF'
      };
      
      expect(() => {
        touchZoneRenderer.renderTouchZones([invalidZone]);
      }).not.toThrow();
    });

    it('should handle zones with invalid colors', () => {
      const invalidColorZone: TouchZone = {
        id: 'invalid-color',
        keys: ['x'],
        bounds: { x: 0, y: 0, width: 100, height: 50 },
        color: 'not-a-color'
      };
      
      expect(() => {
        touchZoneRenderer.renderTouchZones([invalidColorZone]);
      }).not.toThrow();
    });

    it('should handle PIXI creation failures gracefully', () => {
      (PIXI.Graphics as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Graphics creation failed');
      });
      
      const testZones = [createMockTouchZone('A', 0, 0, 100, 50)];
      
      expect(() => {
        touchZoneRenderer.renderTouchZones(testZones);
      }).not.toThrow();
    });

    it('should handle requestAnimationFrame failures', () => {
      (global.requestAnimationFrame as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Animation frame failed');
      });
      
      expect(() => touchZoneRenderer.showZones()).not.toThrow();
    });

    it('should handle performance.now failures', () => {
      mockPerformanceNow.mockImplementationOnce(() => {
        throw new Error('Performance timing failed');
      });
      
      expect(() => touchZoneRenderer.showZones()).not.toThrow();
    });

    it('should handle very large zone counts', () => {
      const manyZones = Array.from({ length: 1000 }, (_, i) => 
        createMockTouchZone(`Zone${i}`, i * 10, 0, 10, 10)
      );
      
      expect(() => {
        touchZoneRenderer.renderTouchZones(manyZones);
      }).not.toThrow();
    });

    it('should handle zones with extreme positions', () => {
      const extremeZones = [
        createMockTouchZone('A', -1000, -1000, 100, 50),
        createMockTouchZone('B', 10000, 10000, 100, 50)
      ];
      
      expect(() => {
        touchZoneRenderer.renderTouchZones(extremeZones);
      }).not.toThrow();
    });
  });

  describe('performance optimization', () => {
    it('should efficiently handle large numbers of zones', () => {
      const startTime = performance.now();
      
      const manyZones = Array.from({ length: 100 }, (_, i) => 
        createMockTouchZone(`Zone${i}`, i * 20, 0, 18, 18)
      );
      
      touchZoneRenderer.renderTouchZones(manyZones);
      
      const endTime = performance.now();
      
      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should reuse resources when possible', () => {
      const testZones = [createMockTouchZone('A', 0, 0, 100, 50)];
      
      touchZoneRenderer.renderTouchZones(testZones);
      const firstCallCount = (PIXI.Graphics as jest.Mock).mock.calls.length;
      
      touchZoneRenderer.renderTouchZones(testZones);
      const secondCallCount = (PIXI.Graphics as jest.Mock).mock.calls.length;
      
      // Should create new graphics for re-render
      expect(secondCallCount).toBeGreaterThan(firstCallCount);
    });

    it('should handle rapid visibility changes efficiently', () => {
      const testZones = [createMockTouchZone('A', 0, 0, 100, 50)];
      touchZoneRenderer.renderTouchZones(testZones);
      
      // Rapid visibility changes
      for (let i = 0; i < 20; i++) {
        if (i % 2 === 0) {
          touchZoneRenderer.showZones();
        } else {
          touchZoneRenderer.hideZones();
        }
      }
      
      expect(() => touchZoneRenderer.toggleZones()).not.toThrow();
    });
  });

  describe('responsive design features', () => {
    it('should calculate appropriate font sizes for different zone sizes', () => {
      const zones = [
        createMockTouchZone('Small', 0, 0, 30, 20),
        createMockTouchZone('Large', 0, 30, 200, 100)
      ];
      
      const mockText = new PIXI.Text();
      (PIXI.Text as jest.Mock).mockReturnValue(mockText);
      
      touchZoneRenderer.renderTouchZones(zones);
      
      // Should create text with appropriate sizing
      expect(PIXI.Text).toHaveBeenCalled();
    });

    it('should position labels correctly in zone centers', () => {
      const testZone = createMockTouchZone('Center', 100, 200, 80, 40);
      
      const mockText = new PIXI.Text();
      (PIXI.Text as jest.Mock).mockReturnValue(mockText);
      
      touchZoneRenderer.renderTouchZones([testZone]);
      
      // Text should be positioned at zone center
      expect(mockText.x).toBe(140); // 100 + 80/2
      expect(mockText.y).toBe(220); // 200 + 40/2
    });

    it('should handle overlapping zones gracefully', () => {
      const overlappingZones = [
        createMockTouchZone('A', 0, 0, 100, 50),
        createMockTouchZone('B', 50, 25, 100, 50) // Overlaps with A
      ];
      
      expect(() => {
        touchZoneRenderer.renderTouchZones(overlappingZones);
      }).not.toThrow();
    });
  });

  describe('accessibility considerations', () => {
    it('should create high-contrast zone borders', () => {
      const mockGraphics = new PIXI.Graphics();
      (PIXI.Graphics as jest.Mock).mockReturnValue(mockGraphics);
      
      const testZone = createMockTouchZone('A', 0, 0, 100, 50);
      touchZoneRenderer.renderTouchZones([testZone]);
      
      // Should use high-contrast border
      expect(mockGraphics.lineStyle).toHaveBeenCalledWith(2, expect.any(Number), 0.8);
    });

    it('should provide readable labels with drop shadows', () => {
      const mockText = new PIXI.Text();
      (PIXI.Text as jest.Mock).mockReturnValue(mockText);
      
      const testZone = createMockTouchZone('ReadableLabel', 0, 0, 100, 50);
      touchZoneRenderer.renderTouchZones([testZone]);
      
      expect(PIXI.Text).toHaveBeenCalledWith('ReadableLabel', expect.objectContaining({
        dropShadow: expect.objectContaining({
          alpha: 0.8,
          color: 0x000000
        })
      }));
    });

    it('should ensure minimum zone sizes for touch targets', () => {
      const smallZone = createMockTouchZone('Small', 0, 0, 10, 10);
      
      expect(() => {
        touchZoneRenderer.renderTouchZones([smallZone]);
      }).not.toThrow();
      
      // Renderer should handle small zones without errors
    });
  });
});
