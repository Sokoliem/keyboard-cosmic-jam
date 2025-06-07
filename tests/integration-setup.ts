// Integration test setup - More realistic mocking for system interactions
import '@testing-library/jest-dom';

// Mock localStorage with more realistic behavior
const localStorageMock = {
  data: new Map<string, string>(),
  getItem: jest.fn((key: string) => localStorageMock.data.get(key) || null),
  setItem: jest.fn((key: string, value: string) => {
    localStorageMock.data.set(key, value);
  }),
  removeItem: jest.fn((key: string) => {
    localStorageMock.data.delete(key);
  }),
  clear: jest.fn(() => {
    localStorageMock.data.clear();
  }),
  length: 0,
  key: jest.fn()
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock AudioContext with more realistic behavior for integration tests
const createMockAudioContext = () => {
  const mockNodes = new Set();
  const mockConnections = new Map();
  
  return {
    currentTime: 0,
    state: 'running',
    sampleRate: 44100,
    destination: { connect: jest.fn() },
    
    createOscillator: jest.fn(() => {
      const osc = {
        connect: jest.fn((destination) => {
          mockConnections.set(osc, destination);
        }),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: { value: 440 },
        type: 'sine',
        onended: null
      };
      mockNodes.add(osc);
      return osc;
    }),
    
    createGain: jest.fn(() => {
      const gain = {
        connect: jest.fn((destination) => {
          mockConnections.set(gain, destination);
        }),
        gain: { 
          value: 1,
          setValueAtTime: jest.fn(),
          linearRampToValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn()
        }
      };
      mockNodes.add(gain);
      return gain;
    }),
    
    createBiquadFilter: jest.fn(() => {
      const filter = {
        connect: jest.fn((destination) => {
          mockConnections.set(filter, destination);
        }),
        frequency: { value: 440 },
        Q: { value: 1 },
        type: 'lowpass'
      };
      mockNodes.add(filter);
      return filter;
    }),
    
    createBufferSource: jest.fn(() => {
      const source = {
        connect: jest.fn((destination) => {
          mockConnections.set(source, destination);
        }),
        start: jest.fn(),
        stop: jest.fn(),
        buffer: null,
        loop: false
      };
      mockNodes.add(source);
      return source;
    }),
    
    createBuffer: jest.fn((channels, length, sampleRate) => ({
      getChannelData: jest.fn(() => new Float32Array(length))
    })),
    
    resume: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    
    // Test helpers
    _mockNodes: mockNodes,
    _mockConnections: mockConnections
  };
};

const mockAudioContext = createMockAudioContext();

Object.defineProperty(global, 'AudioContext', {
  value: jest.fn(() => mockAudioContext),
  writable: true
});

Object.defineProperty(global, 'webkitAudioContext', {
  value: jest.fn(() => mockAudioContext),
  writable: true
});

// Mock performance with realistic timing
let mockTime = 0;
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => {
      mockTime += 16; // Simulate 60fps
      return mockTime;
    }),
    mark: jest.fn(),
    measure: jest.fn()
  },
  writable: true
});

// Mock animation frame with timing control
let animationFrameId = 0;
const animationFrameCallbacks = new Map();

Object.defineProperty(global, 'requestAnimationFrame', {
  value: jest.fn((callback) => {
    animationFrameId++;
    animationFrameCallbacks.set(animationFrameId, callback);
    return animationFrameId;
  }),
  writable: true
});

Object.defineProperty(global, 'cancelAnimationFrame', {
  value: jest.fn((id) => {
    animationFrameCallbacks.delete(id);
  }),
  writable: true
});

// Mock fullscreen API for toddler mode testing
const mockFullscreenAPI = {
  fullscreenElement: null,
  fullscreenEnabled: true,
  exitFullscreen: jest.fn().mockResolvedValue(undefined),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

Object.defineProperty(document, 'fullscreenElement', {
  get: () => mockFullscreenAPI.fullscreenElement,
  configurable: true
});

Object.defineProperty(document, 'fullscreenEnabled', {
  get: () => mockFullscreenAPI.fullscreenEnabled,
  configurable: true
});

Object.defineProperty(document, 'exitFullscreen', {
  value: mockFullscreenAPI.exitFullscreen,
  configurable: true
});

// Mock HTMLElement fullscreen methods
Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
  value: jest.fn().mockImplementation(function() {
    mockFullscreenAPI.fullscreenElement = this;
    // Simulate fullscreen change event
    setTimeout(() => {
      document.dispatchEvent(new Event('fullscreenchange'));
    }, 0);
    return Promise.resolve();
  }),
  configurable: true
});

// Mock DOM manipulation methods
const originalCreateElement = document.createElement;
document.createElement = jest.fn().mockImplementation((tagName) => {
  const element = originalCreateElement.call(document, tagName);
  
  // Add mock methods for specific elements
  if (tagName === 'canvas') {
    const mockContext = {
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      drawImage: jest.fn(),
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn()
    };
    
    element.getContext = jest.fn(() => mockContext);
    element.width = 800;
    element.height = 600;
  }
  
  return element;
});

// Test helpers for integration tests
export const testHelpers = {
  // Advance mock time and trigger animation frames
  advanceTime: (ms: number) => {
    mockTime += ms;
    jest.advanceTimersByTime(ms);
    
    // Trigger pending animation frames
    animationFrameCallbacks.forEach((callback, id) => {
      callback(mockTime);
      animationFrameCallbacks.delete(id);
    });
  },
  
  // Simulate fullscreen state
  setFullscreen: (element: Element | null) => {
    mockFullscreenAPI.fullscreenElement = element;
    document.dispatchEvent(new Event('fullscreenchange'));
  },
  
  // Get mock audio context for testing
  getMockAudioContext: () => mockAudioContext,
  
  // Clear localStorage between tests
  clearStorage: () => {
    localStorageMock.data.clear();
  },
  
  // Simulate keyboard events with realistic properties
  simulateKeyEvent: (type: string, key: string, options: any = {}) => {
    const event = new KeyboardEvent(type, {
      key,
      code: `Key${key.toUpperCase()}`,
      bubbles: true,
      cancelable: true,
      ...options
    });
    
    document.dispatchEvent(event);
    return event;
  },
  
  // Wait for async operations to complete
  waitForAsync: () => new Promise(resolve => setTimeout(resolve, 0))
};

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.data.clear();
  mockTime = 0;
  animationFrameCallbacks.clear();
  mockFullscreenAPI.fullscreenElement = null;
  
  // Reset mock audio context
  mockAudioContext._mockNodes.clear();
  mockAudioContext._mockConnections.clear();
});

// Expose test helpers globally
(global as any).testHelpers = testHelpers;