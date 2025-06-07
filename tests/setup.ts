// Mock DOM APIs
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

// Ensure we're in a proper DOM environment
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock AudioContext with comprehensive implementation
const mockAudioContext = {
  currentTime: 0,
  state: 'running',
  sampleRate: 44100,
  destination: {},
  createOscillator: jest.fn().mockReturnValue({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { value: 440 },
    type: 'sine'
  }),
  createGain: jest.fn().mockReturnValue({
    connect: jest.fn(),
    gain: { 
      value: 1,
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn()
    }
  }),
  createBiquadFilter: jest.fn().mockReturnValue({
    connect: jest.fn(),
    frequency: { value: 440 },
    Q: { value: 1 },
    type: 'lowpass'
  }),
  createBufferSource: jest.fn().mockReturnValue({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    buffer: null,
    loop: false
  }),
  createBuffer: jest.fn((channels, length, sampleRate) => ({
    getChannelData: jest.fn(() => new Float32Array(length))
  })),
  resume: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined)
};

Object.defineProperty(global, 'AudioContext', {
  value: jest.fn(() => mockAudioContext),
  writable: true
});

Object.defineProperty(global, 'webkitAudioContext', {
  value: jest.fn(() => mockAudioContext),
  writable: true
});

// Mock performance.now()
Object.defineProperty(global, 'performance', {
  value: {
    ...global.performance,
    now: jest.fn(() => Date.now())
  },
  writable: true
});

// Mock requestAnimationFrame
Object.defineProperty(global, 'requestAnimationFrame', {
  value: jest.fn(cb => setTimeout(cb, 16) as any),
  writable: true
});

Object.defineProperty(global, 'cancelAnimationFrame', {
  value: jest.fn(id => clearTimeout(id)),
  writable: true
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});