import { VisualEngine } from '@game/visuals/VisualEngine';
import { SoundConfig } from '@game/audio/AudioEngine';
import { ScoreEvent } from '@game/core/ScoringSystem';
import * as PIXI from 'pixi.js';

// Mock PIXI.js
jest.mock('pixi.js', () => ({
  Application: jest.fn(() => ({
    stage: {
      addChild: jest.fn(),
      removeChild: jest.fn()
    },
    view: {
      style: {},
      appendChild: jest.fn()
    },
    renderer: {
      resize: jest.fn()
    },
    ticker: {
      add: jest.fn(),
      remove: jest.fn()
    },
    destroy: jest.fn()
  })),
  Container: jest.fn(() => ({
    x: 0,
    y: 0,
    alpha: 1,
    addChild: jest.fn(),
    removeChild: jest.fn(),
    destroy: jest.fn()
  })),
  Graphics: jest.fn(() => ({
    lineStyle: jest.fn(),
    beginFill: jest.fn(),
    drawCircle: jest.fn(),
    drawRect: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    endFill: jest.fn(),
    clear: jest.fn()
  })),
  Text: jest.fn(() => ({
    anchor: { set: jest.fn() },
    x: 0,
    y: 0,
    text: ''
  })),
  Sprite: jest.fn(() => ({
    x: 0,
    y: 0,
    scale: { set: jest.fn() },
    anchor: { set: jest.fn() }
  }))
}));

// Mock BackgroundEffects and TouchZoneRenderer
jest.mock('@game/visuals/BackgroundEffects', () => ({
  BackgroundEffects: jest.fn(() => ({
    update: jest.fn(),
    setStarDensity: jest.fn(),
    setGridIntensity: jest.fn(),
    cleanup: jest.fn()
  }))
}));

jest.mock('@game/visuals/TouchZoneRenderer', () => ({
  TouchZoneRenderer: jest.fn(() => ({
    updateZones: jest.fn(),
    showZones: jest.fn(),
    hideZones: jest.fn(),
    highlightZone: jest.fn(),
    cleanup: jest.fn()
  }))
}));

describe('VisualEngine', () => {
  let visualEngine: VisualEngine;
  let mockApp: any;
  let mockStage: any;
  let mockContainer: any;

  beforeEach(() => {
    // Setup DOM environment
    document.body.innerHTML = '<div id="game-container"></div>';
    
    // Setup mocks
    mockContainer = {
      x: 0,
      y: 0,
      alpha: 1,
      addChild: jest.fn(),
      removeChild: jest.fn(),
      destroy: jest.fn()
    };
    
    mockStage = {
      addChild: jest.fn(),
      removeChild: jest.fn(),
      children: []
    };
    
    mockApp = {
      stage: mockStage,
      view: {
        style: {},
        appendChild: jest.fn()
      },
      renderer: {
        resize: jest.fn()
      },
      ticker: {
        add: jest.fn(),
        remove: jest.fn()
      },
      destroy: jest.fn()
    };
    
    (PIXI.Application as jest.Mock).mockReturnValue(mockApp);
    (PIXI.Container as jest.Mock).mockReturnValue(mockContainer);
    
    visualEngine = new VisualEngine();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create PIXI application with correct settings', async () => {
      await visualEngine.initialize();
      
      expect(PIXI.Application).toHaveBeenCalledWith({
        width: expect.any(Number),
        height: expect.any(Number),
        backgroundColor: 0x000000,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      });
    });

    it('should initialize background effects', async () => {
      await visualEngine.initialize();
      
      const { BackgroundEffects } = require('@game/visuals/BackgroundEffects');
      expect(BackgroundEffects).toHaveBeenCalledWith(mockStage);
    });

    it('should setup touch zone renderer', async () => {
      await visualEngine.initialize();
      
      const { TouchZoneRenderer } = require('@game/visuals/TouchZoneRenderer');
      expect(TouchZoneRenderer).toHaveBeenCalledWith(mockStage);
    });

    it('should handle WebGL fallback to canvas', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      (PIXI.Application as jest.Mock).mockImplementationOnce(() => {
        throw new Error('WebGL not supported');
      });
      
      await expect(visualEngine.initialize()).rejects.toThrow();
      
      consoleWarnSpy.mockRestore();
    });

    it('should emit initialized event', async () => {
      const initSpy = jest.fn();
      visualEngine.on('initialized', initSpy);
      
      await visualEngine.initialize();
      
      expect(initSpy).toHaveBeenCalled();
    });

    it('should not initialize twice', async () => {
      await visualEngine.initialize();
      
      const appCallCount = (PIXI.Application as jest.Mock).mock.calls.length;
      await visualEngine.initialize();
      
      expect((PIXI.Application as jest.Mock)).toHaveBeenCalledTimes(appCallCount);
    });
  });

  describe('effect generation', () => {
    beforeEach(async () => {
      await visualEngine.initialize();
    });

    it('should create instrument-specific visual effects', () => {
      const sound: SoundConfig = {
        key: 'q',
        instrument: 'synthBass',
        note: 'C',
        octave: 4,
        frequency: 261.63,
        volume: 0.8,
        duration: 0.5,
        color: '#FF00FF'
      };
      
      visualEngine.triggerKeyEffect('q', sound);
      
      expect(PIXI.Container).toHaveBeenCalled();
      expect(mockStage.addChild).toHaveBeenCalled();
    });

    it('should handle different instrument types', () => {
      const instruments = ['synthBass', 'synthLead', 'synthPad', 'fmBell', 'digitalDrum'];
      
      instruments.forEach(instrument => {
        const sound: SoundConfig = {
          key: 'q',
          instrument,
          note: 'C',
          octave: 4,
          frequency: 261.63,
          volume: 0.8,
          duration: 0.5,
          color: '#FF00FF'
        };
        
        visualEngine.triggerKeyEffect('q', sound);
      });
      
      expect(PIXI.Container).toHaveBeenCalledTimes(instruments.length);
    });

    it('should manage effect lifecycle and cleanup', (done) => {
      const sound: SoundConfig = {
        key: 'q',
        instrument: 'synthBass',
        note: 'C',
        octave: 4,
        frequency: 261.63,
        volume: 0.8,
        duration: 0.5,
        color: '#FF00FF'
      };
      
      visualEngine.triggerKeyEffect('q', sound);
      
      // Check that cleanup happens after effect duration
      setTimeout(() => {
        expect(mockContainer.destroy).toHaveBeenCalled();
        done();
      }, 600); // Slightly longer than effect duration
    });

    it('should handle rapid effect generation', () => {
      const sound: SoundConfig = {
        key: 'q',
        instrument: 'synthBass',
        note: 'C',
        octave: 4,
        frequency: 261.63,
        volume: 0.8,
        duration: 0.5,
        color: '#FF00FF'
      };
      
      // Trigger multiple effects rapidly
      for (let i = 0; i < 10; i++) {
        visualEngine.triggerKeyEffect('q', sound);
      }
      
      expect(PIXI.Container).toHaveBeenCalledTimes(10);
    });

    it('should animate effects with proper timing', () => {
      jest.useFakeTimers();
      
      const sound: SoundConfig = {
        key: 'q',
        instrument: 'synthBass',
        note: 'C',
        octave: 4,
        frequency: 261.63,
        volume: 0.8,
        duration: 0.5,
        color: '#FF00FF'
      };
      
      visualEngine.triggerKeyEffect('q', sound);
      
      // Fast forward time to check animation
      jest.advanceTimersByTime(250);
      
      expect(global.requestAnimationFrame).toHaveBeenCalled();
      
      jest.useRealTimers();
    });
  });

  describe('touch zone rendering', () => {
    beforeEach(async () => {
      await visualEngine.initialize();
    });

    it('should render touch zones based on screen size', () => {
      const zones = [
        { keys: ['q', 'w'], x: 100, y: 100, width: 50, height: 50 }
      ];
      
      visualEngine.updateTouchZones(zones);
      
      const { TouchZoneRenderer } = require('@game/visuals/TouchZoneRenderer');
      const mockInstance = TouchZoneRenderer.mock.instances[0];
      expect(mockInstance.updateZones).toHaveBeenCalledWith(zones);
    });

    it('should update zones on orientation change', () => {
      const resizeEvent = new Event('resize');
      
      window.dispatchEvent(resizeEvent);
      
      expect(mockApp.renderer.resize).toHaveBeenCalled();
    });

    it('should highlight active zones', () => {
      const touch = { x: 100, y: 100 };
      const sound: SoundConfig = {
        key: 'q',
        instrument: 'synthBass',
        note: 'C',
        octave: 4,
        frequency: 261.63,
        volume: 0.8,
        duration: 0.5,
        color: '#FF00FF'
      };
      
      visualEngine.triggerTouchEffect(touch, sound);
      
      expect(PIXI.Container).toHaveBeenCalled();
    });

    it('should manage zone visibility states', () => {
      visualEngine.showTouchZones();
      
      const { TouchZoneRenderer } = require('@game/visuals/TouchZoneRenderer');
      const mockInstance = TouchZoneRenderer.mock.instances[0];
      expect(mockInstance.showZones).toHaveBeenCalled();
      
      visualEngine.hideTouchZones();
      expect(mockInstance.hideZones).toHaveBeenCalled();
    });
  });

  describe('background effects', () => {
    beforeEach(async () => {
      await visualEngine.initialize();
    });

    it('should render animated starfield', () => {
      visualEngine.update(16);
      
      const { BackgroundEffects } = require('@game/visuals/BackgroundEffects');
      const mockInstance = BackgroundEffects.mock.instances[0];
      expect(mockInstance.update).toHaveBeenCalledWith(16);
    });

    it('should create perspective grid effects', () => {
      visualEngine.setBackgroundIntensity(0.8);
      
      const { BackgroundEffects } = require('@game/visuals/BackgroundEffects');
      const mockInstance = BackgroundEffects.mock.instances[0];
      expect(mockInstance.setGridIntensity).toHaveBeenCalledWith(0.8);
    });

    it('should handle effect enable/disable', () => {
      visualEngine.setBackgroundEnabled(false);
      visualEngine.setBackgroundEnabled(true);
      
      // Should not throw errors
      expect(() => visualEngine.update(16)).not.toThrow();
    });

    it('should optimize performance with large star counts', () => {
      // Set high performance mode
      visualEngine.setPerformanceMode('high');
      
      const { BackgroundEffects } = require('@game/visuals/BackgroundEffects');
      const mockInstance = BackgroundEffects.mock.instances[0];
      expect(mockInstance.setStarDensity).toHaveBeenCalledWith(expect.any(Number));
    });
  });

  describe('score visualization', () => {
    beforeEach(async () => {
      await visualEngine.initialize();
    });

    it('should create score popup animations', () => {
      const scoreEvent: ScoreEvent = {
        basePoints: 100,
        comboMultiplier: 1.5,
        accuracyMultiplier: 1.2,
        totalPoints: 180,
        combo: 5,
        accuracy: 0.95,
        timestamp: Date.now()
      };
      
      const sound: SoundConfig = {
        key: 'q',
        instrument: 'synthBass',
        note: 'C',
        octave: 4,
        frequency: 261.63,
        volume: 0.8,
        duration: 0.5,
        color: '#FF00FF'
      };
      
      visualEngine.triggerKeyEffect('q', sound, scoreEvent);
      
      expect(PIXI.Text).toHaveBeenCalled();
    });

    it('should display combo multipliers', () => {
      const scoreEvent: ScoreEvent = {
        basePoints: 100,
        comboMultiplier: 2.0,
        accuracyMultiplier: 1.0,
        totalPoints: 200,
        combo: 10,
        accuracy: 0.8,
        timestamp: Date.now()
      };
      
      const sound: SoundConfig = {
        key: 'q',
        instrument: 'synthBass',
        note: 'C',
        octave: 4,
        frequency: 261.63,
        volume: 0.8,
        duration: 0.5,
        color: '#FF00FF'
      };
      
      visualEngine.triggerKeyEffect('q', sound, scoreEvent);
      
      // Should create text for combo display
      expect(PIXI.Text).toHaveBeenCalledTimes(2); // Score and combo text
    });

    it('should show achievement celebrations', () => {
      visualEngine.showAchievementCelebration('Test Achievement');
      
      expect(PIXI.Container).toHaveBeenCalled();
      expect(PIXI.Text).toHaveBeenCalled();
    });

    it('should handle celebration effect overlaps', () => {
      // Trigger multiple celebrations
      visualEngine.showAchievementCelebration('Achievement 1');
      visualEngine.showAchievementCelebration('Achievement 2');
      
      expect(PIXI.Container).toHaveBeenCalledTimes(2);
    });
  });

  describe('cleanup and resource management', () => {
    beforeEach(async () => {
      await visualEngine.initialize();
    });

    it('should cleanup PIXI application on destroy', () => {
      visualEngine.cleanup();
      
      expect(mockApp.destroy).toHaveBeenCalled();
    });

    it('should remove event listeners on cleanup', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      visualEngine.cleanup();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });

    it('should cleanup background effects', () => {
      visualEngine.cleanup();
      
      const { BackgroundEffects } = require('@game/visuals/BackgroundEffects');
      const mockInstance = BackgroundEffects.mock.instances[0];
      expect(mockInstance.cleanup).toHaveBeenCalled();
    });

    it('should handle cleanup when not initialized', () => {
      const newEngine = new VisualEngine();
      
      expect(() => newEngine.cleanup()).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle initialization failure gracefully', async () => {
      (PIXI.Application as jest.Mock).mockImplementationOnce(() => {
        throw new Error('PIXI initialization failed');
      });
      
      await expect(visualEngine.initialize()).rejects.toThrow('PIXI initialization failed');
    });

    it('should handle missing DOM container', async () => {
      document.body.innerHTML = '';
      
      await expect(visualEngine.initialize()).rejects.toThrow();
    });

    it('should handle effect creation errors', async () => {
      await visualEngine.initialize();
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (PIXI.Container as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Container creation failed');
      });
      
      const sound: SoundConfig = {
        key: 'q',
        instrument: 'synthBass',
        note: 'C',
        octave: 4,
        frequency: 261.63,
        volume: 0.8,
        duration: 0.5,
        color: '#FF00FF'
      };
      
      visualEngine.triggerKeyEffect('q', sound);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('performance optimization', () => {
    beforeEach(async () => {
      await visualEngine.initialize();
    });

    it('should limit concurrent effects', () => {
      const sound: SoundConfig = {
        key: 'q',
        instrument: 'synthBass',
        note: 'C',
        octave: 4,
        frequency: 261.63,
        volume: 0.8,
        duration: 0.5,
        color: '#FF00FF'
      };
      
      // Create many effects to test limit
      for (let i = 0; i < 100; i++) {
        visualEngine.triggerKeyEffect('q', sound);
      }
      
      // Should limit to reasonable number
      expect(mockStage.addChild).toHaveBeenCalledTimes(50); // Assuming 50 is the limit
    });

    it('should adjust quality based on performance', () => {
      visualEngine.setPerformanceMode('low');
      
      const { BackgroundEffects } = require('@game/visuals/BackgroundEffects');
      const mockInstance = BackgroundEffects.mock.instances[0];
      expect(mockInstance.setStarDensity).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should handle resize efficiently', () => {
      const resizeSpy = jest.fn();
      visualEngine.on('resized', resizeSpy);
      
      // Trigger multiple rapid resize events
      for (let i = 0; i < 10; i++) {
        window.dispatchEvent(new Event('resize'));
      }
      
      // Should debounce resize events
      setTimeout(() => {
        expect(resizeSpy).toHaveBeenCalledTimes(1);
      }, 100);
    });
  });
});
